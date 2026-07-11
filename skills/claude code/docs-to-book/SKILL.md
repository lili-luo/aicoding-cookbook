---
name: docs-to-book
description: 把任意项目消化重构为一本结构化、带阅读路线的离线"网站书"，帮助接手者按认知逻辑快速吃透项目。输入可以是散乱文档（docs/ 里成堆的 markdown），也可以在文档缺失或过时时由 agent 探查代码库反推梳理；产出零依赖、双击即开的静态多页站点（侧边栏导航、上下页、全文搜索、深浅色、Mermaid 图）。只要用户想"把文档做成网站/做成书"、"文档太多太乱想重整"、"重构/结构化项目文档"、"接手项目想快速读懂"、"做个项目导览/知识库/文档站"、"项目没文档帮我从代码梳理"，即使没有明说要"网站"或"书"，都应使用本 skill。Also use when the user asks to turn project docs into a readable website or handbook, restructure messy documentation, build an onboarding guide for a codebase, or make sense of an undocumented project from its source code.
---

# Docs to Book —— 文档转网站书

把一个项目的文档（散落在 `docs/` 里的成堆 Markdown，或缺失文档时直接从代码反推），消化重构为**一本结构清晰、重新润色、带阅读路线的离线静态网站**。读者顺着读一遍，就能完整理解整个项目。

核心理念：**不是搬运文档，而是重新叙述项目**——让读者按人的认知逻辑走一遍，而不是按文件目录走。无论输入是文档还是代码，产出都是一本连贯的书。

## Quick Start

0. **判定文档完备度** → 决定走哪条路径（详见下方「前置判定」）：
   - **完备**：以 `docs/` 为主通读，代码仅核实漂移
   - **残缺/过时**：文档为线索 + 并行探查代码补全空白，交叉印证
   - **无文档**：完全以代码探查为核心，agent 从代码反推全书
1. **梳理**：按选定路径产出统一「全局笔记」（跨文档/跨模块整合 + 演进逻辑 + 漂移点）。量大用并行子代理分读
2. **归类**：按「七部分分类法」重排内容，设计全书骨架 → 写 `book.config.js`
3. **搭壳**：套 `templates/` 的构建脚本 + 设计系统，写 2-4 个标杆页定文风
4. **填内容**：并行委派子代理填充其余页，统一文风（见 references/voice-style.md）
5. **验证**：跑 `verify.js` + 真实浏览器渲染 Mermaid + 截图视觉终检

## 前置判定 · 文档完备度

做完 Step 0 的盘点后，按文档覆盖与新鲜度走三条路径之一。**代码永远是事实基线**，文档是线索：

| 文档状态 | 判定信号 | 路径 | 主要输入 |
|---|---|---|---|
| 完备 | `docs/` 覆盖架构/数据/运维、不过时 | 以文档为主通读 | `docs/` |
| 残缺/过时 | `docs/` 只覆盖局部，或大量「待办」、与代码明显不符 | 文档为线索 + 代码探查补全 | `docs/` + 代码 |
| 无文档 | 几乎无 `docs/`，只有零散 README/注释 | 完全代码探查，从代码反推全书 | 代码 |

残缺/过时与无文档两条路径都需要**探查代码库**，方法见 [codebase-survey.md](references/codebase-survey.md)。

---

## 渐进式披露（本 skill 的设计原则）

本 skill 按需加载。**SKILL.md 是路由入口**，只放方法论骨架与路由；具体规范在 `references/`，按当前步骤读取对应那份即可，不必全读。可复用产物在 `templates/`，直接复制改用。

### 当前步骤 → 读哪份 reference

| 你正在做的事 | 读取 |
|---|---|
| 文档残缺或无文档，要探查代码库梳理项目 | [references/codebase-survey.md](references/codebase-survey.md) |
| 通读完，要给内容分类、定全书骨架 | [references/classification.md](references/classification.md) |
| 要定全书语气/措辞/去 emoji/标点 | [references/voice-style.md](references/voice-style.md) |
| 要设计阅读路线（完整/速览/按角色） | [references/reading-path.md](references/reading-path.md) |
| 要验证质量、列漂移清单 | [references/quality-checks.md](references/quality-checks.md) |

### 需要的产物 → 用哪个 template

