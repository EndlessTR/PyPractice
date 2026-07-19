import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2, Play, RotateCcw, Save, Send } from 'lucide-react'

import { useQuestionDraft } from '../../features/editor'
import { useTheme } from '../../features/theme/ThemeProvider'
import { EditorErrorBoundary } from './EditorErrorBoundary'

const createLazyEditor = () => lazy(() => import('./MonacoCodeEditor'))

type Props = {
  questionId: string
  questionVersion?: number
  starterCode: string
  onRun: (code: string) => void
  onSubmit: (code: string) => void
  runDisabled?: boolean
}

const toolbarButton =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'

export function QuestionCodeEditor({
  questionId,
  questionVersion,
  starterCode,
  onRun,
  onSubmit,
  runDisabled = false,
}: Props) {
  const { resolvedTheme } = useTheme()
  const { code, setCode, saveNow, saveState, reset } = useQuestionDraft(
    questionId,
    starterCode,
    questionVersion,
  )
  const [fontSize, setFontSize] = useState(14)
  const [EditorComponent, setEditorComponent] = useState(createLazyEditor)
  const [editorReady, setEditorReady] = useState(false)
  const [loadTimedOut, setLoadTimedOut] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const syncFullscreen = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  useEffect(() => {
    if (editorReady) return
    const timer = window.setTimeout(() => setLoadTimedOut(true), 12_000)
    return () => window.clearTimeout(timer)
  }, [EditorComponent, editorReady])

  const retryEditor = () => {
    setEditorReady(false)
    setLoadTimedOut(false)
    setEditorComponent(createLazyEditor())
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await containerRef.current?.requestFullscreen()
    } catch {
      setIsFullscreen(false)
    }
  }

  const confirmReset = () => {
    if (code === starterCode || window.confirm('确定要丢弃当前草稿并恢复起始代码吗？')) reset()
  }

  const saveLabel =
    saveState === 'saving'
      ? '保存中…'
      : saveState === 'saved'
        ? '已保存'
        : saveState === 'error'
          ? '保存失败'
          : '本地草稿'

  return (
    <div
      ref={containerRef}
      className="editor-workspace overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <button className={toolbarButton} onClick={saveNow} title="Ctrl/Cmd+S">
            <Save size={14} /> 保存
          </button>
          <button className={toolbarButton} onClick={confirmReset}>
            <RotateCcw size={14} /> 重置
          </button>
          <label className="flex items-center gap-1.5 text-xs">
            字号
            <select
              aria-label="编辑器字体大小"
              className="rounded-md border border-slate-200 bg-transparent px-1.5 py-1 dark:border-slate-700"
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
            >
              {[12, 14, 16, 18, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span
            className={`text-xs ${saveState === 'error' ? 'text-red-600' : 'text-slate-500'}`}
            aria-live="polite"
          >
            {saveLabel}
          </span>
        </div>
        <button
          className={toolbarButton}
          onClick={toggleFullscreen}
          title={isFullscreen ? '退出全屏（Esc）' : '进入全屏'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {isFullscreen ? '退出全屏' : '全屏'}
        </button>
      </div>
      <div className="relative h-[28rem] min-h-72">
        <EditorErrorBoundary onRetry={retryEditor}>
          <Suspense
            fallback={
              <div className="grid h-full place-items-center text-sm text-slate-500">
                正在准备代码编辑器…
              </div>
            }
          >
            <EditorComponent
              questionId={questionId}
              code={code}
              theme={resolvedTheme}
              fontSize={fontSize}
              onChange={setCode}
              onSave={saveNow}
              onRun={() => !runDisabled && onRun(code)}
              onSubmit={() => !runDisabled && onSubmit(code)}
              onReady={() => {
                setEditorReady(true)
                setLoadTimedOut(false)
              }}
            />
          </Suspense>
        </EditorErrorBoundary>
        {loadTimedOut && !editorReady && (
          <div className="absolute inset-0 grid place-items-center bg-white/95 p-6 text-center dark:bg-slate-950/95">
            <div>
              <p className="font-semibold">编辑器加载时间过长</p>
              <p className="mt-2 text-sm text-slate-500">
                可以重试加载；已恢复的本地草稿不会被清除。
              </p>
              <button
                className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                onClick={retryEditor}
              >
                重试加载
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 dark:border-slate-700">
        <p className="text-xs text-slate-500">Ctrl/Cmd+Enter 运行 · Ctrl/Cmd+Shift+Enter 提交</p>
        <div className="flex gap-2">
          <button
            className={toolbarButton}
            disabled={runDisabled}
            onClick={() => !runDisabled && onRun(code)}
            title="Ctrl/Cmd+Enter"
          >
            <Play size={14} />
            {runDisabled ? '准备中' : '运行'}
          </button>
          <button
            className={`${toolbarButton} border-brand-600 bg-brand-600 text-white hover:bg-brand-700`}
            disabled={runDisabled}
            onClick={() => !runDisabled && onSubmit(code)}
            title="Ctrl/Cmd+Shift+Enter"
          >
            <Send size={14} />
            提交
          </button>
        </div>
      </div>
    </div>
  )
}
