# 质量校验

「改完不验证就交付」是最大的坑。本 skill 的验证分三层：脚本校验 → 真实渲染 → 视觉终检。三层都过才算完成。

## 一、脚本校验（verify.js）

跑 `node verify.js`，检查：

1. **页面齐全**：`book.config.js` 里声明的每个 slug，在 `pages/` 都有对应 html
2. **内部链接全有效**：所有 `href="...html"` 都指向存在的页面，无死链
3. **Mermaid 无语法崩点**：mermaid 块内无裸 `< >`（会被当标签解析）、节点文字含括号时建议加引号
4. **HTML 结构完整**：callout 有 body、页面有 main、标题层级合理
5. **无残留 emoji**：扫描装饰性 emoji

校验脚本要点：

```js
// 链接校验：收集所有 *.html href，检查目标存在
// mermaid 校验：正则提取 ```mermaid 块，检查裸 < >（<br/> 除外）
// 结构校验：每个 callout 必须有 .body 或直接子内容
```

> Mermaid 的误报要会甄别：`<br/>` 是合法换行（loose 模式支持），`[(...)]` 是数据库圆柱体形状——这些不是错。真正的崩点是节点文字里**未加引号的裸 `<` 或 `>`**。

## 一·五、内容准确性抽查（verify.js 做不到的事）

**verify.js 只管结构和语法，不管事实。** 子代理在润色散文时可能误改表名、端口号、workflow 名或命令。这个检查必须人工做（或由主 agent 做）。

### 为什么需要这一步

实测中发现：6 个并行撰写代理产出的页面，verify.js 全部通过（链接对、mermaid 语法对、HTML 结构对），但内容可能把 `DORIS_PM_*` 端口写错、把 workflow 名记混、把 dead table 警告漏掉。这些错误 verify.js 完全看不见——它不检查「这个端口号是否正确」。

### 抽查方法

在 build 之前，从子代理产出的页面中随机抽 3-5 页，重点核对以下事实项：

| 核对项 | 检查方法 | 典型错误 |
|---|---|---|
| 表名 | 对照原始文档/CLAUDE.md | `trade_signals` 误写为 `trade_signal` |
| 端口号 | 对照 .env / CLAUDE.md | 9030 误写为 13218 |
| Workflow 名 | 对照 definitions.ts / CLAUDE.md | `cpiSignalWorkflow` 大小写错误 |
| 命令/配置值 | 对照原始文档 | `docker compose build` 漏了 service 名 |
| 关键数字 | **grep 源码确认**，不信任文档 | 端点数、阈值、计数等数字与代码不符 |
| Dead table 警告 | 确认危险标注在 | PM 市场库 13218 死表警告是否保留 |
| 否定结论（「无 X」） | **grep 源码搜索验证** | 文档说「无通知」但代码有 webhook |
| 配置项有效性 | **在 config.py / Settings 类中确认** | 环境变量名 ≠ 有效配置（死变量） |
| 代码片段 | **逐行与源文件对齐** | 文档中的代码片段缺少新参数 |
| 执行路径描述 | **检查 orchestrator / runner** | 文档说「支持 A/B 模式」但 B 已从运行时移除 |

### 如果发现事实错误

直接在 content 源文件中修正，然后 rebuild。不要只改 pages/ 下的生成文件——下次 rebuild 会被覆盖。

## 二、真实浏览器渲染（Mermaid 必做）

**光看源码无法证明 Mermaid 图不崩。** 必须用真实浏览器 headless 渲染每张图，确认生成 `<svg>` 且 console 0 报错。

方法（headless 浏览器，按平台选可用的一个）：

```bash
# macOS（注意：macOS 无 timeout 命令，别用它包裹，会静默失败）
BROWSER="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# Linux（任一存在即可）
BROWSER=$(command -v google-chrome || command -v chromium || command -v chromium-browser)

"$BROWSER" --headless --disable-gpu --no-sandbox \
  --virtual-time-budget=8000 \
  --run-all-compositor-stages-before-draw \
  --dump-dom "file://$(pwd)/pages/some-page.html" > dump.html 2>err.txt

# 检查：dump.html 里每张 mermaid 图是否生成了 <svg>，err.txt 是否有报错
```

**环境没有任何浏览器时的降级**：跑不了真实渲染就不要假装验证过——照常完成
verify.js 静态校验与人工抽查源码，然后在交付说明里明确列出「未做真实渲染验证，
Mermaid 图请在浏览器打开后确认」。降级要透明，沉默交付是最差的选择。

注意：
- macOS 没有 `timeout` 命令，用它会让整个命令静默失败（exit 127）
- `--virtual-time-budget` 等待 Mermaid 异步渲染完成
- 中文路径在 `file://` URL 下可能出问题，必要时拷到纯英文临时目录渲染

批量渲染所有含 mermaid 的页，逐张确认 `<svg>` 生成、0 console error。

## 三、视觉终检（截图必做）

用 Chrome headless 截图，肉眼确认排版与配色：

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu \
  --window-size=1440,2400 \
  --screenshot="shot.png" \
  "file://$(pwd)/pages/some-page.html"
```

必截的三类页：

| 截哪页 | 看什么 |
|---|---|
| 封面/首页 | hero、配色、字体、卡片网格 |
| 最复杂页（含多张 mermaid + 表格 + callout） | 图渲染、表格细线、callout 标签、整体密度 |
| 暗色模式 | 深色背景、图自适应、对比度 |

暗色模式截图：临时改 `<html>` 加 `.dark` class，或用脚本注入主题后截。

## 四、漂移清单（特殊交付物）

通读全程时交叉核对，把「文档说一套、代码做一套」的不一致单列成**一页**，这是接手者最需要的避坑指南。每条记：

- 文档怎么说的
- 代码/现状实际是怎样的
- 以哪个为准
- 出处（哪个文档 / 哪段代码）

典型漂移点：
- 数据库地址 / 端口多处不一致
- 状态标记失真（标「已完成」但文末「0/N stories」）
- Kafka topic / 配置 key 文档与代码不符
- 已废弃的旧方案仍被引用

漂移清单放在「七·参考规范」部分，并在阅读指南里点名提醒「接手必读」。

## 验证完成的标准

四项全过才交付：

- [ ] **内容准确性抽查**：抽 3-5 页子代理产出的页面，核对事实项（表名/端口/命令/workflow 名）未被误改
- [ ] `node verify.js` 0 错误（页面齐全 / 链接有效 / 结构完整 / 无 emoji）
- [ ] 真实浏览器渲染所有 mermaid 图，0 报错，全部生成 svg
- [ ] 截图视觉终检：封面 + 最复杂页 + 暗色模式
- [ ] 漂移清单页已写，并已在阅读指南中点名

## 反模式

- ❌ 只跑 verify.js 就交付（Mermaid 源码看着对，渲染可能崩）
- ❌ 用 `timeout` 包 Chrome（macOS 无此命令，静默失败还以为通过了）
- ❌ 中文路径直接喂 `file://`（URL 编码问题导致加载失败）
- ❌ 不写漂移清单（接手者踩坑你背锅）
