import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

const sectionIds = {
  1: 'summary',
  2: 'scope',
  3: 'terms',
  4: 'principles',
  5: 'layout',
  '5.1': 'ids',
  '5.2': 'text',
  '5.3': 'omit',
  '5.4': 'extensions',
  '5.5': 'secrets',
  6: 'companyfile',
  7: 'productfile',
  8: 'task',
  9: 'agent',
  10: 'guard',
  11: 'import',
  '11.1': 'import-git',
  '11.2': 'import-path',
  12: 'schema',
  13: 'sites',
};

const requiredKeys = [
  'title',
  'description',
  'toc',
  'spec',
  'versionLabel',
  'version',
  'revisedLabel',
  'revised',
  'schemaLabel',
];

function fail(message) {
  throw new Error(message);
}

function load(name) {
  const file = join(root, 'spec', name);
  let raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  raw = raw.replace(/^<!--[\s\S]*?-->\s*/, '');
  const parsed = parseFrontMatter(raw, name);
  const blocks = parseBlocks(parsed.body, name);
  const data = parsed.data;
  for (const key of requiredKeys) {
    if (!data[key]) fail(`${name}: missing front matter key ${key}`);
  }
  const h1 = blocks.find((block) => block.type === 'heading' && block.level === 1);
  if (!h1) fail(`${name}: missing title heading`);
  if (h1.text !== data.title) fail(`${name}: title front matter and the level-1 heading differ`);
  return { name, data, blocks };
}

function parseFrontMatter(raw, name) {
  if (!raw.startsWith('---\n')) fail(`${name}: front matter must start the file`);
  const end = raw.indexOf('\n---\n', 3);
  if (end < 0) fail(`${name}: front matter is not closed`);
  const data = {};
  for (const line of raw.slice(4, end).split('\n')) {
    if (!line.trim()) continue;
    const match = /^([A-Za-z0-9]+):\s*(.*)$/.exec(line);
    if (!match) fail(`${name}: bad front matter line: ${line}`);
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    data[match[1]] = value;
  }
  return { data, body: raw.slice(end + 5) };
}

function parseBlocks(body, name) {
  const lines = body.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === '') {
      i += 1;
      continue;
    }
    if (lines[i].startsWith('```')) {
      const lang = lines[i].slice(3).trim();
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i]);
        i += 1;
      }
      if (i >= lines.length) fail(`${name}: a code block is not closed`);
      i += 1;
      blocks.push({ type: 'code', lang, text: code.join('\n') });
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(lines[i]);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }
    if (/^#{4,}\s/.test(lines[i])) fail(`${name}: headings only go three levels deep: ${lines[i]}`);
    if (lines[i].startsWith('> ')) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quote.push(lines[i].slice(2));
        i += 1;
      }
      blocks.push({ type: 'quote', text: quote.join(' ') });
      continue;
    }
    if (lines[i].startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'table', rows });
      continue;
    }
    if (/^[-*]\s+/.test(lines[i])) {
      const read = readList(lines, i, /^[-*]\s+/, name);
      blocks.push({ type: 'ul', items: read.items });
      i = read.i;
      continue;
    }
    if (/^\d+\.\s+/.test(lines[i])) {
      const read = readList(lines, i, /^\d+\.\s+/, name);
      blocks.push({ type: 'ol', items: read.items });
      i = read.i;
      continue;
    }
    const paragraph = [];
    while (i < lines.length && lines[i].trim() !== '' && !startsBlock(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'p', text: paragraph.join(' ') });
  }
  return blocks;
}

function startsBlock(line) {
  return /^(#{1,6}\s|```|\||> |[-*]\s|\d+\.\s)/.test(line);
}

function readList(lines, i, marker) {
  const items = [];
  while (i < lines.length && marker.test(lines[i])) {
    let item = lines[i].replace(marker, '');
    i += 1;
    while (i < lines.length && lines[i].trim() !== '' && !startsBlock(lines[i])) {
      item += ' ' + lines[i].trim();
      i += 1;
    }
    items.push(item.trim());
  }
  return { items, i };
}

function sectionNumber(block, name) {
  if (block.level === 2) {
    const match = /^(\d+)\.\s+\S/.exec(block.text);
    if (!match) fail(`${name}: a section heading must look like "## 1. Title": ${block.text}`);
    return match[1];
  }
  if (block.level === 3) {
    const match = /^(\d+\.\d+)\s+\S/.exec(block.text);
    if (!match) fail(`${name}: a subsection heading must look like "### 5.1 Title": ${block.text}`);
    return match[1];
  }
  return null;
}

function outline(doc) {
  const numbers = [];
  for (const block of doc.blocks) {
    if (block.type !== 'heading' || block.level === 1) continue;
    numbers.push(sectionNumber(block, doc.name));
  }
  return numbers;
}

function sameOutline(zh, en) {
  const left = outline(zh);
  const right = outline(en);
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    if (left[i] !== right[i]) {
      fail(
        `section numbers differ at position ${i + 1}: zh.md has ${left[i] ?? '(end)'} and en.md has ${right[i] ?? '(end)'}`,
      );
    }
  }
}

