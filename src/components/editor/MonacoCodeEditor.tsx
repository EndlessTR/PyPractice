import Editor, { loader, type OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution.js'
import { useEffect, useRef } from 'react'

loader.config({ monaco: monaco as typeof import('monaco-editor') })

type MonacoWorkerHost = typeof globalThis & {
  MonacoEnvironment?: { getWorker: () => Worker }
}
;(globalThis as MonacoWorkerHost).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

export type MonacoCodeEditorProps = {
  questionId: string
  code: string
  theme: 'light' | 'dark'
  fontSize: number
  onChange: (code: string) => void
  onSave: () => void
  onRun: () => void
  onSubmit: () => void
  onReady?: () => void
}

export default function MonacoCodeEditor({
  questionId,
  code,
  theme,
  fontSize,
  onChange,
  onSave,
  onRun,
  onSubmit,
  onReady,
}: MonacoCodeEditorProps) {
  const actionsRef = useRef({ onSave, onRun, onSubmit, onReady })
  useEffect(() => {
    actionsRef.current = { onSave, onRun, onSubmit, onReady }
  }, [onReady, onRun, onSave, onSubmit])

  const handleMount: OnMount = (editor, monaco) => {
    editor.addAction({
      id: 'pypractice-save',
      label: '保存草稿',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => actionsRef.current.onSave(),
    })
    editor.addAction({
      id: 'pypractice-run',
      label: '运行代码',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => actionsRef.current.onRun(),
    })
    editor.addAction({
      id: 'pypractice-submit',
      label: '提交答案',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => actionsRef.current.onSubmit(),
    })
    editor.focus()
    actionsRef.current.onReady?.()
  }

  return (
    <Editor
      height="100%"
      language="python"
      path={`file:///pypractice/questions/${encodeURIComponent(questionId)}/main.py`}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      value={code}
      onChange={(value) => onChange(value ?? '')}
      onMount={handleMount}
      loading={
        <div className="grid h-full place-items-center text-sm text-slate-500">
          正在加载代码编辑器…
        </div>
      }
      options={{
        ariaLabel: 'Python 代码编辑器',
        automaticLayout: true,
        fontFamily: "'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
        fontSize,
        minimap: { enabled: false },
        padding: { top: 14, bottom: 14 },
        scrollBeyondLastLine: false,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
      }}
    />
  )
}
