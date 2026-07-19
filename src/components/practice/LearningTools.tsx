import { Heart, NotebookPen } from 'lucide-react'
import { useState } from 'react'

import { useLearning, type Mastery } from '../../features/learning'
import { Card } from '../ui/Page'

export function LearningTools({ questionId }: { questionId: string }) {
  const { snapshot, toggleFavorite, setMastery, saveQuestionNote } = useLearning()
  const state = snapshot.questionStates[questionId] ?? {
    questionId,
    favorite: false,
    mastery: 0 as Mastery,
  }
  const persistedNote = snapshot.notes.find((note) => note.questionId === questionId)

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">学习状态</h2>
        <button
          aria-pressed={state.favorite}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${
            state.favorite
              ? 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-500/10'
              : 'border-slate-200 dark:border-slate-700'
          }`}
          onClick={() => void toggleFavorite(questionId)}
        >
          <Heart fill={state.favorite ? 'currentColor' : 'none'} size={16} />
          {state.favorite ? '已收藏' : '收藏'}
        </button>
      </div>
      <label className="mt-4 grid gap-1 text-sm">
        <span>掌握度</span>
        <select
          aria-label="掌握度"
          className="rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700"
          value={state.mastery}
          onChange={(event) => void setMastery(questionId, Number(event.target.value) as Mastery)}
        >
          <option value={0}>尚未评估</option>
          <option value={1}>1 · 刚接触</option>
          <option value={2}>2 · 需要提示</option>
          <option value={3}>3 · 基本掌握</option>
          <option value={4}>4 · 熟练运用</option>
          <option value={5}>5 · 完全掌握</option>
        </select>
      </label>
      {snapshot.status === 'ready' ? (
        <NoteEditor
          initialValue={persistedNote?.content ?? ''}
          onSave={(content) => saveQuestionNote(questionId, content)}
        />
      ) : (
        <p className="mt-4 text-sm text-slate-500">正在加载本地笔记…</p>
      )}
    </Card>
  )
}

function NoteEditor({
  initialValue,
  onSave,
}: {
  initialValue: string
  onSave: (content: string) => Promise<void>
}) {
  const [note, setNote] = useState(initialValue)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const save = async () => {
    setSaveState('saving')
    await onSave(note)
    setSaveState('saved')
  }
  return (
    <>
      <label className="mt-4 grid gap-1 text-sm">
        <span className="flex items-center gap-1.5">
          <NotebookPen size={16} /> 题目笔记
        </span>
        <textarea
          aria-label="题目笔记"
          className="min-h-28 rounded-lg border border-slate-200 bg-transparent p-3 dark:border-slate-700"
          placeholder="记录思路、易错点或复习提示…"
          value={note}
          onChange={(event) => {
            setNote(event.target.value)
            setSaveState('idle')
          }}
        />
      </label>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500" aria-live="polite">
          {saveState === 'saving' ? '保存中…' : saveState === 'saved' ? '笔记已保存' : ' '}
        </span>
        <button
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          disabled={saveState === 'saving'}
          onClick={() => void save()}
        >
          保存笔记
        </button>
      </div>
    </>
  )
}
