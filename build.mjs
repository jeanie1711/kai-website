// Assembles src/pages/**/*.html into static pages in public/.
// Usage: node build.mjs
// Markers a page can use:
//   <!--#head-common-->  shared <head> tags + Organization JSON-LD
//   <!--#sprite-->       SVG icon sprite
//   <!--#nav ai knowledge-->  nav, marking top item "ai" and dropdown item "knowledge" active
//   <!--#footer-->       footer + shared script
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
    .replace('<!--#footer-->', parts.footer);
  const left = html.match(/<!--#[\w-]+[^>]*-->/);
  if (left) throw new Error(`${file}: unresolved marker ${left[0]}`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log('built', relative(root, out).split('\\').join('/'));
}
