// Assembles src/pages/**/*.html into static pages in public/.
// Usage: node build.mjs
//
// Languages: English pages live in src/pages/, Vietnamese pages mirror them under src/pages/vi/ (served at /vi/...).
// Pages under vi/ automatically get the Vietnamese nav, footer, data and UI strings, <html lang="vi">,
// hreflang alternates, and an EN | VI switch that links to the matching page in the other language.
//
// Markers a page can use:
//   <!--#head-common-->  shared <head> tags + Organization JSON-LD + hreflang alternates
//   <!--#sprite-->       SVG icon sprite
//   <!--#nav ai knowledge-->  nav, marking top item "ai" and dropdown item "knowledge" active
//   <!--#footer-->       footer + shared script
//   <!--#glossary-index--> <!--#glossary-terms--> <!--#glossary-jsonld-->  rendered from src/data/glossary.json
//   <!--#related <workflow-id>-->  cards for every other workflow in src/data/workflows.json
//   <!--#workflows-all-->  cards for all workflows (equal-size, rows of three)
//   <!--#zt-map--> <!--#zt-detail--> <!--#zt-data-->  Zero Trust baseline map, from src/data/zt-baseline.json
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const root = dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SITE = 'https://kai.services';
const read = (p) => readFileSync(join(root, p), 'utf8');
const partial = (name) => read('src/partials/' + name + '.html').trimEnd();
const parts = {
  head: partial('head-common'), sprite: partial('sprite'),
  en: { nav: partial('nav'), footer: partial('footer') },
  vi: { nav: partial('nav.vi'), footer: partial('footer.vi') },
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const prefix = (lang, href) => (lang === 'vi' && href.startsWith('/') && !href.startsWith('/vi/') ? '/vi' + href : href);

// UI strings rendered by the build (page copy itself lives in the page files).
const T = {
  en: {
    seeWorkflow: 'See the workflow →', glossaryTerms: 'Glossary terms', glossaryName: 'KAI Glossary',
    closer: 'Take a closer look', attention: 'What needs attention here?', choose: 'Choose a status',
    check: 'Needs checking', progress: 'In progress', reviewed: 'Checked with our IT team',
    note: 'These are your own notes. They stay in this browser and are not sent to KAI.',
    oos: 'Out of baseline scope.', auth: 'Strong<br>authentication', dev: 'Device<br>compliance', risk: 'Risk assessment',
    miniData: 'Classify, label, protect', miniApps: 'App &amp; AI controls', miniCloud: 'Cloud posture mgmt',
    net: ['Network', 'Filtering, on-premises'], infra: ['Infrastructure', 'Servers, containers, cloud platforms'],
    langLabel: 'Language',
  },
  vi: {
    seeWorkflow: 'Xem workflow →', glossaryTerms: 'Thuật ngữ', glossaryName: 'KAI Glossary (Thuật ngữ)',
    closer: 'Xem kỹ hơn', attention: 'Phần này cần lưu ý gì?', choose: 'Chọn trạng thái',
    check: 'Cần kiểm tra', progress: 'Đang thực hiện', reviewed: 'Đã kiểm tra cùng đội IT',
    note: 'Đây là ghi chú của riêng bạn. Ghi chú được lưu trên trình duyệt này và không gửi cho KAI.',
    oos: 'Ngoài phạm vi baseline.', auth: 'Xác thực<br>mạnh', dev: 'Thiết bị<br>đạt chuẩn', risk: 'Đánh giá rủi ro',
    miniData: 'Phân loại, gắn nhãn', miniApps: 'Kiểm soát app &amp; AI', miniCloud: 'Quản lý cấu hình cloud',
    net: ['Mạng', 'Lọc truy cập, tại chỗ'], infra: ['Hạ tầng', 'Máy chủ, container, nền tảng cloud'],
    langLabel: 'Ngôn ngữ',
  },
};

function nav(lang, top, sub) {
  let html = parts[lang].nav;
  if (top) html = html.replace(`data-nav="${top}"`, `data-nav="${top}" class="active" aria-current="${sub ? 'true' : 'page'}"`);
  if (sub) html = html.replace(`data-sub="${sub}"`, `data-sub="${sub}" class="active" aria-current="page"`);
  return html;
}

// ---------- Glossary ----------
const glossaryData = JSON.parse(read('src/data/glossary.json'));
function glossaryParts(lang) {
  const groups = glossaryData.map((g) => ({
    group: lang === 'vi' ? g.vi : g.group,
    terms: g.terms.map((t) => {
      const v = lang === 'vi' ? t.vi : t;
      const see = t.see && { href: prefix(lang, t.see.href), label: lang === 'vi' ? t.vi.see : t.see.label };
      return { id: t.id, name: v.name, def: v.def, see };
    }),
  }));
  const url = SITE + prefix(lang, '/glossary');
  return {
    index: `<nav class="term-index" aria-label="${T[lang].glossaryTerms}">` + groups.map((g) =>
      `<div><b>${esc(g.group)}</b>${g.terms.map((t) => `<a href="#${t.id}">${esc(t.name)}</a>`).join('')}</div>`).join('') + '</nav>',
    terms: groups.map((g) =>
      `<div class="term-group"><h2>${esc(g.group)}</h2><div class="terms">` + g.terms.map((t) =>
        `<article class="term" id="${t.id}"><h3>${esc(t.name)}</h3><p>${esc(t.def)}</p>` +
        (t.see ? `<a class="see" href="${t.see.href}"${t.see.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(t.see.label)} →</a>` : '') +
        '</article>').join('') + '</div></div>').join('\n'),
    jsonld: '<script type="application/ld+json">\n' + JSON.stringify({
      '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: T[lang].glossaryName, url, inLanguage: lang,
      publisher: { '@type': 'Organization', name: 'KAI', url: SITE },
      hasDefinedTerm: groups.flatMap((g) => g.terms.map((t) => ({
        '@type': 'DefinedTerm', name: t.name, description: t.def, url: `${url}#${t.id}`, inDefinedTermSet: url }))),
    }) + '\n</script>',
  };
}

// ---------- Workflow cards ----------
const workflowData = JSON.parse(read('src/data/workflows.json'));
function related(lang, skip, cls = 'grid-4') {
  return `<div class="${cls}">` + workflowData.filter((w) => w.id !== skip).map((w) => {
    const v = lang === 'vi' ? w.vi : w;
    return `<a class="card" href="${prefix(lang, w.path)}"><div class="card-ico"><svg width="22" height="22" aria-hidden="true"><use href="#${w.icon}"/></svg></div>` +
      `<h3>${esc(v.name)}</h3><p>${esc(v.blurb)}</p><span class="more">${T[lang].seeWorkflow}</span></a>`;
  }).join('') + '</div>';
}

// ---------- Zero Trust baseline map ----------
// Boxes keep the design's 1536 x 906 canvas coordinates; kai.css scales them with container units.
const ztData = JSON.parse(read('src/data/zt-baseline.json'));
function ztFor(lang) {
  if (lang === 'en') return { components: ztData.components.map(({ vi, ...c }) => c), steps: ztData.steps.map(({ vi, ...s }) => s) };
  return {
    components: ztData.components.map((c) => {
      const items = c.items.map((it, i) => ({ id: it.id, name: c.vi.items[i] }));
      return { key: c.key, box: c.box, name: c.vi.name, sub: c.vi.sub, outcome: c.vi.outcome, check: c.vi.check, items,
        kit: { name: c.vi.kit.name, sub: c.vi.kit.sub, items } };
    }),
    steps: ztData.steps.map((s) => ({ c: s.c, l: s.l, t: s.vi.t, d: s.vi.d })),
  };
}
const pos = ([x, y, w, h]) => `--x:${x};--y:${y};--w:${w};--h:${h}`;
const badge = (id) => `<b class="${id.startsWith('PR') ? 'pr' : 'po'}">${id}</b>`;
const line = (pts, arrow = true) => `<polyline points="${pts}"${arrow ? ' marker-end="url(#ztm-arrow)"' : ''}/>`;
const ztLines = `<svg class="ztm-lines" viewBox="0 0 1536 906" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="ztm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>` +
  `<g data-line="auth">${line('400,132 410,132', false)}${line('470,154 470,286 552,286')}</g>` +
  `<g data-line="dev">${line('400,436 410,436', false)}${line('530,436 552,436')}</g>` +
  `<g data-line="gov">${line('756,216 756,252')}</g>` +
  `<g data-line="risk">${line('756,550 756,506')}</g>` +
  `<g data-line="out">${line('956,379 968,379')}${line('1070,379 1082,379', false)}${line('1082,122 1082,782', false)}${line('1082,122 1156,122')}${line('1082,378 1156,378')}${line('1082,562 1156,562')}</g></svg>`;
function ztParts(lang) {
  const t = T[lang], z = ztFor(lang);
  const byKey = Object.fromEntries(z.components.map((c) => [c.key, c]));
  const num = (key) => z.steps.findIndex((s, i) => i > 0 && s.c.includes(key));
  const box = (c) => `<button type="button" class="ztm-box ztm-${c.key}" data-key="${c.key}" style="${pos(c.box)}" aria-pressed="${c.key === 'eng'}">` +
    `<span class="ztm-num" aria-hidden="true">${num(c.key)}</span>` +
    `<span class="ztm-head"><strong class="ztm-name">${esc(c.name)}</strong><span class="ztm-sub">${esc(c.sub)}</span><span class="ztm-out">${esc(c.outcome)}</span></span>` +
    `<span class="ztm-items">${c.items.map((i) => `<span class="ztm-item">${badge(i.id)}<span>${esc(i.name)}</span></span>`).join('')}</span></button>`;
  const via = (txt, b) => `<span class="ztm-via" style="${pos(b)}" aria-hidden="true">${txt}</span>`;
  const mini = (txt, b) => `<span class="ztm-mini" style="${pos(b)}" aria-hidden="true">${txt}</span>`;
  const oos = ([name, sub], b) => `<div class="ztm-oos" style="${pos(b)}"><strong>${name}</strong><span>${sub}</span><em>${t.oos}</em></div>`;
  const count = (items) => { const po = items.filter((i) => i.id.startsWith('PO')).length; return `${po} PO · ${items.length - po} PR`; };
  const eng = byKey.eng;
  return {
    map: '<div class="ztm-wrap"><div class="ztm">' + ztLines +
      box(byKey.ident) + via(t.auth, [410, 110, 120, 44]) + box(byKey.endp) + via(t.dev, [410, 414, 120, 44]) +
      box(byKey.gov) + box(byKey.eng) + via(t.risk, [686, 512, 140, 28]) + box(byKey.threat) +
      mini(t.miniData, [1086, 78, 70, 30]) + mini(t.miniApps, [1086, 334, 70, 30]) + mini(t.miniCloud, [1086, 518, 70, 30]) +
      box(byKey.data) + box(byKey.apps) + box(byKey.tele) +
      oos(t.net, [970, 309, 100, 140]) + oos(t.infra, [1160, 512, 376, 100]) + '</div></div>',
    detail: `<div class="ztd-left"><span class="eyebrow">${t.closer}</span><h3>${esc(eng.name)}</h3><p class="ztd-meta">${esc(eng.sub)} · ${count(eng.items)}</p><p class="ztd-check">${esc(eng.check)}</p>` +
      `<label class="ztd-label" for="ztd-status">${t.attention}</label><select id="ztd-status" class="ztd-status"><option value="">${t.choose}</option><option value="check">${t.check}</option><option value="progress">${t.progress}</option><option value="reviewed">${t.reviewed}</option></select>` +
      `<small class="ztd-note">${t.note}</small></div>` +
      `<ul class="ztd-list">${eng.items.map((i) => `<li>${badge(i.id)}<span>${esc(i.name)}</span></li>`).join('')}</ul>`,
    data: `<script type="application/json" id="zt-data">${JSON.stringify(z).replace(/</g, '\\u003c')}</script>`,
  };
}

// ---------- Pages ----------
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}
// "about.html" -> "/about", "ai-workflows/index.html" -> "/ai-workflows/", "index.html" -> "/"
const urlOf = (rel) => '/' + rel.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');

