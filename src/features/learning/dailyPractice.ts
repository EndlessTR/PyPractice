function hash(value: string): number {
  return [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7)
}

/** Selects a stable daily set without storing a second copy of question data. */
export function selectDailyPractice<T extends { id: string }>(
  questions: readonly T[],
  date = new Date().toISOString().slice(0, 10),
  count = 3,
): T[] {
  if (!questions.length || count <= 0) return []
  const start = hash(date) % questions.length
  return Array.from({ length: Math.min(count, questions.length) }, (_, index) =>
    questions[(start + index) % questions.length],
  )
}
