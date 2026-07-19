import type { SubmissionRepository } from './SubmissionRepository'
import type { SubmissionRecord } from './types'

/** Falls back to memory when IndexedDB is unavailable or rejects an operation. */
export class ResilientSubmissionRepository implements SubmissionRepository {
  constructor(
    private readonly primary: SubmissionRepository,
    private readonly fallback: SubmissionRepository,
  ) {}

  async save(record: SubmissionRecord): Promise<SubmissionRecord> {
    try {
      const saved = await this.primary.save(record)
      await this.fallback.save(saved)
      return saved
    } catch {
      return this.fallback.save(record)
    }
  }

  async getById(id: string): Promise<SubmissionRecord | undefined> {
    try {
      return (await this.primary.getById(id)) ?? this.fallback.getById(id)
    } catch {
      return this.fallback.getById(id)
    }
  }

  async list(questionId?: string): Promise<SubmissionRecord[]> {
    try {
      const [primary, fallback] = await Promise.all([
        this.primary.list(questionId),
        this.fallback.list(questionId),
      ])
      const records = new Map(primary.map((record) => [record.id, record]))
      fallback.forEach((record) => records.set(record.id, record))
      return [...records.values()].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    } catch {
      return this.fallback.list(questionId)
    }
  }

  async clear(): Promise<void> {
    await Promise.allSettled([this.primary.clear(), this.fallback.clear()])
  }
}
