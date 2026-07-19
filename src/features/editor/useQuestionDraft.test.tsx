import { act, renderHook } from '@testing-library/react'

import { getDraftKey } from './draftStorage'
import { useQuestionDraft } from './useQuestionDraft'

describe('useQuestionDraft', () => {
  beforeEach(() => localStorage.clear())

  test('优先恢复当前题目的草稿，并在切题时回退到各自 starterCode', async () => {
    localStorage.setItem(getDraftKey('question-a'), 'saved a')
    const saved = renderHook(() => useQuestionDraft('question-a', 'starter a'))

    expect(saved.result.current.code).toBe('saved a')
    saved.unmount()

    const fallback = renderHook(() => useQuestionDraft('question-b', 'starter b'))
    expect(fallback.result.current.code).toBe('starter b')
    fallback.unmount()

    localStorage.setItem(getDraftKey('question-a'), 'new saved a')
    const restoredAgain = renderHook(() => useQuestionDraft('question-a', 'starter a'))
    expect(restoredAgain.result.current.code).toBe('new saved a')
  })

  test('重置会删除当前题草稿并恢复 starterCode，不影响其他题', () => {
    vi.useFakeTimers()
    localStorage.setItem(getDraftKey('question-a'), 'saved a')
    localStorage.setItem(getDraftKey('question-b'), 'saved b')
    const { result } = renderHook(() => useQuestionDraft('question-a', 'starter a'))

    act(() => result.current.reset())

    expect(result.current.code).toBe('starter a')
    expect(localStorage.getItem(getDraftKey('question-a'))).toBeNull()
    expect(localStorage.getItem(getDraftKey('question-b'))).toBe('saved b')
    act(() => vi.advanceTimersByTime(500))
    expect(localStorage.getItem(getDraftKey('question-a'))).toBeNull()
    vi.useRealTimers()
  })

  test('保存失败会报告 error，但保留用户当前代码', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const { result } = renderHook(() => useQuestionDraft('question-a', 'starter'))

    act(() => result.current.setCode('unsaved work'))
    act(() => expect(result.current.saveNow()).toBe(false))

    expect(result.current.code).toBe('unsaved work')
    expect(result.current.saveState).toBe('error')
    setItem.mockRestore()
  })
})
