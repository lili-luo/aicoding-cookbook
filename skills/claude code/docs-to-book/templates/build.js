#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   build.js — 把 content/<slug>.html 片段编译成完整的多页静态站点
   用法：node build.js   （在输出目录下运行）
   依赖：book.config.js（全书结构）、content/<slug>.html（内容片段）
   产物：index.html + pages/*.html + assets/{style.css,app.js,search-index.js}
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');
const PAGES = path.join(ROOT, 'pages');
const ASSETS = path.join(ROOT, 'assets');
const book = require('./book.config.js');

// 首次运行时目录可能不存在，先建好（幂等）
[CONTENT, PAGES, ASSETS].forEach((d) => fs.mkdirSync(d, { recursive: true }));

// 展平所有页面，附带 part 信息与全局序号
const flat = [];
book.parts.forEach((part) => {
  part.pages.forEach((pg) => {
    flat.push({ ...pg, part, partLabel: part.label, partIcon: part.icon });
  });
});
flat.forEach((p, i) => {
  p.n = i;
  p.url = p.home ? 'index.html' : 'pages/' + p.slug + '.html';
});

// 计算从 fromUrl 到 toUrl 的相对路径
function rel(fromUrl, toUrl) {
  const fromDir = path.posix.dirname(fromUrl);
  let r = path.posix.relative(fromDir, toUrl);
  return r || path.posix.basename(toUrl);
}
// 资源前缀（home 在根，其余在 pages/）
function base(p) { return p.home ? '' : '../'; }

// 给正文 h2/h3 注入 id，并抽取 TOC
function processHeadings(html) {
  const toc = [];
  let n = 0;
  const out = html.replace(/<(h2|h3)(\s[^>]*)?>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
    attrs = attrs || '';
    let id;
    const idMatch = attrs.match(/id="([^"]+)"/);
    if (idMatch) { id = idMatch[1]; }
    else { id = 's' + (++n); attrs += ` id="${id}"`; }
    const text = inner.replace(/<[^>]+>/g, '').trim();
    toc.push({ level: tag === 'h2' ? 2 : 3, id, text });
    return `<${tag}${attrs}><a class="anchor" href="#${id}" aria-hidden="true"></a>${inner}</${tag}>`;
  });
  return { html: out, toc };
}

// 提取纯文本用于搜索
function plain(html) {
  return html.replace(/<(script|style|pre)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2400);
}

// ── 侧边栏 HTML ──────────────────────────────────────────────────
function sidebar(curr) {
  const b = base(curr);
  let html = `<div class="brand"><a href="${b}index.html">
    <span class="logo"><span class="mark">LOGO</span>${book.title}</span>
    <span class="sub">${book.subtitle} · ${book.tagline}</span>
  </a></div><nav class="nav">`;
  book.parts.forEach((part) => {
    html += `<div class="part"><div class="part-label"><span class="pn">${part.icon}</span>${part.label}</div>`;
    part.pages.forEach((pg) => {
      const target = flat.find((f) => f.slug === pg.slug);
      const href = rel(curr.url, target.url);
      const active = pg.slug === curr.slug ? ' class="active"' : '';
      const idx = (target.n).toString().padStart(2, '0');
      html += `<a href="${href}"${active}><span class="idx">${idx}</span><span>${pg.title}</span></a>`;
    });
    html += `</div>`;
  });
  html += `</nav>`;
  // 奥付：书末的出版信息栏，放版本与源仓库，安静收笔
  const colophon = [book.version, book.repo].filter(Boolean).join(' · ');
  if (colophon) html += `<div class="colophon">${colophon}</div>`;
  return html;
}

// ── TOC HTML ──────────────────────────────────────────────────────
function tocHtml(toc) {
  if (toc.length < 2) return '';
  let items = toc.map((t) =>
    `<li class="h${t.level}"><a href="#${t.id}">${t.text}</a></li>`).join('');
  return `<aside class="toc"><div class="toc-title">本页目录</div><ul>${items}</ul></aside>`;
}

// ── 页眉 ──────────────────────────────────────────────────────────
function pageHead(p) {
  const srcLine = p.src && p.src.length
    ? `<span class="src" title="原始文档来源">源自 ${p.src.join(' · ')}</span>` : '';
  const tag = p.partIcon === '◆'
    ? `<span class="part-tag">${p.partLabel}</span>`
    : `<span class="part-tag"><span class="pn">${p.partIcon}</span> ${p.partLabel}</span>`;
  return `<header class="page-head">
    ${tag}
    <h1>${p.title}</h1>
    <p class="lead">${p.lead}</p>
    <div class="meta">
      <span><span class="lbl">阅读约</span> ${p.time} 分钟</span>
      <span><span class="lbl">第</span> ${p.n + 1} / ${flat.length} 篇</span>
      ${srcLine}
    </div>
  </header>`;
}

// ── 上下页 ────────────────────────────────────────────────────────
function pager(p) {
  const prev = p.n > 0 ? flat[p.n - 1] : null;
  const next = p.n < flat.length - 1 ? flat[p.n + 1] : null;
  const prevA = prev
    ? `<a class="prev" href="${rel(p.url, prev.url)}"><span class="dir">← 上一篇</span><span class="ttl">${prev.title}</span></a>`
    : `<a class="prev disabled"></a>`;
  const nextA = next
    ? `<a class="next" href="${rel(p.url, next.url)}"><span class="dir">下一篇 →</span><span class="ttl">${next.title}</span></a>`
    : `<a class="next disabled"></a>`;
  return `<nav class="pager">${prevA}${nextA}</nav>`;
}

// ── 面包屑 ────────────────────────────────────────────────────────
function crumbs(p) {
  return `<b>${p.partLabel}</b> &nbsp;/&nbsp; ${p.title}`;
}

// ── 完整 HTML 外壳 ────────────────────────────────────────────────
function shell(p, bodyHtml, toc) {
  const b = base(p);
  const indexHref = p.home ? 'index.html' : '../index.html';
  const needMermaid = /class="mermaid"/.test(bodyHtml);
  const mermaidTag = needMermaid
    ? `<script src="${b}assets/mermaid.min.js"></script>`
    : '';
  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title} · ${book.title}</title>
<meta name="description" content="${(p.lead || '').replace(/"/g, '')}">
<link rel="stylesheet" href="${b}assets/style.css">
<script>window.__BASE__='${b}';</script>
</head>
<body>
<div class="scrim"></div>
<div class="layout">
  <aside class="sidebar">${sidebar(p)}</aside>
  <script>
  /* 绘制前恢复侧栏滚动位置：避免跳转后侧栏回到顶部（见 quality-checks.md）*/
  (function(){try{
    var sb=document.querySelector('.sidebar');if(!sb)return;
    var saved=sessionStorage.getItem('docsbook-nav-scroll');
    var act=sb.querySelector('.nav a.active');
    function inView(){if(!act)return true;var r=act.getBoundingClientRect(),s=sb.getBoundingClientRect();
      return r.top>=s.top&&r.bottom<=s.bottom;}
    function center(){if(!act)return;var r=act.getBoundingClientRect(),s=sb.getBoundingClientRect();
      sb.scrollTop+=(r.top-s.top)-(sb.clientHeight/2)+(r.height/2);}
    if(saved!==null){sb.scrollTop=parseInt(saved,10)||0;if(!inView())center();}
    else if(act&&!inView())center();
  }catch(e){}})();
  </script>
  <div class="main">
    <header class="topbar">
      <button class="icon-btn menu-btn" id="menuBtn" aria-label="菜单">≡</button>
      <div class="crumbs">${crumbs(p)}</div>
      <button class="search-trigger" data-search-open>
        <span>搜索手册</span><span class="k">⌘K</span>
      </button>
      <button class="icon-btn" id="themeBtn" aria-label="切换主题" title="切换深浅色 (t)">◐</button>
      <div class="progress" aria-hidden="true"><i id="progressBar"></i></div>
    </header>
    <div class="content-wrap">
      <article class="article fade">
        ${bodyHtml}
        ${pager(p)}
      </article>
      ${toc}
    </div>
  </div>
