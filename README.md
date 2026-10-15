# kai.services website

Static site for KAI. Pages are written in `src/pages/` and assembled into `public/`, which is what gets deployed.

## Structure

- `src/pages/` – page sources. Shared parts are pulled in with markers: `<!--#head-common-->`, `<!--#sprite-->`, `<!--#nav <top> <sub>-->`, `<!--#footer-->`.
- `src/partials/` – shared head tags, icon sprite, nav and footer. Edit these once and every page updates.
- `public/` – built site (commit it). Also holds `assets/` (CSS, JS, logos), `sitemap.xml`, `robots.txt`, `llms.txt`, `_redirects`.

## Working on the site

```bash
node build.mjs        # rebuild public/ from src/
node serve.mjs        # preview at http://localhost:8788 with clean URLs
```

Always run `node build.mjs` and commit `public/` together with your `src/` changes.

## Deploy (Cloudflare Pages)

- Framework preset: None
- Build command: (empty)
- Build output directory: `public`

## Adding a page

1. Create it in `src/pages/` (copy a sibling page as a starting point).
2. Add it to `public/sitemap.xml` and, if useful for AI answer engines, `public/llms.txt`.
3. If it belongs in the menu or footer, update `src/partials/nav.html` / `footer.html`.
