import { RotateCw, Square } from 'lucide-react'

import type { PythonRunnerState } from '../../features/runner'

type Props = PythonRunnerState & {
  stdin: string
  onStdinChange: (value: string) => void
  onCancel: () => void
  onRestart: () => void
}

const statusLabels = {
  idle: '等待加载', loading: '正在加载 Python 环境…', ready: 'Python 环境已就绪',
  running: '正在运行…', error: '运行出错', timeout: '运行超时',
} as const

export function RunnerConsole({ status, result, message, stdin, onStdinChange, onCancel, onRestart }: Props) {
  const output = [result?.stdout, result?.stderr].filter(Boolean).join('')
  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <span className="text-sm font-semibold" aria-live="polite">{statusLabels[status]}</span>
        <div className="flex gap-2">
          {status === 'running' && <button className="inline-flex items-center gap-1 text-xs" onClick={onCancel}><Square size={13} /> 终止</button>}
          <button className="inline-flex items-center gap-1 text-xs" onClick={onRestart}><RotateCw size={13} /> 重启环境</button>
        </div>
      </div>
      <label className="block border-b border-slate-200 p-3 text-xs dark:border-slate-700">
        标准输入（每行供一次 input() 读取）
        <textarea
          aria-label="程序标准输入"
          className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-transparent p-2 font-mono text-sm dark:border-slate-700"
          value={stdin}
          onChange={(event) => onStdinChange(event.target.value)}
          placeholder={'第一行输入\n第二行输入'}
        />
      </label>
      <div className="p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span>运行输出</span>{result && <span>{result.durationMs} ms</span>}
        </div>
        <pre className="min-h-28 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-sm text-slate-100" aria-label="程序运行输出">
          {output || message || '点击“运行”后在此查看 stdout 和 stderr。'}
        </pre>
        {result?.truncated && <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">输出超过 20,000 个字符，后续内容已截断。</p>}
        {result?.error && <p className="mt-2 text-xs text-red-600">{result.error}</p>}
        <p className="mt-2 text-xs text-slate-500">代码仅在浏览器中运行；网络相关模块已受限，但纯前端沙箱不是强安全边界。</p>
      </div>
    </section>
  )
}
