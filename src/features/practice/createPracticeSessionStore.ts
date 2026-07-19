import { appDatabase } from '../../repositories'
import { IndexedDbPracticeSessionRepository } from './IndexedDbPracticeSessionRepository'
import { PracticeSessionStore } from './PracticeSessionStore'

export const practiceSessionStore = new PracticeSessionStore(
  undefined,
  undefined,
  appDatabase ? new IndexedDbPracticeSessionRepository(appDatabase) : undefined,
)
