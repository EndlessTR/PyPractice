import { useCallback, useEffect, useState } from 'react'

import { loadDraft, removeDraft, saveDraft } from './draftStorage'

export type DraftSaveState = 'idle' | 'saving' | 'saved' | 'error'

export function useQuestionDraft(
  questionId: string,
  starterCode: string,
  questionVersion?: number,
) {
  const identity = `${questionId}:v${questionVersion ?? 'unknown'}`
  const [draft, setDraft] = useState(() => ({
    identity,
    code: loadDraft(questionId, questionVersion) ?? starterCode,
    saveState: 'idle' as DraftSaveState,
    skipAutoSave: true,
  }))

  if (draft.identity !== identity) {
    setDraft({
      identity,
      code: loadDraft(questionId, questionVersion) ?? starterCode,
      saveState: 'idle',
      skipAutoSave: true,
    })
  }

  const code =
    draft.identity === identity
      ? draft.code
      : (loadDraft(questionId, questionVersion) ?? starterCode)
  const saveState = draft.identity === identity ? draft.saveState : 'idle'
  const setCode = useCallback((nextCode: string) => {
    setDraft((current) => ({
      ...current,
      code: nextCode,
      saveState: 'saving',
      skipAutoSave: false,
    }))
  }, [])

  const saveNow = useCallback(() => {
    const saved = saveDraft(questionId, code, questionVersion)
    setDraft((current) => ({ ...current, saveState: saved ? 'saved' : 'error' }))
    return saved
  }, [code, questionId, questionVersion])

  useEffect(() => {
    if (draft.skipAutoSave) return
    const timer = window.setTimeout(saveNow, 450)
    return () => window.clearTimeout(timer)
  }, [code, draft.skipAutoSave, saveNow])

  const reset = useCallback(() => {
    removeDraft(questionId, questionVersion)
    setDraft((current) => ({
      ...current,
      code: starterCode,
      saveState: 'idle',
      skipAutoSave: true,
    }))
  }, [questionId, questionVersion, starterCode])

  return { code, setCode, saveNow, saveState, reset }
}
