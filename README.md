# kai.services website

Static site for KAI. Pages are written in `src/pages/` and assembled into `public/`, which is what gets deployed.

## Structure

- `src/pages/` – page sources. Shared parts are pulled in with markers: `<!--#head-common-->`, `<!--#sprite-->`, `<!--#nav <top> <sub>-->`, `<!--#footer-->`.
- `src/partials/` – shared head tags, icon sprite, nav and footer. Edit these once and every page updates.
- `src/data/glossary.json` – glossary terms. The build renders both the visible glossary and its DefinedTermSet JSON-LD from this file.
- `src/data/workflows.json` – the AI workflow list; related-workflow cards render from it.
- `src/data/zt-baseline.json` – the Zero Trust Baseline map: 8 components, 28 policies (PO) and 8 practices (PR), demo steps and box positions. `public/assets/zt-map.js` adds the map behaviour and the free policy kit download.
- `public/` – built site (commit it). Also holds `assets/` (CSS, JS, logos), `sitemap.xml`, `robots.txt`, `llms.txt`, `_redirects`.

## Working on the site

```bash
node build.mjs        # rebuild public/ from src/
node serve.mjs        # preview at http://localhost:8788 with clean URLs
```

Always run `node build.mjs` and commit `public/` together with your `src/` changes.

## Deploy (Netlify, DNS stays at GoDaddy)

`netlify.toml` already sets everything: publish `public/`, no build command, functions in `netlify/functions/`.

1. Netlify → **Add new site → Import an existing project** → GitHub → `jeanie1711/kai-website`. Leave the settings as read from `netlify.toml` and deploy.
2. **Domain management → Add a domain** → `kai.services` (Netlify adds `www` too). Choose to keep DNS at your current provider.
3. In GoDaddy → **DNS → Records** (nameservers stay at GoDaddy):
   - `A` record, name `@` → `75.2.60.5` (Netlify's load balancer; use the value Netlify shows if different). Remove any other `A`/`AAAA` record on `@`, and turn off GoDaddy **Forwarding** for the domain.
   - `CNAME` record, name `www` → `<your-site>.netlify.app`.
   - Leave `MX` and `TXT` records alone (they run email).
4. Back in Netlify, wait for **HTTPS** to show the certificate as issued, and set `kai.services` as the primary domain.

## Free policy kit email gate

Visitors must leave an email to get the kit. The flow (code in `lib/kit-gate.js`, wired up in `netlify/functions/`):

1. `POST /api/kit-request`: the email is checked (format, common typos, throwaway inbox providers, placeholder
   addresses, domain can receive mail), then a one-time download link is emailed via Resend. The link holds an
   encrypted token with the email, language and tick-box choice, valid 7 days. Nothing is stored on Netlify.
2. The visitor opens the link and lands on the Zero Trust page with `?kit=...`. The page calls
   `GET /api/kit-verify`, then builds and downloads the kit in their language, with their map notes.
3. On that confirmation the lead goes to HubSpot (Forms API), so HubSpot only receives inboxes proven real.

Netlify rate-limits both endpoints per visitor. Locally, `node serve.mjs` runs the same flow and prints the
emailed link and the HubSpot lead in the terminal instead of sending them.

### One-time setup

**Resend** (sends the download link):
1. Sign up at resend.com → **Domains → Add domain** → `kai.services`.
2. Add the DNS records Resend lists (SPF/DKIM `TXT`, `MX` on a `send` subdomain) in GoDaddy DNS. They do not touch your main email.
3. **API Keys → Create** (sending access) and copy the key.

**HubSpot** (receives the leads):
1. **Marketing → Forms → Create form** (embedded form), name it "Zero Trust policy kit". Fields: **Email**, and optionally
   **Preferred language** (`hs_language`). Under the form's settings, add C4L@kai.services to notifications if you want an email per lead.
2. Publish, then copy the **form ID** (in the form URL / embed code) and your **portal ID** (Account ID, top-right menu).
3. Optional: to record the "occasional Zero Trust tips" tick-box as a real subscription, turn on data privacy settings,
   create a subscription type (Settings → Marketing → Email → Subscriptions) and copy its ID.

**Netlify → Site configuration → Environment variables:**

| Variable | Value |
|---|---|
| `KIT_SECRET` | A long random string (e.g. from a password generator). Changing it invalidates links already sent. |
| `RESEND_API_KEY` | The Resend API key |
| `MAIL_FROM` | `KAI <kit@kai.services>` |
| `MAIL_REPLY_TO` | `C4L@kai.services` |
| `HUBSPOT_PORTAL_ID` | HubSpot portal (account) ID |
| `HUBSPOT_FORM_ID` | The form's ID |
| `HUBSPOT_SUBSCRIPTION_ID` | Optional, see above |

Redeploy after adding them. Until `KIT_SECRET` and `RESEND_API_KEY` are set the form shows a friendly error and no kit
can be downloaded; until the HubSpot IDs are set, downloads work but leads are not recorded.

## Adding a page

1. Create it in `src/pages/` (copy a sibling page as a starting point).
2. Add it to `public/sitemap.xml` and, if useful for AI answer engines, `public/llms.txt`.
3. If it belongs in the menu or footer, update `src/partials/nav.html` / `footer.html`.

## Languages (English / Vietnamese)

- English pages live in `src/pages/`; each has a Vietnamese twin at the same path under `src/pages/vi/`, served at `/vi/...`.
- Pages under `vi/` automatically get `src/partials/nav.vi.html` and `footer.vi.html`, `<html lang="vi">`, hreflang alternates and the EN | VI switch (which links to the matching page).
- Data files hold both languages: Vietnamese copy sits in a `vi` field next to the English (`workflows.json`, `glossary.json`, `zt-baseline.json`).
- When you change copy on an English page, update its Vietnamese twin too. Links inside Vietnamese pages should point to `/vi/...`.
- New page? Create both `src/pages/x.html` and `src/pages/vi/x.html`, and add both URLs to `public/sitemap.xml`.
