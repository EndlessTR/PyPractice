import {
  STORE_NAMES,
  requestToPromise,
  transactionToPromise,
  type AppDatabase,
} from '../../repositories'
import type { PracticeSessionRepository } from './PracticeSessionRepository'
import type { PracticeSession } from './PracticeSessionStore'

type StoredPracticeSession = PracticeSession & { questionKey?: string }

const questionKey = (questionId: string, questionVersion: number) =>
  `${questionId}@${questionVersion}`

export class IndexedDbPracticeSessionRepository implements PracticeSessionRepository {
  constructor(private readonly database: AppDatabase) {}

  async save(session: PracticeSession): Promise<PracticeSession> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.practiceSessions, 'readwrite')
    const stored: StoredPracticeSession = {
      ...structuredClone(session),
      questionKey: questionKey(session.questionId, session.questionVersion),
    }
    transaction.objectStore(STORE_NAMES.practiceSessions).put(stored)
    await transactionToPromise(transaction)
    return structuredClone(session)
  }

  async get(questionId: string, questionVersion: number): Promise<PracticeSession | undefined> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.practiceSessions, 'readonly')
    const stored = await requestToPromise<StoredPracticeSession | undefined>(
      transaction
        .objectStore(STORE_NAMES.practiceSessions)
        .index('questionKey')
        .get(questionKey(questionId, questionVersion)),
    )
    await transactionToPromise(transaction)
    if (!stored) return undefined
    const session = structuredClone(stored)
    delete session.questionKey
    return session
  }

  async clear(): Promise<void> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.practiceSessions, 'readwrite')
    transaction.objectStore(STORE_NAMES.practiceSessions).clear()
    await transactionToPromise(transaction)
  }
}
