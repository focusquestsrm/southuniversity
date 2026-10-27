const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

const CAMPAIGN_CODE = process.env.LEADHOOP_CAMPAIGN_CODE || 'avK3j_5CahaVgpJ4SicSQw';
const CAMPUS_ID = process.env.LEADHOOP_CAMPUS_ID || '11776';
const PING_URL = process.env.LEADHOOP_PING_URL || 'http://back2learn-api.leadhoop.com/v1/pings';
const POST_URL = process.env.LEADHOOP_POST_URL || 'http://back2learn-post.leadhoop.com/incoming/leads';
const STORE_NAME = 'south-lead-idempotency';
const RETENTION_MS = 24 * 60 * 60 * 1000;

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

function normalizePhoneValue(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(text)) return null;
  const digits = text.replace(/\D/g, '');
  let normalized = null;
  if (digits.length === 10 && text.charAt(0) !== '+') normalized = digits;
  else if (digits.length === 11 && digits.charAt(0) === '1') normalized = digits.slice(1);
  return normalized && normalized.charAt(0) !== '1' ? normalized : null;
}

function validSubmissionId(value) {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{15,127}$/.test(String(value || ''));
}

const VALID_STATE_CODES = Object.freeze([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
  'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
  'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'DC', 'WV', 'WI', 'WY', 'AA', 'AE', 'AP'
]);

function normalizeLocationValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidStreetAddress(value) {
  const text = normalizeLocationValue(value);
  if (!text || text.length < 4) return false;
  if (!/^[A-Za-z0-9\s.,#/'-]+$/.test(text)) return false;
  if (/(?:[.,#/'-]){3,}/.test(text) || /(?:\s){3,}/.test(text)) return false;
  if (/https?:\/\/|www\./i.test(text) || /(?:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i.test(text)) return false;
  if (!/[A-Za-z]/.test(text) || !/[0-9]/.test(text)) return false;
  const compact = text.replace(/[\s.,#/'-]+/g, '');
  if (!/[A-Za-z]/.test(compact) || !/[0-9]/.test(compact)) return false;
  if (/^(?:[A-Za-z]+|[0-9]+|[.,#/'-]+)$/i.test(text)) return false;
  return true;
}

function isValidCity(value) {
  const text = normalizeLocationValue(value);
  if (!text || !/[A-Za-z]/.test(text)) return false;
  if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(text)) return false;
  if (/(?:[.'-]){2,}/.test(text) || /(?:\s){3,}/.test(text)) return false;
  if (/https?:\/\/|www\./i.test(text) || /(?:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i.test(text)) return false;
  if (/[0-9]/.test(text)) return false;
  return true;
}

function isValidStateCode(value) {
  return VALID_STATE_CODES.includes(String(normalizeLocationValue(value) || '').toUpperCase());
}

function isValidZipCode(value) {
  return /^\d{5}$/.test(normalizeLocationValue(value));
}

function validateAddressValues(lead) {
  const address = normalizeLocationValue(lead['lead_address[address]']);
  if (!isValidStreetAddress(address)) return 'Please enter a valid street address';
  const city = normalizeLocationValue(lead['lead_address[city]']);
  if (!isValidCity(city)) return 'Please enter a valid city';
  const state = normalizeLocationValue(lead['lead_address[state]']).toUpperCase();
  if (!isValidStateCode(state)) return 'Please select your state.';
  const zip = normalizeLocationValue(lead['lead_address[zip]']);
  if (!isValidZipCode(zip)) return 'Please enter a valid 5-digit ZIP code';

  lead['lead_address[address]'] = address;
  lead['lead_address[city]'] = city;
  lead['lead_address[state]'] = state;
  lead['lead_address[zip]'] = zip;
  return null;
}

function submissionKey(submissionId) {
  return 'submission:' + crypto.createHash('sha256').update(submissionId).digest('hex');
}

function makeRecord(submissionId, requestId, now) {
  const created = now || new Date();
  return {
    submissionId,
    state: 'processing',
    createdAt: created.toISOString(),
    expiresAt: new Date(created.getTime() + RETENTION_MS).toISOString(),
    requestId: requestId || null,
    response: null
  };
}

function isExpired(record, now) {
  const expiration = Date.parse(record && record.expiresAt);
  return !Number.isFinite(expiration) || expiration <= (now || new Date()).getTime();
}

async function readRecord(store, key) {
  if (typeof store.getWithMetadata === 'function') {
    return store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
  }
  const value = await store.get(key, { type: 'json', consistency: 'strong' });
  return value === null ? null : { data: value, etag: null };
}

function resultModified(result) {
  if (result === undefined) return true;
  if (result === null) return false;
  if (result && typeof result === 'object') {
    if (typeof result.modified === 'boolean') return result.modified;
    if (result.etag || result.version || result.created || result.updated) return true;
  }
  return true;
}

async function reserveSubmission(store, submissionId, requestId, now) {
  const key = submissionKey(submissionId);
  const record = makeRecord(submissionId, requestId, now);
  try {
    const created = await store.setJSON(key, record, { onlyIfNew: true });
    if (resultModified(created)) {
      return { owner: true, key, etag: created && created.etag ? created.etag : null, record };
    }
    const existing = await readRecord(store, key);
    if (!existing) {
      const retried = await store.setJSON(key, record, { onlyIfNew: true });
      return resultModified(retried) ? { owner: true, key, etag: retried && retried.etag ? retried.etag : null, record } : { owner: false, indeterminate: false, key, record: null };
    }
    if (isExpired(existing.data, now)) {
      const replaced = await store.setJSON(key, record, { onlyIfMatch: existing.etag });
      if (resultModified(replaced)) return { owner: true, key, etag: replaced && replaced.etag ? replaced.etag : null, record };
      const winner = await readRecord(store, key);
      return { owner: false, indeterminate: false, key, record: winner && winner.data };
    }
    return { owner: false, indeterminate: false, key, record: existing.data };
  } catch (error) {
    return { owner: false, indeterminate: true, key, record: null };
  }
}

async function completeSubmission(store, reservation, state, responseBody, now) {
  const completed = now || new Date();
  const record = Object.assign({}, reservation.record, {
    state,
    completedAt: completed.toISOString(),
    response: responseBody
  });
  try {
    const result = await store.setJSON(reservation.key, record, { onlyIfMatch: reservation.etag });
    if (!resultModified(result)) throw new Error('Idempotency reservation ownership was lost');
    return record;
  } catch (error) {
    throw new Error('Idempotency reservation ownership was lost');
  }
}

function responseForDuplicate(record) {
  if (!record || record.state === 'processing') {
    return { statusCode: 202, body: { outcome: 'pending' } };
  }
  if (record.state === 'completed' && record.response) {
    return { statusCode: 200, body: record.response };
  }
  if (record.state === 'ambiguous') {
    return { statusCode: 202, body: { outcome: 'pending' } };
  }
  return { statusCode: 502, body: { outcome: 'unavailable', retryable: false } };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' });
  if (process.env.LEAD_SUBMISSION_ENABLED !== 'true') {
    return response(200, { outcome: 'failed', location: '/next-steps/' });
  }

  const lead = parseBody(event);
  const submissionId = String(lead.submission_id || '');
  if (!validSubmissionId(submissionId)) {
    return response(400, { outcome: 'unavailable', retryable: true, error: 'Missing or invalid submission id.' });
  }

  const required = ['lead_education[program_id]', 'lead_education[grad_year]', 'lead_address[state]', 'lead[email]', 'lead[phone1]', 'lead[firstname]', 'lead[lastname]'];
  if (required.some(field => !String(lead[field] || '').trim())) {
    return response(400, { outcome: 'unavailable', retryable: true, error: 'Required lead fields are missing.' });
  }
  const leadId = String(lead['lead[service_leadid]'] || '').trim();
  if (!leadId) {
    return response(400, { outcome: 'unavailable', retryable: true, error: 'Your session is still preparing your lead identification. Please wait a moment and try again.' });
  }

  const addressValidationError = validateAddressValues(lead);
  if (addressValidationError) {
    return response(400, { outcome: 'unavailable', retryable: true, error: addressValidationError });
  }

  const normalizedPhone = normalizePhoneValue(String(lead['lead[phone1]'] || ''));
  if (normalizedPhone === null) {
    return response(400, { outcome: 'unavailable', retryable: true, error: 'A valid phone number is required.' });
  }
  lead['lead[phone1]'] = normalizedPhone;
  const consentValue = String(lead['lead_consent[tcpa_consent]'] || '').trim().toUpperCase();
  if (!['1', 'Y', 'YES', 'TRUE'].includes(consentValue)) {
    return response(400, { outcome: 'unavailable', retryable: true, error: 'Consent is required.' });
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
  payload.set('lead[test]', process.env.LEAD_TEST_MODE === 'true' ? 'true' : 'false');

  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  const requestId = event.headers && (event.headers['x-nf-request-id'] || event.headers['X-Nf-Request-Id']) || null;
  const reservation = await reserveSubmission(store, submissionId, requestId, new Date());

  if (reservation.indeterminate === true) {
    console.error(JSON.stringify({
      event: 'idempotency_store_unavailable',
      submissionId,
      requestId,
      storeName: STORE_NAME,
      outboundRequests: 0
    }));
    return response(503, { outcome: 'pending', retryable: false, message: 'Your request is being processed. Please do not submit it again.' });
  }

  if (!reservation.owner) {
    const duplicate = responseForDuplicate(reservation.record);
    return response(duplicate.statusCode, duplicate.body);
  }

  try {
    const ping = await fetch(PING_URL, { method: 'POST', body: payload });
    if (!ping.ok) {
      await completeSubmission(store, reservation, 'ambiguous', { outcome: 'unavailable', retryable: false });
      return response(502, { outcome: 'unavailable', retryable: false });
    }
    const pingResult = await ping.json();
    const pingId = pingResult.ping_id || pingResult.id;
    if (!pingId) {
      await completeSubmission(store, reservation, 'ambiguous', { outcome: 'unavailable', retryable: false });
      return response(200, { outcome: 'failed', location: '/next-steps/' });
    }
    payload.set('ping_id', String(pingId));
    const posted = await fetch(POST_URL, { method: 'POST', body: payload });
    if (!posted.ok) {
      await completeSubmission(store, reservation, 'ambiguous', { outcome: 'unavailable', retryable: false });
      return response(502, { outcome: 'unavailable', retryable: false });
    }
    await completeSubmission(store, reservation, 'completed', { outcome: 'accepted', location: '/thank-you/' });
    return response(200, { outcome: 'accepted', location: '/thank-you/' });
  } catch (error) {
    await completeSubmission(store, reservation, 'ambiguous', { outcome: 'unavailable', retryable: false });
    return response(502, { outcome: 'unavailable', retryable: false });
  }
};

module.exports = {
  isValidStreetAddress,
  isValidCity,
  isValidStateCode,
  isValidZipCode,
  validateAddressValues,
  handler: exports.handler
};