| 产物 | 模板 |
|---|---|
| 全书结构骨架（单一事实来源） | [templates/book.config.js](templates/book.config.js) |
| 静态站点生成器 | [templates/build.js](templates/build.js) |
| 设计系统（日式简约 CSS） | [templates/style.css](templates/style.css) |
| 客户端交互（搜索/主题/TOC 高亮/Mermaid/复制） | [templates/app.js](templates/app.js) |
| 内容片段的组件字典（callout/cards/steps/kv…） | [templates/content-example.html](templates/content-example.html) |
| 链接/Mermaid/HTML/资产 校验 | [templates/verify.js](templates/verify.js) |

**落地拷贝清单**（Phase 2 搭壳时照做）：`build.js`、`verify.js`、`book.config.js` 拷到输出目录根；`style.css`、`app.js` 拷到 `assets/`；`content-example.html` 不进站点，作为写内容片段时的组件用法参考（尤其：卡片内标题用 h4，h2/h3 会被抽进本页目录）。漏拷 `app.js` 或 `style.css` 会让页面裸奔——`verify.js` 会查，但别等它报。

---

## 核心方法论

### 七部分分类法

任何项目的文档，都能按「**认识 → 演进 → 方法论 → 实现 → 数据 → 运维 → 规范**」的认知曲线重新组织。这是本 skill 最重要的洞察——**不要沿用 `docs/` 的原始目录**，要按读者理解项目的自然顺序重排。详见 [classification.md](references/classification.md)。

### 重叙述，非搬运

- 规划体「将要做 X」→ 改写陈述体「系统是怎样的」
- 每页能独立读懂，不依赖读者读过别处
- 数字/表名/字段/命令/配置值：**逐字保留，绝不改写**
- 文档与代码不一致处：单列一页「漂移清单」，照应「以代码为准」

### 文风：沉静陈述体

去口语、去营销、去感叹、去 emoji。详见 [voice-style.md](references/voice-style.md)。

### 阅读路线

主线按七部分排，顺着读即可。另给「30 分钟速览」「按角色切入」两条辅线。详见 [reading-path.md](references/reading-path.md)。

---

## 站点形态

零依赖、双击即开的静态多页站：

- 左侧目录树 + 右侧本页小目录（TOC 滚动高亮）
- 上一页/下一页 + 全文搜索（`⌘K`）
- 深浅色切换 + Mermaid 架构/流程图
- 侧栏滚动位置跨页保持（跳转不回顶）

技术约束：纯 HTML/CSS/JS，无需服务器、无需 `node_modules`。一个 `build.js` 读 config + content 分页套壳生成，一个 `verify.js` 校验。

---

## 工作流（按阶段）

### Phase 0 · 盘点与梳理
```
1. 评估文档完备度：docs/ 是否存在、覆盖度、新鲜度（是否与代码明显不符）
2. 按完备度选路径，三条路径的子代理策略不同：
   - 完备：项目有 CLAUDE.md / README.md 等高质量总览文件 → 主 agent 直接读这些关键文件
     即可建立全局认知，不必等 Explore 代理（代理扫描 100+ 文档产出的摘要往往你读完
     关键文件后就用不上了）。如需核实具体细节，按需点读。
   - 残缺/过时：文档为线索 + 代码探查补全（见 codebase-survey.md 的 6 个角度）
   - 无文档：完全以代码探查为核心
3. 探查类代理只在「残缺/过时」和「无文档」两条路径派发，且只读扫描用轻量/只读型代理。
   完备路径下：量大的 docs/ 如需批量扫描 → 只在你有明确问题需要回答时才派，不要在
   「先读一遍」阶段无目标地全量扫描。
4. 主线汇总统一"全局笔记"：跨文档/跨模块整合、演进逻辑、文档-代码漂移点
   （文档与代码探查的笔记合并成一份，不区分来源）
```
> 无文档或残缺时，代码探查的 6 个切入角度：入口与启动 / 模块边界与依赖 / 数据流与状态 / 持久化与数据层 / 配置部署运维 / 外部集成与**职责边界**。详见 [codebase-survey.md](references/codebase-survey.md)。

### Phase 1 · 骨架
```
1. 按七部分分类法把内容归入各部分
2. 每部分拆成若干页(slug)，定标题与阅读顺序
3. 估算总页数：7 个固定页（封面/阅读指南/漂移清单/术语表/API参考/项目规范/快速开始）
   + 每部分至少 1 个总览页 + 每个核心模块/工作流约 1 页。
   小项目 ~15 页，中型项目 ~25 页，大型项目 ~35 页。心里有数再动笔。
4. 写 book.config.js：parts[] / pages[]{slug,title,part}，next-prev 自动算
```

