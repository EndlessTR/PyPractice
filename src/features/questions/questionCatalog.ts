import { questions } from '../../data/questions'
import { LocalQuestionProvider } from './LocalQuestionProvider'

export const questionProvider = new LocalQuestionProvider(questions)

