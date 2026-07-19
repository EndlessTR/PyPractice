import { loadPyodide, type PyodideAPI } from 'pyodide'

import {
  MAX_OUTPUT_CHARACTERS,
  type RunnerRequest,
  type RunnerResponse,
} from '../features/runner/protocol'

const scope = self as unknown as {
  postMessage: (message: RunnerResponse) => void
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<RunnerRequest>) => void,
  ) => void
}

let pyodide: PyodideAPI | undefined
let loading: Promise<PyodideAPI> | undefined

const securityBootstrap = String.raw`
import builtins as _builtins
import sys as _sys

if not getattr(_builtins, "__pypractice_guard_installed__", False):
    _blocked_roots = frozenset({
        "socket", "urllib", "http", "requests", "ftplib", "smtplib",
        "telnetlib", "webbrowser", "micropip", "js", "pyodide", "pyodide_js"
    })
    _original_import = _builtins.__import__
    _original_input = _builtins.input

    def _guarded_import(name, globals=None, locals=None, fromlist=(), level=0):
        root = name.split(".", 1)[0]
        if root in _blocked_roots:
            raise ImportError(f"出于安全限制，练习环境不允许导入 {name}")
        return _original_import(name, globals, locals, fromlist, level)

    def _friendly_input(prompt=""):
        try:
            return _original_input(prompt)
        except EOFError as exc:
            raise EOFError("输入不足：input() 没有可读取的下一行") from exc

    def _audit_guard(event, args):
        if event == "import" and args and str(args[0]).split(".", 1)[0] in _blocked_roots:
            raise PermissionError(f"出于安全限制，不允许导入 {args[0]}")
        if event.startswith("socket."):
            raise PermissionError("出于安全限制，不允许进行网络连接")

    _builtins.__import__ = _guarded_import
    _builtins.input = _friendly_input
    _builtins.__pypractice_guard_installed__ = True
    _sys.addaudithook(_audit_guard)

    for _module_name in list(_sys.modules):
        if _module_name.split(".", 1)[0] in _blocked_roots:
            _sys.modules.pop(_module_name, None)
`

async function ensureLoaded(indexURL: string): Promise<PyodideAPI> {
  if (pyodide) return pyodide
  loading ??= loadPyodide({ indexURL }).then(async (runtime) => {
    await runtime.runPythonAsync(securityBootstrap)
    pyodide = runtime
    return runtime
  })
  return loading
}

function post(message: RunnerResponse) {
  scope.postMessage(message)
}

async function runCode(request: Extract<RunnerRequest, { type: 'run' }>) {
  if (!pyodide) throw new Error('Python 运行环境尚未加载。')
  let stdout = ''
  let stderr = ''
  let usedCharacters = 0
  let truncated = false
  const append = (stream: 'stdout' | 'stderr', text: string) => {
    const remaining = MAX_OUTPUT_CHARACTERS - usedCharacters
    if (remaining <= 0) {
      truncated = true
      return
    }
    const accepted = text.slice(0, remaining)
    if (stream === 'stdout') stdout += accepted
    else stderr += accepted
    usedCharacters += accepted.length
    if (accepted.length < text.length) truncated = true
  }

  const normalizedInput = request.stdin.replace(/\r\n?/g, '\n')
  const inputLines = normalizedInput === '' ? [] : normalizedInput.split('\n')
  if (normalizedInput.endsWith('\n')) inputLines.pop()
  let inputIndex = 0
  pyodide.setStdin({
    stdin: () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : undefined),
    autoEOF: true,
  })
  pyodide.setStdout({ raw: (code: number) => append('stdout', String.fromCodePoint(code)) })
  pyodide.setStderr({ raw: (code: number) => append('stderr', String.fromCodePoint(code)) })

  const startedAt = performance.now()
  const globals = pyodide.globals.get('dict')()
  const createdFiles: string[] = []
  const createdDirectories = new Set<string>()
  const originalWorkingDirectory = pyodide.FS.cwd()
  const virtualRoot = `/tmp/pypractice/${request.requestId}`
  try {
    pyodide.FS.mkdirTree(virtualRoot)
    createdDirectories.add(virtualRoot)
    for (const file of request.virtualFiles ?? []) {
      const normalizedPath = file.path.replace(/\\/g, '/').replace(/^\.\//, '')
      if (
        !normalizedPath ||
        normalizedPath.startsWith('/') ||
        normalizedPath.split('/').includes('..')
      ) {
        throw new Error(`虚拟文件路径不安全：${file.path}`)
      }
      const fullPath = `${virtualRoot}/${normalizedPath}`
      const parent = fullPath.slice(0, fullPath.lastIndexOf('/'))
      pyodide.FS.mkdirTree(parent)
      for (let path = parent; path.startsWith(virtualRoot); path = path.slice(0, path.lastIndexOf('/'))) {
        createdDirectories.add(path)
        if (path === virtualRoot) break
      }
      pyodide.FS.writeFile(fullPath, file.content, { encoding: 'utf8' })
      createdFiles.push(fullPath)
    }
    pyodide.FS.chdir(virtualRoot)
    globals.set('__pypractice_virtual_root__', virtualRoot)
    await pyodide.runPythonAsync(request.code, { filename: 'main.py', globals })
    post({
      type: 'run', requestId: request.requestId, phase: 'success', stdout, stderr, truncated,
      durationMs: Math.round(performance.now() - startedAt),
    })
  } catch (error) {
    post({
      type: 'run', requestId: request.requestId, phase: 'error', stdout, stderr, truncated,
      durationMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    globals.destroy()
    pyodide.FS.chdir(originalWorkingDirectory)
    for (const file of createdFiles.reverse()) {
      try {
        pyodide.FS.unlink(file)
      } catch {
        // The submitted program may already have removed a temporary file.
      }
    }
    for (const directory of [...createdDirectories].sort((a, b) => b.length - a.length)) {
      try {
        pyodide.FS.rmdir(directory)
      } catch {
        // The submitted program may have created extra files; a future run uses a unique root.
      }
    }
    pyodide.setStdin()
    pyodide.setStdout()
    pyodide.setStderr()
  }
}

scope.addEventListener('message', (event) => {
  const request = event.data
  if (request.type === 'init') {
    post({ type: 'init', requestId: request.requestId, ok: true })
    return
  }
  if (request.type === 'load') {
    post({ type: 'load', requestId: request.requestId, phase: 'loading' })
    void ensureLoaded(request.indexURL)
      .then(() => post({ type: 'load', requestId: request.requestId, phase: 'ready' }))
      .catch((error: unknown) => post({
        type: 'load', requestId: request.requestId, phase: 'error',
        error: error instanceof Error ? error.message : 'Pyodide 加载失败。',
      }))
    return
  }
  if (request.type === 'run') {
    void runCode(request)
    return
  }
  post({ type: request.type, requestId: request.requestId, ok: true })
})
