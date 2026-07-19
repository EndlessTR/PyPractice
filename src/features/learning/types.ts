import type { SubmissionRecord } from '../judge'

export type Mastery = 0 | 1 | 2 | 3 | 4 | 5

export interface UserQuestionState {
  questionId: string
  favorite: boolean
  mastery: Mastery
  lastAttemptAt?: string
}

export interface Note {
  id: string
  questionId?: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface LearningSnapshot {
  status: 'loading' | 'ready'
  questionStates: Readonly<Record<string, UserQuestionState>>
  notes: readonly Note[]
  submissions: readonly SubmissionRecord[]
}

export interface LearningProgress {
  attemptCount: number
  practicedQuestionIds: string[]
  completedQuestionIds: string[]
  wrongQuestionIds: string[]
  favoriteQuestionIds: string[]
  noteCount: number
  averageMastery: number
}
