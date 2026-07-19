import { describe, expect, test } from 'vitest'

import type { Question } from '../../types'
import { judgeStructuredAnswer, type StructuredAnswer } from './judgeStructuredAnswer'

function structuredQuestion(type: Question['type']): Question {
  return {
    id: `structured-${type}`,
    slug: `structured-${type}`,
    title: '结构化题',
    chapterId: 'chapter-01',
    knowledgePointIds: ['basic-syntax'],
    description: 'test',
    requirements: [],
    difficulty: 'intro',
    type,
    starterCode: '',
    solutionCode: '',
    choices: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ],
    correctChoiceIds: ['a', 'b'],
    codeBlocks: [
      { id: 'first', code: 'a = 1' },
      { id: 'second', code: 'print(a)' },
    ],
    correctCodeOrder: ['first', 'second'],
    examples: [
      {
        id: 'example',
        input: '',
        expectedOutput: 'hello\n',
        visible: true,
        compareMode: 'exact',
      },
    ],
    hiddenTests: [],
    hints: [],
    explanation: '',
    estimatedMinutes: 1,
    status: 'approved',
    version: 1,
    createdAt: '2026-07-13',
  }
}

test.each<{
  type: Question['type']
  answer: StructuredAnswer
}>([
  { type: 'output', answer: { type: 'output', value: 'hello\n' } },
  { type: 'multipleChoice', answer: { type: 'multipleChoice', value: ['b', 'a'] } },
  { type: 'codeOrder', answer: { type: 'codeOrder', value: ['first', 'second'] } },
])('$type 正确答案返回 accepted', ({ type, answer }) => {
  const result = judgeStructuredAnswer(structuredQuestion(type), answer)

  expect(result).toMatchObject({
    status: 'accepted',
    passed: true,
    passedCount: 1,
    totalCount: 1,
  })
  expect(result.tests[0]).toMatchObject({ status: 'passed', passed: true, hidden: false })
})

describe('结构化答案类型隔离', () => {
  test('答案类型与题型不匹配时判为 wrongAnswer', () => {
    const result = judgeStructuredAnswer(structuredQuestion('output'), {
      type: 'codeOrder',
      value: ['first', 'second'],
    })
    expect(result).toMatchObject({ status: 'wrongAnswer', passed: false })
  })
})
