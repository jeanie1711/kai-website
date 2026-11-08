// Email gate for the free KAI Zero Trust Baseline policy kit.
//
// 1. Visitor submits an email. We check it looks real: format, common typos, throwaway inbox
//    providers, placeholder addresses, and that the domain can receive mail.
// 2. We email them a one-time download link (via Resend). The link carries an encrypted token
//    holding the email, language and tick-box choice, so nothing needs storing on our side.
// 3. Opening the link brings them back to the page, which confirms the token here and then builds
//    the kit. Only at that point, with the inbox proven real, the lead is sent to HubSpot.
//
// Used by netlify/functions/*.mjs in production and by serve.mjs for local testing.

const SITE = 'https://kai.services';
const TOKEN_DAYS = 7;

// Throwaway inbox providers. Not exhaustive: the confirmation link is the real check.
export const DISPOSABLE = new Set(`
mailinator.com mailinator.net mailinator.org guerrillamail.com guerrillamail.net guerrillamail.org guerrillamail.biz
guerrillamail.de guerrillamailblock.com sharklasers.com grr.la pokemail.net spam4.me 10minutemail.com 10minutemail.net
10minutemail.co.uk 20minutemail.com 30minutemail.com temp-mail.org temp-mail.io tempmail.com tempmail.net tempmail.dev
tempmail.plus tempmailo.com tempmail.email tempmailaddress.com tempinbox.com tempr.email temp-inbox.com tmpmail.org
tmpmail.net tmails.net tmail.ws mytemp.email yopmail.com yopmail.net yopmail.fr cool.fr.nf jetable.fr.nf nospam.ze.tc
nomail.xl.cx mega.zik.dk speed.1s.fr courriel.fr.nf moncourrier.fr.nf monemail.fr.nf monmail.fr.nf trashmail.com
trashmail.net trashmail.de trashmail.me trashmail.io trashmail.at wegwerfmail.de wegwerfmail.net einrot.com
getnada.com nada.email getairmail.com dispostable.com maildrop.cc mailnesia.com mailcatch.com mintemail.com
fakeinbox.com fakemail.net throwawaymail.com throwaway.email discard.email discardmail.com discardmail.de
spamgourmet.com spambox.us spamex.com mohmal.com emailondeck.com burnermail.io moakt.com moakt.cc tmpbox.net
mailpoof.com inboxkitten.com emailfake.com email-fake.com fake-mail.net generator.email 33mail.com anonaddy.me
mailsac.com harakirimail.com mailforspam.com spamherelots.com spamhereplease.com mvrht.net mt2015.com
dropmail.me 1secmail.com 1secmail.net 1secmail.org esiix.com wwjmp.com xojxe.com yoggm.com emltmp.com
tempemail.co tempemail.net tempomail.fr emailtemporanea.net instantemailaddress.com incognitomail.org
mailtemp.info mail-temp.com mail.tm mailbox.in.ua linshiyouxiang.net 24hourmail.com 2prong.com
byom.de cuvox.de dayrep.com einrot.de fleckens.hu gustr.com jourrapide.com rhyta.com superrito.com teleworm.us
armyspy.com mailnull.com nowmymail.com objectmail.com proxymail.eu rcpt.at receiveee.com selfdestructingmail.com
spamfree24.org spamgoes.in spaml.com tempail.com tempmails.org trbvm.com wuzup.net zetmail.com zippymail.info
`.trim().split(/\s+/));

// Domains people mistype; we suggest the fix instead of failing silently.
const TYPOS = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmail.om': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.co': 'outlook.com', 'outlook.con': 'outlook.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  'icloud.co': 'icloud.com', 'iclod.com': 'icloud.com', 'icoud.com': 'icloud.com',
};

// Addresses that are clearly placeholders rather than a person's inbox.
const JUNK_LOCAL = /^(test|testing|tester|asdf\w*|qwer\w*|abc|abcd|abc123|aaa+|xxx+|zzz+|123+|1234\w*|none|null|no-?reply|noemail|nomail|fake|example|sample|demo|user|email|mail|a|aa|x|xx)$/;
const JUNK_DOMAIN = /^(example\.(com|org|net)|test\.com|test\.vn|domain\.com|email\.com|mail\.com|abc\.com|xyz\.com|asdf\.com|localhost|invalid)$/;

const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function normalise(email) { return String(email || '').trim().toLowerCase(); }

// Checks that need no network. Returns { ok, email, domain } or { ok:false, reason, suggestion? }.
export function checkEmailShape(raw) {
  const email = normalise(raw);
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, reason: 'invalid_format' };
  const [local, domain] = email.split('@');
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return { ok: false, reason: 'invalid_format' };
  if (!/\.[a-z]{2,}$/.test(domain)) return { ok: false, reason: 'invalid_format' };
  if (TYPOS[domain]) return { ok: false, reason: 'typo', suggestion: local + '@' + TYPOS[domain] };
  if (DISPOSABLE.has(domain) || [...DISPOSABLE].some((d) => domain.endsWith('.' + d))) return { ok: false, reason: 'disposable' };
  if (JUNK_LOCAL.test(local) || JUNK_DOMAIN.test(domain)) return { ok: false, reason: 'junk' };
  return { ok: true, email, domain };
}

