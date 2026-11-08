// GET /api/kit-verify?token=...  Confirms the emailed link so the page can build the kit,
// then records the confirmed lead in HubSpot. See lib/kit-gate.js.
import { handleKitVerify, hubspotSender } from '../../lib/kit-gate.js';

export default (req, context) => {
  const env = process.env;
  return handleKitVerify(req, env, {
    hubspot: hubspotSender(env),
    ip: context.ip,
    waitUntil: context.waitUntil ? context.waitUntil.bind(context) : null,
  });
};

export const config = {
  path: '/api/kit-verify',
  method: 'GET',
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
