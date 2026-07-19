import {
  STORE_NAMES,
  requestToPromise,
  transactionToPromise,
  type AppDatabase,
} from '../../repositories'
import type { LearningRepository } from './LearningRepository'
import type { Note, UserQuestionState } from './types'

export class IndexedDbLearningRepository implements LearningRepository {
  constructor(private readonly database: AppDatabase) {}

  async listQuestionStates(): Promise<UserQuestionState[]> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.userQuestionStates, 'readonly')
    const done = transactionToPromise(transaction)
    const states = await requestToPromise<UserQuestionState[]>(
      transaction.objectStore(STORE_NAMES.userQuestionStates).getAll(),
    )
    await done
    return states
  }

  async saveQuestionState(state: UserQuestionState): Promise<UserQuestionState> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.userQuestionStates, 'readwrite')
    transaction.objectStore(STORE_NAMES.userQuestionStates).put(structuredClone(state))
    await transactionToPromise(transaction)
    return structuredClone(state)
  }

  async listNotes(questionId?: string): Promise<Note[]> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.notes, 'readonly')
    const done = transactionToPromise(transaction)
    const store = transaction.objectStore(STORE_NAMES.notes)
    const request = questionId ? store.index('questionId').getAll(questionId) : store.getAll()
    const notes = await requestToPromise<Note[]>(request)
    await done
    return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async saveNote(note: Note): Promise<Note> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.notes, 'readwrite')
    transaction.objectStore(STORE_NAMES.notes).put(structuredClone(note))
    await transactionToPromise(transaction)
    return structuredClone(note)
  }

  async deleteNote(id: string): Promise<void> {
    const database = await this.database.open()
    const transaction = database.transaction(STORE_NAMES.notes, 'readwrite')
    transaction.objectStore(STORE_NAMES.notes).delete(id)
    await transactionToPromise(transaction)
  }

  async clear(): Promise<void> {
    const database = await this.database.open()
    const transaction = database.transaction(
      [STORE_NAMES.userQuestionStates, STORE_NAMES.notes],
      'readwrite',
    )
    transaction.objectStore(STORE_NAMES.userQuestionStates).clear()
    transaction.objectStore(STORE_NAMES.notes).clear()
    await transactionToPromise(transaction)
  }
}