// Does the domain accept mail? Uses Cloudflare's public DNS-over-HTTPS resolver (a plain lookup, no
// Cloudflare account involved). If the lookup itself fails we let the address through: the
// confirmation link still has to be opened from that inbox.
export async function domainAcceptsMail(domain, fetchImpl = fetch) {
  const ask = async (type) => {
    const r = await fetchImpl(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      { headers: { accept: 'application/dns-json' } });
    if (!r.ok) throw new Error('dns ' + r.status);
    return r.json();
  };
  try {
    const mx = await ask('MX');
    if (mx.Status === 3) return false; // domain does not exist
    const answers = (mx.Answer || []).filter((a) => a.type === 15);
    if (answers.length) return answers.some((a) => !/^\d+\s+\.?$/.test(String(a.data).trim())); // "0 ." = null MX, no mail
    const a = await ask('A'); // no MX: mail falls back to the A record
    return (a.Answer || []).some((x) => x.type === 1);
  } catch {
    return true;
  }
}

/* ---------- encrypted link token (AES-GCM, key derived from KIT_SECRET) ---------- */

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function keyFrom(secret) {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kai-kit|' + secret));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function sealToken(payload, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(secret), new TextEncoder().encode(JSON.stringify(payload)));
  const out = new Uint8Array(12 + data.byteLength);
  out.set(iv); out.set(new Uint8Array(data), 12);
  return b64url(out);
}

export async function openToken(token, secret) {
  try {
    const bytes = unb64url(token);
    const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, await keyFrom(secret), bytes.slice(12));
    return JSON.parse(new TextDecoder().decode(data));
  } catch {
    return null;
  }
}

/* ---------- mail ---------- */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MAIL = {
  en: {
    subject: 'Your KAI Zero Trust Baseline policy kit',
    hi: 'Thanks for your interest in the KAI Zero Trust Baseline Policies.',
    body: 'Click the button below to download your free policy kit: 28 security policies and 8 team practices for Microsoft 365, with questions to check before making changes.',
    button: 'Download the policy kit',
    expiry: `This link works for ${TOKEN_DAYS} days. If you did not request the kit, you can ignore this email.`,
    help: 'Want help putting the policies in place? Reply to this email and we’ll arrange a call.',
  },
  vi: {
    subject: 'Bộ chính sách KAI Zero Trust Baseline của bạn',
    hi: 'Cảm ơn bạn đã quan tâm đến KAI Zero Trust Baseline Policies.',
    body: 'Bấm nút bên dưới để tải bộ chính sách miễn phí: 28 chính sách bảo mật và 8 thực hành cho đội ngũ trên Microsoft 365, kèm câu hỏi cần kiểm tra trước khi thay đổi.',
    button: 'Tải bộ chính sách',
    expiry: `Đường link có hiệu lực trong ${TOKEN_DAYS} ngày. Nếu bạn không yêu cầu bộ tài liệu này, hãy bỏ qua email.`,
    help: 'Cần hỗ trợ triển khai các chính sách? Hãy trả lời email này để sắp xếp một cuộc gọi.',
  },
};

export function kitEmail(lang, link) {
  const m = MAIL[lang] || MAIL.en;
  const html = `<!doctype html><html lang="${lang}"><body style="margin:0;background:#f3f7fa;font-family:Arial,sans-serif;color:#0a2f49">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #dce5ee">
<p style="margin:0 0 6px;font-size:13px;letter-spacing:.08em;color:#0770a7;font-weight:bold">KAI ZERO TRUST BASELINE POLICIES</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${esc(m.subject)}</h1>
<p style="font-size:15px;line-height:1.6">${esc(m.hi)}</p>
<p style="font-size:15px;line-height:1.6">${esc(m.body)}</p>
<p style="margin:26px 0"><a href="${esc(link)}" style="display:inline-block;background:#0770a7;color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:9px">${esc(m.button)} &darr;</a></p>
<p style="font-size:13px;line-height:1.6;color:#5a6878">${esc(m.expiry)}</p>
<hr style="border:0;border-top:1px solid #dce5ee;margin:22px 0">
<p style="font-size:14px;line-height:1.6">${esc(m.help)}</p>
</div>
<p style="font-size:12px;color:#5a6878;text-align:center;margin-top:16px">KAI · kai.services · C4L@kai.services</p>
</div></body></html>`;
  const text = `${m.subject}\n\n${m.hi}\n\n${m.body}\n\n${m.button}: ${link}\n\n${m.expiry}\n\n${m.help}\n\nKAI · kai.services`;
  return { subject: m.subject, html, text };
}

