export interface Chapter {
  id: string
  order: number
  title: string
  description: string
}

export interface KnowledgePoint {
  id: string
  chapterId: string
  title: string
}

