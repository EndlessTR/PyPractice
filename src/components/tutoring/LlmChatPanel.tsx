import { Bot, Send, Settings2 } from 'lucide-react'
import { useState } from 'react'

import { askLlm, type LlmConfig, type LlmMessage } from '../../features/tutoring'

const SYSTEM_PROMPT = '你是 PyPractice 的 Python 学习助教。用中文回答，先给出清晰结论，再说明原因；不要直接替学生完成题目，优先给提示、思路和可运行的小例子。'

type Props = { chapterTitle: string }

export function LlmChatPanel({ chapterTitle }: Props) {
  const [config, setConfig] = useState<LlmConfig>()
  const [draftConfig, setDraftConfig] = useState<LlmConfig>({ baseUrl: '', apiKey: '', model: '' })
  const [messages, setMessages] = useState<LlmMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [error, setError] = useState<string>()

  const submit = async () => {
    const question = input.trim()
    if (!question || !config || loading) return
    const nextMessages: LlmMessage[] = [...messages, { role: 'user', content: question }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError(undefined)
    try {
      const reply = await askLlm(config, [
        { role: 'system', content: `${SYSTEM_PROMPT}\n当前学习单元：${chapterTitle}` },
        ...nextMessages,
      ])
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '互动答疑请求失败。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">可接入 OpenAI 兼容的 Chat Completions 接口。密钥仅保留在当前页面内存，刷新后会清除。</p>
        <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-700" onClick={() => setShowSetup((value) => !value)}><Settings2 size={16} />{config ? '更改接口' : '配置接口'}</button>
      </div>
      {showSetup && <div className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:grid-cols-2">
        <label className="grid gap-1 text-sm sm:col-span-2">接口地址<input className="rounded-lg border border-slate-200 bg-transparent p-2 dark:border-slate-700" placeholder="https://api.example.com/v1" value={draftConfig.baseUrl} onChange={(event) => setDraftConfig((value) => ({ ...value, baseUrl: event.target.value }))} /></label>
        <label className="grid gap-1 text-sm">模型名称<input className="rounded-lg border border-slate-200 bg-transparent p-2 dark:border-slate-700" placeholder="gpt-4.1-mini" value={draftConfig.model} onChange={(event) => setDraftConfig((value) => ({ ...value, model: event.target.value }))} /></label>
        <label className="grid gap-1 text-sm">API Key<input type="password" className="rounded-lg border border-slate-200 bg-transparent p-2 dark:border-slate-700" value={draftConfig.apiKey} onChange={(event) => setDraftConfig((value) => ({ ...value, apiKey: event.target.value }))} /></label>
        <button className="w-fit rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!draftConfig.baseUrl || !draftConfig.model || !draftConfig.apiKey} onClick={() => { setConfig(draftConfig); setShowSetup(false); setError(undefined) }}>保存到本次会话</button>
      </div>}
      {!config ? <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700"><div><Bot className="mx-auto text-brand-600" size={32} /><h2 className="mt-3 font-semibold">等待配置互动答疑接口</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">提供接口地址、模型名称和 API Key 后即可提问。</p></div></div> : <>
        <div className="min-h-52 space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700" aria-live="polite">
          {!messages.length && <p className="text-sm text-slate-600 dark:text-slate-300">例如：为什么条件判断中要注意边界顺序？</p>}
          {messages.map((message, index) => <div className={`rounded-xl p-3 text-sm whitespace-pre-wrap ${message.role === 'user' ? 'ml-8 bg-brand-600 text-white' : 'mr-8 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`} key={`${message.role}-${index}`}>{message.content}</div>)}
          {loading && <p className="text-sm text-slate-600 dark:text-slate-300">助教正在思考…</p>}
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <label className="grid gap-2 text-sm">你的问题<textarea className="min-h-24 rounded-xl border border-slate-200 bg-transparent p-3 dark:border-slate-700" value={input} onChange={(event) => setInput(event.target.value)} placeholder="描述你的疑问、尝试过的思路和报错信息…" /></label>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!input.trim() || loading} onClick={() => void submit()}><Send size={16} />发送问题</button>
      </>}
    </div>
  )
}
