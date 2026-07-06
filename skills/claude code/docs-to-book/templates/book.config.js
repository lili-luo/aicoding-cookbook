// ── 全书结构 + 阅读顺序的唯一事实来源 ──────────────────────────────
// 用法：改这个文件定义你的「书」的结构；build.js 据此生成侧边栏、上下页、搜索索引。
// parts 的顺序 = 推荐通读顺序（也是侧边栏从上到下的顺序）。
// 每页内容片段位于 content/<slug>.html，由 build.js 套进统一外壳。
//
// 这是模板：把下面的占位内容换成你的项目。
module.exports = {
  title: '项目名',
  subtitle: '项目全景手册',
  tagline: '一句话副标题',
  repo: 'repo-name',
  version: '手册 v1.0',
  parts: [
    {
      id: 'p0', label: '起点', icon: '◆',
      desc: '先到这里，拿到全局视角与阅读路线。',
      pages: [
        // home: true 的页生成在根 index.html，用自带 hero，不套页眉
        { slug: 'index', title: '封面与导读', home: true, time: 5,
          lead: '一句话认识项目，看清这本手册怎么读。' },
        { slug: 'reading-guide', title: '阅读顺序指南', time: 10,
          lead: '三条阅读路线：速览、完整通读、按角色切入。' },
      ],
    },
    {
      id: 'p1', label: '第一部分 · 认识项目', icon: '01',
      desc: '它是什么、为谁服务、边界在哪里。',
      pages: [
        // src: 标注原始文档来源，会显示在页眉（可省略）
        { slug: 'overview', title: '项目总览', time: 10,
          lead: '定位、核心理念，在更大系统中的位置。',
          src: ['README.md', 'CLAUDE.md'] },
        { slug: 'architecture', title: '系统架构总览', time: 14,
          lead: '分层架构、技术栈，一条数据如何流经整个系统。',
          src: ['docs/arch/'] },
        { slug: 'boundaries', title: '职责边界与生态', time: 8,
          lead: '各模块如何分工，不可逾越的职责铁律。',
          src: ['docs/arch/'] },
      ],
    },
    {
      id: 'p2', label: '第二部分 · 演进历程', icon: '02',
      desc: '理解今天的架构，先看清它从哪里来。',
      pages: [
        { slug: 'evolution', title: '架构演进主线', time: 12,
          lead: '关键决策点，每个阶段解决了什么问题。',
          src: ['docs/'] },
        { slug: 'pipeline', title: '核心编排范式', time: 10,
          lead: '系统统一的工作方式。',
          src: ['docs/'] },
      ],
    },
    {
      id: 'p3', label: '第三部分 · 方法论', icon: '03',
      desc: '平台背后的思维模型。',
      pages: [
        { slug: 'methodology', title: '核心方法论', time: 12,
          lead: '一套标准化的处理流程。',
          src: ['docs/prd/'] },
        { slug: 'classification', title: '分类体系与阈值', time: 8,
          lead: '领域对象的分类与判断标准。',
          src: ['docs/'] },
        { slug: 'glossary', title: '术语表', time: 6,
          lead: '高频专有名词的准确定义。',
          src: ['docs/'] },
      ],
    },
    {
      id: 'p4', label: '第四部分 · 核心实现', icon: '04',
      desc: '逐个拆解系统的主要能力。',
      pages: [
        { slug: 'capabilities-overview', title: '能力总览', time: 8,
          lead: '一张表看清所有核心能力。',
          src: ['docs/'] },
        // 为每个核心能力建一页，slug 用功能名
        { slug: 'capability-a', title: '能力 A 详解', time: 12,
          lead: '触发、流程、输入输出、关键决策。',
          src: ['docs/'] },
      ],
    },
    {
      id: 'p5', label: '第五部分 · 数据与集成', icon: '05',
      desc: '数据从哪来、存哪去、和谁对接。',
      pages: [
        { slug: 'data', title: '数据全景', time: 10,
          lead: '所有数据源与存储的清单与职责。',
          src: ['docs/'] },
        { slug: 'integration', title: '外部集成', time: 8,
          lead: '与上下游系统的对接方式。',
          src: ['docs/'] },
      ],
    },
    {
      id: 'p6', label: '第六部分 · 部署与运维', icon: '06',
      desc: '怎么把它跑起来、跑稳。',
      pages: [
        { slug: 'quickstart', title: '快速开始', time: 10,
          lead: '本地起一套的最短路径。',
          src: ['README.md', 'deploy/'] },
        { slug: 'ops', title: '运维与故障排查', time: 10,
          lead: '日常运维要点与常见坑。',
          src: ['deploy/'] },
      ],
    },
    {
      id: 'p7', label: '第七部分 · 参考与规范', icon: '07',
      desc: '规范、约定、避坑指南。',
      pages: [
        { slug: 'rules', title: '项目规范', time: 8,
          lead: '开发与文档约定。',
          src: ['docs/PROJECT_RULES.md'] },
        { slug: 'drift', title: '漂移清单', time: 8,
          lead: '文档与代码不一致的地方，接手必读。',
          src: ['代码与文档交叉核对'] },
      ],
    },
  ],
};
