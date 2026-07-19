import type { SubmissionRecord } from '../judge'
import { deriveLearningProgress } from './progress'
import type { LearningSnapshot } from './types'

const submission = (
  id: string,
  questionId: string,
  status: SubmissionRecord['result']['status'],
): SubmissionRecord => ({
  id,
  questionId,
  questionVersion: 1,
  userCode: '',
  submittedAt: `2026-07-14T00:0${id}:00.000Z`,
  result: {
    status,
    passed: status === 'accepted',
    tests: [],
    passedCount: status === 'accepted' ? 1 : 0,
    totalCount: 1,
    durationMs: 1,
  },
})

test('从真实提交与题目状态派生完成、错题和掌握度', () => {
  const snapshot: LearningSnapshot = {
    status: 'ready',
    submissions: [
      submission('1', 'question-a', 'wrongAnswer'),
      submission('2', 'question-a', 'accepted'),
      submission('3', 'question-b', 'runtimeError'),
    ],
    notes: [
      {
        id: 'note-one',
        questionId: 'question-a',
        content: 'note',
        createdAt: '2026-07-14T00:00:00.000Z',
        updatedAt: '2026-07-14T00:00:00.000Z',
      },
    ],
    questionStates: {
      'question-a': { questionId: 'question-a', favorite: true, mastery: 4 },
      'question-b': { questionId: 'question-b', favorite: false, mastery: 2 },
    },
  }

  expect(deriveLearningProgress(snapshot)).toEqual({
    attemptCount: 3,
    practicedQuestionIds: ['question-a', 'question-b'],
    completedQuestionIds: ['question-a'],
    wrongQuestionIds: ['question-b'],
    favoriteQuestionIds: ['question-a'],
    noteCount: 1,
    averageMastery: 3,
  })
})
