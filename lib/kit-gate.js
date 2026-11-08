// Request form for the free KAI Zero Trust Baseline policy kit (lead magnet).
//
// The visitor leaves their name, work email, company and team size. We check the email looks real
// (format, common typos, throwaway inbox providers, placeholder addresses, domain can receive mail),
// then send the details to HubSpot through the Forms API. KAI reviews each request in HubSpot and
// emails the kit by hand (files in lead-magnet/, made with tools/make-kit.mjs).
//
// Used by netlify/functions/kit-request.mjs in production and by serve.mjs for local testing.

const SITE = 'https://kai.services';

// Throwaway inbox providers. Not exhaustive: KAI still reviews every request by hand.
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
// Cloudflare account involved). If the lookup itself fails we let the address through: KAI
// reviews every request before sending the kit.
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

/* ---------- HubSpot (Forms API: creates or updates the contact and logs a form submission) ---------- */

// HubSpot's built-in "Number of employees" options.
export const TEAM_SIZES = ['1-5', '5-25', '25-50', '50-100', '100-500', '500-1000', '1000+'];

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
        text: 'I agree to KAI storing my details to send me the free policy kit.',
        communications: [{ value: !!lead.updates, subscriptionTypeId: Number(env.HUBSPOT_SUBSCRIPTION_ID), text: 'Also send me occasional Zero Trust tips from KAI.' }],
      } };
    }
    const f = (name, value) => ({ objectTypeId: '0-1', name, value });
    const fields = [f('email', lead.email), f('firstname', lead.firstname), f('lastname', lead.lastname), f('company', lead.company), f('numemployees', lead.size)];
    // Preferred language goes into HubSpot's built-in "hs_language" property, if the form has that field.
    let r = await post({ ...base, fields: [...fields, f('hs_language', lead.lang)] });
    if (r.status === 400) r = await post({ ...base, fields }); // form without the language field
    if (!r.ok) throw new Error('hubspot ' + r.status + ' ' + (await r.text()).slice(0, 300));
  };
}

/* ---------- handler (standard Request in, Response out) ---------- */

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clean = (v) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 100);

// deps: { hubspot, fetch, ip }
export async function handleKitRequest(request, env, deps) {
  if (!deps.hubspot) return json({ ok: false, reason: 'not_configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, reason: 'invalid_format' }, 400); }
  if (body.website) return json({ ok: true }); // honeypot filled in: a bot. Pretend it worked.
  const lang = body.lang === 'vi' ? 'vi' : 'en';

  const firstname = clean(body.firstname), lastname = clean(body.lastname), company = clean(body.company);
  if (!firstname || !lastname || !company || !TEAM_SIZES.includes(body.size)) return json({ ok: false, reason: 'missing' }, 422);

  const shape = checkEmailShape(body.email);
  if (!shape.ok) return json(shape, 422);
  if (!(await domainAcceptsMail(shape.domain, deps.fetch))) return json({ ok: false, reason: 'no_mail_server' }, 422);

  const site = env.SITE_URL || SITE;
  try {
    await deps.hubspot({
      email: shape.email, firstname, lastname, company, size: body.size, lang, updates: !!body.updates, ip: deps.ip,
      pageUri: `${site}${lang === 'vi' ? '/vi' : ''}/zero-trust-security-foundation`,
    });
  } catch (e) {
    console.error('hubspot submit failed', e);
    return json({ ok: false, reason: 'failed' }, 502);
  }
  return json({ ok: true });
}
