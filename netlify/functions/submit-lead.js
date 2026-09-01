const CAMPAIGN_CODE = process.env.LEADHOOP_CAMPAIGN_CODE || 'avK3j_5CahaVgpJ4SicSQw';
const CAMPUS_ID = process.env.LEADHOOP_CAMPUS_ID || '11776';
const PING_URL = process.env.LEADHOOP_PING_URL || 'http://back2learn-api.leadhoop.com/v1/pings';
const POST_URL = process.env.LEADHOOP_POST_URL || 'http://back2learn-post.leadhoop.com/incoming/leads';

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function parseBody(event) {
  const params = new URLSearchParams(event.body || '');
  return Object.fromEntries(params.entries());
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' });
  if (process.env.LEAD_SUBMISSION_ENABLED !== 'true') {
    return response(200, { outcome: 'failed', location: '/next-steps/' });
  }

  const lead = parseBody(event);
  const required = ['lead_education[program_id]', 'lead_education[grad_year]', 'lead_address[state]', 'lead[email]', 'lead[phone1]', 'lead[firstname]', 'lead[lastname]'];
  if (required.some(field => !String(lead[field] || '').trim())) {
    return response(400, { error: 'Required lead fields are missing.' });
  }
  if (!/^\d{5}$/.test(String(lead['lead_address[zip]'] || ''))) {
    return response(400, { error: 'A valid ZIP code is required.' });
  }
  if (!/^\d{10}$/.test(String(lead['lead[phone1]'] || '').replace(/\D/g, ''))) {
    return response(400, { error: 'A valid phone number is required.' });
  }
  if (lead['lead_consent[tcpa_consent]'] !== '1') {
    return response(400, { error: 'Consent is required.' });
  }
  const unavailableStates = ['CT', 'MA', 'MS', 'NY', 'OR', 'RI', 'DC', 'AA', 'AE', 'AP', 'PR', 'VI', 'AS', 'GU', 'MP'];
  const restrictedPrograms = { '114283': ['CA'], '114284': ['NJ'], '114286': ['NJ'], '114266': ['NJ'], '114273': ['NJ'], '114268': ['NJ'] };
  const state = String(lead['lead_address[state]']).toUpperCase();
  const program = String(lead['lead_education[program_id]']);
  if (unavailableStates.includes(state) || (restrictedPrograms[program] || []).includes(state)) {
    return response(200, { outcome: 'failed', location: '/next-steps/' });
  }

  const payload = new URLSearchParams(lead);
  payload.set('campaign_code', CAMPAIGN_CODE);
  payload.set('lead_education[campus_id]', CAMPUS_ID);
  payload.set('lead[media_type]', process.env.LEADHOOP_MEDIA_TYPE || 'noncallcenter');
  payload.set('lead[test]', process.env.LEAD_TEST_MODE === 'true' ? '1' : '0');

  try {
    const ping = await fetch(PING_URL, { method: 'POST', body: payload });
    if (!ping.ok) return response(502, { error: 'Lead eligibility check failed.' });
    const pingResult = await ping.json();
    const pingId = pingResult.ping_id || pingResult.id;
    if (!pingId) return response(200, { outcome: 'failed', location: '/next-steps/' });
    payload.set('ping_id', String(pingId));
    const posted = await fetch(POST_URL, { method: 'POST', body: payload });
    if (!posted.ok) return response(502, { error: 'Lead delivery failed.' });
    return response(200, { outcome: 'accepted', location: '/thank-you/' });
  } catch (error) {
    return response(502, { error: 'Lead delivery is unavailable.' });
  }
};
