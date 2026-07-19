import { vi } from 'vitest'

import { InMemorySubmissionRepository, type SubmissionRecord } from '../judge'
import { InMemoryLearningRepository } from './InMemoryLearningRepository'
import { LearningStore } from './LearningStore'
import { deriveLearningProgress } from './progress'

const accepted: SubmissionRecord = {
  id: 'submission-one',
  questionId: 'question-a',
  questionVersion: 1,
  userCode: 'print(1)',
  submittedAt: '2026-07-14T00:01:00.000Z',
  result: {
    status: 'accepted',
    passed: true,
    tests: [],
    passedCount: 1,
    totalCount: 1,
    durationMs: 4,
  },
}

test('学习 Store 持久化收藏、掌握度、笔记并刷新提交进度', async () => {
  const repository = new InMemoryLearningRepository()
  const submissions = new InMemorySubmissionRepository()
  const store = new LearningStore(
    repository,
    submissions,
    () => '2026-07-14T00:02:00.000Z',
    () => 'note-one',
  )
  const listener = vi.fn()
  store.subscribe(listener)

  await store.load()
  await store.toggleFavorite('question-a')
  await store.setMastery('question-a', 4)
  await store.saveQuestionNote('question-a', '  注意边界条件  ')
  await submissions.save(accepted)
  await store.recordAttempt('question-a')

  expect(store.getSnapshot().questionStates['question-a']).toMatchObject({
    favorite: true,
    mastery: 4,
    lastAttemptAt: '2026-07-14T00:02:00.000Z',
  })
  expect(store.getSnapshot().notes[0]).toMatchObject({
    id: 'note-one',
    content: '注意边界条件',
  })
  expect(deriveLearningProgress(store.getSnapshot()).completedQuestionIds).toEqual(['question-a'])
  expect(listener).toHaveBeenCalled()

  await store.saveQuestionNote('question-a', '   ')
  expect(store.getSnapshot().notes).toEqual([])
})