function anchor(number, lang) {
  const base = sectionIds[number] ?? `s${number.replaceAll('.', '-')}`;
  return lang === 'en' ? `${base}-en` : base;
}

function esc(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(src) {
  const codes = [];
  const masked = src.replace(/`([^`]+)`/g, (_, code) => {
    const token = `\u0000${codes.length}\u0000`;
    codes.push(esc(code));
    return token;
  });
  let html = '';
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const match of masked.matchAll(re)) {
    html += esc(masked.slice(last, match.index));
    if (match[1] != null) html += `<a href="${esc(match[2])}">${esc(match[1])}</a>`;
    else html += `<strong>${esc(match[3])}</strong>`;
    last = match.index + match[0].length;
  }
  html += esc(masked.slice(last));
  return html.replace(/\u0000(\d+)\u0000/g, (_, index) => `<code>${codes[Number(index)]}</code>`);
}

function fieldTerm(block) {
  if (block?.type !== 'p') return null;
  const match = /^\*\*(.+)\*\*$/.exec(block.text.trim());
  if (!match || match[1].includes('**')) return null;
  return match[1];
}

function renderToc(blocks, doc) {
  const items = blocks
    .filter((block) => block.type === 'heading' && block.level === 2)
    .map((block) => {
      const number = sectionNumber(block, doc.name);
      const label = block.text.replace(/^\d+\.\s+/, '');
      return `<li><a href="#${anchor(number, doc.lang)}">${renderInline(label)}</a></li>`;
    });
  return `<nav class="toc" aria-label="${esc(doc.data.toc)}">
      <p class="toc-title">${esc(doc.data.toc)}</p>
      <ol>
        ${items.join('\n        ')}
      </ol>
    </nav>`;
}

function renderSample(quote, code) {
  const parts = /^(.*?)\s·\s\[([^\]]+)\]\(([^)\s]+)\)$/.exec(quote.text.trim());
  const label = parts ? parts[1] : quote.text.trim();
  const link = parts ? `<a href="${esc(parts[3])}">${esc(parts[2])}</a>` : '';
  return `<div class="sample">
      <div class="sample-label">
        <span>${renderInline(label)}</span>
        ${link}
      </div>
      <pre><code>${esc(code.text)}</code></pre>
    </div>`;
}

function renderTable(rows) {
  const parsed = rows.map(splitRow).filter((cells) => !cells.every((cell) => /^:?-+:?$/.test(cell)));
  const head = parsed[0].map((cell) => `<th>${renderInline(cell)}</th>`).join('');
  const body = parsed
    .slice(1)
    .map((cells) => `<tr>${cells.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`)
    .join('\n        ');
  return `<table>
      <thead><tr>${head}</tr></thead>
      <tbody>
        ${body}
      </tbody>
    </table>`;
}

function splitRow(row) {
  const inner = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let current = '';
  let code = false;
  for (const char of inner) {
    if (char === '`') code = !code;
    if (char === '|' && !code) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function renderBlocks(doc) {
  const blocks = doc.blocks;
  let html = '';
  let tocDone = false;
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block.type === 'heading' && block.level === 1) continue;
    if (!tocDone && block.type === 'heading' && block.level === 2) {
      html += renderToc(blocks, doc) + '\n    ';
      tocDone = true;
    }
    if (fieldTerm(block)) {
      if (blocks[i + 1]?.type !== 'p') fail(`${doc.name}: a term has no definition: ${block.text}`);
      const pairs = [];
      while (fieldTerm(blocks[i]) && blocks[i + 1]?.type === 'p') {
        pairs.push([fieldTerm(blocks[i]), blocks[i + 1].text]);
        i += 2;
      }
      i -= 1;
      const rows = pairs
        .map(([term, definition]) => `<dt>${renderInline(term)}</dt>\n      <dd>${renderInline(definition)}</dd>`)
        .join('\n      ');
      html += `<dl class="fields">\n      ${rows}\n    </dl>\n    `;
      continue;
    }
    if (block.type === 'quote' && blocks[i + 1]?.type === 'code') {
      html += renderSample(block, blocks[i + 1]) + '\n    ';
      i += 1;
      continue;
    }
    html += renderBlock(block, doc) + '\n    ';
  }
  return html.trimEnd();
}

