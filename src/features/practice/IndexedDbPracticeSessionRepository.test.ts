import { IDBFactory } from 'fake-indexeddb'

import { AppDatabase } from '../../repositories'
import { IndexedDbPracticeSessionRepository } from './IndexedDbPracticeSessionRepository'
import type { PracticeSession } from './PracticeSessionStore'

const session: PracticeSession = {
  id: 'session-one',
  questionId: 'question-a',
  questionVersion: 2,
  status: 'completed',
  startedAt: '2026-07-14T00:00:00.000Z',
  lastActivityAt: '2026-07-14T00:02:00.000Z',
  submissionCount: 2,
  totalJudgeDurationMs: 20,
  latestSubmissionStatus: 'accepted',
  completedAt: '2026-07-14T00:02:00.000Z',
}

test('IndexedDB 会话仓库按题目版本恢复会话', async () => {
  const database = new AppDatabase(new IDBFactory(), 'session-repository-test')
  const repository = new IndexedDbPracticeSessionRepository(database)

  await repository.save(session)
  expect(await repository.get('question-a', 2)).toEqual(session)
  expect(await repository.get('question-a', 1)).toBeUndefined()

  await repository.clear()
  expect(await repository.get('question-a', 2)).toBeUndefined()
  await database.close()
})
