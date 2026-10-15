// Builds public/theme-preview.html: the live home page with a theme switcher, for comparing
// design/themes.css candidates. The output is gitignored, so it is never deployed.
// Usage: node build.mjs && node design/preview.mjs && node serve.mjs  ->  http://localhost:8788/theme-preview
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const themes = [
  { id: 'current', name: 'Live site', note: 'Navy & Cyan + Amber (E2)' },
  { id: 'navycyan-teal', name: 'E1 · Navy & Cyan + Teal', note: 'Cohesive, calm blue family' },
  { id: 'navycyan-amber', name: 'E2 · Navy & Cyan + Amber', note: 'Warm counterpoint, nods to gold' },
  { id: 'navycyan-coral', name: 'E3 · Navy & Cyan + Coral', note: 'Warmer, more energetic' },
  { id: 'emerald', name: 'A · Midnight & Emerald', note: 'Safe to go. Calm, growth, trust' },
  { id: 'graphite', name: 'B · Graphite & Gold', note: 'Premium advisory. Serif headings' },
  { id: 'indigo', name: 'C · Indigo & Cyan', note: 'AI-forward, modern software' },
  { id: 'forest', name: 'D · Forest & Terracotta', note: 'Human, grounded, warm' },
];
const fonts = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap';

const css = readFileSync(join(root, 'design/themes.css'), 'utf8');
const bar = `
<style>
.theme-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:999;display:flex;gap:6px;padding:8px;border-radius:14px;
  background:rgba(20,20,24,.92);backdrop-filter:blur(10px);box-shadow:0 18px 40px rgba(0,0,0,.35);font-family:system-ui,sans-serif;max-width:calc(100vw - 24px);overflow-x:auto}
.theme-bar button{flex:none;border:1px solid rgba(255,255,255,.14);background:transparent;color:#fff;border-radius:10px;padding:8px 12px;text-align:left;cursor:pointer;font:inherit}
.theme-bar button[aria-pressed=true]{background:#fff;color:#111}
.theme-bar b{display:block;font-size:12px}
.theme-bar span{display:block;font-size:10.5px;opacity:.7;margin-top:2px;white-space:nowrap}
.theme-bar i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px}
</style>
<div class="theme-bar" role="group" aria-label="Theme preview">
${themes.map((t) => `<button type="button" data-t="${t.id}" aria-pressed="false"><b>${t.name}</b><span>${t.note}</span></button>`).join('\n')}
</div>
<script>
(function(){
  var html=document.documentElement,btns=[].slice.call(document.querySelectorAll('.theme-bar button'));
  function set(id){ if(id==='current')html.removeAttribute('data-theme');else html.setAttribute('data-theme',id);
    btns.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.t===id))});
    history.replaceState(null,'','#'+id); }
  btns.forEach(function(b){b.addEventListener('click',function(){set(b.dataset.t)})});
  set((location.hash||'#current').slice(1));
})();
</script>`;

let html = readFileSync(join(root, 'public/index.html'), 'utf8');
html = html
  .replace('</head>', `<link href="${fonts}" rel="stylesheet">\n<style>\n${css}\n</style>\n<meta name="robots" content="noindex">\n</head>`)
  .replace('</body>', `${bar}\n</body>`);
writeFileSync(join(root, 'public/theme-preview.html'), html);
console.log('wrote public/theme-preview.html');
