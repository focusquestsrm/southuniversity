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

function validSubmissionId(value) {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{15,127}$/.test(String(value || ''));
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
  if (!/^\d{5}$/.test(String(lead['lead_address[zip]'] || ''))) {
    return response(400, { outcome: 'unavailable', retryable: true, error: 'A valid ZIP code is required.' });
  }
  if (!/^\d{10}$/.test(String(lead['lead[phone1]'] || '').replace(/\D/g, ''))) {
    return response(400, { outcome: 'unavailable', retryable: true, error: 'A valid phone number is required.' });
  }
  if (lead['lead_consent[tcpa_consent]'] !== '1') {
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
  payload.set('lead[test]', process.env.LEAD_TEST_MODE === 'true' ? '1' : '0');

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
