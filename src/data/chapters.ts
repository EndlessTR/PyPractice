import type { Chapter } from '../types'

export const chapters = [
  { id: 'chapter-01', order: 1, title: '基础语法与变量', description: '认识 Python 程序、变量、基本类型与算术运算。' },
  { id: 'chapter-02', order: 2, title: '输入与输出', description: '使用 input、print 与格式化字符串完成交互。' },
  { id: 'chapter-03', order: 3, title: '条件判断', description: '使用比较、逻辑运算和分支表达规则。' },
  { id: 'chapter-04', order: 4, title: '循环', description: '用 for、while 和 range 处理重复任务。' },
  { id: 'chapter-05', order: 5, title: '字符串', description: '掌握索引、切片与常用字符串方法。' },
  { id: 'chapter-06', order: 6, title: '列表', description: '创建、修改并遍历有序的数据集合。' },
  { id: 'chapter-07', order: 7, title: '元组、字典与集合', description: '根据任务选择合适的容器类型。' },
  { id: 'chapter-08', order: 8, title: '函数', description: '使用参数、返回值和作用域组织可复用代码。' },
  { id: 'chapter-09', order: 9, title: '推导式与常用内置函数', description: '用简洁表达式和内置工具转换数据。' },
  { id: 'chapter-10', order: 10, title: '异常处理', description: '识别并妥善处理可预期的运行时错误。' },
  { id: 'chapter-11', order: 11, title: '文件读写', description: '安全地读取和写入 UTF-8 文本文件。' },
  { id: 'chapter-12', order: 12, title: '模块与包', description: '导入并使用 Python 标准库模块。' },
  { id: 'chapter-13', order: 13, title: '面向对象', description: '使用类、实例、属性和方法描述对象。' },
  { id: 'chapter-14', order: 14, title: '综合基础练习', description: '综合运用基础知识完成小型程序。' },
] as const satisfies readonly Chapter[]

export const chapterById = new Map<string, Chapter>(chapters.map((chapter) => [chapter.id, chapter]))
