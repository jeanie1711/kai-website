// Assembles src/pages/**/*.html into static pages in public/.
// Usage: node build.mjs
// Markers a page can use:
//   <!--#head-common-->  shared <head> tags + Organization JSON-LD
//   <!--#sprite-->       SVG icon sprite
//   <!--#nav ai knowledge-->  nav, marking top item "ai" and dropdown item "knowledge" active
//   <!--#footer-->       footer + shared script
//   <!--#glossary-index--> <!--#glossary-terms--> <!--#glossary-jsonld-->  rendered from src/data/glossary.json
//   <!--#related <workflow-id>-->  cards for every other workflow in src/data/workflows.json
//   <!--#workflows-all-->  cards for all workflows (equal-size, rows of three)
//   <!--#zt-map--> <!--#zt-detail--> <!--#zt-data-->  Zero Trust baseline map, from src/data/zt-baseline.json
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const root = dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const partial = (name) => readFileSync(join(root, 'src/partials', name + '.html'), 'utf8').trimEnd();
const parts = { head: partial('head-common'), sprite: partial('sprite'), nav: partial('nav'), footer: partial('footer') };

function nav(top, sub) {
  let html = parts.nav;
  if (top) html = html.replace(`data-nav="${top}"`, `data-nav="${top}" class="active" aria-current="${sub ? 'true' : 'page'}"`);
  if (sub) html = html.replace(`data-sub="${sub}"`, `data-sub="${sub}" class="active" aria-current="page"`);
  return html;
}

// Glossary: one data file drives the visible terms and the DefinedTermSet JSON-LD.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const glossary = JSON.parse(readFileSync(join(root, 'src/data/glossary.json'), 'utf8'));
const glossaryParts = {
  index: '<nav class="term-index" aria-label="Glossary terms">' + glossary.map((g) =>
    `<div><b>${esc(g.group)}</b>${g.terms.map((t) => `<a href="#${t.id}">${esc(t.name)}</a>`).join('')}</div>`).join('') + '</nav>',
  terms: glossary.map((g) =>
    `<div class="term-group"><h2>${esc(g.group)}</h2><div class="terms">` + g.terms.map((t) =>
      `<article class="term" id="${t.id}"><h3>${esc(t.name)}</h3><p>${esc(t.def)}</p>` +
      (t.see ? `<a class="see" href="${t.see.href}"${t.see.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(t.see.label)} →</a>` : '') +
      '</article>').join('') + '</div></div>').join('\n'),
  jsonld: '<script type="application/ld+json">\n' + JSON.stringify({
    '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'KAI Glossary', url: 'https://kai.services/glossary',
    publisher: { '@type': 'Organization', name: 'KAI', url: 'https://kai.services' },
    hasDefinedTerm: glossary.flatMap((g) => g.terms.map((t) => ({
      '@type': 'DefinedTerm', name: t.name, description: t.def, url: `https://kai.services/glossary#${t.id}`,
      inDefinedTermSet: 'https://kai.services/glossary' }))),
  }) + '\n</script>',
};

// Workflow cards: <!--#related some-id--> renders every workflow except that one, as a 4-up grid.
const workflows = JSON.parse(readFileSync(join(root, 'src/data/workflows.json'), 'utf8'));
const related = (skip) => '<div class="grid-4">' + workflows.filter((w) => w.id !== skip).map((w) =>
  `<a class="card" href="${w.path}"><div class="card-ico"><svg width="22" height="22" aria-hidden="true"><use href="#${w.icon}"/></svg></div>` +
  `<h3>${esc(w.name)}</h3><p>${esc(w.blurb)}</p><span class="more">See the workflow →</span></a>`).join('') + '</div>';

// Zero Trust baseline map: <!--#zt-map--> <!--#zt-detail--> <!--#zt-data--> from src/data/zt-baseline.json.
// Boxes keep the design's 1536 x 906 canvas coordinates; kai.css scales them with container units.
const zt = JSON.parse(readFileSync(join(root, 'src/data/zt-baseline.json'), 'utf8'));
const ztNum = (key) => zt.steps.findIndex((s, i) => i > 0 && s.c.includes(key));
const pos = ([x, y, w, h]) => `--x:${x};--y:${y};--w:${w};--h:${h}`;
const ztItems = (items) => items.map((i) =>
  `<span class="ztm-item"><b class="${i.id.startsWith('PR') ? 'pr' : 'po'}">${i.id}</b><span>${esc(i.name)}</span></span>`).join('');
const ztBox = (c) => `<button type="button" class="ztm-box ztm-${c.key}" data-key="${c.key}" style="${pos(c.box)}" aria-pressed="${c.key === 'eng'}">` +
  `<span class="ztm-num" aria-hidden="true">${ztNum(c.key)}</span>` +
  `<span class="ztm-head"><strong class="ztm-name">${esc(c.name)}</strong><span class="ztm-sub">${esc(c.sub)}</span><span class="ztm-out">${esc(c.outcome)}</span></span>` +
  `<span class="ztm-items">${ztItems(c.items)}</span></button>`;
