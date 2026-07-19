import { IDBFactory } from 'fake-indexeddb'

import { AppDatabase } from '../../repositories'
import { IndexedDbSubmissionRepository } from './IndexedDbSubmissionRepository'
import type { SubmissionRecord } from './types'

const record = (id: string, questionId: string): SubmissionRecord => ({
  id,
  questionId,
  questionVersion: 1,
  userCode: 'print(1)',
  submittedAt: `2026-07-14T00:00:0${id}.000Z`,
  result: {
    status: 'accepted',
    passed: true,
    tests: [],
    passedCount: 1,
    totalCount: 1,
    durationMs: 2,
  },
})

test('IndexedDB 提交仓库满足保存、查询、筛选和清空契约', async () => {
  const database = new AppDatabase(new IDBFactory(), 'submission-repository-test')
  const repository = new IndexedDbSubmissionRepository(database)

  await repository.save(record('1', 'question-a'))
  await repository.save(record('2', 'question-b'))

  expect((await repository.getById('1'))?.userCode).toBe('print(1)')
  expect((await repository.list('question-a')).map((item) => item.id)).toEqual(['1'])
  expect(await repository.list()).toHaveLength(2)

  await repository.clear()
  expect(await repository.list()).toEqual([])
  await database.close()
})
