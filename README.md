# kai.services website

Static site for KAI. Pages are written in `src/pages/` and assembled into `public/`, which is what gets deployed.

## Structure

- `src/pages/` – page sources. Shared parts are pulled in with markers: `<!--#head-common-->`, `<!--#sprite-->`, `<!--#nav <top> <sub>-->`, `<!--#footer-->`.
- `src/partials/` – shared head tags, icon sprite, nav and footer. Edit these once and every page updates.
- `src/data/glossary.json` – glossary terms. The build renders both the visible glossary and its DefinedTermSet JSON-LD from this file.
- `src/data/workflows.json` – the AI workflow list; related-workflow cards render from it.
- `src/data/zt-baseline.json` – the Zero Trust Baseline map: 8 components, 28 policies (PO) and 8 practices (PR), demo steps and box positions. `public/assets/zt-map.js` adds the map behaviour and the policy kit request form.
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

## Free policy kit requests (HubSpot, sent by hand)

Visitors request the kit with a short form on the Zero Trust page: first name, last name, work email, company,
team size, plus an optional "occasional tips" tick-box. There is no automatic download.

1. `POST /api/kit-request` (code in `lib/kit-gate.js`, wired up in `netlify/functions/kit-request.mjs`) checks the
   email (format, common typos, throwaway inbox providers, placeholder addresses, domain can receive mail).
2. The details go to HubSpot through the Forms API: the contact is created or updated and a form submission is logged.
3. KAI reviews the request in HubSpot and emails the kit by hand, attaching the file from `lead-magnet/`
   (English `KAI_Zero_Trust_Baseline_Policy_Kit.html`, Vietnamese `KAI_Zero_Trust_Baseline_Bo_Chinh_Sach.html`).
   The page promises a reply within 1 to 2 business days.

After changing the map data or copy, regenerate the kit files: `node build.mjs && node tools/make-kit.mjs`.
`lead-magnet/` sits outside `public/`, so the files are not published on the site.

Netlify rate-limits the endpoint per visitor. Locally, `node serve.mjs` runs the same form and prints the lead in the
terminal instead of sending it to HubSpot.

### One-time HubSpot setup

1. **Marketing → Forms → Create form** (embedded form), name it "Zero Trust policy kit". Add these fields:
   **First name**, **Last name**, **Email**, **Company name**, **Number of employees**, and optionally
   **Preferred language** (`hs_language`, can be hidden). Field names must match these HubSpot contact properties.
2. In the form's options, turn on **notifications** to C4L@kai.services so every request lands in your inbox.
3. Publish, then copy the **form ID** (in the form URL or embed code) and your **portal ID** (Account ID, top-right menu).
4. Optional: to record the tips tick-box as a real email subscription, turn on data privacy settings, create a subscription
   type (Settings → Marketing → Email → Subscriptions) and copy its ID.

**Netlify → Site configuration → Environment variables:**

| Variable | Value |
|---|---|
| `HUBSPOT_PORTAL_ID` | HubSpot portal (account) ID |
| `HUBSPOT_FORM_ID` | The form's ID |
| `HUBSPOT_SUBSCRIPTION_ID` | Optional, see step 4 |

Redeploy after adding them. Until the HubSpot IDs are set, the form shows a friendly error asking visitors to write to
C4L@kai.services.

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