</div>

<div class="search-mask"></div>
<div class="search-box">
  <input id="searchInput" type="text" placeholder="搜索页面、概念、术语…" autocomplete="off" spellcheck="false">
  <div class="search-results"></div>
  <div class="search-hint"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>↵</kbd> 打开</span><span><kbd>esc</kbd> 关闭</span></div>
</div>

<script src="${b}assets/search-index.js"></script>
${mermaidTag}
<script src="${b}assets/app.js"></script>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════════════════
//  主构建流程
// ══════════════════════════════════════════════════════════════════
const searchIndex = [];
let built = 0, missing = [];

flat.forEach((p) => {
  const fragPath = path.join(CONTENT, p.slug + '.html');
  let frag;
  if (fs.existsSync(fragPath)) {
    frag = fs.readFileSync(fragPath, 'utf8');
  } else {
    missing.push(p.slug);
    frag = `<div class="callout warn"><div class="body">
      <strong>本页内容正在撰写</strong>本页（<code>${p.slug}</code>）的内容片段尚未生成。</div></div>
      <p>${p.lead}</p>`;
  }

  // ── 内容格式自检：扫描疑似 Markdown 语法 ─────────────────────
  // content/*.html 应为纯 HTML 片段（build.js 不做 Markdown→HTML 转换）。
  // 以下模式若出现在最终页面中将显示为裸文本，在此提前告警。
  const mdWarnings = [];
  const fragLines = frag.split('\n');
  fragLines.forEach((line, i) => {
    const ln = i + 1;
    if (/^## /.test(line)) mdWarnings.push(`  L${ln}: Markdown h2 "## …" → 应改为 <h2>…</h2>`);
    if (/^### /.test(line)) mdWarnings.push(`  L${ln}: Markdown h3 "### …" → 应改为 <h3>…</h3>`);
    if (/^\|.*\|.*\|/.test(line) && !/<(thead|tbody|tr|th|td)/i.test(line))
      mdWarnings.push(`  L${ln}: Markdown 表格 "|…|" → 应改为 <table> 标签`);
    if (/^- /.test(line) && !/<li>/i.test(line))
      mdWarnings.push(`  L${ln}: Markdown 列表 "- …" → 应改为 <ul><li>…</li></ul>`);
  });
  if (mdWarnings.length) {
    console.warn(`\n⚠ ${p.slug}.html 疑似含 Markdown 语法（将原样显示为裸文本）：`);
    mdWarnings.forEach(w => console.warn(w));
  }

  const { html: withIds, toc } = processHeadings(frag);
  const head = p.home ? '' : pageHead(p);   // 封面页用自带 hero，不套页眉
  const fullBody = (head ? head + '\n' : '') + withIds;
  const outHtml = shell(p, fullBody, tocHtml(toc));

  const outPath = p.home ? path.join(ROOT, 'index.html') : path.join(PAGES, p.slug + '.html');
  fs.writeFileSync(outPath, outHtml, 'utf8');
  built++;

  searchIndex.push({
    url: p.url, title: p.title, part: p.partLabel,
    lead: p.lead || '', text: plain(frag),
  });
});

// 写搜索索引
fs.writeFileSync(
  path.join(ROOT, 'assets', 'search-index.js'),
  'window.__SEARCH_INDEX__=' + JSON.stringify(searchIndex) + ';',
  'utf8'
);

console.log(`✓ 构建完成：${built} 页`);
if (missing.length) console.log(`⚠ 缺内容片段（占位）：${missing.length} 页 → ${missing.join(', ')}`);
else console.log('✓ 全部页面内容齐全');

// 离线依赖自检：有页面用了 mermaid，但本地库没拷进 assets/ → 图会静默不渲染
const anyMermaid = flat.some((p) => {
  const f = path.join(CONTENT, p.slug + '.html');
  return fs.existsSync(f) && /class="mermaid"/.test(fs.readFileSync(f, 'utf8'));
});
if (anyMermaid && !fs.existsSync(path.join(ASSETS, 'mermaid.min.js')))
  console.log('⚠ 检测到 mermaid 图，但 assets/mermaid.min.js 不存在。'
    + '获取方式见 skill 的「关键约束 · 离线可用」；缺失时图将不渲染。');
['style.css', 'app.js'].forEach((f) => {
  if (!fs.existsSync(path.join(ASSETS, f)))
    console.log(`⚠ assets/${f} 不存在 —— 页面会裸奔（无样式/无交互）。请从 skill 的 templates/ 拷入。`);
});
