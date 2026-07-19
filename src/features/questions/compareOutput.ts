import type { CompareMode } from '../../types/question'

export interface OutputComparisonResult {
  passed: boolean
  mode: CompareMode
  normalizedActual: string
  normalizedExpected: string
  reason?: string
  difference?: number
}

export interface CompareOutputOptions {
  mode: CompareMode
  numericTolerance?: number
  customComparatorId?: string
}

export type CustomOutputComparator = (
  actual: string,
  expected: string,
) => boolean | Omit<OutputComparisonResult, 'mode'>

const customComparators = new Map<string, CustomOutputComparator>()

/** 将 CRLF 与 CR 统一为 LF，不修改其他字符。 */
export const normalizeLineEndings = (value: string) => value.replace(/\r\n?/g, '\n')

/** exact 保留全部空白，只容忍换行编码差异。 */
export const compareExactOutput = (actual: string, expected: string) =>
  normalizeLineEndings(actual) === normalizeLineEndings(expected)

export const registerCustomOutputComparator = (
  id: string,
  comparator: CustomOutputComparator,
): (() => void) => {
  if (!id.trim()) throw new Error('Custom comparator id must not be empty.')
  if (customComparators.has(id)) throw new Error(`Custom comparator already registered: ${id}`)
  customComparators.set(id, comparator)
  return () => customComparators.delete(id)
}

export const unregisterCustomOutputComparator = (id: string) => customComparators.delete(id)

const normalizeLineTrimmed = (value: string) =>
  normalizeLineEndings(value)
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n+$/u, '')

const normalizeUnorderedLines = (value: string) => {
  const normalized = normalizeLineEndings(value).replace(/\n$/u, '')
  return normalized === '' ? [] : normalized.split('\n').sort()
}

const baseResult = (
  passed: boolean,
  mode: CompareMode,
  normalizedActual: string,
  normalizedExpected: string,
  reason?: string,
): OutputComparisonResult => ({
  passed,
  mode,
  normalizedActual,
  normalizedExpected,
  ...(reason ? { reason } : {}),
})

/**
 * 比较 stdout。第三个参数既可传模式字符串，也可传完整配置；省略时与旧的
 * exact 行为一致。
 */
export function compareOutput(
  actual: string,
  expected: string,
  modeOrOptions: CompareMode | CompareOutputOptions = 'exact',
  numericTolerance?: number,
): OutputComparisonResult {
  const options: CompareOutputOptions =
    typeof modeOrOptions === 'string'
      ? { mode: modeOrOptions, numericTolerance }
      : modeOrOptions
  const { mode } = options

  if (mode === 'exact') {
    const normalizedActual = normalizeLineEndings(actual)
    const normalizedExpected = normalizeLineEndings(expected)
    return baseResult(
      normalizedActual === normalizedExpected,
      mode,
      normalizedActual,
      normalizedExpected,
    )
  }

  if (mode === 'trimmed') {
    const normalizedActual = normalizeLineEndings(actual).trim()
    const normalizedExpected = normalizeLineEndings(expected).trim()
    return baseResult(
      normalizedActual === normalizedExpected,
      mode,
      normalizedActual,
      normalizedExpected,
    )
  }

  if (mode === 'lineTrimmed') {
    const normalizedActual = normalizeLineTrimmed(actual)
    const normalizedExpected = normalizeLineTrimmed(expected)
    return baseResult(
      normalizedActual === normalizedExpected,
      mode,
      normalizedActual,
      normalizedExpected,
    )
  }

  if (mode === 'numeric') {
    const normalizedActual = normalizeLineEndings(actual).trim()
    const normalizedExpected = normalizeLineEndings(expected).trim()
    const tolerance = options.numericTolerance
    if (!(typeof tolerance === 'number' && Number.isFinite(tolerance) && tolerance > 0)) {
      return baseResult(false, mode, normalizedActual, normalizedExpected, 'invalid-numeric-tolerance')
    }
    if (normalizedActual === '' || normalizedExpected === '') {
      return baseResult(false, mode, normalizedActual, normalizedExpected, 'invalid-number')
    }
    const actualNumber = Number(normalizedActual)
    const expectedNumber = Number(normalizedExpected)
    if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) {
      return baseResult(false, mode, normalizedActual, normalizedExpected, 'invalid-number')
    }
    const difference = Math.abs(actualNumber - expectedNumber)
    return {
      ...baseResult(difference <= tolerance, mode, normalizedActual, normalizedExpected),
      difference,
    }
  }

  if (mode === 'unorderedLines') {
    const actualLines = normalizeUnorderedLines(actual)
    const expectedLines = normalizeUnorderedLines(expected)
    const normalizedActual = actualLines.join('\n')
    const normalizedExpected = expectedLines.join('\n')
    return baseResult(
      normalizedActual === normalizedExpected,
      mode,
      normalizedActual,
      normalizedExpected,
    )
  }

  const normalizedActual = normalizeLineEndings(actual)
  const normalizedExpected = normalizeLineEndings(expected)
  const id = options.customComparatorId
  const comparator = id ? customComparators.get(id) : undefined
  if (!comparator) {
    return baseResult(false, mode, normalizedActual, normalizedExpected, 'custom-comparator-not-found')
  }
  try {
    const customResult = comparator(normalizedActual, normalizedExpected)
    if (typeof customResult === 'boolean') {
      return baseResult(customResult, mode, normalizedActual, normalizedExpected)
    }
    return { ...customResult, mode }
  } catch {
    return baseResult(false, mode, normalizedActual, normalizedExpected, 'custom-comparator-error')
  }
}
