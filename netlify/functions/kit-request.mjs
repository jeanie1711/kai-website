// POST /api/kit-request  { firstname, lastname, email, company, size, lang, updates, website (honeypot) }
// Checks the details and records the kit request in HubSpot. See lib/kit-gate.js.
import { handleKitRequest, hubspotSender } from '../../lib/kit-gate.js';

export default (req, context) => handleKitRequest(req, process.env, { hubspot: hubspotSender(process.env), ip: context.ip });

// At most 5 requests per minute from one visitor (Netlify rate limiting).
export const config = {
  path: '/api/kit-request',
  method: 'POST',
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
