import type { Question, QuestionFilter, TestCase } from '../../types'

export type QuestionSummary = Pick<
  Question,
  'id' | 'slug' | 'title' | 'chapterId' | 'knowledgePointIds' | 'description' | 'difficulty' | 'type' | 'estimatedMinutes' | 'version'
>

export type PublicTestCase = Omit<TestCase, 'expectedOutput'> & { expectedOutput?: string }

export type PracticeQuestion = Omit<
  Question,
  | 'solutionCode'
  | 'hiddenTests'
  | 'testHarnessCode'
  | 'correctChoiceIds'
  | 'correctCodeOrder'
  | 'examples'
> & { examples: PublicTestCase[] }

export interface QuestionProvider {
  list(filter?: QuestionFilter): QuestionSummary[]
  getById(id: string): PracticeQuestion | undefined
  countByChapter(chapterId: string): number
}

const matchesFilter = (question: Question, filter: QuestionFilter) =>
  (!filter.chapterId || question.chapterId === filter.chapterId) &&
  (!filter.difficulty || question.difficulty === filter.difficulty) &&
  (!filter.type || question.type === filter.type) &&
  (!filter.knowledgePointId || question.knowledgePointIds.includes(filter.knowledgePointId))

const toSummary = (question: Question): QuestionSummary => ({
  id: question.id,
  slug: question.slug,
  title: question.title,
  chapterId: question.chapterId,
  knowledgePointIds: [...question.knowledgePointIds],
  description: question.description,
  difficulty: question.difficulty,
  type: question.type,
  estimatedMinutes: question.estimatedMinutes,
  version: question.version,
})

const toPracticeQuestion = (question: Question): PracticeQuestion => {
  const {
    solutionCode: _solution,
    hiddenTests: _hidden,
    testHarnessCode: _harness,
    correctChoiceIds: _correctChoices,
    correctCodeOrder: _correctOrder,
    examples,
    ...safeQuestion
  } = question
  void _solution
  void _hidden
  void _harness
  void _correctChoices
  void _correctOrder
  const mustRedactExpectedOutput = ['output', 'multipleChoice', 'codeOrder'].includes(question.type)
  return {
    ...safeQuestion,
    examples: examples.map(({ expectedOutput, ...example }) =>
      mustRedactExpectedOutput ? example : { ...example, expectedOutput },
    ),
  }
}

export class LocalQuestionProvider implements QuestionProvider {
  readonly #approvedQuestions: readonly Question[]

  constructor(questions: readonly Question[]) {
    this.#approvedQuestions = questions.filter((question) => question.status === 'approved')
  }

  list(filter: QuestionFilter = {}): QuestionSummary[] {
    return this.#approvedQuestions.filter((question) => matchesFilter(question, filter)).map(toSummary)
  }

  getById(id: string): PracticeQuestion | undefined {
    const question = this.#approvedQuestions.find((item) => item.id === id)
    return question ? toPracticeQuestion(question) : undefined
  }

  countByChapter(chapterId: string): number {
    return this.#approvedQuestions.filter((question) => question.chapterId === chapterId).length
  }
}
