import { Highlighter, MessageSquarePlus, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import type { LearningGuide } from '../../data/learningGuides'
import {
  listGuideAnnotations,
  removeGuideAnnotation,
  saveGuideAnnotation,
  type GuideAnnotation,
} from '../../features/tutoring'

type PendingSelection = Pick<GuideAnnotation, 'textId' | 'start' | 'end'> & { text: string }

function AnnotatedText({ text, textId, annotations }: { text: string; textId: string; annotations: GuideAnnotation[] }) {
  const items = annotations
    .filter((item) => item.textId === textId && item.start >= 0 && item.end <= text.length && item.start < item.end)
    .sort((left, right) => left.start - right.start)
  if (!items.length) return <>{text}</>
  const nodes: ReactNode[] = []
  let cursor = 0
  for (const annotation of items) {
    if (annotation.start < cursor) continue
    if (cursor < annotation.start) nodes.push(text.slice(cursor, annotation.start))
    nodes.push(<mark className="rounded bg-amber-200 px-0.5 text-inherit dark:bg-amber-400/40" key={annotation.id} title={annotation.note || '已高亮'}>{text.slice(annotation.start, annotation.end)}</mark>)
    cursor = annotation.end
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return <>{nodes}</>
}

export function GuideReader({ guide }: { guide: LearningGuide }) {
  const [annotations, setAnnotations] = useState(listGuideAnnotations)
  const [pending, setPending] = useState<PendingSelection>()
  const [note, setNote] = useState('')
  const guideAnnotations = useMemo(() => annotations.filter((item) => item.textId.startsWith(`${guide.chapterId}:`)), [annotations, guide.chapterId])

  const captureSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount !== 1 || selection.isCollapsed) return
    const range = selection.getRangeAt(0)
    const element = (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer as Element
      : range.commonAncestorContainer.parentElement)?.closest<HTMLElement>('[data-guide-text-id]')
    if (!element || !element.contains(range.startContainer) || !element.contains(range.endContainer)) return
    const before = range.cloneRange()
    before.selectNodeContents(element)
    before.setEnd(range.startContainer, range.startOffset)
    const start = before.toString().length
    const selected = selection.toString().trim()
    if (!selected) return
    setPending({ textId: element.dataset.guideTextId!, start, end: start + selected.length, text: selected })
    setNote('')
  }

  const save = () => {
    if (!pending) return
    setAnnotations((items) => [...items, saveGuideAnnotation({ ...pending, note })])
    window.getSelection()?.removeAllRanges()
    setPending(undefined)
  }

  return (
    <div onMouseUp={captureSelection}>
      <div className="mb-5 rounded-xl bg-sky-50 p-4 text-sm text-sky-950 dark:bg-sky-500/10 dark:text-sky-100">
        <Highlighter className="mr-2 inline-block" size={16} />选中文本后松开鼠标，即可添加高亮和个人批注。批注只保存在当前浏览器。
      </div>
      <p className="mb-6 leading-7 text-slate-700 dark:text-slate-200">{guide.overview}</p>
      <div className="space-y-5">
        {guide.sections.map((section) => {
          const textId = `${guide.chapterId}:${section.id}`
          return <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700" key={section.id}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7" data-guide-text-id={textId}><AnnotatedText text={section.explanation} textId={textId} annotations={guideAnnotations} /></p>
            {section.example && <pre className="mt-3 overflow-auto rounded-lg bg-slate-950 p-3 text-sm text-slate-100"><code>{section.example}</code></pre>}
            <div className="mt-4 rounded-lg bg-rose-50 p-3 dark:bg-rose-500/10">
              <h3 className="font-medium text-rose-800 dark:text-rose-200">易错内容</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-950 dark:text-rose-100">{section.pitfalls.map((pitfall) => <li key={pitfall}>{pitfall}</li>)}</ul>
            </div>
          </article>
        })}
      </div>
      {pending && <div className="sticky bottom-4 mt-5 rounded-xl border border-brand-200 bg-white p-4 shadow-lg dark:border-brand-500/40 dark:bg-slate-900">
        <p className="text-sm font-medium"><MessageSquarePlus className="mr-1 inline-block" size={16} />已选中：“{pending.text}”</p>
        <label className="mt-3 grid gap-1 text-sm">添加批注（可选）<textarea className="min-h-20 rounded-lg border border-slate-200 bg-transparent p-2 dark:border-slate-700" value={note} onChange={(event) => setNote(event.target.value)} placeholder="记录理解、疑问或复习提示" /></label>
        <div className="mt-3 flex gap-2"><button className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white" onClick={save}>保存高亮</button><button className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" onClick={() => setPending(undefined)}>取消</button></div>
      </div>}
      {!!guideAnnotations.length && <section className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><h2 className="font-semibold">我的批注</h2><div className="mt-3 space-y-2">{guideAnnotations.map((annotation) => <div className="flex items-start justify-between gap-3 rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-500/10" key={annotation.id}><p>{annotation.note || '仅高亮，未添加文字批注。'}</p><button aria-label="删除批注" className="shrink-0 text-slate-600 dark:text-slate-300" onClick={() => { removeGuideAnnotation(annotation.id); setAnnotations(listGuideAnnotations()) }}><Trash2 size={16} /></button></div>)}</div></section>}
    </div>
  )
}
