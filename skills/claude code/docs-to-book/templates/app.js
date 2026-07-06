/* ══════════════════════════════════════════════════════════════════
   docs-to-book · 客户端交互（模板：随站点拷入 assets/）
   主题切换 / 移动端抽屉 / 全文搜索 / TOC 滚动高亮 / Mermaid / 快捷键
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── 主题 ───────────────────────────────────────────────────────
  var root = document.documentElement;
  var saved = localStorage.getItem('docsbook-theme');
  if (saved) root.setAttribute('data-theme', saved);
  else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)
    root.setAttribute('data-theme', 'dark');

  function toggleTheme() {
    var now = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', now);
    localStorage.setItem('docsbook-theme', now);
    if (window.__renderMermaid) window.__renderMermaid();
  }
  var tbtn = document.getElementById('themeBtn');
  if (tbtn) tbtn.addEventListener('click', toggleTheme);

  // ── 移动端侧栏 ─────────────────────────────────────────────────
  var sidebar = document.querySelector('.sidebar');
  var scrim = document.querySelector('.scrim');
  var menuBtn = document.getElementById('menuBtn');
  function openNav(v) {
    if (!sidebar) return;
    sidebar.classList.toggle('open', v);
    if (scrim) scrim.classList.toggle('open', v);
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { openNav(!sidebar.classList.contains('open')); });
  if (scrim) scrim.addEventListener('click', function () { openNav(false); });

  // ── 侧栏滚动位置：跨页面保持（跳转后不回到顶部）──────────────────
  if (sidebar) {
    var saveNavScroll = function () {
      try { sessionStorage.setItem('docsbook-nav-scroll', String(sidebar.scrollTop)); } catch (e) {}
    };
    // 点击导航链接、卸载前都记一次，覆盖各种跳转路径
    [].forEach.call(sidebar.querySelectorAll('.nav a'), function (a) {
      a.addEventListener('click', saveNavScroll);
    });
    window.addEventListener('pagehide', saveNavScroll);
    window.addEventListener('beforeunload', saveNavScroll);
  }

  // ── 阅读进度丝线（topbar 下缘的一根细线，随滚动伸展）────────────
  var progressBar = document.getElementById('progressBar');
  if (progressBar) {
    var ticking = false;
    var updateProgress = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      progressBar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();
  }

  // ── TOC 滚动高亮 ───────────────────────────────────────────────
  var headings = [].slice.call(document.querySelectorAll('.article h2[id], .article h3[id]'));
  var tocLinks = {};
  [].forEach.call(document.querySelectorAll('.toc a'), function (a) {
    var id = a.getAttribute('href').replace('#', '');
    tocLinks[id] = a;
  });
  if (headings.length && Object.keys(tocLinks).length) {
    var spy = function () {
      var top = window.scrollY + 96;
      var cur = headings[0];
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].offsetTop <= top) cur = headings[i];
      }
      Object.keys(tocLinks).forEach(function (k) { tocLinks[k].classList.remove('active'); });
      if (cur && tocLinks[cur.id]) tocLinks[cur.id].classList.add('active');
    };
    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  // ── 全文搜索 ───────────────────────────────────────────────────
  var mask = document.querySelector('.search-mask');
  var box = document.querySelector('.search-box');
  var input = document.getElementById('searchInput');
  var results = document.querySelector('.search-results');
  var triggers = [].slice.call(document.querySelectorAll('[data-search-open]'));
  var INDEX = window.__SEARCH_INDEX__ || [];
  var BASE = window.__BASE__ || '';
  var sel = -1, cur = [];

  function openSearch(v) {
    if (!box) return;
    mask.classList.toggle('open', v);
    box.classList.toggle('open', v);
    if (v) { input.value = ''; input.focus(); render(''); }
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hl(text, q) {
    if (!q) return esc(text.slice(0, 120));
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text.slice(0, 120));
    var start = Math.max(0, i - 30);
    var snip = (start > 0 ? '…' : '') + text.slice(start, i + q.length + 70);
    return esc(snip).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'),
      '<mark>$1</mark>');
  }
  function render(q) {
    q = q.trim();
    sel = -1;
    if (!q) {
      cur = INDEX.slice(0, 8);
      results.innerHTML = cur.map(function (r) {
        return '<a href="' + BASE + r.url + '"><div class="r-part">' + esc(r.part) +
          '</div><div class="r-ttl">' + esc(r.title) + '</div><div class="r-txt">' + esc(r.lead || '') + '</div></a>';
      }).join('');
      return;
    }
    var ql = q.toLowerCase();
    cur = INDEX.map(function (r) {
      var score = 0;
      if (r.title.toLowerCase().indexOf(ql) >= 0) score += 10;
      if ((r.lead || '').toLowerCase().indexOf(ql) >= 0) score += 4;
      var ti = r.text.toLowerCase().indexOf(ql);
      if (ti >= 0) score += 2;
      return { r: r, score: score, ti: ti };
    }).filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 12);
    if (!cur.length) { results.innerHTML = '<div class="search-empty">没有找到「' + esc(q) + '」相关内容</div>'; return; }
    results.innerHTML = cur.map(function (x) {
      var r = x.r;
      var snippet = x.ti >= 0 ? hl(r.text, q) : esc(r.lead || '');
      return '<a href="' + BASE + r.url + '"><div class="r-part">' + esc(r.part) +
        '</div><div class="r-ttl">' + esc(r.title) + '</div><div class="r-txt">' + snippet + '</div></a>';
    }).join('');
    cur = cur.map(function (x) { return x.r; });
  }
  function move(d) {
    var links = results.querySelectorAll('a');
    if (!links.length) return;
    sel = (sel + d + links.length) % links.length;
    [].forEach.call(links, function (l, i) { l.classList.toggle('sel', i === sel); });
    links[sel].scrollIntoView({ block: 'nearest' });
  }
  if (input) {
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        var links = results.querySelectorAll('a');
        if (links[sel < 0 ? 0 : sel]) location.href = links[sel < 0 ? 0 : sel].href;
      }
    });
  }
  triggers.forEach(function (t) { t.addEventListener('click', function () { openSearch(true); }); });
  if (mask) mask.addEventListener('click', function () { openSearch(false); });

  // ── 快捷键：⌘K / 搜索，[ ] 翻页，t 主题 ──────────────────────
  document.addEventListener('keydown', function (e) {
    var typing = /input|textarea/i.test((e.target.tagName || ''));
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(true); return; }
    if (e.key === 'Escape') { openSearch(false); openNav(false); return; }
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); openSearch(true); }
    else if (e.key === '[') { var p = document.querySelector('.pager a.prev:not(.disabled)'); if (p) location.href = p.href; }
    else if (e.key === ']') { var n = document.querySelector('.pager a.next:not(.disabled)'); if (n) location.href = n.href; }
    else if (e.key.toLowerCase() === 't') { toggleTheme(); }
  });

  // ── Mermaid 渲染 ───────────────────────────────────────────────
  window.__renderMermaid = function () {
    if (!window.mermaid) return;
    var blocks = [].slice.call(document.querySelectorAll('.mermaid'));
    if (!blocks.length) return;
    var dark = root.getAttribute('data-theme') === 'dark';
    blocks.forEach(function (b) { if (b.dataset.src) b.innerHTML = b.dataset.src; b.removeAttribute('data-processed'); });
    // 与设计系统对齐的低饱和纸感配色（浅/深两套）
    var pal = dark ? {
      bg: '#201e1a', surface: '#262320', ink: '#e2ded4', soft: '#aca89d',
      line: '#3a362e', accent: '#9fb2bf', accentBg: '#232a2e', clay: '#c3a276'
    } : {
      bg: '#faf9f5', surface: '#f0ede5', ink: '#2c2a26', soft: '#595650',
      line: '#d8d3c7', accent: '#4a5d6b', accentBg: '#eaeef0', clay: '#927443'
    };
    try {
      window.mermaid.initialize({
        startOnLoad: false, securityLevel: 'loose', theme: 'base',
        themeVariables: {
          fontFamily: 'inherit', fontSize: '13.5px',
          background: pal.bg,
          primaryColor: pal.surface, primaryTextColor: pal.ink, primaryBorderColor: pal.line,
          secondaryColor: pal.accentBg, secondaryTextColor: pal.ink, secondaryBorderColor: pal.line,
          tertiaryColor: pal.bg, tertiaryTextColor: pal.soft, tertiaryBorderColor: pal.line,
          lineColor: pal.soft, textColor: pal.ink,
          nodeBorder: pal.line, clusterBkg: pal.bg, clusterBorder: pal.line,
          edgeLabelBackground: pal.bg, titleColor: pal.ink,
          actorBkg: pal.surface, actorBorder: pal.line, actorTextColor: pal.ink,
          labelBoxBkgColor: pal.surface, noteBkgColor: pal.accentBg, noteTextColor: pal.ink, noteBorderColor: pal.line,
        },
        flowchart: { curve: 'basis', useMaxWidth: true, padding: 16 },
        sequence: { useMaxWidth: true }, quadrantChart: { useMaxWidth: true },
      });
      window.mermaid.run({ nodes: blocks });
    } catch (err) { /* noop */ }
  };
  [].forEach.call(document.querySelectorAll('.mermaid'), function (b) { b.dataset.src = b.textContent; });
  if (window.mermaid) window.__renderMermaid();

  // ── Mermaid 点击放大灯箱 ──────────────────────────────────────
  var lb = document.createElement('div');
  lb.className = 'mermaid-lb';
  lb.innerHTML = '<div class="lb-backdrop"></div><div class="lb-stage"></div>' +
    '<button class="lb-close" aria-label="关闭">✕</button>' +
    '<div class="lb-hint">按 Esc 或点击背景关闭</div>';
  document.body.appendChild(lb);

  var lbStage = lb.querySelector('.lb-stage');
  var lbClose = lb.querySelector('.lb-close');
  var lbBackdrop = lb.querySelector('.lb-backdrop');

  function openLightbox(svgClone) {
    lbStage.innerHTML = '';
    lbStage.appendChild(svgClone);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    lbStage.innerHTML = '';
  }

  function bindMermaidClicks() {
    [].forEach.call(document.querySelectorAll('.mermaid'), function (m) {
      if (m.dataset.lbBound) return;
      m.dataset.lbBound = '1';
      m.addEventListener('click', function (e) {
        if (window.getSelection().toString().length > 0) return;
        var svg = m.querySelector('svg');
        if (!svg) return;
        var clone = svg.cloneNode(true);
        clone.style.maxWidth = 'none';
        openLightbox(clone);
      });
    });
  }
  bindMermaidClicks();

  // 主题切换后重新绑定（Mermaid 重渲染后 SVG 是新的）
  var origRender = window.__renderMermaid;
  window.__renderMermaid = function () {
    origRender();
    setTimeout(bindMermaidClicks, 150);
  };

  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lb.classList.contains('open')) {
      closeLightbox();
    }
  });

  // ── 代码块一键复制 ─────────────────────────────────────────────
  [].forEach.call(document.querySelectorAll('.article pre'), function (pre) {
    var btn = document.createElement('button');
    btn.className = 'copy-btn'; btn.textContent = '复制';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      navigator.clipboard.writeText(code ? code.textContent : pre.textContent).then(function () {
        btn.textContent = '已复制'; setTimeout(function () { btn.textContent = '复制'; }, 1500);
      });
    });
    pre.appendChild(btn);
  });
})();
