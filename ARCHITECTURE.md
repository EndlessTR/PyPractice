# PyPractice 技术架构

## 1. 架构原则

PyPractice 采用按功能边界组织的单页应用。UI、领域模型、数据访问和 Python 执行彼此解耦；阶段 1 只实现 UI 骨架和主题能力，同时为后续题库、持久化与执行沙箱保留清晰接口。

## 2. 技术栈

- Vite + React + TypeScript
- React Router + Tailwind CSS
- ESLint + Prettier
- Vitest + React Testing Library
- 当前：本地打包 Monaco Editor、Pyodide 314.0.2 + 模块 Web Worker；后续：IndexedDB 与完整判题系统

## 3. 当前目录职责

```text
src/
  components/layout/  应用级布局与导航
  components/ui/      无业务含义的基础 UI
  features/theme/     主题状态与持久化
  features/questions/ 本地题库 Provider、公开 DTO、筛选与输出比较规则
  features/editor/    按题目与版本隔离的本地草稿状态
  features/practice/  按题目版本隔离的会话状态与提交汇总
  features/learning/  收藏、错题、笔记、掌握度与派生进度
  repositories/       IndexedDB 连接、schema 版本与向前迁移
  components/editor/  懒加载 Monaco、工具栏、全屏与错误恢复
  features/runner/    Worker 客户端、强类型消息协议和运行状态
  components/runner/  标准输入、运行输出、取消与重启界面
  types/              冻结的题目、测试、章节和知识点类型
  data/               章节、知识点和待审核静态题库
  pages/              路由页面组合层
  test/               测试环境配置
scripts/
  validateQuestions.ts 题目结构、引用与题型约束的静态校验
docs/questions/       出题规范、30 题蓝图与独立审核报告
```

后续建议扩展：

```text
src/
  domain/             Question、Attempt 等领域类型与规则
  features/questions/ 题库浏览、筛选和详情
  features/practice/  练习会话、提交与反馈
  repositories/       题库和用户数据仓储接口/实现
  workers/            Pyodide 执行协议与 Worker
  data/               仅存放审核通过的静态题库
```

依赖方向为 `pages -> features -> domain/repositories`。页面不得直接操作 IndexedDB 或 Pyodide；Worker 不依赖 React。

## 4. 路由与部署

应用使用 `HashRouter`，避免 GitHub Pages 刷新子路由时返回 404；Vite `base` 仅负责静态资源路径。本地使用 `/`，GitHub Pages 构建使用 `/PyPractice/`。

## 5. 状态与数据边界

- 界面状态：组件本地状态或轻量 Context。
- 用户偏好：主题等小数据使用 `localStorage`。
- 题库：构建期 TypeScript 数据经静态校验；页面只能通过 `LocalQuestionProvider` 访问 `approved` 题目。
- 公开题目 DTO：移除 `solutionCode`、`hiddenTests`、`testHarnessCode`、`correctChoiceIds` 与 `correctCodeOrder`。输出预测、选择和排序题的示例答案也会脱敏。
- 学习记录：提交与练习会话通过 repository 持久化到 IndexedDB；受限环境写入失败时，提交记录降级到内存仓库，会话继续保留在当前页面内存中。
- 学习状态：收藏、掌握度和笔记通过响应式 Store 写入 repository；错题、完成进度和统计从正式提交及题目状态实时派生，不保存重复统计值。错题以每题最近一次提交是否通过为准，完成题目以至少一次通过为准。
- 数据库：当前 schema 为 v2。v1 建立提交和练习会话表；v2 增加题目状态、笔记、偏好和元数据表，升级时保留既有提交。
- 派生统计：从作答记录计算，不重复保存可推导数据。

数据库迁移必须保存 schema 版本；题目 ID 一经发布保持稳定，题目内容依靠 `version` 演进。

## 6. Python 执行边界

### 编辑器边界

Monaco 只在可编程练习题页面通过 `React.lazy` 加载，首页和题库页不加载编辑器代码。编辑器使用本地 ESM 与独立 Worker，不依赖 CDN；model URI 按题目 ID 隔离。草稿以 `questionId + questionVersion` 为键保存到 `localStorage`，切题、重置和延迟自动保存不得互相污染。运行与提交快捷键在 Pyodide 接入前只显示“尚未执行/判定”的明确提示。

Pyodide 必须运行在 Web Worker 中。主线程通过可序列化消息发送用户代码、测试、受保护的 harness 和虚拟文件；Worker 返回 stdout、stderr、结构化测试结果、耗时和错误类型。

当前运行阶段使用版本锁定的 Pyodide 314.0.2，并从同版本 CDN 加载运行时资源。每次运行默认最多 3 秒；超时、取消或并发替代会终止整个 Worker 并创建干净实例，因此不依赖 GitHub Pages 无法提供的跨源隔离头。stdin 按行提供给 `input()`，stdout/stderr 使用 raw 字符流精确捕获，二者合计超过 20,000 字符时截断。加载过程最多等待 30 秒，失败后清除 rejected Promise，允许重试。

Worker 会阻止常见网络相关模块，并清理已加载的受限模块引用；但浏览器内纯前端执行不是强安全边界，不能处理不受信任的高风险代码。

正式提交由 `features/judge` 负责编排：合并用户源码与 harness，按公开、未展示顺序串行执行，每个用例前重建 Worker，并传入独立 stdin 与虚拟文件。六种比较模式统一复用 `features/questions/compareOutput`，截断、运行错误、答案错误和判题配置错误分别建模。未展示用例不会向结果 DTO 返回输入、预期输出、实际输出、stderr 或原始异常文本。结构化输出、多选和代码排序不经过 stdout，而走各自的确定性判定路径。

“运行”只执行当前源码与用户输入，不产生提交记录；“提交”运行官方测试并通过 repository 写入 IndexedDB。练习会话按题目与版本隔离，统一汇总编程题和结构化题的提交次数、最近结果、累计判题耗时与完成状态，并可在刷新后恢复。IndexedDB 不可用或被拒绝时会自动降级为当前页面内存状态，不阻断运行和判题。

每次执行使用干净环境，设置超时与最大输出，禁止网络、宿主文件、子进程和任意包安装。隐藏测试和 harness 不进入可浏览的普通题面数据；纯前端部署无法提供强保密，只能减少直接暴露，因此不能将隐藏测试视为安全凭据。

`exact` 输出比较只把 CRLF/CR 统一为 LF，保留其他所有空白，包括 stdout 的终止换行。使用 `exact` 的 stdout 测试必须在 `expectedOutput` 中显式写出终止 `\n`；不考查末尾空白时使用 `lineTrimmed`。结构化答案不套用 stdout 终止换行约束。

## 7. 错误处理与测试

- 应用级 Error Boundary 处理渲染异常；路由层提供未知地址回退。
- UI 测试覆盖路由、主题、空状态与关键交互。
- 领域规则与比较器使用单元测试。
- repository 使用契约测试与迁移测试。
- Worker 使用集成测试覆盖超时、异常、输出限制、harness 和虚拟文件。
- 发布前增加端到端测试、可访问性扫描和构建产物校验。
