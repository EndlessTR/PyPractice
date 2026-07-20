export type LlmMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type LlmConfig = {
  baseUrl: string
  apiKey: string
  model: string
}

type OpenAiCompatibleResponse = {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

export async function askLlm(config: LlmConfig, messages: LlmMessage[], signal?: AbortSignal) {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ model: config.model, messages, temperature: 0.3 }),
  })
  const payload = (await response.json().catch(() => ({}))) as OpenAiCompatibleResponse
  if (!response.ok) throw new Error(payload.error?.message ?? `请求失败（${response.status}）`)
  const content = payload.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('模型没有返回可显示的内容。')
  return content
}
