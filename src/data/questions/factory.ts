import type { Question } from '../../types/question'

type SeedQuestion = Omit<Question, 'createdAt' | 'status' | 'version'>

export const defineQuestion = (question: SeedQuestion): Question => ({
  ...question,
  createdAt: '2026-07-13',
  status: 'approved',
  version: 1,
})
