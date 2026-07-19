import { expect, test } from 'vitest'

import { InMemorySubmissionRepository } from './InMemorySubmissionRepository'
import type { SubmissionRecord } from './types'

const record = (id: string, questionId: string): SubmissionRecord => ({
  id,
  questionId,
  questionVersion: 1,
  userCode: 'print(1)',
  submittedAt: '2026-07-13T00:00:00.000Z',
  result: {
    status: 'accepted',
    passed: true,
    tests: [],
    passedCount: 0,
    totalCount: 0,
    durationMs: 0,
  },
})

test('内存仓库保存副本、支持按题筛选与清空', async () => {
  const repository = new InMemorySubmissionRepository()
  const source = record('one', 'question-a')
  await repository.save(source)
  await repository.save(record('two', 'question-b'))

  source.userCode = 'mutated outside'
  const firstRead = await repository.getById('one')
  expect(firstRead?.userCode).toBe('print(1)')
  if (firstRead) firstRead.userCode = 'mutated result'
  expect((await repository.getById('one'))?.userCode).toBe('print(1)')
  expect((await repository.list('question-a')).map((item) => item.id)).toEqual(['one'])
  expect(await repository.list()).toHaveLength(2)

  await repository.clear()
  expect(await repository.list()).toEqual([])
})
