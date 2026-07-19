import type { KnowledgePoint } from '../types'

export const knowledgePoints = [
  { id: 'variables', chapterId: 'chapter-01', title: '变量与赋值' },
  { id: 'numeric-conversion', chapterId: 'chapter-01', title: '数值转换与算术' },
  { id: 'print-formatting', chapterId: 'chapter-02', title: 'print 与输出格式' },
  { id: 'input-and-fstring', chapterId: 'chapter-02', title: '输入与 f-string' },
  { id: 'conditional-branches', chapterId: 'chapter-03', title: 'if / elif / else' },
  { id: 'boolean-logic', chapterId: 'chapter-03', title: '比较与逻辑运算' },
  { id: 'range-for-loop', chapterId: 'chapter-04', title: 'range 与 for 循环' },
  { id: 'loop-accumulator', chapterId: 'chapter-04', title: '循环与累加器' },
  { id: 'string-indexing', chapterId: 'chapter-05', title: '字符串索引' },
  { id: 'string-methods', chapterId: 'chapter-05', title: '字符串方法' },
  { id: 'list-mutation', chapterId: 'chapter-06', title: '列表追加与扩展' },
  { id: 'list-traversal', chapterId: 'chapter-06', title: '列表遍历与成员判断' },
  { id: 'dictionary-access', chapterId: 'chapter-07', title: '字典安全取值' },
  { id: 'dictionary-counting', chapterId: 'chapter-07', title: '字典计数' },
  { id: 'function-return', chapterId: 'chapter-08', title: '函数与返回值' },
  { id: 'function-parameters', chapterId: 'chapter-08', title: '默认参数与关键字参数' },
  { id: 'enumerate', chapterId: 'chapter-09', title: 'enumerate' },
  { id: 'list-comprehension', chapterId: 'chapter-09', title: '列表推导式' },
  { id: 'exception-types', chapterId: 'chapter-10', title: '异常类型' },
  { id: 'try-except-else', chapterId: 'chapter-10', title: 'try / except / else' },
  { id: 'with-open', chapterId: 'chapter-11', title: 'with 与 open' },
  { id: 'text-file-reading', chapterId: 'chapter-11', title: '文本文件读取' },
  { id: 'imports', chapterId: 'chapter-12', title: '模块导入' },
  { id: 'standard-library', chapterId: 'chapter-12', title: '标准库模块' },
  { id: 'class-basics', chapterId: 'chapter-13', title: '类、属性与方法' },
  { id: 'instance-state', chapterId: 'chapter-13', title: '实例状态隔离' },
  { id: 'integrated-io-statistics', chapterId: 'chapter-14', title: '输入与统计综合' },
  { id: 'text-processing-pipeline', chapterId: 'chapter-14', title: '文本处理流水线' },
  { id: 'while-menu', chapterId: 'chapter-14', title: '循环菜单' },
  { id: 'dictionary-application', chapterId: 'chapter-14', title: '字典综合应用' },
] as const satisfies readonly KnowledgePoint[]

export const knowledgePointById = new Map<string, KnowledgePoint>(knowledgePoints.map((point) => [point.id, point]))
export const knowledgePointsForChapter = (chapterId: string) =>
  knowledgePoints.filter((point) => point.chapterId === chapterId)
