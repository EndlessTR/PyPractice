import { expect, test, vi } from 'vitest'

import type { SubmissionResult } from '../judge'
import { InMemoryPracticeSessionRepository } from './InMemoryPracticeSessionRepository'
import { PracticeSessionStore } from './PracticeSessionStore'

const result = (status: SubmissionResult['status'], durationMs: number): SubmissionResult => ({
  status,
  passed: status === 'accepted',
  tests: [],
  passedCount: status === 'accepted' ? 1 : 0,
  totalCount: 1,
  durationMs,
})

test('按题目版本复用会话并累计提交状态', () => {
  const times = [
    '2026-07-14T01:00:00.000Z',
    '2026-07-14T01:01:00.000Z',
    '2026-07-14T01:02:00.000Z',
    '2026-07-14T01:03:00.000Z',
  ]
  const store = new PracticeSessionStore(
    () => times.shift()!,
    () => 'session-one',
  )
  const listener = vi.fn()
  store.subscribe(listener)

  expect(store.getOrStart('question-a', 1)).toMatchObject({
    id: 'session-one',
    status: 'active',
    submissionCount: 0,
  })
  expect(store.getOrStart('question-a', 1).id).toBe('session-one')

  store.recordSubmission('question-a', 1, result('wrongAnswer', 12))
  const completed = store.recordSubmission('question-a', 1, result('accepted', 8))

  expect(completed).toMatchObject({
    status: 'completed',
    submissionCount: 2,
    totalJudgeDurationMs: 20,
    latestSubmissionStatus: 'accepted',
    completedAt: '2026-07-14T01:02:00.000Z',
  })
  expect(listener).toHaveBeenCalledTimes(2)
  expect(store.getOrStart('question-a', 2)).toMatchObject({
    questionVersion: 2,
    submissionCount: 0,
  })
})

test('完成状态不会被后续失败提交覆盖', () => {
  const store = new PracticeSessionStore(() => '2026-07-14T00:00:00.000Z')
  store.recordSubmission('question-a', 1, result('accepted', 5))
  const session = store.recordSubmission('question-a', 1, result('runtimeError', 3))

  expect(session.status).toBe('completed')
  expect(session.latestSubmissionStatus).toBe('runtimeError')
  expect(session.completedAt).toBe('2026-07-14T00:00:00.000Z')
})

test('从 repository 恢复尚未提交的页面会话', async () => {
  const repository = new InMemoryPracticeSessionRepository()
  await repository.save({
    id: 'persisted-session',
    questionId: 'question-a',
    questionVersion: 1,
    status: 'completed',
    startedAt: '2026-07-13T00:00:00.000Z',
    lastActivityAt: '2026-07-13T00:10:00.000Z',
    submissionCount: 3,
    totalJudgeDurationMs: 30,
    latestSubmissionStatus: 'accepted',
    completedAt: '2026-07-13T00:10:00.000Z',
  })
  const store = new PracticeSessionStore(
    () => '2026-07-14T00:00:00.000Z',
    () => 'temporary-session',
    repository,
  )
  store.getOrStart('question-a', 1)

  await store.hydrate('question-a', 1)

  expect(store.get('question-a', 1)).toMatchObject({
    id: 'persisted-session',
    status: 'completed',
    submissionCount: 3,
  })
})
