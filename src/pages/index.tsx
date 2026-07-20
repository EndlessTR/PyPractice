import { BarChart3, BookHeart, FileCode2, FileText, Footprints } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { QuestionCodeEditor } from '../components/editor/QuestionCodeEditor'
import { StructuredAnswerWorkspace } from '../components/judge/StructuredAnswerWorkspace'
import { SubmissionResults } from '../components/judge/SubmissionResults'
import { LearningTools } from '../components/practice/LearningTools'
import { PracticeSessionSummary } from '../components/practice/PracticeSessionSummary'
import { RunnerConsole } from '../components/runner/RunnerConsole'
import { GuideReader } from '../components/tutoring/GuideReader'
import { buttonClass, Card, EmptyState, Page } from '../components/ui/Page'
import { chapters, chapterById } from '../data/chapters'
import { learningGuides } from '../data/learningGuides'
import { knowledgePointById } from '../data/knowledgePoints'
import { questions } from '../data/questions'
import {
  judgeStructuredAnswer,
  submissionRepository,
  useSubmissionJudge,
  type SubmissionResult,
  type StructuredAnswer,
} from '../features/judge'
import { deriveAchievements, selectDailyPractice, useLearning } from '../features/learning'
import {
  difficultyLabels,
  questionProvider,
  questionTypeLabels,
  type PracticeQuestion,
} from '../features/questions'
import { usePythonRunner } from '../features/runner'
import { usePracticeSession } from '../features/practice'
import { useTheme, type Theme } from '../features/theme/ThemeProvider'
import {
  DIFFICULTIES,
  QUESTION_TYPES,
  type Difficulty,
  type QuestionFilter,
  type QuestionType,
} from '../types'

const selectClass =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900'

const LlmChatPanel = lazy(async () => ({ default: (await import('../components/tutoring/LlmChatPanel')).LlmChatPanel }))

export function HomePage() {
  const questionCount = questionProvider.list().length
  return (
    <Page title="首页" description="从一个小目标开始，逐步提升 Python 编程能力。">
      <Card className="bg-gradient-to-br from-brand-600 to-cyan-600 text-white">
        <p className="text-sm text-sky-100">欢迎来到 PyPractice</p>
        <h2 className="mt-2 text-2xl font-bold">建立你的 Python 练习节奏</h2>
        <p className="mt-2 max-w-xl text-sky-100">
          沿着 14 个章节学习，并从 {questionCount} 道已审核题目中选择练习。
        </p>
        <Link
          className={`${buttonClass} mt-5 bg-white text-brand-700 hover:bg-sky-50`}
          to="/learning-path"
        >
          查看学习路径
        </Link>
      </Card>
    </Page>
  )
}

