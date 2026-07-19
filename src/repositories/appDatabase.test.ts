import { IDBFactory } from 'fake-indexeddb'

import { AppDatabase, STORE_NAMES, requestToPromise, transactionToPromise } from './appDatabase'

function createLegacyDatabase(factory: IDBFactory, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, 1)
    request.onupgradeneeded = () => {
      const submissions = request.result.createObjectStore(STORE_NAMES.submissions, {
        keyPath: 'id',
      })
      submissions.createIndex('questionId', 'questionId')
      submissions.createIndex('submittedAt', 'submittedAt')
      const sessions = request.result.createObjectStore(STORE_NAMES.practiceSessions, {
        keyPath: 'id',
      })
      sessions.createIndex('questionKey', 'questionKey', { unique: true })
      sessions.createIndex('questionId', 'questionId')
      sessions.createIndex('lastActivityAt', 'lastActivityAt')
      submissions.put({
        id: 'legacy-submission',
        questionId: 'question-a',
        submittedAt: '2026-07-14T00:00:00.000Z',
      })
    }
    request.onsuccess = () => {
      request.result.close()
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

test('从 v1 升级到 v2 时保留提交并创建学习状态表', async () => {
  const factory = new IDBFactory()
  const name = 'migration-test'
  await createLegacyDatabase(factory, name)

  const wrapper = new AppDatabase(factory, name)
  const database = await wrapper.open()
  expect(database.version).toBe(2)
  expect([...database.objectStoreNames]).toEqual(expect.arrayContaining(Object.values(STORE_NAMES)))

  const transaction = database.transaction(
    [STORE_NAMES.submissions, STORE_NAMES.metadata],
    'readonly',
  )
  const done = transactionToPromise(transaction)
  const legacy = await requestToPromise(
    transaction.objectStore(STORE_NAMES.submissions).get('legacy-submission'),
  )
  const metadata = await requestToPromise(
    transaction.objectStore(STORE_NAMES.metadata).get('schemaVersion'),
  )
  await done

  expect(legacy).toMatchObject({ id: 'legacy-submission', questionId: 'question-a' })
  expect(metadata).toEqual({ key: 'schemaVersion', value: 2 })
  await wrapper.close()
})
