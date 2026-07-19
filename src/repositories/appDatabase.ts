export const APP_DATABASE_NAME = 'pypractice'
export const APP_DATABASE_VERSION = 2

export const STORE_NAMES = {
  submissions: 'submissions',
  practiceSessions: 'practiceSessions',
  userQuestionStates: 'userQuestionStates',
  notes: 'notes',
  preferences: 'preferences',
  metadata: 'metadata',
} as const

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES]

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 请求失败。'))
  })
}

export function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB 事务已中止。'))
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB 事务失败。'))
  })
}

function createV1(database: IDBDatabase) {
  const submissions = database.createObjectStore(STORE_NAMES.submissions, { keyPath: 'id' })
  submissions.createIndex('questionId', 'questionId')
  submissions.createIndex('submittedAt', 'submittedAt')

  const sessions = database.createObjectStore(STORE_NAMES.practiceSessions, { keyPath: 'id' })
  sessions.createIndex('questionKey', 'questionKey', { unique: true })
  sessions.createIndex('questionId', 'questionId')
  sessions.createIndex('lastActivityAt', 'lastActivityAt')
}

function migrateToV2(database: IDBDatabase, transaction: IDBTransaction) {
  database.createObjectStore(STORE_NAMES.userQuestionStates, { keyPath: 'questionId' })

  const notes = database.createObjectStore(STORE_NAMES.notes, { keyPath: 'id' })
  notes.createIndex('questionId', 'questionId')
  notes.createIndex('updatedAt', 'updatedAt')

  database.createObjectStore(STORE_NAMES.preferences, { keyPath: 'key' })
  const metadata = database.createObjectStore(STORE_NAMES.metadata, { keyPath: 'key' })
  metadata.put({ key: 'schemaVersion', value: 2 })

  // Keep the explicit transaction parameter: later migrations can transform existing stores.
  void transaction
}

export function applyMigrations(
  database: IDBDatabase,
  transaction: IDBTransaction,
  oldVersion: number,
) {
  if (oldVersion < 1) createV1(database)
  if (oldVersion < 2) migrateToV2(database, transaction)
}

export class AppDatabase {
  private databasePromise?: Promise<IDBDatabase>

  constructor(
    private readonly factory: IDBFactory = indexedDB,
    private readonly name = APP_DATABASE_NAME,
  ) {}

  open(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise
    const databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = this.factory.open(this.name, APP_DATABASE_VERSION)
      request.onupgradeneeded = (event) => {
        applyMigrations(request.result, request.transaction!, event.oldVersion)
      }
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close()
        resolve(request.result)
      }
      request.onerror = () => reject(request.error ?? new Error('无法打开本地学习数据库。'))
      request.onblocked = () => reject(new Error('数据库升级被其他页面阻塞，请关闭旧页面后重试。'))
    }).catch((error) => {
      this.databasePromise = undefined
      throw error
    })
    this.databasePromise = databasePromise
    return databasePromise
  }

  async close(): Promise<void> {
    const database = await this.databasePromise
    database?.close()
    this.databasePromise = undefined
  }
}

export const appDatabase = typeof indexedDB === 'undefined' ? undefined : new AppDatabase()
