import type { TestCase } from '../../types'
import { compareOutput } from '../questions/compareOutput'
import type { CustomOutputComparator } from './types'

export function compareTestOutput(
  actual: string,
  testCase: TestCase,
  customComparator?: CustomOutputComparator,
): boolean {
  if (testCase.compareMode === 'custom') {
    if (!customComparator) throw new Error(`测试 ${testCase.id} 缺少 custom 输出比较器。`)
    return customComparator(actual, testCase.expectedOutput, testCase)
  }

  const comparison = compareOutput(actual, testCase.expectedOutput, {
    mode: testCase.compareMode,
    numericTolerance: testCase.numericTolerance,
  })
  if (comparison.reason === 'invalid-numeric-tolerance') {
    throw new Error(`测试 ${testCase.id} 的 numericTolerance 配置无效。`)
  }
  return comparison.passed
}