### Phase 2 · 外壳
```
1. 写 style.css 设计系统(令牌→基础→排版→组件→响应式)
2. 写 build.js：读 config + content/{slug}.html，套统一外壳输出 pages/{slug}.html
   自动抽 TOC(h2/h3)、算上下页、生成搜索索引、注入侧栏滚动保持脚本
3. 跑一次测试构建，确认引擎通(页面占位无妨)
   - 若项目 `package.json` 设了 `"type": "module"`，`.js` 文件会被当成 ESM 导致
     `require()` 报错。此时将 `build.js`、`verify.js`、`book.config.js` 改扩展名为
     `.cjs`，并更新 `require` 路径。注意：`node --check` 只做语法检查、不会触发
     `require` 解析，**探测请直接跑** `node build.js`（或先 `node -e "require('./build.js')"`）。
```

### Phase 3 · 内容
```
1. 划分页面归属（防冲突，关键步骤）：
   - 主 agent 负责的页：封面、阅读指南、总览页（项目总览/架构总览）、漂移清单、
     术语表、API 参考——这些需要跨文档交叉引用、全局一致性要求高
   - 子代理负责的页：独立性强的模块/工作流描述页（如「CPI 工作流」「Fed 四件套」）、
     各 part 之下的独立主题页——页内闭环、不依赖其他页的内容
   - 文件落盘规则：由主 agent 统一 Write 所有 content/*.html。
     子代理不直接写文件，而是返回「slug + HTML 正文」文本，由主 agent 落盘。
     这能杜绝主 agent 和子代理同时写同一个文件导致的冲突。
2. 亲手写 2-4 个标杆页(封面/阅读指南/总览/漂移清单)，定组件用法与文风
3. 写一份 AUTHORING.md 内容撰写规范(共享给子代理)
4. 子代理规范（并行委派时）：
   - 只读探查用轻量/只读型代理；写内容用通用代理
   - 委派 prompt 里写死：子代理只返回「slug + HTML 正文」文本，不自己落盘文件
   - prompt 硬约束：只改散文措辞，绝不动数字/表名/字段/命令/mermaid/HTML 结构
5. 主 agent 收到子代理返回的内容后，抽查几页确认无事实错误，再统一 Write 落盘
6. 逐组验收，早退或超时的代理补做
7. **事实验证（关键，不可跳过）**：全部内容写完后、进入 Phase 4 前，主 agent 必须
   逐项核对以下高频遗漏模式（实测踩坑总结）：
   - **数字类事实**（端点数、阈值、计数）：grep 源码确认，不信任文档
   - **否定结论**（「无 X」「不存在 X」）：grep 源码搜索验证，常见反例：文档说
     「无通知」但代码有 webhook
   - **配置项**：在 config.py / Settings 类中确认存在，环境变量名 ≠ 有效配置
   - **代码片段**：逐行与源文件对齐，不从文档中抄过时版本
   - **执行路径描述**（如「支持 A/B 两种模式」）：检查 orchestrator / runner
     确认模式是否仍在运行时路径上
   详见 quality-checks.md「代码核对 checklist」。
8. **清理检查**：全部子代理完成后，确认输出目录外没有遗留的临时产物（如代理工具
   自动落盘的中间文件、未归入 `content/` 的 HTML 片段等）。`git status` 或 `ls`
   快速扫一遍项目根目录，发现多余文件立即清理。
```

### Phase 4 · 验证
```
1. 内容准确性抽查（重点）：verify.js 只查语法不查事实。对子代理写的页做抽查——
   至少抽 3-5 页，对照原始文档/CLAUDE.md，确认表名/端口/workflow名/命令/配置值
   未被代理在润色时误改。关键事实项见 quality-checks.md
2. **代码核对 checklist**（Phase 3 事实验证的二次确认）：
   - 每个数字（端点数、阈值、计数）→ grep 源码确认
   - 每个否定结论（「无 X」）→ grep 源码搜索验证
   - 每个配置项 → 在 config.py / Settings 类中确认存在
   - 每个代码片段 → 逐行与源文件对齐
   - 每个执行路径描述 → 检查 orchestrator / runner 确认
3. node verify.js：内部链接全有效、mermaid 语法、HTML 结构
4. 真实浏览器 headless 渲染所有 mermaid 图，确认 0 报错(光看源码不够)
5. 截图视觉终检：封面、最复杂页(含多图)、暗色模式
6. 重新构建确认齐全
```
详见 [quality-checks.md](references/quality-checks.md)。

