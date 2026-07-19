import {
  compareExactOutput,
  compareOutput,
  normalizeLineEndings,
  registerCustomOutputComparator,
  unregisterCustomOutputComparator,
} from './compareOutput'

describe('output comparators', () => {
  test('exact 只统一换行编码，并保持旧布尔调用', () => {
    expect(normalizeLineEndings('a\r\nb\rc')).toBe('a\nb\nc')
    expect(compareExactOutput('a\r\n', 'a\n')).toBe(true)
    expect(compareExactOutput('a\n', 'a')).toBe(false)
    expect(compareOutput('a \n', 'a\n').passed).toBe(false)
  })

  test('trimmed 仅忽略整体首尾空白', () => {
    expect(compareOutput(' \nalpha beta\n ', 'alpha beta', 'trimmed').passed).toBe(true)
    expect(compareOutput('alpha  beta', 'alpha beta', 'trimmed').passed).toBe(false)
  })

  test('lineTrimmed 忽略行尾空白与最终换行，但保留行首空白', () => {
    expect(compareOutput('a  \r\n b\t\r\n', 'a\n b', 'lineTrimmed').passed).toBe(true)
    expect(compareOutput(' a\n', 'a\n', 'lineTrimmed').passed).toBe(false)
  })

  test('numeric 使用有限的正绝对容差并拒绝非数字', () => {
    const close = compareOutput('3.14160\n', '3.14159', 'numeric', 0.00002)
    expect(close.passed).toBe(true)
    expect(close.difference).toBeCloseTo(0.00001)
    expect(compareOutput('3.2', '3.0', { mode: 'numeric', numericTolerance: 0.1 }).passed).toBe(false)
    expect(compareOutput('', '0', 'numeric', 0.1).reason).toBe('invalid-number')
    expect(compareOutput('NaN', '0', 'numeric', 0.1).reason).toBe('invalid-number')
    expect(compareOutput('1', '1', 'numeric').reason).toBe('invalid-numeric-tolerance')
    expect(compareOutput('1', '1', 'numeric', 0).reason).toBe('invalid-numeric-tolerance')
  })

  test('unorderedLines 忽略顺序、保留重复项与行内空白', () => {
    expect(compareOutput('b\na\na\n', 'a\nb\na', 'unorderedLines').passed).toBe(true)
    expect(compareOutput('b\na', 'a\nb\nb', 'unorderedLines').passed).toBe(false)
    expect(compareOutput(' a\nb', 'a\nb', 'unorderedLines').passed).toBe(false)
  })

  test('custom 只调用显式注册的比较器，并可安全注销', () => {
    const dispose = registerCustomOutputComparator(
      'case-insensitive',
      (actual, expected) => actual.toLowerCase() === expected.toLowerCase(),
    )
    expect(
      compareOutput('YES\r\n', 'yes\n', {
        mode: 'custom',
        customComparatorId: 'case-insensitive',
      }).passed,
    ).toBe(true)
    dispose()
    expect(
      compareOutput('YES', 'yes', { mode: 'custom', customComparatorId: 'case-insensitive' }).reason,
    ).toBe('custom-comparator-not-found')
  })

  test('custom 拒绝重复注册，并隔离比较器异常', () => {
    unregisterCustomOutputComparator('throws')
    const dispose = registerCustomOutputComparator('throws', () => {
      throw new Error('boom')
    })
    expect(() => registerCustomOutputComparator('throws', () => true)).toThrow(/already registered/)
    expect(
      compareOutput('a', 'a', { mode: 'custom', customComparatorId: 'throws' }).reason,
    ).toBe('custom-comparator-error')
    dispose()
  })
})
