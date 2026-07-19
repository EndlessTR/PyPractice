import { describe, expect, test, vi } from 'vitest'

import type { Question, TestCase, VirtualFile } from '../../types'
import { judgeSubmission } from './judgeSubmission'
import type { JudgeRunner, JudgeRunnerOptions, JudgeRunnerResult } from './types'

const testCase = (
  id: string,
  input: string,
  expectedOutput: string,
  visible: boolean,
  virtualFiles?: VirtualFile[],
): TestCase => ({
  id,
  input,
  expectedOutput,
  visible,
  compareMode: 'exact',
  ...(virtualFiles ? { virtualFiles } : {}),
})

const question = (
  examples: TestCase[],
  hiddenTests: TestCase[],
  testHarnessCode = 'print(solve(input()))',
): Pick<Question, 'examples' | 'hiddenTests' | 'testHarnessCode'> => ({
  examples,
  hiddenTests,
  testHarnessCode,
})

class RecordingRunner implements JudgeRunner {
  readonly calls: Array<{ code: string; stdin: string; options?: JudgeRunnerOptions }> = []
  readonly reset = vi.fn(async () => undefined)

  constructor(private readonly execute: (stdin: string) => JudgeRunnerResult) {}

  async run(code: string, stdin: string, options?: JudgeRunnerOptions) {
    this.calls.push({ code, stdin, options })
    return this.execute(stdin)
  }
}

describe('judgeSubmission', () => {
  test('组合用户代码与 harness，按公开再隐藏顺序执行并在每例前 reset', async () => {
    const runner = new RecordingRunner((stdin) => ({
      stdout: `${Number(stdin) * 2}\n`,
      stderr: '',
      truncated: false,
      durationMs: 5,
    }))
    const result = await judgeSubmission(
      runner,
      question([testCase('public-1', '2', '4\n', true)], [testCase('hidden-1', '3', '6\n', false)]),
      'def solve(value):\n    return int(value) * 2',
    )

    expect(result).toMatchObject({
      status: 'accepted',
      passed: true,
      passedCount: 2,
      totalCount: 2,
      durationMs: 10,
    })
    expect(runner.reset).toHaveBeenCalledTimes(2)
    expect(runner.calls.map((call) => call.stdin)).toEqual(['2', '3'])
    expect(runner.calls[0].code).toContain('def solve(value):')
    expect(runner.calls[0].code).toContain('# --- PyPractice test harness ---')
    expect(runner.calls[0].code).toContain('print(solve(input()))')
  })

  test('公开结果包含诊断信息，隐藏结果不泄露输入、期望、实际输出或 stderr', async () => {
    const runner = new RecordingRunner((stdin) => ({
      stdout: stdin === 'shown-secret' ? 'wrong\n' : 'hidden-actual\n',
      stderr: 'diagnostic',
      truncated: false,
      durationMs: 1,
    }))
    const result = await judgeSubmission(
      runner,
      question(
        [testCase('public', 'shown-secret', 'expected\n', true)],
        [testCase('hidden', 'hidden-secret', 'hidden-expected\n', false)],
      ),
      'pass',
    )

    expect(result.tests[0]).toMatchObject({
      hidden: false,
      input: 'shown-secret',
      expectedOutput: 'expected\n',
      actualOutput: 'wrong\n',
      stderr: 'diagnostic',
    })
    expect(result.tests[1]).toMatchObject({ hidden: true, status: 'wrongAnswer' })
    expect(result.tests[1]).not.toHaveProperty('input')
    expect(result.tests[1]).not.toHaveProperty('expectedOutput')
    expect(result.tests[1]).not.toHaveProperty('actualOutput')
    expect(result.tests[1].stderr).toBeUndefined()
  })

  test('把虚拟文件传给运行器，输出被截断时即使前缀匹配也判失败', async () => {
    const files: VirtualFile[] = [{ path: 'data/input.txt', content: 'Ada', encoding: 'utf-8' }]
    const runner = new RecordingRunner(() => ({
      stdout: 'ok\n',
      stderr: '',
      truncated: true,
      durationMs: 2,
    }))
    const result = await judgeSubmission(
      runner,
      question([testCase('files', '', 'ok\n', true, files)], []),
      'pass',
    )

    expect(runner.calls[0].options?.virtualFiles).toEqual(files)
    expect(result).toMatchObject({ status: 'runtimeError', passed: false, passedCount: 0 })
    expect(result.tests[0]).toMatchObject({
      status: 'runtimeError',
      passed: false,
      truncated: true,
    })
  })

  test('隐藏用例的运行错误不会泄露输入或原始异常文本', async () => {
    const runner = new RecordingRunner(() => ({
      stdout: '',
      stderr: 'traceback: hidden-secret',
      truncated: false,
      durationMs: 1,
      error: 'Exception: hidden-secret',
    }))
    const result = await judgeSubmission(
      runner,
      question([], [testCase('hidden', 'hidden-secret', 'ok', false)]),
      'pass',
    )
    expect(result.tests[0].error).toBe('未展示测试运行失败。')
    expect(JSON.stringify(result.tests[0])).not.toContain('hidden-secret')
  })

  test('AbortSignal 中止后不再执行后续用例', async () => {
    const controller = new AbortController()
    const runner = new RecordingRunner(() => {
      controller.abort()
      return { stdout: 'ok', stderr: '', truncated: false, durationMs: 1 }
    })
    await expect(
      judgeSubmission(
        runner,
        question([testCase('first', '', 'ok', true)], [testCase('second', '', 'ok', false)]),
        'pass',
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(runner.calls).toHaveLength(1)
  })
})
