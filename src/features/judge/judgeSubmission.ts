import type { Question, TestCase } from '../../types'
import { compareTestOutput } from './compareTestOutput'
import type {
  CustomOutputComparator,
  JudgeRunner,
  SubmissionResult,
  SubmissionStatus,
  TestResult,
} from './types'

export interface JudgeSubmissionOptions {
  customComparator?: CustomOutputComparator
  signal?: AbortSignal
}

export function composeSubmissionCode(userCode: string, testHarnessCode?: string): string {
  if (!testHarnessCode?.trim()) return userCode
  return `${userCode.replace(/\s+$/, '')}\n\n# --- PyPractice test harness ---\n${testHarnessCode}`
}

const resultStatus = (tests: readonly TestResult[]): SubmissionStatus => {
  if (tests.every((test) => test.passed)) return 'accepted'
  if (tests.some((test) => test.status === 'judgeError')) return 'judgeError'
  if (tests.some((test) => test.status === 'runtimeError')) return 'runtimeError'
  return 'wrongAnswer'
}

function publicDetails(testCase: TestCase, hidden: boolean, actualOutput: string) {
  return hidden
    ? {}
    : {
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput,
      }
}

async function judgeTestCase(
  runner: JudgeRunner,
  code: string,
  testCase: TestCase,
  hidden: boolean,
  customComparator?: CustomOutputComparator,
): Promise<TestResult> {
  try {
    const execution = await runner.run(code, testCase.input, {
      virtualFiles: testCase.virtualFiles,
    })
    const base = {
      testCaseId: testCase.id,
      hidden,
      compareMode: testCase.compareMode,
      durationMs: execution.durationMs,
      truncated: execution.truncated,
      ...publicDetails(testCase, hidden, execution.stdout),
    }
    if (execution.error || execution.truncated) {
      return {
        ...base,
        status: 'runtimeError',
        passed: false,
        stderr: hidden ? undefined : execution.stderr || undefined,
        error: hidden
          ? '未展示测试运行失败。'
          : (execution.error ?? '程序输出超过限制，测试已终止。'),
      }
    }
    try {
      const passed = compareTestOutput(execution.stdout, testCase, customComparator)
      return {
        ...base,
        status: passed ? 'passed' : 'wrongAnswer',
        passed,
        stderr: hidden ? undefined : execution.stderr || undefined,
      }
    } catch (error) {
      return {
        ...base,
        status: 'judgeError',
        passed: false,
        error: hidden
          ? '未展示测试的比较配置错误。'
          : error instanceof Error
            ? error.message
            : '输出比较器执行失败。',
      }
    }
  } catch (error) {
    return {
      testCaseId: testCase.id,
      hidden,
      status: 'runtimeError',
      passed: false,
      compareMode: testCase.compareMode,
      durationMs: 0,
      truncated: false,
      ...(hidden
        ? {}
        : { input: testCase.input, expectedOutput: testCase.expectedOutput, actualOutput: '' }),
      error: hidden
        ? '未展示测试运行失败。'
        : error instanceof Error
          ? error.message
          : '运行器执行失败。',
    }
  }
}

/** 按公开示例、隐藏测试的顺序串行执行，避免共享 Worker 的并发重入。 */
export async function judgeSubmission(
  runner: JudgeRunner,
  question: Pick<Question, 'examples' | 'hiddenTests' | 'testHarnessCode'>,
  userCode: string,
  options: JudgeSubmissionOptions = {},
): Promise<SubmissionResult> {
  const code = composeSubmissionCode(userCode, question.testHarnessCode)
  const testPlan = [
    ...question.examples.map((testCase) => ({ testCase, hidden: false })),
    ...question.hiddenTests.map((testCase) => ({ testCase, hidden: true })),
  ]
  const tests: TestResult[] = []
  for (const { testCase, hidden } of testPlan) {
    options.signal?.throwIfAborted()
    if (runner.reset) await runner.reset()
    options.signal?.throwIfAborted()
    tests.push(await judgeTestCase(runner, code, testCase, hidden, options.customComparator))
    options.signal?.throwIfAborted()
  }
  const status = resultStatus(tests)
  const passedCount = tests.filter((test) => test.passed).length
  return {
    status,
    passed: status === 'accepted',
    tests,
    passedCount,
    totalCount: tests.length,
    durationMs: tests.reduce((total, test) => total + test.durationMs, 0),
  }
}
