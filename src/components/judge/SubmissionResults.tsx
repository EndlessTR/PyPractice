import { CheckCircle2, CircleX, FlaskConical, Square } from 'lucide-react'

import type { SubmissionResult } from '../../features/judge'

type Props = {
  result?: SubmissionResult
  running: boolean
  error?: string
  onCancel?: () => void
}

const statusLabel = {
  passed: '通过',
  wrongAnswer: '答案错误',
  runtimeError: '运行错误',
  judgeError: '判题配置错误',
} as const

export function SubmissionResults({ result, running, error, onCancel }: Props) {
  if (!running && !result && !error) return null

  return (
    <section
      className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
      aria-live="polite"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <span className="flex items-center gap-2 font-semibold">
          <FlaskConical size={17} /> 提交判定
        </span>
        {running && onCancel ? (
          <button className="inline-flex items-center gap-1 text-sm text-red-600" onClick={onCancel}>
            <Square size={14} /> 终止提交
          </button>
        ) : result && (
          <span className={result.passed ? 'text-emerald-600' : 'text-red-600'}>
            {result.passed ? '全部通过' : '未通过'} · {result.passedCount}/{result.totalCount}
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        {running && <p className="text-sm text-slate-500">正在依次运行官方测试，请稍候…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result?.tests.map((test, index) => (
          <article
            className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
            key={test.testCaseId}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-medium">
                {test.passed ? (
                  <CheckCircle2 className="text-emerald-600" size={16} />
                ) : (
                  <CircleX className="text-red-600" size={16} />
                )}
                {test.hidden ? `未展示测试 ${index + 1}` : `公开测试 ${index + 1}`}
              </span>
              <span className="text-xs text-slate-500">
                {statusLabel[test.status]} · {test.durationMs} ms
              </span>
            </div>
            {!test.hidden && test.expectedOutput !== undefined && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-xs text-slate-500">预期输出</span>
                  <pre className="mt-1 overflow-auto rounded bg-slate-950 p-2 text-slate-100">
                    {test.expectedOutput || '（空）'}
                  </pre>
                </div>
                <div>
                  <span className="text-xs text-slate-500">实际输出</span>
                  <pre className="mt-1 overflow-auto rounded bg-slate-950 p-2 text-slate-100">
                    {test.actualOutput || '（空）'}
                  </pre>
                </div>
              </div>
            )}
            {test.error && <p className="mt-2 text-xs text-red-600">{test.error}</p>}
          </article>
        ))}
        {result && (
          <p className="text-xs text-slate-500">
            总耗时 {result.durationMs} ms。未展示测试仅隐藏在界面中；本地前端判题不构成安全保密边界。
          </p>
        )}
      </div>
    </section>
  )
}
