// Assembles src/pages/**/*.html into static pages in public/.
// Usage: node build.mjs
// Markers a page can use:
//   <!--#head-common-->  shared <head> tags + Organization JSON-LD
//   <!--#sprite-->       SVG icon sprite
//   <!--#nav ai knowledge-->  nav, marking top item "ai" and dropdown item "knowledge" active
//   <!--#footer-->       footer + shared script
//   <!--#glossary-index--> <!--#glossary-terms--> <!--#glossary-jsonld-->  rendered from src/data/glossary.json
//   <!--#related <workflow-id>-->  cards for every other workflow in src/data/workflows.json
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
    .replace(/<!--#related ([\w-]+)-->/g, (_, id) => related(id));
  const left = html.match(/<!--#[\w-]+[^>]*-->/);
  if (left) throw new Error(`${file}: unresolved marker ${left[0]}`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log('built', relative(root, out).split('\\').join('/'));
}
