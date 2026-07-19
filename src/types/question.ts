export const DIFFICULTIES = ['intro', 'basic', 'skilled', 'combined'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const QUESTION_TYPES = [
  'coding',
  'fillBlank',
  'debug',
  'output',
  'multipleChoice',
  'codeOrder',
  'miniProject',
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export const COMPARE_MODES = [
  'exact',
  'trimmed',
  'lineTrimmed',
  'numeric',
  'unorderedLines',
  'custom',
] as const
export type CompareMode = (typeof COMPARE_MODES)[number]

export const QUESTION_STATUSES = ['draft', 'review', 'approved', 'retired'] as const
export type QuestionStatus = (typeof QUESTION_STATUSES)[number]

export interface VirtualFile {
  path: string
  content: string
  encoding?: 'utf-8'
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  visible: boolean
  compareMode: CompareMode
  numericTolerance?: number
  explanation?: string
  virtualFiles?: VirtualFile[]
}

export interface Choice {
  id: string
  text: string
}

export interface CodeBlock {
  id: string
  code: string
}

export interface Question {
  id: string
  slug: string
  title: string
  chapterId: string
  knowledgePointIds: string[]
  description: string
  requirements: string[]
  difficulty: Difficulty
  type: QuestionType
  starterCode: string
  solutionCode: string
  promptCode?: string
  choices?: Choice[]
  correctChoiceIds?: string[]
  codeBlocks?: CodeBlock[]
  correctCodeOrder?: string[]
  examples: TestCase[]
  hiddenTests: TestCase[]
  testHarnessCode?: string
  hints: string[]
  explanation: string
  estimatedMinutes: number
  status: QuestionStatus
  version: number
  createdAt: string
}

export interface QuestionFilter {
  chapterId?: string
  difficulty?: Difficulty
  type?: QuestionType
  knowledgePointId?: string
}

