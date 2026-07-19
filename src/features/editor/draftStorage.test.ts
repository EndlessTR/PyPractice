import { getDraftKey, loadDraft, removeDraft, saveDraft } from './draftStorage'

describe('draftStorage', () => {
  beforeEach(() => localStorage.clear())

  test('按 questionId 隔离保存、读取与删除草稿', () => {
    expect(getDraftKey('question-a')).not.toBe(getDraftKey('question-b'))

    expect(saveDraft('question-a', 'print("a")')).toBe(true)
    expect(saveDraft('question-b', 'print("b")')).toBe(true)
    expect(loadDraft('question-a')).toBe('print("a")')
    expect(loadDraft('question-b')).toBe('print("b")')

    expect(removeDraft('question-a')).toBe(true)
    expect(loadDraft('question-a')).toBeNull()
    expect(loadDraft('question-b')).toBe('print("b")')
  })

  test('localStorage 不可用时安全降级而不抛错', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage is blocked')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage is blocked')
    })

    expect(loadDraft('question-a')).toBeNull()
    expect(saveDraft('question-a', 'code')).toBe(false)
    expect(removeDraft('question-a')).toBe(false)

    getItem.mockRestore()
    setItem.mockRestore()
    removeItem.mockRestore()
  })
})