---

## 关键约束（硬规则）

- **emoji**：装饰性 emoji 一律移除；callout 改 CSS 文字标签；几何/功能字符（✓ ★ ◐ ⌘）可留
- **标点**：CJK 相邻的半角 `,;` 转全角 `，；`，但保护 code/pre/mermaid 块不动
- **事实保真**：数字、阈值、表名、字段、workflow 名、命令、配置 = 逐字保留
- **漂移透明**：文档说一套代码做一套的，单列漂移清单页，提示「以代码为准」
- **离线可用**：Mermaid 等三方库落到 `assets/` 本地，不依赖 CDN。获取顺序：
  ① 项目 `node_modules/mermaid/dist/mermaid.min.js` 直接拷；② 有网时 `npm pack mermaid` 或从
  jsdelivr/unpkg 下载一次；③ 完全离线且拿不到 → 站点照常构建（build.js 会告警），
  在 README 与交付说明里明确"图需补库后可见"，不要沉默交付
- **子代理委派**：遵循所在环境的委派机制与命名规范；核心不变——子代理只返回结构化摘要与散文改写，不得改动事实

---

## 输出位置

站点写到项目内指定目录（如 `文档可视化/` 或 `docs-site/`）：

```
文档可视化/
├── index.html              ← 双击即开
├── pages/                  ← 生成的各页
├── assets/                 ← mermaid.min.js 等(离线)
├── build.js  verify.js     ← 可重新生成/校验
├── book.config.js          ← 全书结构(单一事实来源)
├── content/                ← 内容源(按 slug)
└── README.md               ← 维护说明
```

---

## 常见坑

| 坑 | 解法 |
|---|---|
| 沿用 docs/ 原始目录 | 按七部分重排，别按文件目录 |
| 全文搬 markdown 不润色 | 重叙述，规划体改陈述体 |
| 只拷 build.js 漏拷 app.js/style.css | 按「落地拷贝清单」全拷；verify.js 会兜底报缺 |
| 卡片/组件里用 h3 当小标题 | 组件内标题用 h4；h2/h3 会被抽进本页目录 |
| 子代理改了数字/表名 | Phase 4 加内容准确性抽查；委派 prompt 里写死「只改散文」 |
| 主 agent 与子代理同时写同一文件冲突 | Phase 3 第一步划分页面归属；子代理只返回文本、主 agent 统一落盘 |
| 完备路径下派 Explore 代理全量扫描、产出用不上 | 完备 + 有好的 CLAUDE.md 时主 agent 直接读关键文件，不派无目标的全量扫描 |
| Mermaid 含裸 `< >` 崩图 | 节点文字加引号，或用 `<br/>` 换行 |
| 改完不验证就交付 | verify.js + 内容抽查 + 真实渲染 + 截图四件套 |
| 多页站跳转后侧栏回顶 | 绘制前用内联脚本恢复 sessionStorage 滚动位置 |
| 项目无文档/文档过时 | 按完备度选路径，用 6 角度探查代码反推全书（见 codebase-survey.md） |
| 把注释/README 当事实 | 注释是线索，以可执行代码为准，冲突记入漂移清单 |
| 项目 package.json 设 `"type": "module"` 导致 `require()` 报错 | 若项目根目录的 `package.json` 含 `"type": "module"`，`.js` 文件被 Node.js 视为 ESM，模板中的 `require()` 会直接报 `ReferenceError`。解法：将 `build.js`、`verify.js`、`book.config.js` 改扩展名为 `.cjs`，并更新内部的 `require('./book.config.js')` → `require('./book.config.cjs')`。探测请直接跑 `node build.js`（`node --check` 只查语法，测不出 require 问题）。 |
| 信任文档中的数字/计数不验证 | 数字类事实（端点数、阈值、计数）必须 grep 源码确认，文档可能过时 |
| 文档说「无 X」就信了 | 否定结论必须 grep 源码搜索验证；实测案例：文档说「无通知」但代码有 webhook |
| 从文档抄代码片段 | 代码片段必须与源文件逐行对齐，文档中的版本可能已过时 |
| 环境变量名当作有效配置 | 配置项必须在 config.py / Settings 类中确认存在，环境变量名 ≠ 有效配置 |
