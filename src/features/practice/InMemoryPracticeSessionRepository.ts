import type { PracticeSessionRepository } from './PracticeSessionRepository'
import type { PracticeSession } from './PracticeSessionStore'

const keyOf = (questionId: string, questionVersion: number) => `${questionId}@${questionVersion}`

export class InMemoryPracticeSessionRepository implements PracticeSessionRepository {
  private readonly sessions = new Map<string, PracticeSession>()

  async save(session: PracticeSession): Promise<PracticeSession> {
    const stored = structuredClone(session)
    this.sessions.set(keyOf(session.questionId, session.questionVersion), stored)
    return structuredClone(stored)
  }

  async get(questionId: string, questionVersion: number): Promise<PracticeSession | undefined> {
    const session = this.sessions.get(keyOf(questionId, questionVersion))
    return session ? structuredClone(session) : undefined
  }

  async clear(): Promise<void> {
    this.sessions.clear()
  }
}
