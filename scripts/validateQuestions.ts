import { chapters } from '../src/data/chapters'
import { knowledgePoints } from '../src/data/knowledgePoints'
import { COMPARE_MODES, DIFFICULTIES, QUESTION_STATUSES, QUESTION_TYPES, type Question } from '../src/types/question'

export interface ValidationIssue {
  questionId: string
  path: string
  message: string
}

const executableTypes = new Set(['coding', 'fillBlank', 'debug', 'miniProject'])
const structuredAnswerTypes = new Set(['output', 'multipleChoice', 'codeOrder'])
const idPattern = /^ch\d{2}-q\d{3}$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/

export function validateQuestions(questions: readonly Question[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const chapterIds = new Set(chapters.map((chapter) => chapter.id))
  const pointById = new Map(knowledgePoints.map((point) => [point.id, point]))
  const questionIds = new Set<string>()
  const slugs = new Set<string>()
  const testIds = new Set<string>()
  const add = (questionId: string, path: string, message: string) => issues.push({ questionId, path, message })

  for (const question of questions) {
    const id = question.id || '<missing-id>'
    if (!idPattern.test(question.id)) add(id, 'id', '必须符合 chNN-qNNN 格式')
    if (questionIds.has(question.id)) add(id, 'id', '题目 ID 重复')
    questionIds.add(question.id)
    if (!question.slug.trim() || slugs.has(question.slug)) add(id, 'slug', 'slug 不能为空且必须唯一')
    slugs.add(question.slug)
    if (!question.title.trim() || !question.description.trim() || !question.explanation.trim()) add(id, 'content', '标题、描述和解析不能为空')
    if (!chapterIds.has(question.chapterId)) add(id, 'chapterId', '引用了不存在的章节')
    if (!DIFFICULTIES.includes(question.difficulty)) add(id, 'difficulty', '难度值无效')
    if (!QUESTION_TYPES.includes(question.type)) add(id, 'type', '题型值无效')
    if (!QUESTION_STATUSES.includes(question.status)) add(id, 'status', '状态值无效')
    if (!Number.isInteger(question.version) || question.version < 1) add(id, 'version', '版本必须是正整数')
    if (!datePattern.test(question.createdAt)) add(id, 'createdAt', '日期必须使用 YYYY-MM-DD')
    if (!Number.isInteger(question.estimatedMinutes) || question.estimatedMinutes < 1) add(id, 'estimatedMinutes', '预计时间必须是正整数')
    if (!question.requirements.length) add(id, 'requirements', '至少需要一条明确要求')
    if (question.hints.length < 3) add(id, 'hints', '至少需要三级递进提示')
    if (!question.knowledgePointIds.length) add(id, 'knowledgePointIds', '至少引用一个知识点')

    for (const pointId of question.knowledgePointIds) {
      const point = pointById.get(pointId)
      if (!point) add(id, 'knowledgePointIds', `知识点 ${pointId} 不存在`)
      else if (point.chapterId !== question.chapterId && question.type !== 'miniProject') {
        add(id, 'knowledgePointIds', `知识点 ${pointId} 不属于当前章节`)
      }
    }

    const allTests = [...question.examples, ...question.hiddenTests]
    if (!question.examples.length || !question.hiddenTests.length) add(id, 'tests', '至少需要一个示例和一个隐藏测试')
    allTests.forEach((testCase, index) => {
      const collection = index < question.examples.length ? 'examples' : 'hiddenTests'
      const shouldBeVisible = collection === 'examples'
      if (testIds.has(testCase.id)) add(id, `${collection}.id`, `测试 ID ${testCase.id} 重复`)
      testIds.add(testCase.id)
      if (testCase.visible !== shouldBeVisible) add(id, `${collection}.visible`, '可见性与所在集合不一致')
      if (!COMPARE_MODES.includes(testCase.compareMode)) add(id, `${collection}.compareMode`, '比较模式无效')
      if (testCase.compareMode === 'numeric' && !(typeof testCase.numericTolerance === 'number' && testCase.numericTolerance > 0)) {
        add(id, `${collection}.numericTolerance`, 'numeric 模式必须指定正数容差')
      }
      if (
        testCase.compareMode === 'exact' &&
        !structuredAnswerTypes.has(question.type) &&
        testCase.expectedOutput !== '' &&
        !testCase.expectedOutput.endsWith('\n')
      ) {
        add(id, `${collection}.expectedOutput`, 'exact stdout 必须显式包含终止换行；若换行不是考点请改用 lineTrimmed')
      }
      testCase.virtualFiles?.forEach((file) => {
        if (!file.path || file.path.includes('..') || /^[A-Za-z]:|^[\\/]/.test(file.path)) add(id, `${collection}.virtualFiles`, '虚拟文件必须使用安全的相对路径')
      })
    })

    if (executableTypes.has(question.type) && !question.solutionCode.trim()) add(id, 'solutionCode', '可执行题必须提供参考答案')
    if (question.type === 'output' && !question.promptCode?.trim()) add(id, 'promptCode', '输出预测题必须提供待分析代码')
    if (question.type === 'multipleChoice') {
      const choiceIds = new Set((question.choices ?? []).map((choice) => choice.id))
      if ((question.choices?.length ?? 0) < 3) add(id, 'choices', '选择题至少需要三个选项')
      if (!question.correctChoiceIds?.length || question.correctChoiceIds.some((choiceId) => !choiceIds.has(choiceId))) add(id, 'correctChoiceIds', '正确选项必须引用已有选项')
    }
    if (question.type === 'codeOrder') {
      const blockIds = (question.codeBlocks ?? []).map((block) => block.id)
      if (blockIds.length < 2 || new Set(blockIds).size !== blockIds.length) add(id, 'codeBlocks', '排序题至少需要两个 ID 唯一的代码块')
      if (!question.correctCodeOrder || question.correctCodeOrder.length !== blockIds.length || question.correctCodeOrder.some((blockId) => !blockIds.includes(blockId))) add(id, 'correctCodeOrder', '正确顺序必须恰好包含全部代码块')
    }
  }

  return issues
}

export function assertValidQuestions(questions: readonly Question[]): void {
  const issues = validateQuestions(questions)
  if (issues.length) {
    throw new Error(issues.map((issue) => `${issue.questionId} ${issue.path}: ${issue.message}`).join('\n'))
  }
}