export function resendMailer(env, fetchImpl = fetch) {
  return async ({ to, subject, html, text }) => {
    const r = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM || 'KAI <kit@kai.services>', to: [to], subject, html, text, reply_to: env.MAIL_REPLY_TO || 'C4L@kai.services' }),
    });
    if (!r.ok) throw new Error('resend ' + r.status + ' ' + (await r.text()).slice(0, 200));
  };
}

/* ---------- HubSpot (Forms API: creates or updates the contact and logs a form submission) ---------- */

export function hubspotSender(env, fetchImpl = fetch) {
  if (!env.HUBSPOT_PORTAL_ID || !env.HUBSPOT_FORM_ID) return null;
  const url = `https://api.hsforms.com/submissions/v3/integration/submit/${env.HUBSPOT_PORTAL_ID}/${env.HUBSPOT_FORM_ID}`;
  const post = (body) => fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return async (lead) => {
    const base = {
      submittedAt: String(Date.now()),
      context: { pageUri: lead.pageUri, pageName: 'KAI Zero Trust Baseline Policies: free policy kit', ...(lead.ip ? { ipAddress: lead.ip } : {}) },
    };
    if (env.HUBSPOT_SUBSCRIPTION_ID) {
      base.legalConsentOptions = { consent: {
        consentToProcess: true,
        text: 'I agree to KAI storing my email address to send me the free policy kit.',
        communications: [{ value: !!lead.updates, subscriptionTypeId: Number(env.HUBSPOT_SUBSCRIPTION_ID), text: 'Also send me occasional Zero Trust tips from KAI.' }],
      } };
    }
    const email = { objectTypeId: '0-1', name: 'email', value: lead.email };
    // Preferred language goes into HubSpot's built-in "hs_language" property, if the form has that field.
    let r = await post({ ...base, fields: [email, { objectTypeId: '0-1', name: 'hs_language', value: lead.lang }] });
    if (r.status === 400) r = await post({ ...base, fields: [email] }); // form without the language field
    if (!r.ok) throw new Error('hubspot ' + r.status + ' ' + (await r.text()).slice(0, 300));
  };
}

/* ---------- handlers (standard Request in, Response out) ---------- */

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

// deps: { mail, hubspot, fetch, now, ip, waitUntil }
export async function handleKitRequest(request, env, deps) {
  if (!env.KIT_SECRET || !deps.mail) return json({ ok: false, reason: 'not_configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, reason: 'invalid_format' }, 400); }
  if (body.website) return json({ ok: true }); // honeypot filled in: a bot. Pretend it worked.
  const lang = body.lang === 'vi' ? 'vi' : 'en';

  const shape = checkEmailShape(body.email);
  if (!shape.ok) return json(shape, 422);
  if (!(await domainAcceptsMail(shape.domain, deps.fetch))) return json({ ok: false, reason: 'no_mail_server' }, 422);

  const now = deps.now ? deps.now() : Date.now();
  const token = await sealToken({ e: shape.email, l: lang, u: body.updates ? 1 : 0, x: now + TOKEN_DAYS * 86400e3 }, env.KIT_SECRET);
  const site = env.SITE_URL || SITE;
  const link = `${site}${lang === 'vi' ? '/vi' : ''}/zero-trust-security-foundation?kit=${token}#next-step`;
  try {
    await deps.mail({ to: shape.email, ...kitEmail(lang, link) });
  } catch (e) {
    console.error('kit mail failed', e);
    return json({ ok: false, reason: 'send_failed' }, 502);
  }
  return json({ ok: true });
}

export async function handleKitVerify(request, env, deps) {
  if (!env.KIT_SECRET) return json({ ok: false, reason: 'not_configured' }, 503);
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!/^[A-Za-z0-9_-]{40,600}$/.test(token)) return json({ ok: false, reason: 'invalid_link' }, 400);
  const lead = await openToken(token, env.KIT_SECRET);
  if (!lead || !lead.e) return json({ ok: false, reason: 'invalid_link' }, 404);
  const now = deps.now ? deps.now() : Date.now();
  if (lead.x < now) return json({ ok: false, reason: 'expired' }, 410);

  if (deps.hubspot) {
    // The inbox is now proven real: record the lead in HubSpot. Never block the download on this.
    const site = env.SITE_URL || SITE;
    const job = deps.hubspot({
      email: lead.e, lang: lead.l, updates: !!lead.u, ip: deps.ip,
      pageUri: `${site}${lead.l === 'vi' ? '/vi' : ''}/zero-trust-security-foundation`,
    }).catch((e) => console.error('hubspot submit failed', e));
    if (deps.waitUntil) deps.waitUntil(job); else await job;
  }
  return json({ ok: true });
}
