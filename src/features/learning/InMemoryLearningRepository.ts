import type { LearningRepository } from './LearningRepository'
import type { Note, UserQuestionState } from './types'

export class InMemoryLearningRepository implements LearningRepository {
  private readonly states = new Map<string, UserQuestionState>()
  private readonly notes = new Map<string, Note>()

  async listQuestionStates(): Promise<UserQuestionState[]> {
    return [...this.states.values()].map((state) => structuredClone(state))
  }

  async saveQuestionState(state: UserQuestionState): Promise<UserQuestionState> {
    const stored = structuredClone(state)
    this.states.set(state.questionId, stored)
    return structuredClone(stored)
  }

  async listNotes(questionId?: string): Promise<Note[]> {
    return [...this.notes.values()]
      .filter((note) => !questionId || note.questionId === questionId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((note) => structuredClone(note))
  }

  async saveNote(note: Note): Promise<Note> {
    const stored = structuredClone(note)
    this.notes.set(note.id, stored)
    return structuredClone(stored)
  }

  async deleteNote(id: string): Promise<void> {
    this.notes.delete(id)
  }

  async clear(): Promise<void> {
    this.states.clear()
    this.notes.clear()
  }
}
