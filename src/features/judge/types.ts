import type { CompareMode, TestCase, VirtualFile } from '../../types'

export interface JudgeRunnerResult {
  stdout: string
  stderr: string
  truncated: boolean
  durationMs: number
  error?: string
}

export interface JudgeRunnerOptions {
  virtualFiles?: VirtualFile[]
}

/** PythonRunnerClient 等运行器只要满足此最小接口即可接入判题器。 */
export interface JudgeRunner {
  run(code: string, stdin: string, options?: JudgeRunnerOptions): Promise<JudgeRunnerResult>
  /** 重建执行环境，使每个官方用例从干净的解释器状态开始。 */
  reset?(): Promise<void>
}

export type TestStatus = 'passed' | 'wrongAnswer' | 'runtimeError' | 'judgeError'

export interface TestResult {
  testCaseId: string
  hidden: boolean
  status: TestStatus
  passed: boolean
  compareMode: CompareMode
  durationMs: number
  truncated: boolean
  /** 隐藏测试不返回输入和输出，避免判题结果泄露用例。 */
  input?: string
  expectedOutput?: string
  actualOutput?: string
  stderr?: string
  error?: string
}

export type SubmissionStatus = 'accepted' | 'wrongAnswer' | 'runtimeError' | 'judgeError'

export interface SubmissionResult {
  status: SubmissionStatus
  passed: boolean
  tests: TestResult[]
  passedCount: number
  totalCount: number
  durationMs: number
}

export interface SubmissionRecord {
  id: string
  questionId: string
  questionVersion: number
  userCode: string
  submittedAt: string
  result: SubmissionResult
}

export type CustomOutputComparator = (
  actual: string,
  expected: string,
  testCase: TestCase,
) => boolean
