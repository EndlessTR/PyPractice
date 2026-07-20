export type LlmMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
  reasoning_content?: string
}

export type LlmConfig = {
  baseUrl: string
  apiKey: string
  model: string
}

type OpenAiCompatibleResponse = {
  choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>
  error?: { message?: string }
}

export function normalizeLlmBaseUrl(baseUrl: string) {
  const normalized = baseUrl.trim().replace(/\/$/, '')
  try {
    const url = new URL(normalized)
    if (url.hostname === 'api.moonshot.cn' && !url.pathname.endsWith('/v1')) return `${normalized}/v1`
  } catch {
    // Keep the original value so fetch can return a useful browser error.
  }
  return normalized
}

export async function askLlm(config: LlmConfig, messages: LlmMessage[], signal?: AbortSignal): Promise<LlmMessage> {
  const response = await fetch(`${normalizeLlmBaseUrl(config.baseUrl)}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ model: config.model, messages }),
  })
  const payload = (await response.json().catch(() => ({}))) as OpenAiCompatibleResponse
  if (!response.ok) throw new Error(payload.error?.message ?? `请求失败（${response.status}）`)
  const message = payload.choices?.[0]?.message
  const content = message?.content?.trim()
  if (!content) throw new Error('模型没有返回可显示的内容。')
  return { role: 'assistant', content, ...(message?.reasoning_content ? { reasoning_content: message.reasoning_content } : {}) }
}
