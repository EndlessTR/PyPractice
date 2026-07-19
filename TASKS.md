# PyPractice 实施路线图

## 阶段 1：工程与界面骨架

- [x] 初始化 Vite + React + TypeScript
- [x] 配置 Tailwind、Router、ESLint、Prettier
- [x] 配置 Vitest + Testing Library 冒烟测试
- [x] 配置 GitHub Pages `base`
- [x] 建立 10 个主要页面和响应式统一布局
- [x] 实现浅色、深色、跟随系统主题
- [x] 使用真实空状态，并建立产品、架构、数据与题库文档

### 阶段 1 验证结果

- [x] `npm run lint` 通过（0 warning）
- [x] `npm run test` 通过（1 个测试文件，1 个测试）
- [x] `npm run build` 通过（Vite 7.1.7）
- [x] 已生成 `package-lock.json`，依赖版本已固定

## 阶段 2：题库与基础学习闭环

- [x] 冻结 TypeScript 题目类型和公开 DTO 边界
- [x] 建立 14 章、30 个知识点 ID 与静态引用校验
- [x] 按蓝图录入首批 30 题的题面、答案、提示、解析和测试
- [x] 实现 stdin/stdout、结构化答案、harness、虚拟文件协议
- [x] 运行标准答案并完成独立审题，30 题已标记为 `approved`
- [x] 实现本地题库 Provider、章节/难度/题型筛选和安全题目详情
- [x] 实现六种输出比较协议、custom 注册表、静态校验与单元测试
- [x] 实现练习会话状态
- [x] 建立 repository 接口及 IndexedDB 迁移
- [x] 实现收藏、错题、笔记、掌握度和进度基础逻辑

## 阶段 3：浏览器内 Python 执行

- [x] 按需加载 Monaco Editor，并完成按题草稿、主题、字号、快捷键和全屏
- [x] 在 Web Worker 中按需加载 Pyodide 314.0.2
- [x] 实现 stdin/stdout/stderr、3 秒超时、终止重建和 20,000 字符输出上限
- [x] 实现公开/未展示测试、六种比较器、结构化题型判定和逐例反馈
- [x] 分离普通运行与正式提交，并建立当前会话的内存提交记录
- [x] 覆盖异常、harness、fixture 与 Worker 生命周期的集成测试

## 阶段 4：完善与发布

- [x] 增加 Error Boundary、路由回退、资源加载失败恢复
- [x] 完成学习统计、每日练习和成就系统
- [x] 完成键盘流程、对比度和屏幕阅读器检查
- [ ] 增加端到端测试（性能预算和离线/弱网验证已完成）
- [x] 完善 GitHub Pages CI/CD、版本与数据迁移说明
- [ ] 扩充并审核完整 200 题题库（当前 60 题已审核发布）

## 阶段 2 准入条件

首批题目不得仅因“蓝图完整”而发布。只有 Schema 校验、参考答案执行、边界测试、典型错误拦截、独立审题、lint、测试和构建全部通过，题目状态才能从 `review` 改为 `approved`。

公开页面只通过 `LocalQuestionProvider` 读取 `approved` 题目。Provider 会移除参考答案、隐藏测试、harness、选择题正确项和排序题正确顺序；输出预测等结构化题型的公开示例也不会携带答案。
