import { useEffect, useSyncExternalStore } from 'react'

import { learningStore } from './createLearningStore'
import { deriveLearningProgress } from './progress'

export function useLearning() {
  const snapshot = useSyncExternalStore(
    learningStore.subscribe,
    learningStore.getSnapshot,
    learningStore.getSnapshot,
  )
  useEffect(() => {
    void learningStore.load()
  }, [])
  return {
    snapshot,
    progress: deriveLearningProgress(snapshot),
    toggleFavorite: (questionId: string) => learningStore.toggleFavorite(questionId),
    setMastery: learningStore.setMastery.bind(learningStore),
    saveQuestionNote: learningStore.saveQuestionNote.bind(learningStore),
    recordAttempt: learningStore.recordAttempt.bind(learningStore),
  }
}
