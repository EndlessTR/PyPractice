import type { LearningRepository } from './LearningRepository'
import type { Note, UserQuestionState } from './types'

export class ResilientLearningRepository implements LearningRepository {
  constructor(
    private readonly primary: LearningRepository,
    private readonly fallback: LearningRepository,
  ) {}

  async listQuestionStates(): Promise<UserQuestionState[]> {
    try {
      const [primary, fallback] = await Promise.all([
        this.primary.listQuestionStates(),
        this.fallback.listQuestionStates(),
      ])
      const states = new Map(primary.map((state) => [state.questionId, state]))
      fallback.forEach((state) => states.set(state.questionId, state))
      return [...states.values()]
    } catch {
      return this.fallback.listQuestionStates()
    }
  }

  async saveQuestionState(state: UserQuestionState): Promise<UserQuestionState> {
    try {
      const saved = await this.primary.saveQuestionState(state)
      await this.fallback.saveQuestionState(saved)
      return saved
    } catch {
      return this.fallback.saveQuestionState(state)
    }
  }

  async listNotes(questionId?: string): Promise<Note[]> {
    try {
      const [primary, fallback] = await Promise.all([
        this.primary.listNotes(questionId),
        this.fallback.listNotes(questionId),
      ])
      const notes = new Map(primary.map((note) => [note.id, note]))
      fallback.forEach((note) => notes.set(note.id, note))
      return [...notes.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    } catch {
      return this.fallback.listNotes(questionId)
    }
  }

  async saveNote(note: Note): Promise<Note> {
    try {
      const saved = await this.primary.saveNote(note)
      await this.fallback.saveNote(saved)
      return saved
    } catch {
      return this.fallback.saveNote(note)
    }
  }

  async deleteNote(id: string): Promise<void> {
    await Promise.allSettled([this.primary.deleteNote(id), this.fallback.deleteNote(id)])
  }

  async clear(): Promise<void> {
    await Promise.allSettled([this.primary.clear(), this.fallback.clear()])
  }
}
