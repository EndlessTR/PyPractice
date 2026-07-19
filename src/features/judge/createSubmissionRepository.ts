import { appDatabase } from '../../repositories'
import { IndexedDbSubmissionRepository } from './IndexedDbSubmissionRepository'
import { InMemorySubmissionRepository } from './InMemorySubmissionRepository'
import { ResilientSubmissionRepository } from './ResilientSubmissionRepository'

const memorySubmissionRepository = new InMemorySubmissionRepository()

export const submissionRepository = appDatabase
  ? new ResilientSubmissionRepository(
      new IndexedDbSubmissionRepository(appDatabase),
      memorySubmissionRepository,
    )
  : memorySubmissionRepository
