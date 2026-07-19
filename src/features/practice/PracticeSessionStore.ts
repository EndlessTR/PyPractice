import type { SubmissionResult, SubmissionStatus } from '../judge'
import type { PracticeSessionRepository } from './PracticeSessionRepository'

export type PracticeSessionStatus = 'active' | 'completed'

export interface PracticeSession {
  id: string
  questionId: string
  questionVersion: number
  status: PracticeSessionStatus
  startedAt: string
  lastActivityAt: string
  submissionCount: number
  totalJudgeDurationMs: number
  latestSubmissionStatus?: SubmissionStatus
  completedAt?: string
}

type Listener = () => void

const sessionKey = (questionId: string, questionVersion: number) =>
  `${questionId}@${questionVersion}`

const cloneSession = (session: PracticeSession): PracticeSession => ({ ...session })
const freezeSession = (session: PracticeSession): PracticeSession => Object.freeze(session)

export class PracticeSessionStore {
  private readonly sessions = new Map<string, PracticeSession>()
  private readonly listeners = new Set<Listener>()
  private readonly hydrated = new Set<string>()
  private readonly hydrationTasks = new Map<string, Promise<void>>()

  constructor(
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () =>
      globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`,
    private readonly repository?: PracticeSessionRepository,
  ) {}

  get(questionId: string, questionVersion: number): PracticeSession | undefined {
    const session = this.sessions.get(sessionKey(questionId, questionVersion))
    return session ? cloneSession(session) : undefined
  }

  /** React external-store snapshots must keep the same identity until the store changes. */
  getSnapshot(questionId: string, questionVersion: number): PracticeSession | undefined {
    return this.sessions.get(sessionKey(questionId, questionVersion))
  }

  getOrStart(questionId: string, questionVersion: number): PracticeSession {
    const key = sessionKey(questionId, questionVersion)
    const existing = this.sessions.get(key)
    if (existing) return existing

    const startedAt = this.now()
    const session: PracticeSession = {
      id: this.createId(),
      questionId,
      questionVersion,
      status: 'active',
      startedAt,
      lastActivityAt: startedAt,
      submissionCount: 0,
      totalJudgeDurationMs: 0,
    }
    const stored = freezeSession(session)
    this.sessions.set(key, stored)
    return stored
  }

  hydrate(questionId: string, questionVersion: number): Promise<void> {
    const key = sessionKey(questionId, questionVersion)
    if (!this.repository || this.hydrated.has(key)) return Promise.resolve()
    const activeTask = this.hydrationTasks.get(key)
    if (activeTask) return activeTask

    const task = this.repository
      .get(questionId, questionVersion)
      .then(async (persisted) => {
        const current = this.sessions.get(key)
        if (persisted && (!current || current.submissionCount === 0)) {
          this.sessions.set(key, freezeSession(persisted))
          this.emit()
        } else if (current) {
          await this.repository?.save(current)
        }
        this.hydrated.add(key)
      })
      .catch(() => {
        // Restricted/private browsing may reject IndexedDB; keep the usable memory session.
        this.hydrated.add(key)
      })
      .finally(() => this.hydrationTasks.delete(key))
    this.hydrationTasks.set(key, task)
    return task
  }

  recordSubmission(
    questionId: string,
    questionVersion: number,
    result: SubmissionResult,
  ): PracticeSession {
    const key = sessionKey(questionId, questionVersion)
    const current = this.sessions.get(key) ?? this.getOrStart(questionId, questionVersion)
    const submittedAt = this.now()
    const accepted = result.status === 'accepted'
    const next: PracticeSession = {
      ...current,
      status: accepted || current.status === 'completed' ? 'completed' : 'active',
      lastActivityAt: submittedAt,
      submissionCount: current.submissionCount + 1,
      totalJudgeDurationMs: current.totalJudgeDurationMs + result.durationMs,
      latestSubmissionStatus: result.status,
      completedAt: current.completedAt ?? (accepted ? submittedAt : undefined),
    }
    this.sessions.set(key, freezeSession(next))
    void this.repository?.save(next).catch(() => undefined)
    this.emit()
    return cloneSession(next)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  clear(): void {
    if (!this.sessions.size) return
    this.sessions.clear()
    this.emit()
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener())
  }
}
