import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { RunnerRequest, RunnerResponse } from '../features/runner/protocol'

type Stream = { raw?: (code: number) => void }

const runtimeState = vi.hoisted(() => ({
  runtime: undefined as FakePyodide | undefined,
}))

vi.mock('pyodide', () => ({
  loadPyodide: vi.fn(async () => runtimeState.runtime),
}))

class FakeFileSystem {
  readonly files = new Map<string, string>()
  readonly directories = new Set<string>(['/', '/tmp'])
  private workingDirectory = '/'

  cwd() {
    return this.workingDirectory
  }

  chdir(path: string) {
    this.workingDirectory = path
  }

  mkdirTree(path: string) {
    const segments = path.split('/').filter(Boolean)
    let current = ''
    for (const segment of segments) {
      current += `/${segment}`
      this.directories.add(current)
    }
  }

  writeFile(path: string, content: string) {
    this.files.set(path, content)
  }

  unlink(path: string) {
    this.files.delete(path)
  }

  rmdir(path: string) {
    const hasChildren = [...this.files.keys(), ...this.directories].some(
      (candidate) => candidate !== path && candidate.startsWith(`${path}/`),
    )
    if (hasChildren) throw new Error('directory is not empty')
    this.directories.delete(path)
  }
}

class FakePyodide {
  readonly FS = new FakeFileSystem()
  readonly globalsValues = new Map<string, unknown>()
  readonly executedCode: string[] = []
  readonly globals = {
    get: () => () => ({
      set: (key: string, value: unknown) => this.globalsValues.set(key, value),
      destroy: vi.fn(),
    }),
  }
  private stdout?: Stream
  private stderr?: Stream

  setStdin = vi.fn()
  setStdout(stream?: Stream) {
    this.stdout = stream
  }
  setStderr(stream?: Stream) {
    this.stderr = stream
  }

  async runPythonAsync(code: string) {
    this.executedCode.push(code)
    if (code.includes('__pypractice_guard_installed__')) return
    if (code.includes('RAISE_FROM_PYTHON')) {
      this.stderr?.raw?.('traceback\n'.codePointAt(0)!)
      throw new Error('ValueError: integration failure')
    }
    const fixture = [...this.FS.files.values()][0] ?? ''
    for (const character of `fixture:${fixture}\n`) {
      this.stdout?.raw?.(character.codePointAt(0)!)
    }
  }
}

class FakeWorkerScope {
  readonly responses: RunnerResponse[] = []
  private listener?: (event: MessageEvent<RunnerRequest>) => void

  postMessage = (response: RunnerResponse) => {
    this.responses.push(response)
  }

  addEventListener = (
    type: 'message',
    listener: (event: MessageEvent<RunnerRequest>) => void,
  ) => {
    if (type === 'message') this.listener = listener
  }

  send(request: RunnerRequest) {
    this.listener?.({ data: request } as MessageEvent<RunnerRequest>)
  }

  async waitFor(predicate: (response: RunnerResponse) => boolean) {
    await vi.waitFor(() => expect(this.responses.some(predicate)).toBe(true))
    return this.responses.find(predicate)!
  }
}

async function loadWorker() {
  const scope = new FakeWorkerScope()
  vi.stubGlobal('self', scope)
  await import('./pythonRunner.worker')
  scope.send({ type: 'load', requestId: 'load-1', indexURL: '/pyodide/' })
  await scope.waitFor(
    (response) => response.type === 'load' && response.phase === 'ready',
  )
  return scope
}

describe('pythonRunner.worker integration', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.unstubAllGlobals()
    runtimeState.runtime = new FakePyodide()
  })

  test('通过消息协议挂载虚拟文件，并在运行后恢复工作目录和清理文件', async () => {
    const scope = await loadWorker()
    scope.send({
      type: 'run',
      requestId: 'run-files',
      code: 'print(open("data/name.txt").read())',
      stdin: '',
      virtualFiles: [{ path: 'data/name.txt', content: 'Ada' }],
    })

    const response = await scope.waitFor(
      (item) => item.type === 'run' && item.requestId === 'run-files',
    )

    expect(response).toMatchObject({
      type: 'run',
      phase: 'success',
      stdout: 'fixture:Ada\n',
      stderr: '',
      truncated: false,
    })
    expect(runtimeState.runtime?.globalsValues.get('__pypractice_virtual_root__')).toBe(
      '/tmp/pypractice/run-files',
    )
    expect(runtimeState.runtime?.FS.cwd()).toBe('/')
    expect(runtimeState.runtime?.FS.files.size).toBe(0)
    expect(runtimeState.runtime?.FS.directories.has('/tmp/pypractice/run-files')).toBe(false)
  })

  test('把 Python 异常转换为结构化错误响应并执行清理', async () => {
    const scope = await loadWorker()
    scope.send({
      type: 'run',
      requestId: 'run-error',
      code: 'RAISE_FROM_PYTHON',
      stdin: '',
      virtualFiles: [{ path: 'temporary.txt', content: 'secret' }],
    })

    const response = await scope.waitFor(
      (item) => item.type === 'run' && item.requestId === 'run-error',
    )

    expect(response).toMatchObject({
      type: 'run',
      phase: 'error',
      error: 'ValueError: integration failure',
      truncated: false,
    })
    expect(runtimeState.runtime?.FS.cwd()).toBe('/')
    expect(runtimeState.runtime?.FS.files.size).toBe(0)
  })

  test('拒绝逃逸虚拟根目录的 fixture 路径', async () => {
    const scope = await loadWorker()
    scope.send({
      type: 'run',
      requestId: 'run-unsafe-path',
      code: 'print("should not execute")',
      stdin: '',
      virtualFiles: [{ path: '../secret.txt', content: 'secret' }],
    })

    const response = await scope.waitFor(
      (item) => item.type === 'run' && item.requestId === 'run-unsafe-path',
    )

    expect(response).toMatchObject({
      type: 'run',
      phase: 'error',
      error: '虚拟文件路径不安全：../secret.txt',
    })
    expect(runtimeState.runtime?.executedCode).toHaveLength(1)
    expect(runtimeState.runtime?.FS.cwd()).toBe('/')
  })
})
