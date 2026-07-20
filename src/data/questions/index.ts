import type { Question } from '../../types/question'
import { chapters01to05 } from './chapters01to05'
import { chapters06to10 } from './chapters06to10'
import { chapters11to14 } from './chapters11to14'
import { expansionReview } from './expansionReview'
import { outputExpansion } from './outputExpansion'

export const questions: readonly Question[] = [
  ...chapters01to05,
  ...chapters06to10,
  ...chapters11to14,
  ...expansionReview,
  ...outputExpansion,
]

export default questions
