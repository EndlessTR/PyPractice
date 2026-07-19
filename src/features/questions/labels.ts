import type { Difficulty, QuestionType } from '../../types'

export const difficultyLabels: Record<Difficulty, string> = {
  intro: '入门',
  basic: '基础',
  skilled: '熟练',
  combined: '综合',
}

export const questionTypeLabels: Record<QuestionType, string> = {
  coding: '编程',
  fillBlank: '代码补全',
  debug: '纠错',
  output: '输出预测',
  multipleChoice: '选择题',
  codeOrder: '代码排序',
  miniProject: '小型项目',
}

