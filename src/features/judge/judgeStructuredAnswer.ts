import type { Question } from '../../types'
import { compareOutput } from '../questions/compareOutput'
import type { SubmissionResult, TestResult } from './types'

export type StructuredAnswer =
  | { type: 'output'; value: string }
  | { type: 'multipleChoice'; value: string[] }
  | { type: 'codeOrder'; value: string[] }

const sameMembers = (actual: readonly string[], expected: readonly string[]) => {
  const left = [...actual].sort()
  const right = [...expected].sort()
  return left.length === right.length && left.every((value, index) => value === right[index])
}

export function judgeStructuredAnswer(
  question: Question,
  answer: StructuredAnswer,
): SubmissionResult {
  let passed = false
  let expectedOutput = ''
  let actualOutput = ''

  if (question.type === 'output' && answer.type === 'output') {
    const test = question.examples[0]
    expectedOutput = test?.expectedOutput ?? ''
    actualOutput = answer.value
    passed = test
      ? compareOutput(actualOutput, expectedOutput, {
          mode: test.compareMode,
          numericTolerance: test.numericTolerance,
        }).passed
      : false
  } else if (question.type === 'multipleChoice' && answer.type === 'multipleChoice') {
    expectedOutput = (question.correctChoiceIds ?? []).join(',')
    actualOutput = answer.value.join(',')
    passed = sameMembers(answer.value, question.correctChoiceIds ?? [])
  } else if (question.type === 'codeOrder' && answer.type === 'codeOrder') {
    expectedOutput = (question.correctCodeOrder ?? []).join(',')
    actualOutput = answer.value.join(',')
    passed =
      answer.value.length === (question.correctCodeOrder ?? []).length &&
      answer.value.every((value, index) => value === question.correctCodeOrder?.[index])
  }

  const test: TestResult = {
    testCaseId: `${question.id}-structured`,
    hidden: false,
    status: passed ? 'passed' : 'wrongAnswer',
    passed,
    compareMode: question.examples[0]?.compareMode ?? 'exact',
    durationMs: 0,
    truncated: false,
    expectedOutput,
    actualOutput,
  }
  return {
    status: passed ? 'accepted' : 'wrongAnswer',
    passed,
    tests: [test],
    passedCount: passed ? 1 : 0,
    totalCount: 1,
    durationMs: 0,
  }
}