const pagesDir = join(root, 'src/pages');
const cache = {};
for (const file of walk(pagesDir)) {
  const rel = relative(pagesDir, file).split('\\').join('/');
  const lang = rel.startsWith('vi/') ? 'vi' : 'en';
  const baseRel = lang === 'vi' ? rel.slice(3) : rel;
  const enUrl = urlOf(baseRel), viUrl = '/vi' + enUrl;
  const hasEn = existsSync(join(pagesDir, baseRel)), hasVi = existsSync(join(pagesDir, 'vi', baseRel));
  const alternates = (hasEn && hasVi)
    ? `\n<link rel="alternate" hreflang="en" href="${SITE}${enUrl}">\n<link rel="alternate" hreflang="vi" href="${SITE}${viUrl}">\n<link rel="alternate" hreflang="x-default" href="${SITE}${enUrl}">`
    : '';
  const sw = `<div class="lang-switch" role="group" aria-label="${T[lang].langLabel}">` +
    `<a href="${hasEn ? enUrl : '/'}" lang="en" hreflang="en"${lang === 'en' ? ' aria-current="true"' : ''}>EN</a>` +
    `<a href="${hasVi ? viUrl : '/vi/'}" lang="vi" hreflang="vi"${lang === 'vi' ? ' aria-current="true"' : ''}>VI</a></div>`;
  const g = cache['g' + lang] ||= glossaryParts(lang);
  const z = cache['z' + lang] ||= ztParts(lang);

  const html = readFileSync(file, 'utf8')
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace('<!--#head-common-->', parts.head + alternates)
    .replace('<!--#sprite-->', parts.sprite)
    .replace(/<!--#nav ?([\w-]*) ?([\w-]*)-->/, (_, t, s) => nav(lang, t, s))
    .replace('<!--#lang-switch-->', sw)
    .replace('<!--#footer-->', parts[lang].footer)
    .replace('<!--#glossary-index-->', g.index)
    .replace('<!--#glossary-terms-->', g.terms)
    .replace('<!--#glossary-jsonld-->', g.jsonld)
    .replace(/<!--#related ([\w-]+)-->/g, (_, id) => related(lang, id))
    .replace('<!--#workflows-all-->', related(lang, '', 'wf-grid'))
    .replace('<!--#zt-map-->', z.map)
    .replace('<!--#zt-detail-->', z.detail)
    .replace('<!--#zt-data-->', z.data);
  const left = html.match(/<!--#[\w-]+[^>]*-->/);
  if (left) throw new Error(`${rel}: unresolved marker ${left[0]}`);
  const out = join(root, 'public', rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log('built', 'public/' + rel);
}
