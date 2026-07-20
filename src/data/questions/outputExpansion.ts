import type { Question } from '../../types/question'

type OutputQuestion = Pick<Question, 'id' | 'slug' | 'title' | 'chapterId' | 'knowledgePointIds' | 'difficulty' | 'description' | 'requirements' | 'promptCode' | 'hints' | 'explanation' | 'estimatedMinutes'> & { answer: string }

const output = (item: OutputQuestion): Question => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  chapterId: item.chapterId,
  knowledgePointIds: item.knowledgePointIds,
  difficulty: item.difficulty,
  type: 'output',
  description: item.description,
  requirements: item.requirements,
  starterCode: '',
  solutionCode: '',
  promptCode: item.promptCode,
  examples: [{ id: `${item.id}-e01`, input: '', expectedOutput: item.answer, visible: true, compareMode: 'exact' }],
  hiddenTests: [{ id: `${item.id}-h01`, input: '', expectedOutput: item.answer, visible: false, compareMode: 'exact' }],
  hints: item.hints,
  explanation: item.explanation,
  estimatedMinutes: item.estimatedMinutes,
  status: 'approved',
  version: 1,
  createdAt: '2026-07-20',
})

export const outputExpansion: readonly Question[] = [
  output({ id: 'ch01-q005', slug: 'assignment-rebinding-output', title: '追踪变量重新绑定', chapterId: 'chapter-01', knowledgePointIds: ['variables'], difficulty: 'intro', description: '写出变量重新赋值后的输出。', requirements: ['答案只写一行', '保留空格'], promptCode: "score = 7\nscore = score + 5\nprint(score, score - 2)", answer: '12 10', hints: ['先执行第一行赋值。', '第二次赋值会覆盖旧绑定。', 'print 用空格分隔两个值。'], explanation: 'score 先为 7，随后更新为 12；第二个输出表达式使用更新后的值。', estimatedMinutes: 3 }),
  output({ id: 'ch02-q005', slug: 'fstring-width-output', title: '读取 f-string 输出', chapterId: 'chapter-02', knowledgePointIds: ['input-and-fstring'], difficulty: 'basic', description: '判断 f-string 的格式化输出。', requirements: ['保留空格', '答案只写一行'], promptCode: "name = 'Ada'\nprint(f'[{name:>5}]')", answer: '[  Ada]', hints: ['字段总宽度是 5。', '> 表示右对齐。', '方括号不属于字段宽度。'], explanation: 'Ada 长度为 3，因此右对齐到 5 列时左侧补两个空格。', estimatedMinutes: 3 }),
  output({ id: 'ch03-q005', slug: 'short-circuit-output', title: '判断短路求值', chapterId: 'chapter-03', knowledgePointIds: ['boolean-logic'], difficulty: 'basic', description: '写出逻辑表达式的输出。', requirements: ['使用 Python 的 True/False 写法', '答案只写一行'], promptCode: "value = 0\nprint(value != 0 and 10 / value > 1)", answer: 'False', hints: ['and 左侧先求值。', 'False and ... 不需要计算右侧。', '因此不会发生除零错误。'], explanation: '左侧 value != 0 为 False，and 短路返回 False，右侧除法不会执行。', estimatedMinutes: 4 }),
  output({ id: 'ch04-q005', slug: 'range-step-output', title: '追踪 range 步长', chapterId: 'chapter-04', knowledgePointIds: ['range-for-loop'], difficulty: 'basic', description: '写出循环的每行输出。', requirements: ['每个数字独占一行', '不添加额外说明'], promptCode: "for number in range(2, 8, 2):\n    print(number)", answer: '2\n4\n6', hints: ['range 的终点不包含。', '步长为 2。', '从 2 开始依次加 2。'], explanation: 'range(2, 8, 2) 产生 2、4、6；8 作为终点不包含在序列中。', estimatedMinutes: 3 }),
  output({ id: 'ch05-q005', slug: 'slice-boundary-output', title: '读取切片边界', chapterId: 'chapter-05', knowledgePointIds: ['string-indexing'], difficulty: 'basic', description: '写出字符串切片的结果。', requirements: ['答案只写一行', '不添加引号'], promptCode: "text = 'python'\nprint(text[1:5])", answer: 'ytho', hints: ['索引从 0 开始。', '起点包含。', '终点索引不包含。'], explanation: '索引 1 到 4 对应 y、t、h、o，因此结果为 ytho。', estimatedMinutes: 3 }),
  output({ id: 'ch06-q005', slug: 'append-and-pop-output', title: '追踪列表修改', chapterId: 'chapter-06', knowledgePointIds: ['list-mutation'], difficulty: 'basic', description: '写出列表经过 pop 和 append 后的结果。', requirements: ['使用 Python 列表格式', '答案只写一行'], promptCode: "items = [1, 2, 3]\nitems.append(items.pop(0))\nprint(items)", answer: '[2, 3, 1]', hints: ['pop(0) 删除并返回首项。', 'append 将返回值放到末尾。', '列表会原地修改。'], explanation: '首项 1 被取出后追加到尾部，列表顺序变为 2、3、1。', estimatedMinutes: 4 }),
  output({ id: 'ch07-q005', slug: 'dict-get-default-output', title: '读取字典默认值', chapterId: 'chapter-07', knowledgePointIds: ['dictionary-access'], difficulty: 'basic', description: '写出 get 在键不存在时返回的结果。', requirements: ['答案只写一行', '保留整数格式'], promptCode: "scores = {'Ada': 90}\nprint(scores.get('Lin', 0) + 1)", answer: '1', hints: ['Lin 不在字典中。', 'get 的第二个参数是默认值。', '默认值再加 1。'], explanation: 'scores.get 返回默认值 0，而不是抛出 KeyError，因此输出 1。', estimatedMinutes: 3 }),
  output({ id: 'ch08-q005', slug: 'return-stops-function-output', title: '理解 return 的终止作用', chapterId: 'chapter-08', knowledgePointIds: ['function-return'], difficulty: 'basic', description: '写出函数调用的输出。', requirements: ['每个结果独占一行', '不添加解释'], promptCode: "def label(value):\n    if value > 0:\n        return 'positive'\n    return 'non-positive'\n\nprint(label(2))\nprint(label(0))", answer: 'positive\nnon-positive', hints: ['value 为 2 时进入第一个分支。', 'return 后函数立即结束。', '0 不大于 0。'], explanation: '第一次调用返回 positive；第二次跳过 if 并执行最后的 return。', estimatedMinutes: 4 }),
  output({ id: 'ch09-q005', slug: 'enumerate-custom-start-prediction', title: '读取 enumerate 起点', chapterId: 'chapter-09', knowledgePointIds: ['enumerate'], difficulty: 'basic', description: '判断 enumerate 的索引输出。', requirements: ['每项一行', '保留冒号'], promptCode: "for index, item in enumerate(['a', 'b'], start=1):\n    print(f'{index}:{item}')", answer: '1:a\n2:b', hints: ['start 指定第一个索引。', 'enumerate 同时给出索引和元素。', 'f-string 中冒号为普通字符。'], explanation: '指定 start=1 后，两个元素分别配对索引 1 和 2。', estimatedMinutes: 3 }),
  output({ id: 'ch10-q005', slug: 'except-branch-output', title: '追踪异常分支', chapterId: 'chapter-10', knowledgePointIds: ['try-except-else'], difficulty: 'basic', description: '写出异常处理代码的输出。', requirements: ['答案只写一行', '不添加引号'], promptCode: "try:\n    value = int('x')\nexcept ValueError:\n    print('invalid')\nelse:\n    print(value)", answer: 'invalid', hints: ['int 不能把 x 转成整数。', '异常类型是 ValueError。', '发生异常时不会执行 else。'], explanation: '转换抛出 ValueError，被对应 except 捕获，因此输出 invalid。', estimatedMinutes: 4 }),
  output({ id: 'ch11-q005', slug: 'splitlines-output', title: '读取 splitlines 结果', chapterId: 'chapter-11', knowledgePointIds: ['text-file-reading'], difficulty: 'basic', description: '写出文本按行拆分后的长度。', requirements: ['答案只写整数', '不添加说明'], promptCode: "content = 'first\\nsecond\\n'\nprint(len(content.splitlines()))", answer: '2', hints: ['字符串包含两个文本行。', '末尾换行不会产生额外文本行。', 'splitlines 返回列表。'], explanation: 'splitlines 将两行文本拆为两个元素，末尾换行不额外增加空元素。', estimatedMinutes: 3 }),
  output({ id: 'ch12-q005', slug: 'module-alias-output', title: '读取模块别名调用', chapterId: 'chapter-12', knowledgePointIds: ['imports'], difficulty: 'basic', description: '写出标准库函数的输出。', requirements: ['答案只写整数', '不添加说明'], promptCode: "import math as m\nprint(m.ceil(2.1))", answer: '3', hints: ['as 给模块取别名。', 'ceil 向上取整。', '2.1 的下一个整数是 3。'], explanation: 'm 指向 math 模块，ceil(2.1) 返回不小于输入的最小整数 3。', estimatedMinutes: 3 }),
  output({ id: 'ch13-q005', slug: 'instance-attribute-output', title: '追踪实例属性', chapterId: 'chapter-13', knowledgePointIds: ['class-basics'], difficulty: 'basic', description: '写出实例方法的输出。', requirements: ['答案只写一行', '保留空格'], promptCode: "class Counter:\n    def __init__(self, value):\n        self.value = value\n    def add(self, amount):\n        self.value += amount\n\ncounter = Counter(3)\ncounter.add(2)\nprint(counter.value)", answer: '5', hints: ['构造函数把 value 保存到实例。', 'add 修改 self.value。', '3 加 2 等于 5。'], explanation: 'counter 是独立实例，其 value 先初始化为 3，调用 add 后更新为 5。', estimatedMinutes: 4 }),
  output({ id: 'ch14-q009', slug: 'statistics-format-output', title: '读取统计格式化结果', chapterId: 'chapter-14', knowledgePointIds: ['integrated-io-statistics'], difficulty: 'combined', description: '写出平均值格式化后的输出。', requirements: ['保留两位小数', '答案只写一行'], promptCode: "scores = [70, 80, 91]\naverage = sum(scores) / len(scores)\nprint(f'{average:.2f}')", answer: '80.33', hints: ['先求总和 241。', '再除以 3。', '.2f 固定两位小数。'], explanation: '平均值约为 80.333…，格式化为两位小数后输出 80.33。', estimatedMinutes: 4 }),
]
