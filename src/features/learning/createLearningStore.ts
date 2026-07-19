import { appDatabase } from '../../repositories'
import { submissionRepository } from '../judge'
import { InMemoryLearningRepository } from './InMemoryLearningRepository'
import { IndexedDbLearningRepository } from './IndexedDbLearningRepository'
import { LearningStore } from './LearningStore'
import { ResilientLearningRepository } from './ResilientLearningRepository'

const memoryRepository = new InMemoryLearningRepository()
const learningRepository = appDatabase
  ? new ResilientLearningRepository(new IndexedDbLearningRepository(appDatabase), memoryRepository)
  : memoryRepository

export const learningStore = new LearningStore(learningRepository, submissionRepository)
