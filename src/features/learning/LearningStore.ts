import type { SubmissionRepository } from '../judge'
import type { LearningRepository } from './LearningRepository'
import type { LearningSnapshot, Mastery, Note, UserQuestionState } from './types'

type Listener = () => void

const emptySnapshot: LearningSnapshot = {
  status: 'loading',
  questionStates: {},
  notes: [],
  submissions: [],
}

export class LearningStore {
  private snapshot: LearningSnapshot = emptySnapshot
  private readonly listeners = new Set<Listener>()
  private loadTask?: Promise<void>

  constructor(
    private readonly repository: LearningRepository,
    private readonly submissions: SubmissionRepository,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () =>
      globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}`,
  ) {}

  getSnapshot = (): LearningSnapshot => this.snapshot

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  load(): Promise<void> {
    if (this.snapshot.status === 'ready') return Promise.resolve()
    if (this.loadTask) return this.loadTask
    this.loadTask = Promise.all([
      this.repository.listQuestionStates(),
      this.repository.listNotes(),
      this.submissions.list(),
    ])
      .then(([states, notes, submissions]) => {
        this.replace({
          status: 'ready',
          questionStates: Object.fromEntries(states.map((state) => [state.questionId, state])),
          notes,
          submissions,
        })
      })
      .finally(() => {
        this.loadTask = undefined
      })
    return this.loadTask
  }

  async toggleFavorite(questionId: string): Promise<void> {
    const current = this.questionState(questionId)
    await this.saveQuestionState({ ...current, favorite: !current.favorite })
  }

  async setMastery(questionId: string, mastery: Mastery): Promise<void> {
    await this.saveQuestionState({ ...this.questionState(questionId), mastery })
  }

  async saveQuestionNote(questionId: string, content: string): Promise<void> {
    const existing = this.snapshot.notes.find((note) => note.questionId === questionId)
    const trimmed = content.trim()
    if (!trimmed) {
      if (!existing) return
      this.replace({
        ...this.snapshot,
        notes: this.snapshot.notes.filter((note) => note.id !== existing.id),
      })
      await this.repository.deleteNote(existing.id)
      return
    }

    const timestamp = this.now()
    const note: Note = existing
      ? { ...existing, content: trimmed, updatedAt: timestamp }
      : {
          id: this.createId(),
          questionId,
          content: trimmed,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
    const notes = [note, ...this.snapshot.notes.filter((item) => item.id !== note.id)]
    this.replace({ ...this.snapshot, notes })
    await this.repository.saveNote(note)
  }

  async recordAttempt(questionId: string): Promise<void> {
    const state = { ...this.questionState(questionId), lastAttemptAt: this.now() }
    const [submissions] = await Promise.all([
      this.submissions.list(),
      this.repository.saveQuestionState(state),
    ])
    this.replace({
      ...this.snapshot,
      status: 'ready',
      questionStates: { ...this.snapshot.questionStates, [questionId]: state },
      submissions,
    })
  }

  private questionState(questionId: string): UserQuestionState {
    return (
      this.snapshot.questionStates[questionId] ?? {
        questionId,
        favorite: false,
        mastery: 0,
      }
    )
  }

  private async saveQuestionState(state: UserQuestionState): Promise<void> {
    this.replace({
      ...this.snapshot,
      questionStates: { ...this.snapshot.questionStates, [state.questionId]: state },
    })
    await this.repository.saveQuestionState(state)
  }

  private replace(snapshot: LearningSnapshot): void {
    this.snapshot = snapshot
    this.listeners.forEach((listener) => listener())
  }
}
