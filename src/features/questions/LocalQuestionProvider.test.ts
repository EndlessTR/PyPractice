import type { Question } from '../../types'
import { questions } from '../../data/questions'
import { LocalQuestionProvider } from './LocalQuestionProvider'
import { questionProvider } from './questionCatalog'

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'ch01-q001', slug: 'sample', title: '示例题', chapterId: 'chapter-01',
  knowledgePointIds: ['variable-assignment'], description: '描述', requirements: ['要求'],
  difficulty: 'intro', type: 'coding', starterCode: '', solutionCode: 'print(1)',
  examples: [{ id: 'e1', input: '', expectedOutput: '1', visible: true, compareMode: 'exact' }],
  hiddenTests: [{ id: 'h1', input: '', expectedOutput: '1', visible: false, compareMode: 'exact' }],
  testHarnessCode: 'secret harness', hints: ['提示'], explanation: '解析', estimatedMinutes: 3,
  status: 'approved', version: 1, createdAt: '2026-07-13', ...overrides,
})

describe('LocalQuestionProvider', () => {
  test('只发布题库中已审核通过的题目', () => {
    expect(questions).toHaveLength(60)
    expect(questions.filter((question) => question.status === 'approved')).toHaveLength(60)
    expect(questions.filter((question) => question.status === 'review')).toHaveLength(0)
    expect(questionProvider.list()).toHaveLength(60)
  })

  test('只发布 approved 题目并支持组合筛选', () => {
    const provider = new LocalQuestionProvider([
      makeQuestion(),
      makeQuestion({ id: 'draft', status: 'review' }),
      makeQuestion({ id: 'basic', difficulty: 'basic', type: 'debug' }),
    ])
    expect(provider.list()).toHaveLength(2)
    expect(provider.list({ difficulty: 'basic', type: 'debug' }).map((item) => item.id)).toEqual(['basic'])
  })

  test('面向页面的详情不泄露答案、隐藏测试或 harness', () => {
    const detail = new LocalQuestionProvider([makeQuestion()]).getById('ch01-q001')
    expect(detail).toBeDefined()
    expect(detail).not.toHaveProperty('solutionCode')
    expect(detail).not.toHaveProperty('hiddenTests')
    expect(detail).not.toHaveProperty('testHarnessCode')
    expect(detail).not.toHaveProperty('correctChoiceIds')
    expect(detail).not.toHaveProperty('correctCodeOrder')
  })

  test.each(['output', 'multipleChoice', 'codeOrder'] as const)('%s 题不通过公开示例泄露答案', (type) => {
    const detail = new LocalQuestionProvider([makeQuestion({ type })]).getById('ch01-q001')
    expect(detail?.examples[0]).not.toHaveProperty('expectedOutput')
  })
})
