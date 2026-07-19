import { describe, expect, test } from 'vitest'

import { selectDailyPractice } from './dailyPractice'

describe('selectDailyPractice', () => {
  test('同一日期稳定选择不重复的题目，并在末尾回绕', () => {
    const questions = Array.from({ length: 4 }, (_, index) => ({ id: `q-${index}` }))
    const first = selectDailyPractice(questions, '2026-07-15', 3)
    expect(first).toHaveLength(3)
    expect(new Set(first.map((item) => item.id)).size).toBe(3)
    expect(selectDailyPractice(questions, '2026-07-15', 3)).toEqual(first)
  })
})
