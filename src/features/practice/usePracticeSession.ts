import { useCallback, useEffect, useSyncExternalStore } from 'react'

import type { SubmissionResult } from '../judge'
import { practiceSessionStore } from './createPracticeSessionStore'

export function usePracticeSession(questionId: string, questionVersion: number) {
  practiceSessionStore.getOrStart(questionId, questionVersion)
  const getSnapshot = useCallback(
    () =>
      practiceSessionStore.getSnapshot(questionId, questionVersion) ??
      practiceSessionStore.getOrStart(questionId, questionVersion),
    [questionId, questionVersion],
  )
  const session = useSyncExternalStore(
    (listener) => practiceSessionStore.subscribe(listener),
    getSnapshot,
    getSnapshot,
  )
  useEffect(() => {
    void practiceSessionStore.hydrate(questionId, questionVersion)
  }, [questionId, questionVersion])
  const recordSubmission = useCallback(
    (result: SubmissionResult) =>
      practiceSessionStore.recordSubmission(questionId, questionVersion, result),
    [questionId, questionVersion],
  )

  return { session, recordSubmission }
}
