# PyPractice 数据模型

本文定义后续阶段的目标领域契约；阶段 1 尚未创建正式题库或数据库。TypeScript 类型、运行时 Schema 和出题模板必须来自同一份定义，避免字段漂移。

```ts
type Difficulty = 'intro' | 'basic' | 'skilled' | 'combined'
type QuestionType =
  'coding' | 'fillBlank' | 'debug' | 'output' | 'multipleChoice' | 'codeOrder' | 'miniProject'
type CompareMode = 'exact' | 'trimmed' | 'lineTrimmed' | 'numeric' | 'unorderedLines' | 'custom'
type QuestionStatus = 'draft' | 'review' | 'approved' | 'retired'

interface Question {
  id: string
  slug: string
  title: string
  chapterId: string
  knowledgePointIds: string[]
  description: string
  requirements: string[]
  difficulty: Difficulty
  type: QuestionType
  starterCode: string
  solutionCode: string
  promptCode?: string
  choices?: Array<{ id: string; text: string }>
  correctChoiceIds?: string[]
  codeBlocks?: Array<{ id: string; code: string }>
  correctCodeOrder?: string[]
  examples: TestCase[]
  hiddenTests: TestCase[]
  testHarnessCode?: string
  hints: string[]
  explanation: string
  estimatedMinutes: number
  status: QuestionStatus
  version: number
  createdAt: string
}

interface TestCase {
  id: string
  input: string
  expectedOutput: string
  visible: boolean
  compareMode: CompareMode
  numericTolerance?: number
  explanation?: string
  virtualFiles?: Array<{
    path: string
    content: string
    encoding?: 'utf-8'
  }>
}

interface Attempt {
  id: string
  questionId: string
  questionVersion: number
  answer: string
  result: 'passed' | 'failed' | 'error'
  durationMs: number
  createdAt: string
}

interface UserQuestionState {
  questionId: string
  favorite: boolean
  mastery: 0 | 1 | 2 | 3 | 4 | 5
  lastAttemptAt?: string
}

interface Note {
  id: string
  questionId?: string
  content: string
  createdAt: string
  updatedAt: string
}

interface Achievement {
  id: string
  progress: number
  target: number
  unlockedAt?: string
}

interface Preferences {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'sm' | 'md' | 'lg'
}
```

## 约束

- `Question.id` 全局唯一且发布后不变；修改已发布内容时递增 `version`。
- 生产界面只展示 `approved` 题目，`draft`/`review` 不得混入题库。
- 可执行题至少有 1 个可见示例和 1 个隐藏测试；测试 ID 全局稳定。
- 函数、类等返回值题由不可编辑的 `testHarnessCode` 调用；文件题通过 `virtualFiles` 提供每次执行独立的 fixture。
- `multipleChoice`、`codeOrder`、`output` 使用各自结构化答案，不伪装成 stdout 测试。
- `exact` 仅统一 CRLF/CR 为 LF，其他空白（包括 stdout 终止换行）全部保留；stdout 预期必须显式记录终止 `\n`，不考查末尾空白时使用 `lineTrimmed`。
- `numeric` 必须显式指定容差；格式也是要求时使用字符串比较模式。
- 隐藏测试不得进入普通展示模型；harness 与 fixture 的路径需经过白名单校验。
- Attempt 保存题目版本，以便题目升级后解释历史结果；统计从 Attempt 派生。
- 错题状态取每道题最新 Attempt 的结果；完成进度取至少一次通过的题目。二者不重复持久化，避免与提交记录产生漂移。
- 收藏与掌握度保存在 UserQuestionState；当前每道题提供一条可编辑笔记，空内容会删除该笔记。
- IndexedDB 保存 schema 版本并提供向前迁移；当前 v2 从 v1 的提交/会话表扩展出题目状态、笔记、偏好和元数据表，并保留旧提交。导入题目数据必须先通过运行时 Schema 校验。
