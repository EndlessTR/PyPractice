import type { SubmissionRecord } from './types'

export interface SubmissionRepository {
  save(record: SubmissionRecord): Promise<SubmissionRecord>
  getById(id: string): Promise<SubmissionRecord | undefined>
  list(questionId?: string): Promise<SubmissionRecord[]>
  clear(): Promise<void>
}