export function LearningPathPage() {
  const { progress } = useLearning()
  const completedIds = new Set(progress.completedQuestionIds)
  return (
    <Page title="学习路径" description="按循序渐进的路线掌握 Python。">
      <div className="grid gap-4 md:grid-cols-2">
        {chapters.map((chapter) => (
          <Card key={chapter.id}>
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-sky-300">
                {chapter.order}
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold">{chapter.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {chapter.description}
                </p>
                <p className="mt-2 text-xs text-emerald-600">
                  已完成{' '}
                  {
                    questionProvider
                      .list({ chapterId: chapter.id })
                      .filter((item) => completedIds.has(item.id)).length
                  }
                  /{questionProvider.countByChapter(chapter.id)} 题
                </p>
                <Link
                  className="mt-3 inline-block text-sm font-semibold text-brand-700 dark:text-sky-300"
                  to={`/chapter?chapter=${chapter.id}`}
                >
                  {questionProvider.countByChapter(chapter.id)} 道已审核题目 →
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  )
}

function QuestionBrowser({ fixedChapterId }: { fixedChapterId?: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const chapterId = fixedChapterId ?? searchParams.get('chapter') ?? ''
  const difficulty = searchParams.get('difficulty') as Difficulty | null
  const type = searchParams.get('type') as QuestionType | null
  const filter: QuestionFilter = {
    ...(chapterId ? { chapterId } : {}),
    ...(difficulty && DIFFICULTIES.includes(difficulty) ? { difficulty } : {}),
    ...(type && QUESTION_TYPES.includes(type) ? { type } : {}),
  }
  const results = questionProvider.list(filter)
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  return (
    <>
      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {!fixedChapterId && (
            <label className="grid gap-1 text-sm">
              <span>章节</span>
              <select
                aria-label="章节"
                className={selectClass}
                value={chapterId}
                onChange={(event) => setFilter('chapter', event.target.value)}
              >
                <option value="">全部章节</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.order}. {chapter.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-1 text-sm">
            <span>难度</span>
            <select
              aria-label="难度"
              className={selectClass}
              value={filter.difficulty ?? ''}
              onChange={(event) => setFilter('difficulty', event.target.value)}
            >
              <option value="">全部难度</option>
              {DIFFICULTIES.map((value) => (
                <option key={value} value={value}>
                  {difficultyLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>题型</span>
            <select
              aria-label="题型"
              className={selectClass}
              value={filter.type ?? ''}
              onChange={(event) => setFilter('type', event.target.value)}
            >
              <option value="">全部题型</option>
              {QUESTION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {questionTypeLabels[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>
      <p className="mb-3 text-sm text-slate-500" aria-live="polite">
        找到 {results.length} 道已审核题目
      </p>
      {results.length ? (
        <div className="grid gap-4">
          {results.map((question) => (
            <Card key={question.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-brand-50 px-2 py-1 text-brand-700 dark:bg-brand-500/15 dark:text-sky-300">
                      {difficultyLabels[question.difficulty]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                      {questionTypeLabels[question.type]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                      约 {question.estimatedMinutes} 分钟
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold">{question.title}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {question.description}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                    {question.knowledgePointIds
                      .map((id) => knowledgePointById.get(id)?.title ?? id)
                      .join(' · ')}
                  </p>
                </div>
                <Link className={buttonClass} to={`/practice/${question.id}`}>
                  开始练习
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Footprints />}
          title="当前筛选下没有已审核题目"
          description="可以调整筛选条件；处于草稿或审核中的题目不会提前发布。"
        />
      )}
    </>
  )
}

export function ChapterPage() {
  const [searchParams] = useSearchParams()
  const selected = chapterById.get(searchParams.get('chapter') ?? '')
  return (
    <Page
      title={selected ? selected.title : '章节学习'}
      description={selected?.description ?? '按章节、难度和题型浏览已审核题目。'}
    >
      <QuestionBrowser />
    </Page>
  )
}

export function QuestionLibraryPage() {
  return (
    <Page title="题目练习" description="筛选题库并选择一道题开始。">
      <QuestionBrowser />
    </Page>
  )
}

function ProgrammableWorkspace({
  question,
  editorCode,
  onSubmission,
}: {
  question: PracticeQuestion
  editorCode: string
  onSubmission: (result: SubmissionResult) => void
}) {
  const runner = usePythonRunner()
  const submission = useSubmissionJudge(question.id, onSubmission)
  const [stdin, setStdin] = useState(question.examples[0]?.input ?? '')
  const runDisabled =
    runner.status === 'loading' || runner.status === 'running' || submission.running

  return (
    <Card>
      <h2 className="mb-3 font-semibold">Python 代码编辑器</h2>
      <QuestionCodeEditor
        questionId={question.id}
        questionVersion={question.version}
        starterCode={editorCode}
        runDisabled={runDisabled}
        onRun={(code) => void runner.run(code, stdin, question.examples[0]?.virtualFiles)}
        onSubmit={(code) => void submission.submit(code)}
      />
      <RunnerConsole
        status={runner.status}
        result={runner.result}
        message={runner.message}
        stdin={stdin}
        onStdinChange={setStdin}
        onCancel={runner.cancel}
        onRestart={runner.restart}
      />
      <SubmissionResults
        running={submission.running}
        result={submission.result}
        error={submission.error}
        onCancel={submission.cancel}
      />
    </Card>
  )
}

function StructuredWorkspace({
  question,
  onSubmission,
}: {
  question: PracticeQuestion
  onSubmission: (result: SubmissionResult) => void
}) {
  const [result, setResult] = useState<SubmissionResult>()
  const [error, setError] = useState<string>()

  const submit = async (answer: StructuredAnswer) => {
    const source = questions.find((item) => item.id === question.id && item.status === 'approved')
    if (!source) {
      setError('题目不存在或尚未通过审核。')
      return
    }
    const nextResult = judgeStructuredAnswer(source, answer)
    await submissionRepository.save({
      id: globalThis.crypto?.randomUUID?.() ?? `${source.id}-${Date.now()}`,
      questionId: source.id,
      questionVersion: source.version,
      userCode: JSON.stringify(answer),
      submittedAt: new Date().toISOString(),
      result: nextResult,
    })
    onSubmission(nextResult)
    setError(undefined)
    setResult(nextResult)
  }

  return (
    <>
      <StructuredAnswerWorkspace question={question} onSubmit={submit} />
      <SubmissionResults running={false} result={result} error={error} />
    </>
  )
}

export function PracticePage() {
  const { questionId = '' } = useParams()
  const question = questionProvider.getById(questionId)
  if (!question)
    return (
      <Page title="题目不可用" description="该题可能仍在审核、已下架或地址有误。">
        <EmptyState
          icon={<FileText />}
          title="找不到这道已审核题目"
          description="返回题库选择其他题目。"
          action={
            <Link className={buttonClass} to="/practice">
              返回题库
            </Link>
          }
        />
      </Page>
    )
  return <AvailablePracticePage question={question} />
}

function AvailablePracticePage({ question }: { question: PracticeQuestion }) {
  const isEditable = ['coding', 'fillBlank', 'debug', 'miniProject'].includes(question.type)
  const editorCode = question.starterCode || question.promptCode || '# 请根据题目要求编写代码'
  const { session, recordSubmission } = usePracticeSession(question.id, question.version)
  const { recordAttempt } = useLearning()
  const handleSubmission = (result: SubmissionResult) => {
    recordSubmission(result)
    void recordAttempt(question.id)
  }
  return (
    <Page
      title={question.title}
      description={`${chapterById.get(question.chapterId)?.title ?? question.chapterId} · ${difficultyLabels[question.difficulty]} · ${questionTypeLabels[question.type]}`}
    >
      <PracticeSessionSummary session={session} />
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="font-semibold">题目说明</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{question.description}</p>
          <h3 className="mt-5 font-semibold">要求</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {question.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!!question.choices?.length && (
            <>
              <h3 className="mt-5 font-semibold">选项</h3>
              <ol className="mt-2 space-y-2 text-sm">
                {question.choices.map((choice) => (
                  <li className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800" key={choice.id}>
                    {choice.id}. {choice.text}
                  </li>
                ))}
              </ol>
            </>
          )}
        </Card>
        <div className="space-y-5">
          {isEditable ? (
            <ProgrammableWorkspace
              key={question.id}
              question={question}
              editorCode={editorCode}
              onSubmission={handleSubmission}
            />
          ) : (
            <>
              <Card>
                <h2 className="font-semibold">{question.promptCode ? '待分析代码' : '题目材料'}</h2>
                <pre className="mt-3 min-h-40 overflow-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
                  <code>{question.promptCode ?? question.starterCode ?? '# 本题无需编写代码'}</code>
                </pre>
              </Card>
              <StructuredWorkspace
                key={question.id}
                question={question}
                onSubmission={handleSubmission}
              />
            </>
          )}
          <Card>
            <h2 className="font-semibold">公开示例</h2>
            {question.examples.map((example) => (
              <div className="mt-3 grid gap-2 text-sm" key={example.id}>
                <div>
                  <b>输入</b>
                  <pre className="mt-1 overflow-auto rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    {example.input || '（无）'}
                  </pre>
                </div>
                <div>
                  <b>{example.expectedOutput === undefined ? '答案' : '预期输出'}</b>
                  <pre className="mt-1 overflow-auto rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    {example.expectedOutput === undefined
                      ? '提交后显示'
                      : example.expectedOutput || '（无）'}
                  </pre>
                </div>
              </div>
            ))}
          </Card>
          <LearningTools key={question.id} questionId={question.id} />
        </div>
      </div>
    </Page>
  )
}

export function FreePracticePage() {
  return (
    <Page title="自由练习" description="在无题目约束的空间尝试 Python 代码。">
      <EmptyState
        icon={<FileCode2 />}
        title="自由编辑器尚未接入"
        description="代码编辑与浏览器运行能力将在后续执行器阶段接入。"
      />
    </Page>
  )
}
export function DailyPracticePage() {
  const dailyQuestions = selectDailyPractice(questionProvider.list())
  return (
    <Page title="每日练习" description="用一份短练习保持学习连续性。">
      <div className="grid gap-4">
        {dailyQuestions.map((question, index) => (
          <Card key={question.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-brand-700 dark:text-sky-300">第 {index + 1} 题 · {difficultyLabels[question.difficulty]}</p>
                <h2 className="mt-1 font-semibold">{question.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{question.description}</p>
              </div>
              <Link className={buttonClass} to={`/practice/${question.id}`}>开始练习</Link>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  )
}
export function WrongBookPage() {
  const { progress } = useLearning()
  return (
    <Page title="错题本" description="集中回顾尚未掌握的知识点。">
      <QuestionCollection
        questionIds={progress.wrongQuestionIds}
        emptyIcon={<FileText />}
        emptyTitle="还没有错题"
        emptyDescription="每道题最近一次提交未通过时会进入这里；通过后自动移出。"
      />
    </Page>
  )
}
export function FavoritesPage() {
  const { progress } = useLearning()
  return (
    <Page title="收藏夹" description="保存值得反复练习的题目。">
      <QuestionCollection
        questionIds={progress.favoriteQuestionIds}
        emptyIcon={<BookHeart />}
        emptyTitle="收藏夹是空的"
        emptyDescription="在题目页点击收藏后，题目会出现在这里。"
      />
    </Page>
  )
}
export function StatisticsPage() {
  const { progress } = useLearning()
  const total = questionProvider.list().length
  const cards = [
    ['已完成题目', `${progress.completedQuestionIds.length}/${total}`],
    ['正式提交', String(progress.attemptCount)],
    ['当前错题', String(progress.wrongQuestionIds.length)],
    ['收藏题目', String(progress.favoriteQuestionIds.length)],
    ['学习笔记', String(progress.noteCount)],
    ['平均掌握度', `${progress.averageMastery}/5`],
  ]
  const achievements = deriveAchievements(progress)
  return (
    <Page title="学习统计" description="了解自己的投入与掌握情况。">
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </Card>
        ))}
      </div>
      {!progress.attemptCount && (
        <EmptyState
          icon={<BarChart3 />}
          title="等待第一次正式提交"
          description="统计只基于真实作答、收藏、笔记和自评掌握度生成。"
        />
      )}
      <Card className="mt-5">
        <h2 className="font-semibold">成就</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <div className={`rounded-xl border p-3 ${achievement.unlocked ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30' : 'border-slate-200 opacity-60 dark:border-slate-700'}`} key={achievement.id}>
              <p className="font-medium">{achievement.unlocked ? '✓ ' : '○ '}{achievement.title}</p>
              <p className="mt-1 text-sm text-slate-500">{achievement.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  )
}

function QuestionCollection({
  questionIds,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  questionIds: string[]
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptyDescription: string
}) {
  const items = questionIds
    .map((questionId) => questionProvider.list().find((item) => item.id === questionId))
    .filter((item) => item !== undefined)
  if (!items.length) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
  }
  return (
    <div className="grid gap-4">
      {items.map((question) => (
        <Card key={question.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{question.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{question.description}</p>
            </div>
            <Link className={buttonClass} to={`/practice/${question.id}`}>
              继续练习
            </Link>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function QnaPage() {
  const [chapterId, setChapterId] = useState(learningGuides[0]?.chapterId ?? '')
  const guide = learningGuides.find((item) => item.chapterId === chapterId)
  const chapter = chapterById.get(chapterId)

  return (
    <Page title="答疑中心" description="系统梳理知识点、标记个人笔记，并在配置接口后向 AI 助教提问。">
      <Card className="mb-5">
        <label className="grid gap-2 text-sm font-medium sm:max-w-md">
          选择学习单元
          <select className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" value={chapterId} onChange={(event) => setChapterId(event.target.value)}>
            {learningGuides.map((item) => <option key={item.chapterId} value={item.chapterId}>{chapterById.get(item.chapterId)?.order}. {item.title}</option>)}
          </select>
        </label>
      </Card>
      {guide && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.7fr)]">
        <Card><GuideReader guide={guide} /></Card>
        <Card className="h-fit xl:sticky xl:top-20"><h2 className="text-lg font-semibold">互动答疑</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">围绕“{chapter?.title ?? guide.title}”提出问题。</p><div className="mt-4"><Suspense fallback={<p className="text-sm text-slate-600 dark:text-slate-300">正在加载答疑工具…</p>}><LlmChatPanel chapterTitle={chapter?.title ?? guide.title} /></Suspense></div></Card>
      </div>}
    </Page>
  )
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const options: { value: Theme; label: string; detail: string }[] = [
    { value: 'light', label: '浅色', detail: '始终使用明亮界面' },
    { value: 'dark', label: '深色', detail: '始终使用深色界面' },
    { value: 'system', label: '跟随系统', detail: '自动匹配设备外观' },
  ]
  return (
    <Page title="设置" description="调整最适合你的学习体验。">
      <Card>
        <h2 className="font-semibold" id="theme-label">
          外观主题
        </h2>
        <div
          className="mt-4 grid gap-3 sm:grid-cols-3"
          role="radiogroup"
          aria-labelledby="theme-label"
        >
          {options.map((option) => (
            <button
              key={option.value}
              role="radio"
              aria-checked={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={`rounded-xl border p-4 text-left ${theme === option.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 dark:border-slate-700'}`}
            >
              <b className="block">{option.label}</b>
              <small className="text-slate-500">{option.detail}</small>
            </button>
          ))}
        </div>
      </Card>
    </Page>
  )
}