function renderBlock(block, doc) {
  if (block.type === 'heading' && block.level === 1) return `<h1>${renderInline(block.text)}</h1>`;
  if (block.type === 'heading') {
    const number = sectionNumber(block, doc.name);
    const id = anchor(number, doc.lang);
    const tag = block.level === 2 ? 'h2' : 'h3';
    return `<${tag} id="${id}">${renderInline(block.text)}<a class="anchor" href="#${id}" aria-hidden="true">§</a></${tag}>`;
  }
  if (block.type === 'p') return `<p>${renderInline(block.text)}</p>`;
  if (block.type === 'ul' || block.type === 'ol') {
    const tag = block.type;
    const items = block.items.map((item) => `<li>${renderInline(item)}</li>`).join('\n      ');
    return `<${tag}>\n      ${items}\n    </${tag}>`;
  }
  if (block.type === 'code') return `<pre><code>${esc(block.text)}</code></pre>`;
  if (block.type === 'table') return renderTable(block.rows);
  if (block.type === 'quote') return `<blockquote><p>${renderInline(block.text)}</p></blockquote>`;
  fail(`${doc.name}: cannot render a ${block.type} here`);
}

function renderMeta(doc) {
  return `<dl class="meta">
      <dt>${esc(doc.data.versionLabel)}</dt><dd>${renderInline(doc.data.version)}</dd>
      <dt>${esc(doc.data.revisedLabel)}</dt><dd>${esc(doc.data.revised)}</dd>
      <dt>${esc(doc.data.schemaLabel)}</dt><dd><a href="schema/v0/companyfile.json"><code>companyfile.json</code></a> · <a href="schema/v0/productfile.json"><code>productfile.json</code></a></dd>
    </dl>`;
}

function renderArticle(doc) {
  return `<article class="doc ${doc.lang}">
    <h1>${renderInline(doc.data.title)}</h1>
    ${renderMeta(doc)}
    ${renderBlocks(doc)}
  </article>`;
}

function renderPage(zh, en) {
  const copy = JSON.stringify({
    zh: { title: zh.data.title, description: zh.data.description },
    en: { title: en.data.title, description: en.data.description },
  });
  return `<!DOCTYPE html>
<!-- Generated from spec/zh.md and spec/en.md. Edit those files, then run node build.mjs. -->
<html lang="zh-Hans" data-lang="zh">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(zh.data.title)}</title>
  <meta name="description" content="${esc(zh.data.description)}">
  <link rel="stylesheet" href="styles.css?v=6">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">
  <script>
    (function () {
      var saved = null;
      try { saved = localStorage.getItem("open-company-lang"); } catch (e) {}
      var lang = saved === "en" || saved === "zh"
        ? saved
        : (navigator.language || "").toLowerCase().indexOf("zh") === 0 ? "zh" : "en";
      document.documentElement.dataset.lang = lang;
      document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    })();
  </script>
</head>
<body>
  <a class="skip" href="#top">
    <span class="zh">跳到正文</span>
    <span class="en">Skip to content</span>
  </a>

  <header class="site-header">
    <div class="bar">
      <a class="wordmark" href="#top"><img src="brand/logo.svg" alt="" width="22" height="22">Open Company</a>
      <nav class="site-nav" aria-label="Sites">
        <a href="https://opencompany.run">opencompany.run</a>
        <a href="https://munk.sh">Munk AI</a>
      </nav>
      <div class="lang-switch" role="group" aria-label="Language">
        <button type="button" data-set-lang="zh" aria-pressed="true">中文</button>
        <button type="button" data-set-lang="en" aria-pressed="false">EN</button>
      </div>
    </div>
  </header>

  <main id="top">
  ${renderArticle(zh)}

  ${renderArticle(en)}
  </main>

  <footer>
    <div class="foot">
      <p>Open Company · <code>${esc(zh.data.spec)}</code> · ${esc(zh.data.revised)}</p>
    </div>
  </footer>

  <script>
    (function () {
      var KEY = "open-company-lang";
      var copy = ${copy};
      function apply(lang) {
        var page = copy[lang] || copy.zh;
        document.documentElement.dataset.lang = lang;
        document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
        document.title = page.title;
        var description = document.querySelector('meta[name="description"]');
        if (description) description.setAttribute("content", page.description);
        document.querySelectorAll("[data-set-lang]").forEach(function (button) {
          button.setAttribute("aria-pressed", button.getAttribute("data-set-lang") === lang ? "true" : "false");
        });
      }
      apply(document.documentElement.dataset.lang === "en" ? "en" : "zh");
      document.querySelectorAll("[data-set-lang]").forEach(function (button) {
        button.addEventListener("click", function () {
          var lang = button.getAttribute("data-set-lang");
          try { localStorage.setItem(KEY, lang); } catch (e) {}
          apply(lang);
        });
      });
    })();
  </script>
</body>
</html>
`;
}

function main() {
  const zh = load('zh.md');
  const en = load('en.md');
  zh.lang = 'zh';
  en.lang = 'en';
  if (zh.data.spec !== en.data.spec) fail('spec values differ');
  if (zh.data.revised !== en.data.revised) fail('revised dates differ');
  sameOutline(zh, en);
  const html = renderPage(zh, en);
  const target = join(root, 'index.html');
  if (process.argv.includes('--check')) {
    const current = readFileSync(target, 'utf8');
    if (current !== html) fail('index.html is out of date. Run node build.mjs');
    return;
  }
  writeFileSync(target, html);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
