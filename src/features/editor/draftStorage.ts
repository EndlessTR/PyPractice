const DRAFT_PREFIX = 'pypractice:draft:'

export function getDraftKey(questionId: string, questionVersion?: number) {
  return `${DRAFT_PREFIX}${questionId}${questionVersion === undefined ? '' : `:v${questionVersion}`}`
}

export function loadDraft(questionId: string, questionVersion?: number): string | null {
  try {
    return localStorage.getItem(getDraftKey(questionId, questionVersion))
  } catch {
    return null
  }
}

export function saveDraft(questionId: string, code: string, questionVersion?: number): boolean {
  try {
    localStorage.setItem(getDraftKey(questionId, questionVersion), code)
    return true
  } catch {
    return false
  }
}

export function removeDraft(questionId: string, questionVersion?: number): boolean {
  try {
    localStorage.removeItem(getDraftKey(questionId, questionVersion))
    return true
  } catch {
    return false
  }
}
