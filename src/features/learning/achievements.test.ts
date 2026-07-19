import { expect, test } from 'vitest'

import { deriveAchievements } from './achievements'

test('按真实学习进度解锁成就', () => {
  const achievements = deriveAchievements({ attemptCount: 1, completedQuestionIds: ['q'], practicedQuestionIds: ['q'], wrongQuestionIds: [], favoriteQuestionIds: [], noteCount: 0, averageMastery: 0 })
  expect(achievements.filter((item) => item.unlocked).map((item) => item.id)).toEqual(['first-attempt', 'first-win'])
})
