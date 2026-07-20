import { normalizeLlmBaseUrl } from './llmClient'

test('为 Kimi 根地址自动补全 v1', () => {
  expect(normalizeLlmBaseUrl('https://api.moonshot.cn')).toBe('https://api.moonshot.cn/v1')
  expect(normalizeLlmBaseUrl('https://api.moonshot.cn/v1/')).toBe('https://api.moonshot.cn/v1')
})

test('保留其他 OpenAI 兼容服务的地址', () => {
  expect(normalizeLlmBaseUrl('https://api.example.com/v1/')).toBe('https://api.example.com/v1')
})
