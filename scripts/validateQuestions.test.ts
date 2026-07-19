import { questions } from '../src/data/questions'
import { validateQuestions } from './validateQuestions'

test('题库通过静态结构与引用校验', () => {
  expect(validateQuestions(questions)).toEqual([])
})

