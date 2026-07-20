import { ArrowDown, ArrowUp, Send } from 'lucide-react'
import { useState } from 'react'

import type { PracticeQuestion } from '../../features/questions'
import type { StructuredAnswer } from '../../features/judge/judgeStructuredAnswer'

type Props = {
  question: PracticeQuestion
  onSubmit: (answer: StructuredAnswer) => void
  disabled?: boolean
}

const submitClass =
  'mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50'

export function StructuredAnswerWorkspace({ question, onSubmit, disabled }: Props) {
  const [output, setOutput] = useState('')
  const [choiceIds, setChoiceIds] = useState<string[]>([])
  const [order, setOrder] = useState(() =>
    [...(question.codeBlocks?.map((block) => block.id) ?? [])].reverse(),
  )

  if (question.type === 'output') {
    return (
      <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <label className="text-sm font-semibold" htmlFor={`output-${question.id}`}>
          写出程序输出
        </label>
        <textarea
          id={`output-${question.id}`}
          className="mt-3 min-h-28 w-full rounded-lg border border-slate-200 bg-transparent p-3 font-mono text-sm dark:border-slate-700"
          value={output}
          onChange={(event) => setOutput(event.target.value)}
        />
        <button
          className={submitClass}
          disabled={disabled}
          onClick={() => onSubmit({ type: 'output', value: output })}
        >
          <Send size={15} /> 提交答案
        </button>
      </section>
    )
  }

  if (question.type === 'multipleChoice') {
    return (
      <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <h2 className="font-semibold">选择答案</h2>
        <div className="mt-3 space-y-2">
          {question.choices?.map((choice) => (
            <label className="flex gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700" key={choice.id}>
              <input
                checked={choiceIds.includes(choice.id)}
                type="checkbox"
                onChange={(event) =>
                  setChoiceIds((current) =>
                    event.target.checked
                      ? [...current, choice.id]
                      : current.filter((id) => id !== choice.id),
                  )
                }
              />
              <span className="min-w-0 flex-1">{choice.id}. {choice.text}</span>
            </label>
          ))}
        </div>
        <button
          className={submitClass}
          disabled={disabled || choiceIds.length === 0}
          onClick={() => onSubmit({ type: 'multipleChoice', value: choiceIds })}
        >
          <Send size={15} /> 提交答案
        </button>
      </section>
    )
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= order.length) return
    setOrder((current) => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  return (
    <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <h2 className="font-semibold">调整代码块顺序</h2>
      <ol className="mt-3 space-y-2">
        {order.map((id, index) => {
          const block = question.codeBlocks?.find((item) => item.id === id)
          return (
            <li className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700" key={id}>
              <div className="grid gap-1">
                <button aria-label={`上移 ${id}`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} /></button>
                <button aria-label={`下移 ${id}`} disabled={index === order.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button>
              </div>
              <pre className="min-w-0 flex-1 overflow-auto rounded bg-slate-950 p-2 text-sm text-slate-100"><code>{block?.code}</code></pre>
            </li>
          )
        })}
      </ol>
      <button
        className={submitClass}
        disabled={disabled || order.length === 0}
        onClick={() => onSubmit({ type: 'codeOrder', value: order })}
      >
        <Send size={15} /> 提交顺序
      </button>
    </section>
  )
}
