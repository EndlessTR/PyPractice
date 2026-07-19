# PyPractice

PyPractice 是一个面向 Python 学习者的渐进式练习 Web 应用，目标是通过章节学习、题目练习、错题、收藏、笔记和进度统计，形成可持续的学习闭环。

## 可用性与离线

生产构建会注册 Service Worker。首次联网访问后，应用壳与已获取的静态资源会缓存，以便在断网时重新打开；Python 运行环境（Pyodide）第一次下载仍需要网络。若页面显示离线提示，恢复网络后刷新即可继续获取新资源。

GitHub Pages 自动发布工作流位于 `.github/workflows/deploy-pages.yml`。在仓库 **Settings → Pages** 中将发布来源设为 **GitHub Actions**，推送到 `main` 后即可发布。

学习数据仅保存在当前浏览器的 IndexedDB 中，不会上传服务器；清除浏览器站点数据会删除这些记录。数据库升级会自动从旧结构迁移到当前 v2，并保留既有提交记录；若升级提示被旧页面阻塞，请关闭其他 PyPractice 标签页后重试。

## 性能预算

`npm run check:performance` 检查生产构建首屏加载的 JavaScript 不超过 450 KiB、CSS 不超过 45 KiB。Monaco 编辑器保持按需加载，因此不计入首屏预算；该检查也会在 Pages 发布前执行。

当前仓库已完成前端骨架、60 道审核题目、Monaco 代码编辑器、Pyodide Web Worker 运行器和本地正式判题。用户可以运行自定义输入，也可以提交代码依次执行公开与未展示测试；输出预测、多选和代码排序题具有独立作答控件。题目页会按题目版本汇总当前会话，并支持收藏、掌握度自评和笔记；提交、会话及学习状态通过带版本迁移的 IndexedDB repository 保存，错题本、收藏夹、章节进度和学习统计均由真实记录生成。

## 本地运行

```bash
npm install
npm run dev
```

质量检查：

```bash
npm run lint
npm test
npm run build
```

GitHub Pages 构建使用 `/PyPractice/` 作为 Vite `base`，本地开发使用 `/`。应用采用哈希路由，刷新子页面不会依赖服务器端 SPA 回退。

## 技术栈

- Vite、React、TypeScript、React Router
- Tailwind CSS
- ESLint、Prettier
- Vitest、React Testing Library

- Monaco Editor 0.55.1（本地懒加载）
- Pyodide 314.0.2（模块 Web Worker）
- 当前题库：60 道已审核题目
- 已接入：正式提交判题、六种输出比较器、结构化作答、会话状态、repository、IndexedDB v2、收藏、错题、笔记、掌握度和基础进度统计
- 尚未接入：每日练习、成就系统和服务端保密判题

## 文档导航

- [产品需求](./PRD.md)
- [技术架构](./ARCHITECTURE.md)
- [数据模型](./DATA_MODEL.md)
- [实施路线图](./TASKS.md)
- [题目编写规范](./docs/questions/QUESTION_AUTHORING_GUIDE.md)
- [首批 30 题蓝图](./docs/questions/SEED_QUESTIONS_DRAFT.md)
- [独立审题报告](./docs/questions/QUESTION_REVIEW.md)
- [60 题扩充审核报告](./docs/questions/STAGE4_EXPANSION_REVIEW.md)
