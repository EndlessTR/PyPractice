import type { LearningProgress } from './types'

export interface Achievement {
  id: string
  title: string
  description: string
  unlocked: boolean
}

export function deriveAchievements(progress: LearningProgress): Achievement[] {
  return [
    { id: 'first-attempt', title: '迈出第一步', description: '完成一次正式提交', unlocked: progress.attemptCount >= 1 },
    { id: 'first-win', title: '首题通过', description: '通过一道练习题', unlocked: progress.completedQuestionIds.length >= 1 },
    { id: 'five-wins', title: '渐入佳境', description: '通过五道练习题', unlocked: progress.completedQuestionIds.length >= 5 },
    { id: 'collector', title: '学习收藏家', description: '收藏三道练习题', unlocked: progress.favoriteQuestionIds.length >= 3 },
  ]
}
