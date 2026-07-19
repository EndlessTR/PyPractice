import type { PracticeSession } from './PracticeSessionStore'

export interface PracticeSessionRepository {
  save(session: PracticeSession): Promise<PracticeSession>
  get(questionId: string, questionVersion: number): Promise<PracticeSession | undefined>
  clear(): Promise<void>
}
