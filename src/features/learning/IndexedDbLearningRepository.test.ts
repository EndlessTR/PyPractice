import { IDBFactory } from 'fake-indexeddb'

import { AppDatabase } from '../../repositories'
import { IndexedDbLearningRepository } from './IndexedDbLearningRepository'

test('IndexedDB 学习仓库保存题目状态并增删笔记', async () => {
  const database = new AppDatabase(new IDBFactory(), 'learning-repository-test')
  const repository = new IndexedDbLearningRepository(database)
  await repository.saveQuestionState({
    questionId: 'question-a',
    favorite: true,
    mastery: 3,
  })
  await repository.saveNote({
    id: 'note-one',
    questionId: 'question-a',
    content: '复习切片',
    createdAt: '2026-07-14T00:00:00.000Z',
    updatedAt: '2026-07-14T00:00:00.000Z',
  })

  expect(await repository.listQuestionStates()).toEqual([
    { questionId: 'question-a', favorite: true, mastery: 3 },
  ])
  expect((await repository.listNotes('question-a'))[0].content).toBe('复习切片')

  await repository.deleteNote('note-one')
  expect(await repository.listNotes()).toEqual([])
  await database.close()
})
