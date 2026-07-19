import { CheckCircle2, CircleDot, TimerReset } from 'lucide-react'

import type { PracticeSession } from '../../features/practice'

const resultLabels = {
  accepted: '最近一次：已通过',
  wrongAnswer: '最近一次：答案错误',
  runtimeError: '最近一次：运行错误',
  judgeError: '最近一次：判题错误',
} as const

export function PracticeSessionSummary({ session }: { session: PracticeSession }) {
  const completed = session.status === 'completed'
  return (
    <section
      aria-label="本次练习会话"
      className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <span
        className={`flex items-center gap-2 font-semibold ${completed ? 'text-emerald-600' : 'text-brand-700 dark:text-sky-300'}`}
      >
        {completed ? <CheckCircle2 size={17} /> : <CircleDot size={17} />}
        {completed ? '本题已完成' : '练习进行中'}
      </span>
      <span>已提交 {session.submissionCount} 次</span>
      {session.latestSubmissionStatus && (
        <span>{resultLabels[session.latestSubmissionStatus]}</span>
      )}
      <span className="flex items-center gap-1 text-slate-500">
        <TimerReset size={15} /> 判题累计 {session.totalJudgeDurationMs} ms
      </span>
    </section>
  )
}
