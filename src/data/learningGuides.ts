export type LearningGuideSection = {
  id: string
  title: string
  explanation: string
  pitfalls: string[]
  example?: string
}

export type LearningGuide = {
  chapterId: string
  title: string
  overview: string
  sections: LearningGuideSection[]
}

export const learningGuides: readonly LearningGuide[] = [
  {
    chapterId: 'chapter-01', title: '基础语法与变量', overview: '程序由按顺序执行的语句组成；变量为数据起名字，类型决定可进行的运算。', sections: [
      { id: 'variables', title: '变量、类型与赋值', explanation: '赋值号 = 是“把右侧计算出的对象绑定给左侧名字”，不是数学等号。常见基本类型有 int、float、str、bool；可用 type() 查看类型，必要时用 int()、float()、str() 转换。', pitfalls: ['把 = 当作比较，应使用 == 比较是否相等。', 'input() 的结果始终是字符串，算术前要转换。'], example: "age = int(input())\nnext_year = age + 1\nprint(next_year)" },
      { id: 'arithmetic', title: '算术运算与优先级', explanation: '+、-、*、/ 分别表示加减乘和真除法；// 向下取整，% 求余，** 求幂。括号优先，其后是幂、乘除，最后加减。', pitfalls: ['负数使用 // 会向更小的整数取整，例如 -3 // 2 为 -2。', '不要把 / 的浮点结果当作整数下标或 range 参数。'], example: "a, b = 17, 5\nprint(a // b, a % b)  # 3 2" },
    ],
  },
  {
    chapterId: 'chapter-02', title: '输入与输出', overview: '使用 input 获取文本，用 print 展示结果；格式化能让输出清晰且满足精确要求。', sections: [
      { id: 'input', title: '读取与转换输入', explanation: 'input(prompt) 读取一整行并返回 str。若一行有多个值，可用 input().split() 拆分，再配合 map(int, ...) 转为整数。', pitfalls: ['split() 默认按任意连续空白切分，不能用它保留原始空格。', '转换前要确认输入格式；空字符串执行 int() 会抛出 ValueError。'], example: "name = input()\na, b = map(int, input().split())\nprint(f'{name}: {a + b}')" },
      { id: 'format', title: 'print 与 f-string', explanation: 'print 默认用空格分隔多个参数、末尾换行；sep 和 end 可改变它们。f-string 用 {表达式} 插入值，:.2f 固定两位小数，:<10 表示左对齐宽度 10。', pitfalls: ['格式化浮点数不改变原变量，只改变显示文本。', '在线评测中额外提示语、空格或换行都可能导致答案错误。'], example: "price = 3.5\nprint(f'价格：{price:.2f}', end=' 元\\n')" },
    ],
  },
  {
    chapterId: 'chapter-03', title: '条件判断', overview: '条件分支让程序依据布尔表达式选择一条路径；分支顺序决定边界归属。', sections: [
      { id: 'branch', title: 'if / elif / else', explanation: 'if 条件为真时执行其缩进代码块；否则依次检查 elif，所有条件都不满足时执行 else。一个链中只会执行第一个满足的分支。', pitfalls: ['不要混用 Tab 与空格；同一层级必须对齐。', '区间判断应从具体或较小边界开始，避免前面的宽条件遮住后续分支。'], example: "if score >= 60:\n    result = '及格'\nelse:\n    result = '不及格'" },
      { id: 'logic', title: '比较与逻辑', explanation: '比较运算产生 True 或 False。and 要求两边都真，or 至少一边真，not 取反；Python 支持 10 <= x <= 20 这类链式比较。', pitfalls: ['x >= 10 or x <= 20 几乎总为真，区间内判断通常应使用 and。', '比较字符串按字典序而非数值大小。'], example: "if 10 <= x <= 20 and x % 2 == 0:\n    print('区间内的偶数')" },
    ],
  },
  {
    chapterId: 'chapter-04', title: '循环', overview: '循环用于重复处理数据；写循环前先明确重复次数、初始状态和停止条件。', sections: [
      { id: 'for-range', title: 'for 与 range', explanation: 'for 依次取可迭代对象中的项目。range(start, stop, step) 生成从 start 到 stop 之前的整数，stop 不包含；省略 start 时从 0 开始。', pitfalls: ['range(1, 5) 得到 1 到 4，不包含 5。', '倒序要写负步长，如 range(n, 0, -1)。'], example: "for number in range(1, 6):\n    print(number)" },
      { id: 'while', title: 'while、累加器与哨兵', explanation: 'while 在条件为真时持续执行。计数器和累加器应在循环前初始化，并在循环体内更新；未知输入数量常用特殊结束值（哨兵）终止。', pitfalls: ['忘记更新条件变量会造成死循环。', '把循环后只需执行一次的语句缩进进循环，会重复执行。'], example: "total = 0\nwhile True:\n    text = input()\n    if text == 'END':\n        break\n    total += int(text)" },
    ],
  },
  {
    chapterId: 'chapter-05', title: '字符串', overview: '字符串是有序、不可变的字符序列；通过索引、切片和方法完成文本处理。', sections: [
      { id: 'index-slice', title: '索引与切片', explanation: '索引从 0 开始，负索引从末尾计数；s[start:stop:step] 返回新字符串且 stop 不包含。字符串不能原地修改。', pitfalls: ['访问 s[len(s)] 会越界，最后一个位置是 len(s)-1 或 -1。', '切片超出边界通常不会报错，但单个索引会报 IndexError。'], example: "word = 'Python'\nprint(word[0], word[-1], word[1:4])  # P n yth" },
      { id: 'methods', title: '常用清洗方法', explanation: 'strip() 删除首尾空白，lower()/upper() 统一大小写，split() 分词，join() 将序列连接为字符串，replace() 替换文本。它们通常返回新字符串。', pitfalls: ['忘记接收返回值：text.lower() 不会修改 text 本身。', "' '.join(text) 会逐字符连接；应传入单词列表。"], example: "words = '  Hello   WORLD '.strip().lower().split()\nprint('-'.join(words))" },
    ],
  },
  {
    chapterId: 'chapter-06', title: '列表', overview: '列表是有序、可修改的集合，适合保存一组可变且允许重复的数据。', sections: [
      { id: 'mutation', title: '创建与修改列表', explanation: 'append(x) 将一个对象作为末尾元素加入，extend(items) 逐项加入，insert(i, x) 指定位置插入；pop() 删除并返回元素。', pitfalls: ['append([1, 2]) 会产生嵌套列表，想添加两个元素应使用 extend。', '遍历列表时直接删除元素易跳项，优先生成新列表。'], example: "numbers = [1, 2]\nnumbers.append(3)\nnumbers.extend([4, 5])" },
      { id: 'traversal', title: '遍历、成员与复制', explanation: 'for item in items 遍历元素；in 检查成员。切片 items[:]、copy() 或 list(items) 可建立浅复制，避免两个变量指向同一列表。', pitfalls: ['b = a 只是创建同一对象的另一个名字，修改 b 也会改 a。', '成员判断 in 返回布尔值，不能直接得到元素的位置。'], example: "values = [3, 1, 3]\nif 1 in values:\n    print(values.count(3))" },
    ],
  },
  {
    chapterId: 'chapter-07', title: '元组、字典与集合', overview: '选择容器要看数据关系：元组表示固定位置，字典表达键到值，集合强调唯一成员。', sections: [
      { id: 'dictionary', title: '字典访问与更新', explanation: '字典用唯一且可哈希的键映射到值。d[key] 在键缺失时抛 KeyError；d.get(key, default) 可安全提供默认值。', pitfalls: ['key in d 检查的是键，不是值；检查值需用 d.values()。', '把可变列表当字典键会报 TypeError。'], example: "scores = {}\nfor name in ['Ada', 'Lin', 'Ada']:\n    scores[name] = scores.get(name, 0) + 1" },
      { id: 'tuple-set', title: '元组与集合', explanation: '元组使用逗号创建，适合不应修改的记录和多重赋值；集合自动去重，支持并集、交集和快速成员判断。', pitfalls: ['单元素元组必须写 (value,)，否则只是括号表达式。', '集合无固定顺序，不能依赖其遍历结果的排列。'], example: "point = (3, 4)\nunique_tags = set(['py', 'py', 'web'])" },
    ],
  },
  {
    chapterId: 'chapter-08', title: '函数', overview: '函数把可复用步骤命名并隔离，实现清晰的输入、处理和输出边界。', sections: [
      { id: 'return', title: '参数与返回值', explanation: 'def 定义函数；参数接收调用者提供的数据，return 把结果交回调用处并立刻结束函数。没有 return 时结果为 None。', pitfalls: ['print 只展示结果，不能替代 return 供后续计算。', 'return 后的同一函数代码不可达。'], example: "def square(number):\n    return number * number\n\nprint(square(5))" },
      { id: 'arguments', title: '默认参数与作用域', explanation: '默认参数在调用时省略对应实参才生效；关键字参数可按名称传值。函数内部赋值默认是局部变量，不会改动同名全局变量。', pitfalls: ['避免用 []、{} 这类可变对象作为默认参数。', '定义默认参数后，后续普通参数不能再省略默认值。'], example: "def greet(name, mark='!'):\n    return name + mark\nprint(greet('Ada', mark='?'))" },
    ],
  },
  {
    chapterId: 'chapter-09', title: '推导式与常用内置函数', overview: '推导式适合简洁地构造新集合；内置函数可概括常见统计和遍历任务。', sections: [
      { id: 'enumerate', title: 'enumerate 与 zip', explanation: 'enumerate(items, start=0) 同时给出下标和元素；zip(a, b) 按位置配对，长度以最短输入为准。', pitfalls: ['enumerate 默认从 0 开始，展示序号时常需 start=1。', 'zip 会静默截断较长序列，长度不一致时要主动检查。'], example: "for index, name in enumerate(['Ada', 'Lin'], start=1):\n    print(index, name)" },
      { id: 'comprehension', title: '列表推导式与聚合', explanation: '列表推导式格式为 [表达式 for 变量 in 可迭代对象 if 条件]，按原顺序构建新列表。sum、min、max、len 可处理可迭代数据。', pitfalls: ['复杂的多层逻辑不要硬塞进推导式，应改用普通循环。', 'min([]) 与 max([]) 在空列表上会报错。'], example: "squares = [n * n for n in range(10) if n % 2 == 0]\nprint(sum(squares))" },
    ],
  },
  {
    chapterId: 'chapter-10', title: '异常处理', overview: '异常处理应保护可预期的失败点，给用户清晰结果，同时避免掩盖真正的程序错误。', sections: [
      { id: 'types', title: '常见异常类型', explanation: 'ValueError 常见于值格式不合法，IndexError 表示序列下标越界，KeyError 表示缺少字典键，ZeroDivisionError 表示除数为零。', pitfalls: ['不要捕获错误的异常类型，例如列表越界不是 ValueError。', '不要用裸 except 吞掉所有错误。'], example: "try:\n    number = int(input())\nexcept ValueError:\n    print('请输入整数')" },
      { id: 'structure', title: 'try / except / else / finally', explanation: 'try 放可能失败的最小代码块，except 处理对应异常，else 仅在没有异常时执行，finally 无论结果如何都会执行，适合清理资源。', pitfalls: ['把过多无关代码放入 try 会误把程序 bug 当成可恢复错误。', 'except 后继续使用未成功赋值的变量会引发新错误。'], example: "try:\n    value = int(text)\nexcept ValueError:\n    result = 0\nelse:\n    result = value * 2" },
    ],
  },
  {
    chapterId: 'chapter-11', title: '文件读写', overview: '文件操作要明确路径、模式和编码，并用上下文管理器保证资源被正确关闭。', sections: [
      { id: 'with-open', title: 'with 与 open', explanation: "with open(path, mode, encoding='utf-8') as file 会在代码块结束后自动关闭文件。r 是读取，w 覆盖写入，a 在末尾追加。", pitfalls: ['w 会清空已有文件，保留内容时应确认是否应使用 a。', '不指定编码在不同系统上可能出现中文乱码。'], example: "with open('note.txt', 'w', encoding='utf-8') as file:\n    file.write('第一行\\n')" },
      { id: 'reading', title: '逐行读取与文本清洗', explanation: 'read() 读取全部内容，readline() 读取一行，直接遍历文件对象适合逐行处理。行末通常带 \n，可用 strip() 或 rstrip() 处理。', pitfalls: ['对大文件使用 read() 可能占用过多内存。', 'strip() 会同时删除首尾有效空格；只想去掉换行可用 rstrip("\\n")。'], example: "count = 0\nwith open('data.txt', encoding='utf-8') as file:\n    for line in file:\n        if line.strip():\n            count += 1" },
    ],
  },
  {
    chapterId: 'chapter-12', title: '模块与包', overview: '模块让代码按功能拆分；导入时应清楚名称从哪里来，并尽量使用标准库已有能力。', sections: [
      { id: 'imports', title: '导入方式', explanation: 'import math 后通过 math.sqrt 访问成员；from math import sqrt 可直接使用 sqrt。别名 import statistics as stats 能缩短且保持语义清楚。', pitfalls: ['import random 后直接写 randint 会 NameError，应写 random.randint。', '避免 from module import *，它会污染命名空间。'], example: "import math\nradius = 3\nprint(math.pi * radius ** 2)" },
      { id: 'stdlib', title: '标准库工具', explanation: 'math 提供数学函数，random 用于伪随机数，datetime 处理日期时间，collections 提供 Counter 等容器。先阅读函数的边界与返回类型再使用。', pitfalls: ['random.randint(a, b) 包含 b，而 randrange(a, b) 不包含 b。', 'math.ceil(-2.5) 是 -2，含义是向正无穷取整。'], example: "from collections import Counter\nprint(Counter('banana')['a'])" },
    ],
  },
  {
    chapterId: 'chapter-13', title: '面向对象', overview: '类把相关数据和行为组合为对象；实例各自保存状态，方法描述对象能做什么。', sections: [
      { id: 'class', title: '类、实例与方法', explanation: '__init__ 在创建实例时初始化属性；self 指向当前实例，实例方法的第一个参数必须是 self。属性通过 self.name 保存，方法通过对象调用。', pitfalls: ['在方法内写 name 而非 self.name 会创建局部变量。', '调用实例方法时不需手动传 self。'], example: "class Rectangle:\n    def __init__(self, width, height):\n        self.width = width\n        self.height = height\n    def area(self):\n        return self.width * self.height" },
      { id: 'state', title: '实例状态与类属性', explanation: '实例属性属于每个对象，修改一个实例不会影响另一个；类属性属于类，所有实例默认共享访问。可变数据通常应在 __init__ 中创建为实例属性。', pitfalls: ['把列表写成类属性会被所有实例共享。', '不要在实例中无意赋同名属性而误以为改了类属性。'], example: "class Account:\n    def __init__(self, balance):\n        self.balance = balance\n    def deposit(self, amount):\n        self.balance += amount" },
    ],
  },
  {
    chapterId: 'chapter-14', title: '综合基础练习', overview: '综合题的核心是把需求拆成输入、数据表示、处理、输出四步，并用小样例和边界数据验证。', sections: [
      { id: 'pipeline', title: '文本处理流水线', explanation: '将输入规范化、拆分、过滤、转换和输出串成清晰步骤。每一步保存中间变量更便于检查，也更容易定位错误。', pitfalls: ['先 split 再 strip 每个词，与先清理整段文本的效果不总相同。', '输出前确认是否要求保留顺序、大小写和分隔符。'], example: "text = input()\nwords = text.strip().lower().split()\nprint('-'.join(words))" },
      { id: 'statistics', title: '统计与菜单程序', explanation: '统计常以列表、字典和累加器实现；菜单程序用 while True 接收命令，用 break 处理结束命令，并把每个分支职责保持单一。', pitfalls: ['计数前先判断结束命令，否则会把 END 计入结果。', '平均值前要处理空数据或确认题目保证数量大于零。'], example: "totals = {}\nfor _ in range(n):\n    category, amount = input().split()\n    totals[category] = totals.get(category, 0) + int(amount)\nfor category in sorted(totals):\n    print(category, totals[category])" },
    ],
  },
] as const
