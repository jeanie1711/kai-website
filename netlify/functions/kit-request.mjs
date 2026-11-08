// POST /api/kit-request  { email, lang, updates, website (honeypot) }
// Checks the email and sends the visitor a one-time download link. See lib/kit-gate.js.
import { handleKitRequest, resendMailer } from '../../lib/kit-gate.js';

export default (req, context) => {
  const env = process.env;
  return handleKitRequest(req, env, { mail: env.RESEND_API_KEY ? resendMailer(env) : null, ip: context.ip });
};

// At most 5 requests per minute from one visitor (Netlify rate limiting).
export const config = {
  path: '/api/kit-request',
  method: 'POST',
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
