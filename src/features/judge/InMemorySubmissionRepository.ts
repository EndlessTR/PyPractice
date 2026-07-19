import type { SubmissionRecord } from './types'
import type { SubmissionRepository } from './SubmissionRepository'

export class InMemorySubmissionRepository implements SubmissionRepository {
  private readonly records: SubmissionRecord[] = []

  async save(record: SubmissionRecord): Promise<SubmissionRecord> {
    const stored = structuredClone(record)
    this.records.push(stored)
    return structuredClone(stored)
  }

  async getById(id: string): Promise<SubmissionRecord | undefined> {
    const found = this.records.find((record) => record.id === id)
    return found ? structuredClone(found) : undefined
  }

  async list(questionId?: string): Promise<SubmissionRecord[]> {
    return Promise.resolve(
      this.records
        .filter((record) => !questionId || record.questionId === questionId)
        .map((record) => structuredClone(record)),
    )
  }

  async clear(): Promise<void> {
    this.records.length = 0
  }
}