const byKey = Object.fromEntries(zt.components.map((c) => [c.key, c]));
const line = (pts, arrow = true) => `<polyline points="${pts}"${arrow ? ' marker-end="url(#ztm-arrow)"' : ''}/>`;
const ztLines = `<svg class="ztm-lines" viewBox="0 0 1536 906" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="ztm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>` +
  `<g data-line="auth">${line('400,132 410,132', false)}${line('470,154 470,286 552,286')}</g>` +
  `<g data-line="dev">${line('400,436 410,436', false)}${line('530,436 552,436')}</g>` +
  `<g data-line="gov">${line('756,216 756,252')}</g>` +
  `<g data-line="risk">${line('756,550 756,506')}</g>` +
  `<g data-line="out">${line('956,379 968,379')}${line('1070,379 1082,379', false)}${line('1082,122 1082,782', false)}${line('1082,122 1156,122')}${line('1082,378 1156,378')}${line('1082,562 1156,562')}</g></svg>`;
const via = (txt, b) => `<span class="ztm-via" style="${pos(b)}" aria-hidden="true">${txt}</span>`;
const mini = (txt, b) => `<span class="ztm-mini" style="${pos(b)}" aria-hidden="true">${txt}</span>`;
const oos = (name, sub, b) => `<div class="ztm-oos" style="${pos(b)}"><strong>${name}</strong><span>${sub}</span><em>Out of baseline scope.</em></div>`;
const ztMap = '<div class="ztm-wrap"><div class="ztm">' + ztLines +
  ztBox(byKey.ident) + via('Strong<br>authentication', [410, 110, 120, 44]) + ztBox(byKey.endp) + via('Device<br>compliance', [410, 414, 120, 44]) +
  ztBox(byKey.gov) + ztBox(byKey.eng) + via('Risk assessment', [686, 512, 140, 28]) + ztBox(byKey.threat) +
  mini('Classify, label, protect', [1086, 78, 70, 30]) + mini('App &amp; AI controls', [1086, 334, 70, 30]) + mini('Cloud posture mgmt', [1086, 518, 70, 30]) +
  ztBox(byKey.data) + ztBox(byKey.apps) + ztBox(byKey.tele) +
  oos('Network', 'Filtering, on-premises', [970, 309, 100, 140]) + oos('Infrastructure', 'Servers, containers, cloud platforms', [1160, 512, 376, 100]) +
  '</div></div>';
const ztCount = (items) => { const po = items.filter((i) => i.id.startsWith('PO')).length, pr = items.length - po; return `${po} PO · ${pr} PR`; };
const ztDetail = (c) => `<div class="ztd-left"><span class="eyebrow">Take a closer look</span><h3>${esc(c.name)}</h3><p class="ztd-meta">${esc(c.sub)} · ${ztCount(c.items)}</p><p class="ztd-check">${esc(c.check)}</p>` +
  `<label class="ztd-label" for="ztd-status">What needs attention here?</label><select id="ztd-status" class="ztd-status"><option value="">Choose a status</option><option value="check">Needs checking</option><option value="progress">In progress</option><option value="reviewed">Checked with our IT team</option></select>` +
  `<small class="ztd-note">These are your own notes. They stay in this browser and are not sent to KAI.</small></div>` +
  `<ul class="ztd-list">${c.items.map((i) => `<li><b class="${i.id.startsWith('PR') ? 'pr' : 'po'}">${i.id}</b><span>${esc(i.name)}</span></li>`).join('')}</ul>`;
const ztData = `<script type="application/json" id="zt-data">${JSON.stringify(zt).replace(/</g, '\\u003c')}</script>`;

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}

const pagesDir = join(root, 'src/pages');
for (const file of walk(pagesDir)) {
  const out = join(root, 'public', relative(pagesDir, file));
  const html = readFileSync(file, 'utf8')
    .replace('<!--#head-common-->', parts.head)
    .replace('<!--#sprite-->', parts.sprite)
    .replace(/<!--#nav ?([\w-]*) ?([\w-]*)-->/, (_, t, s) => nav(t, s))
    .replace('<!--#footer-->', parts.footer)
    .replace('<!--#glossary-index-->', glossaryParts.index)
    .replace('<!--#glossary-terms-->', glossaryParts.terms)
    .replace('<!--#glossary-jsonld-->', glossaryParts.jsonld)
    .replace(/<!--#related ([\w-]+)-->/g, (_, id) => related(id))
    .replace('<!--#workflows-all-->', related('').replace('class="grid-4"', 'class="wf-grid"'))
    .replace('<!--#zt-map-->', ztMap)
    .replace('<!--#zt-detail-->', ztDetail(byKey.eng))
    .replace('<!--#zt-data-->', ztData);
  const left = html.match(/<!--#[\w-]+[^>]*-->/);
  if (left) throw new Error(`${file}: unresolved marker ${left[0]}`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log('built', relative(root, out).split('\\').join('/'));
}
