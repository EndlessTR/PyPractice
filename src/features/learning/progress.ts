import type { SubmissionRecord } from '../judge'
import type { LearningProgress, LearningSnapshot } from './types'

export function latestSubmissionsByQuestion(
  submissions: readonly SubmissionRecord[],
): Map<string, SubmissionRecord> {
  const latest = new Map<string, SubmissionRecord>()
  submissions.forEach((submission) => {
    const current = latest.get(submission.questionId)
    if (!current || current.submittedAt < submission.submittedAt) {
      latest.set(submission.questionId, submission)
    }
  })
  return latest
}

export function deriveLearningProgress(snapshot: LearningSnapshot): LearningProgress {
  const practicedQuestionIds = [...new Set(snapshot.submissions.map((item) => item.questionId))]
  const completedQuestionIds = [
    ...new Set(
      snapshot.submissions
        .filter((submission) => submission.result.status === 'accepted')
        .map((submission) => submission.questionId),
    ),
  ]
  const wrongQuestionIds = [...latestSubmissionsByQuestion(snapshot.submissions).values()]
    .filter((submission) => submission.result.status !== 'accepted')
    .map((submission) => submission.questionId)
  const states = Object.values(snapshot.questionStates)
  const masteredStates = states.filter((state) => state.mastery > 0)
  const averageMastery = masteredStates.length
    ? Math.round(
        (masteredStates.reduce((total, state) => total + state.mastery, 0) /
          masteredStates.length) *
          10,
      ) / 10
    : 0

  return {
    attemptCount: snapshot.submissions.length,
    practicedQuestionIds,
    completedQuestionIds,
    wrongQuestionIds,
    favoriteQuestionIds: states.filter((state) => state.favorite).map((state) => state.questionId),
    noteCount: snapshot.notes.length,
    averageMastery,
  }
}
