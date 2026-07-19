import type { Note, UserQuestionState } from './types'

export interface LearningRepository {
  listQuestionStates(): Promise<UserQuestionState[]>
  saveQuestionState(state: UserQuestionState): Promise<UserQuestionState>
  listNotes(questionId?: string): Promise<Note[]>
  saveNote(note: Note): Promise<Note>
  deleteNote(id: string): Promise<void>
  clear(): Promise<void>
}
