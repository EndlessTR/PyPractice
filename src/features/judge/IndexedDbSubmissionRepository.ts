import {
  STORE_NAMES,
  requestToPromise,
  transactionToPromise,
  type AppDatabase,
} from '../../repositories'
import type { SubmissionRepository } from './SubmissionRepository'
import type { SubmissionRecord } from './types'

export class IndexedDbSubmissionRepository implements SubmissionRepository {
  constructor(private readonly database: AppDatabase) {}

  async save(record: SubmissionRecord): Promise<SubmissionRecord> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.submissions, 'readwrite')
    transaction.objectStore(STORE_NAMES.submissions).put(structuredClone(record))
    await transactionToPromise(transaction)
    return structuredClone(record)
  }

  async getById(id: string): Promise<SubmissionRecord | undefined> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.submissions, 'readonly')
    const record = await requestToPromise<SubmissionRecord | undefined>(
      transaction.objectStore(STORE_NAMES.submissions).get(id),
    )
    await transactionToPromise(transaction)
    return record ? structuredClone(record) : undefined
  }

  async list(questionId?: string): Promise<SubmissionRecord[]> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.submissions, 'readonly')
    const store = transaction.objectStore(STORE_NAMES.submissions)
    const request = questionId ? store.index('questionId').getAll(questionId) : store.getAll()
    const records = await requestToPromise<SubmissionRecord[]>(request)
    await transactionToPromise(transaction)
    return records.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  }

  async clear(): Promise<void> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.submissions, 'readwrite')
    transaction.objectStore(STORE_NAMES.submissions).clear()
    await transactionToPromise(transaction)
  }
}
