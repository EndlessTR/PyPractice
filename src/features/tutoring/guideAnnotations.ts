export type GuideAnnotation = {
  id: string
  textId: string
  start: number
  end: number
  note: string
  createdAt: string
}

const STORAGE_KEY = 'pypractice-guide-annotations-v1'

function read(): GuideAnnotation[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter(isAnnotation) : []
  } catch {
    return []
  }
}

function isAnnotation(value: unknown): value is GuideAnnotation {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return ['id', 'textId', 'note', 'createdAt'].every((key) => typeof item[key] === 'string')
    && typeof item.start === 'number' && typeof item.end === 'number'
}

function write(items: GuideAnnotation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function listGuideAnnotations() {
  return read()
}

export function saveGuideAnnotation(annotation: Omit<GuideAnnotation, 'id' | 'createdAt'>) {
  const next: GuideAnnotation = {
    ...annotation,
    id: globalThis.crypto?.randomUUID?.() ?? `annotation-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  write([...read(), next])
  return next
}

export function removeGuideAnnotation(id: string) {
  write(read().filter((item) => item.id !== id))
}
