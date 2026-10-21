'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../public/js/function2.js'), 'utf8');

function storage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

function classList() {
  const values = new Set();
  return {
    toggle: (name, enabled) => (enabled ? values.add(name) : values.delete(name)),
    contains: (name) => values.has(name)
  };
}

function buildHarness({ fetchImplementation, sessionStorage, overrides = {} }) {
  const fields = {};
  const field = (id, name, value) => {
    const node = {
      id,
      name,
      value: value || '',
      disabled: false,
      textContent: '',
      classList: classList(),
      addEventListener: () => {},
      dispatchEvent: () => {},
      focus: () => {},
      setAttribute: () => {},
      removeAttribute: () => {}
    };
    fields[id] = node;
    return node;
  };

  field('lead_education_program_id', 'lead_education[program_id]', '114281');
  field('lead_education_grad_year', 'lead_education[grad_year]', '2027');
  field('lead_education_education_level_id', 'lead_education[education_level_id]', '1302');
  field('lead_address_address_visible', 'lead_address[address]', '123 Test Street');
  field('lead_address_address', 'lead_address[address]', '123 Test Street');
  field('lead_address_city', 'lead_address[city]', 'Tampa');
  field('lead_address_state', 'lead_address[state]', 'FL');
  field('lead_address_zip', 'lead_address[zip]', '33601');
  field('lead_firstname', 'lead[firstname]', 'Browser');
  field('lead_lastname', 'lead[lastname]', 'Review');
  field('lead_email', 'lead[email]', 'browser.review@example.invalid');
  field('lead_phone1', 'lead[phone1]', '2125550100');
  field('leadid_token', 'lead[service_leadid]', 'leadid-test-123');
  field('lead_consent_tcpa_consent', 'lead_consent[tcpa_consent]', 'Y');
  field('meta_event_id', 'meta_event_id', 'meta-event-safe');
  field('submission_id', 'submission_id', '');
  field('status-message', '', '');
  const button = field('submitButton', '', '');
  button.textContent = 'Request Info';
  Object.assign(fields, overrides);

  const steps = [1, 2, 3, 4].map((number) => ({ dataset: { step: String(number) }, classList: classList() }));
  let visibleStep = steps[2];
  const handlers = {};
  const form = {
    dataset: {},
    addEventListener: (type, listener) => { handlers[type] = listener; },
    querySelectorAll: (selector) => (selector === '.form-step[data-step]' ? steps : []),
    querySelector: (selector) => (selector === '.form-step.is-visible' ? visibleStep : null),
    reset: () => {},
    scrollIntoView: () => {}
  };
  Object.defineProperty(form, 'dataset', { value: {}, writable: true, configurable: true });
  const document = {
    title: 'Submission test',
    activeElement: null,
    cookie: '',
    getElementById: (id) => (id === 'leadform' ? form : fields[id] || null)
  };

  function MockFormData() {
    this.entries = Object.values(fields)
      .filter((node) => node && node.name)
      .map((node) => [node.name, node.value]);
  }
  MockFormData.prototype[Symbol.iterator] = function () { return this.entries[Symbol.iterator](); };

  const context = vm.createContext({
    document,
    location: { search: '', pathname: '/', hash: '', assign: () => {} },
    history: { replaceState: () => {} },
    sessionStorage: sessionStorage || storage(),
    localStorage: storage(),
    URLSearchParams,
    FormData: MockFormData,
    CustomEvent: function () {},
    Event: function () {},
    Uint32Array,
    console,
    crypto: {
      randomUUID: () => '12345678-1234-4123-8123-123456789abc'
    },
    fetch: fetchImplementation,
    setTimeout: (callback) => callback(),
    setInterval: () => 1,
    clearInterval: () => {},
    SOUTH_GRADUATION_YEARS: {
      isValid: (value) => value === '2027',
      populateSelect: () => {}
    },
    SOUTH_PROGRAM_AVAILABILITY: {
      loadPrograms: async () => [{ program_id: '114281' }],
      populateSelect: () => {},
      renderCards: () => {}
    }
  });
  context.window = context;
  context.window.location = context.location;
  context.window.history = context.history;
  context.window.crypto = context.crypto;
  context.window.dispatchEvent = () => {};
  vm.runInContext(source, context);
  return {
    fields,
    form,
    button,
    submit: () => handlers.submit({ preventDefault: () => {} })
  };
}

async function withBlobStore(mockStoreFactory, callback) {
  const blobModulePath = require.resolve('@netlify/blobs');
  const originalModule = require.cache[blobModulePath];
  require.cache[blobModulePath] = {
    exports: { getStore: mockStoreFactory },
    id: blobModulePath,
    filename: blobModulePath,
    loaded: true
  };
  delete require.cache[require.resolve('../netlify/functions/submit-lead.js')];
  try {
    const module = require('../netlify/functions/submit-lead.js');
    const handler = module.handler || module;
    return await callback(handler);
  } finally {
    if (originalModule) {
      require.cache[blobModulePath] = originalModule;
    } else {
      delete require.cache[blobModulePath];
    }
    delete require.cache[require.resolve('../netlify/functions/submit-lead.js')];
  }
}

function makeBaseLead() {
  return new URLSearchParams({
    submission_id: 'same-submission-id-123456',
    'lead_education[program_id]': '114281',
    'lead_education[grad_year]': '2027',
    'lead_address[state]': 'FL',
    'lead_address[zip]': '33601',
    'lead[email]': 'test@example.com',
    'lead[phone1]': '2125550100',
    'lead[service_leadid]': 'leadid-test-123',
    'lead[firstname]': 'Concurrent',
    'lead[lastname]': 'Request',
    'lead_consent[tcpa_consent]': 'Y'
  }).toString();
}

test('phone normalization accepts all valid formats and rejects invalid values', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../public/js/function2.js'), 'utf8');
  const validFormats = ['5551234567', '15551234567', '+1 (555) 123-4567', '(555) 123-4567', '555-123-4567', '555 123 4567'];
  const invalidFormats = ['', ' ', '+', '555', '555123456', '155512345678', '555123456a', '+5551234567', '5551234567 ext 123'];

  const form = {
    dataset: {},
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    reset: () => {},
    scrollIntoView: () => {}
  };
  const phoneField = {
    id: 'lead_phone1',
    value: '',
    textContent: '',
    classList: classList(),
    addEventListener: () => {},
    dispatchEvent: () => {},
    focus: () => {},
    setAttribute: () => {},
    removeAttribute: () => {}
  };
  const context = vm.createContext({
    document: {
      getElementById: (id) => {
        if (id === 'leadform') return form;
        if (id === 'lead_phone1') return phoneField;
        return {
          id,
          value: '',
          textContent: '',
          classList: classList(),
          addEventListener: () => {},
          dispatchEvent: () => {},
          focus: () => {},
          setAttribute: () => {},
          removeAttribute: () => {},
          dataset: {}
        };
      },
      querySelectorAll: () => [],
      querySelector: () => null,
      cookie: '',
      title: 'Phone validation test'
    },
    location: { search: '', pathname: '/', hash: '', assign: () => {} },
    history: { replaceState: () => {} },
    sessionStorage: storage(),
    localStorage: storage(),
    URLSearchParams,
    FormData: function FormData() { this.entries = []; },
    CustomEvent: function CustomEvent() {},
    Event: function Event() {},
    Uint32Array,
    console,
    crypto: { randomUUID: () => '12345678-1234-4123-8123-123456789abc' },
    fetch: async () => ({ ok: true, json: async () => ({ outcome: 'accepted', location: '/thank-you/' }) }),
    setTimeout: (callback) => callback(),
    setInterval: () => 1,
    clearInterval: () => {},
    SOUTH_GRADUATION_YEARS: { isValid: (value) => value === '2027', populateSelect: () => {} },
    SOUTH_PROGRAM_AVAILABILITY: { loadPrograms: async () => [{ program_id: '114281' }], populateSelect: () => {}, renderCards: () => {} }
  });
  context.window = context;
  context.window.location = context.location;
  context.window.history = context.history;
  context.window.crypto = context.crypto;
  context.window.dispatchEvent = () => {};
  vm.runInContext(source, context);

  for (const value of validFormats) {
    assert.strictEqual(context.window.SOUTH_PHONE.normalize(value), '5551234567', `Expected ${value} to normalize to 5551234567`);
  }
  for (const value of invalidFormats) {
    assert.strictEqual(context.window.SOUTH_PHONE.normalize(value), null, `Expected ${value} to be rejected`);
  }

  const originalSubmissionFlag = process.env.LEAD_SUBMISSION_ENABLED;
  process.env.LEAD_SUBMISSION_ENABLED = 'true';
  try {
    let receivedPhone = null;
    await withBlobStore(() => ({
      setJSON: async (key, value, opts) => ({ modified: true, etag: 'etag-commit' }),
      getWithMetadata: async () => null
    }), async (handler) => {
      global.fetch = async (url, options) => {
        receivedPhone = new URLSearchParams(options.body).get('lead[phone1]');
        return { ok: true, json: async () => ({ ping_id: 'ping-123' }) };
      };
      const result = await handler({
        httpMethod: 'POST',
        body: new URLSearchParams({
          submission_id: 'same-submission-id-123456',
          'lead_education[program_id]': '114281',
          'lead_education[grad_year]': '2027',
          'lead_address[state]': 'FL',
          'lead_address[zip]': '33601',
          'lead[email]': 'test@example.com',
          'lead[phone1]': '+1 (555) 123-4567',
          'lead[service_leadid]': 'leadid-test-123',
          'lead[firstname]': 'Concurrent',
          'lead[lastname]': 'Request',
          'lead_consent[tcpa_consent]': 'Y'
        }).toString(),
        headers: { host: 'example.com', origin: 'https://example.com', 'x-nf-request-id': 'req-phone-norm' }
      });
      assert.strictEqual(result.statusCode, 200, 'Valid formatted numbers should be accepted');
      assert.strictEqual(receivedPhone, '5551234567', 'Server should normalize the phone before outbound request');
    });
  } finally {
    if (originalSubmissionFlag === undefined) delete process.env.LEAD_SUBMISSION_ENABLED; else process.env.LEAD_SUBMISSION_ENABLED = originalSubmissionFlag;
  }
});

test('browser invalid phone values never fetch and preserve the raw value', async () => {
  const invalidFormats = ['', ' ', '+', '555', '555123456', '155512345678', '555123456a', '+5551234567', '5551234567 ext 123'];

  for (const value of invalidFormats) {
    let fetchCalls = 0;
    let requestBody = null;
    const harness = buildHarness({
      sessionStorage: storage(),
      fetchImplementation: async (url, options) => {
        fetchCalls += 1;
        requestBody = options && options.body ? String(options.body) : null;
        return { ok: true, json: async () => ({ outcome: 'accepted', location: '/thank-you/' }) };
      },
      overrides: {
        'phone-error': {
          id: 'phone-error',
          name: 'phone-error',
          value: '',
          textContent: '',
          classList: classList(),
          addEventListener: () => {},
          dispatchEvent: () => {},
          focus: () => {},
          setAttribute: () => {},
          removeAttribute: () => {}
        }
      }
    });

    const phoneField = harness.fields['lead_phone1'];
    phoneField.value = value;
    await harness.submit();

    assert.strictEqual(harness.fields['phone-error'].textContent, 'Phone number is not valid', `Expected ${JSON.stringify(value)} to trigger the phone validation message`);
    assert.strictEqual(fetchCalls, 0, `Expected ${JSON.stringify(value)} to create 0 fetch calls`);
    assert.strictEqual(requestBody, null, `Expected ${JSON.stringify(value)} to avoid creating a request body`);
    assert.strictEqual(phoneField.value, value, `Expected ${JSON.stringify(value)} to remain visible and unmodified before validation`);
  }
});

test('browser accepted formats submit exactly once with normalized 10-digit phone values', async () => {
  const validFormats = ['5551234567', '15551234567', '+1 (555) 123-4567', '(555) 123-4567', '555-123-4567', '555 123 4567'];

  for (const value of validFormats) {
    let fetchCalls = 0;
    let requestBody = null;
    const harness = buildHarness({
      sessionStorage: storage(),
      fetchImplementation: async (url, options) => {
        fetchCalls += 1;
        requestBody = options && options.body ? String(options.body) : null;
        return { ok: true, json: async () => ({ outcome: 'accepted', location: '/thank-you/' }) };
      },
      overrides: {
        'phone-error': {
          id: 'phone-error',
          name: 'phone-error',
          value: '',
          textContent: '',
          classList: classList(),
          addEventListener: () => {},
          dispatchEvent: () => {},
          focus: () => {},
          setAttribute: () => {},
          removeAttribute: () => {}
        }
      }
    });

    const phoneField = harness.fields['lead_phone1'];
    assert.strictEqual(phoneField.value, '2125550100', 'Harness baseline phone value is not set as expected');
    phoneField.value = value;
    assert.strictEqual(phoneField.value, value, `Expected ${JSON.stringify(value)} to remain visible while typing or pasting`);

    await harness.submit();

    assert.strictEqual(fetchCalls, 1, `Expected ${JSON.stringify(value)} to trigger exactly one browser fetch`);
    assert.ok(requestBody && requestBody.includes('lead%5Bphone1%5D=5551234567'), `Expected normalized phone in browser request body for ${JSON.stringify(value)}`);
    assert.strictEqual(phoneField.value, '5551234567', `Expected ${JSON.stringify(value)} to normalize to 5551234567 before send`);
  }
});

test('server invalid phone values return the validation error and trigger zero downstream side effects', async () => {
  const invalidFormats = ['555', '555123456', '155512345678', '555123456a', '+5551234567', '5551234567 ext 123'];
  const originalSubmissionFlag = process.env.LEAD_SUBMISSION_ENABLED;
  process.env.LEAD_SUBMISSION_ENABLED = 'true';

  try {
    for (const value of invalidFormats) {
      let prePingCalls = 0;
      let postCalls = 0;
      let reservationCalls = 0;
      let idempotencyRecords = 0;

      await withBlobStore(() => ({
        setJSON: async (key, value, opts) => {
          reservationCalls += 1;
          if (opts && (opts.onlyIfNew === true || opts.onlyIfMatch)) {
            idempotencyRecords += 1;
          }
          return { modified: true, etag: 'etag-' + reservationCalls };
        },
        getWithMetadata: async () => null
      }), async (handler) => {
        const originalFetch = global.fetch;
        global.fetch = async (url, options) => {
          const target = String(url || '');
          if (target.includes('pings')) prePingCalls += 1;
          if (target.includes('incoming/leads')) postCalls += 1;
          return { ok: true, json: async () => ({ ping_id: 'ping-123' }) };
        };

        try {
          const result = await handler({
            httpMethod: 'POST',
            headers: { host: 'example.com', origin: 'https://example.com', 'x-nf-request-id': 'server-invalid-' + value.length },
            body: new URLSearchParams({
              submission_id: 'same-submission-id-123456',
              'lead_education[program_id]': '114281',
              'lead_education[grad_year]': '2027',
              'lead_education[education_level_id]': '1302',
              'lead_background[military_type]': 'none',
              'lead_education[start_date]': '2026-01',
              'lead_address[address]': '123 Test Street',
              'lead_address[city]': 'Tampa',
              'lead_address[state]': 'FL',
              'lead_address[zip]': '33601',
              'lead[email]': 'test@example.com',
              'lead[phone1]': value,
              'lead[service_leadid]': 'leadid-test-123',
              'lead[firstname]': 'Concurrent',
              'lead[lastname]': 'Request',
              'lead_consent[tcpa_consent]': 'Y',
              'lead[media_type]': 'noncallcenter',
              'lead[test]': 'true'
            }).toString()
          });

          assert.strictEqual(result.statusCode, 400, `Expected invalid phone ${JSON.stringify(value)} to be rejected with a 400 response`);
          const payload = JSON.parse(result.body);
          assert.strictEqual(payload.error, 'A valid phone number is required.', `Expected invalid phone ${JSON.stringify(value)} to return the phone validation error`);
          assert.strictEqual(prePingCalls, 0, `Expected invalid phone ${JSON.stringify(value)} to create 0 pre-ping calls`);
          assert.strictEqual(postCalls, 0, `Expected invalid phone ${JSON.stringify(value)} to create 0 LeadHoop post calls`);
          assert.strictEqual(reservationCalls, 0, `Expected invalid phone ${JSON.stringify(value)} to create 0 reservation calls`);
          assert.strictEqual(idempotencyRecords, 0, `Expected invalid phone ${JSON.stringify(value)} to create 0 idempotency records`);
        } finally {
          global.fetch = originalFetch;
        }
      });
    }
  } finally {
    if (originalSubmissionFlag === undefined) delete process.env.LEAD_SUBMISSION_ENABLED; else process.env.LEAD_SUBMISSION_ENABLED = originalSubmissionFlag;
  }
});

test('server accepted formats normalize to 5551234567 and send the normalized value to LeadHoop', async () => {
  const validFormats = ['5551234567', '15551234567', '+1 (555) 123-4567', '(555) 123-4567', '555-123-4567', '555 123 4567'];
  const originalSubmissionFlag = process.env.LEAD_SUBMISSION_ENABLED;
  process.env.LEAD_SUBMISSION_ENABLED = 'true';

  try {
    for (const value of validFormats) {
      let pingCalls = 0;
      let postCalls = 0;
      let leadHoopBody = null;
      await withBlobStore(() => ({
        setJSON: async (key, value, opts) => ({ modified: true, etag: 'etag-accepted' }),
        getWithMetadata: async () => null
      }), async (handler) => {
        const originalFetch = global.fetch;
        global.fetch = async (url, options) => {
          const target = String(url || '');
          if (target.includes('pings')) {
            pingCalls += 1;
            return { ok: true, json: async () => ({ ping_id: 'ping-accepted-123' }) };
          }
          if (target.includes('incoming/leads')) {
            postCalls += 1;
            leadHoopBody = String(options && options.body ? options.body : '');
            return { ok: true, json: async () => ({ outcome: 'accepted' }) };
          }
          return { ok: true, json: async () => ({}) };
        };

        try {
          const result = await handler({
            httpMethod: 'POST',
            headers: { host: 'example.com', origin: 'https://example.com', 'x-nf-request-id': 'server-valid-' + value.length },
            body: new URLSearchParams({
              submission_id: 'same-submission-id-123456',
              'lead_education[program_id]': '114281',
              'lead_education[grad_year]': '2027',
              'lead_education[education_level_id]': '1302',
              'lead_background[military_type]': 'none',
              'lead_education[start_date]': '2026-01',
              'lead_address[address]': '123 Test Street',
              'lead_address[city]': 'Tampa',
              'lead_address[state]': 'FL',
              'lead_address[zip]': '33601',
              'lead[email]': 'test@example.com',
              'lead[phone1]': value,
              'lead[service_leadid]': 'leadid-test-123',
              'lead[firstname]': 'Concurrent',
              'lead[lastname]': 'Request',
              'lead_consent[tcpa_consent]': 'Y',
              'lead[media_type]': 'noncallcenter',
              'lead[test]': 'true'
            }).toString()
          });

          assert.strictEqual(result.statusCode, 200, `Expected valid phone format ${JSON.stringify(value)} to be accepted`);
          assert.strictEqual(pingCalls, 1, `Expected valid phone ${JSON.stringify(value)} to trigger exactly one pre-ping`);
          assert.strictEqual(postCalls, 1, `Expected valid phone ${JSON.stringify(value)} to trigger exactly one post call`);
          assert.ok(leadHoopBody && leadHoopBody.includes('lead%5Bphone1%5D=5551234567'), `Expected valid phone ${JSON.stringify(value)} to submit 5551234567 to LeadHoop`);
          if (value !== '5551234567') {
            assert.ok(!leadHoopBody.includes('lead%5Bphone1%5D=' + encodeURIComponent(value)), `Expected valid phone ${JSON.stringify(value)} to be normalized before the LeadHoop post`);
          }
        } finally {
          global.fetch = originalFetch;
        }
      });
    }
  } finally {
    if (originalSubmissionFlag === undefined) delete process.env.LEAD_SUBMISSION_ENABLED; else process.env.LEAD_SUBMISSION_ENABLED = originalSubmissionFlag;
  }
});

test('browser duplicate-submission protection', async () => {
  let requests = 0;
  const pendingSession = storage();
  const rapidHarness = buildHarness({
    sessionStorage: pendingSession,
    fetchImplementation: async () => {
      requests += 1;
      return {
        ok: true,
        json: async () => ({ outcome: 'accepted', location: 'https://redirect.invalid/accepted' })
      };
    }
  });

  const firstSubmit = rapidHarness.submit();
  const secondSubmit = rapidHarness.submit();
  const thirdSubmit = rapidHarness.submit();
  await Promise.all([firstSubmit, secondSubmit, thirdSubmit]);
  assert.strictEqual(requests, 1, 'Rapid repeated submits created more than one outbound request');
  assert.strictEqual(rapidHarness.button.disabled, true, 'Successful request should remain locked');
  assert.strictEqual(rapidHarness.fields['submission_id'].value.length > 0, true, 'A submission ID was not generated');

  let ambiguousRequests = 0;
  const ambiguousSession = storage();
  const ambiguousHarness = buildHarness({
    sessionStorage: ambiguousSession,
    fetchImplementation: async () => {
      ambiguousRequests += 1;
      throw new Error('network timeout');
    }
  });
  await ambiguousHarness.submit();
  assert.strictEqual(ambiguousRequests, 1, 'Ambiguous browser error allowed an unsafe repeat request');
  assert.strictEqual(ambiguousHarness.button.disabled, true, 'Pending ambiguous submissions must stay disabled');
  assert.strictEqual(ambiguousHarness.fields['status-message'].textContent, 'Your request is being processed. Please do not submit it again.', 'Ambiguous browser status message is incorrect');

  const restoredHarness = buildHarness({
    sessionStorage: ambiguousSession,
    fetchImplementation: async () => {
      throw new Error('should not fetch while pending');
    }
  });
  assert.strictEqual(restoredHarness.button.disabled, true, 'Pending state was not restored after refresh');
  assert.strictEqual(restoredHarness.fields['submission_id'].value, ambiguousHarness.fields['submission_id'].value, 'Pending submission ID was not preserved');

  const invalidHarness = buildHarness({
    sessionStorage: storage(),
    fetchImplementation: async () => {
      throw new Error('validation should prevent outbound request');
    },
    overrides: {
      lead_firstname: {
        id: 'lead_firstname',
        name: 'lead[firstname]',
        value: 'J',
        disabled: false,
        textContent: '',
        classList: classList(),
        addEventListener: () => {},
        dispatchEvent: () => {},
        focus: () => {}
      }
    }
  });
  await invalidHarness.submit();
  assert.strictEqual(invalidHarness.button.disabled, false, 'Validation failures should not lock the form permanently');
});

test('A. concurrent duplicate submissions: one winner, all losers return before vendor calls', async () => {
  const originalSubmissionFlag = process.env.LEAD_SUBMISSION_ENABLED;
  process.env.LEAD_SUBMISSION_ENABLED = 'true';
  try {
    for (let iteration = 0; iteration < 20; iteration += 1) {
      const shared = { setJsonCalls: 0 };
      const atomicStore = {
        setJSON: async (key, value, opts) => {
          if (opts && opts.onlyIfNew === true) {
            shared.setJsonCalls += 1;
            if (shared.setJsonCalls === 1) {
              return { modified: true, etag: 'etag-owner' };
            }
            return { modified: false, etag: 'etag-loser' };
          }
          return { modified: true, etag: 'etag-commit' };
        },
        getWithMetadata: async () => ({
          data: {
            submissionId: 'same-submission-id-123456',
            state: 'processing',
            response: null,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
          },
          etag: 'etag-owner'
        })
      };

      let leadHoopCalls = 0;
      let prePingCalls = 0;
      global.fetch = async (url) => {
        const target = String(url || '');
        if (target.includes('/v1/pings')) {
          prePingCalls += 1;
        }
        if (target.includes('/incoming/leads')) {
          leadHoopCalls += 1;
        }
        return { ok: true, json: async () => ({ ping_id: 'ping-123' }) };
      };

      const responses = await withBlobStore(() => atomicStore, async (handler) => Promise.all([
        handler({ httpMethod: 'POST', body: makeBaseLead(), headers: { host: 'example.com', origin: 'https://example.com', 'x-nf-request-id': 'req-1' } }),
        handler({ httpMethod: 'POST', body: makeBaseLead(), headers: { host: 'example.com', origin: 'https://example.com', 'x-nf-request-id': 'req-2' } }),
        handler({ httpMethod: 'POST', body: makeBaseLead(), headers: { host: 'example.com', origin: 'https://example.com', 'x-nf-request-id': 'req-3' } }),
        handler({ httpMethod: 'POST', body: makeBaseLead(), headers: { host: 'example.com', origin: 'https://example.com', 'x-nf-request-id': 'req-4' } })
      ]));

      assert.strictEqual(shared.setJsonCalls, 4, 'Every concurrent handler should attempt the atomic reservation once');
      assert.strictEqual(prePingCalls, 1, 'The concurrent winner should perform exactly one pre-ping');
      assert.strictEqual(leadHoopCalls, 1, 'The concurrent winner must be the only request that reaches the final LeadHoop post');
      assert.strictEqual(responses.filter((result) => result.statusCode === 200).length, 1, 'Exactly one concurrent request should win the reservation');
      assert.strictEqual(responses.filter((result) => result.statusCode === 202 || JSON.parse(result.body).outcome === 'pending').length, 3, 'The remaining concurrent requests must return duplicate or pending responses');
      assert.ok(responses.every((result) => result.statusCode === 200 || result.statusCode === 202), 'Losing requests must exit before any outbound vendor side effect');
    }
  } finally {
    if (originalSubmissionFlag === undefined) delete process.env.LEAD_SUBMISSION_ENABLED; else process.env.LEAD_SUBMISSION_ENABLED = originalSubmissionFlag;
  }
});

test('B. reservation-store exception returns protected pending', async () => {
  const originalSubmissionFlag = process.env.LEAD_SUBMISSION_ENABLED;
  process.env.LEAD_SUBMISSION_ENABLED = 'true';
  try {
    await withBlobStore(() => ({
      setJSON: async () => { throw new Error('blob store down'); }
    }), async (handler) => {
      let leadHoopCalls = 0;
      let prePingCalls = 0;
      global.fetch = async (url) => {
        const target = String(url || '');
        if (target.includes('/v1/pings')) prePingCalls += 1;
        if (target.includes('/incoming/leads')) leadHoopCalls += 1;
        return { ok: true, json: async () => ({ ping_id: 'ping-err' }) };
      };

      const result = await handler({
        httpMethod: 'POST',
        body: makeBaseLead(),
        headers: { host: 'example.com', origin: 'https://example.com', 'x-nf-request-id': 'req-store-fail' }
      });

      assert.strictEqual(result.statusCode, 503, 'Blob-store errors must return HTTP 503');
      assert.strictEqual(JSON.parse(result.body).outcome, 'pending', 'Blob-store errors must produce a pending outcome');
      assert.strictEqual(JSON.parse(result.body).retryable, false, 'Blob-store errors must be non-retryable and protected');
      assert.strictEqual(leadHoopCalls, 0, 'Blob-store errors must make zero LeadHoop calls');
      assert.strictEqual(prePingCalls, 0, 'Blob-store errors must make zero pre-ping calls');
    });
  } finally {
    if (originalSubmissionFlag === undefined) delete process.env.LEAD_SUBMISSION_ENABLED; else process.env.LEAD_SUBMISSION_ENABLED = originalSubmissionFlag;
  }
});

test('C. indeterminate follow-up read returns protected pending', async () => {
  const originalSubmissionFlag = process.env.LEAD_SUBMISSION_ENABLED;
  process.env.LEAD_SUBMISSION_ENABLED = 'true';
  try {
    await withBlobStore(() => ({
      setJSON: async (key, value, opts) => {
        if (opts && opts.onlyIfNew === true) return { modified: false, etag: 'etag-lookup-fail' };
        return { modified: true, etag: 'etag-commit' };
      },
      getWithMetadata: async () => { throw new Error('lookup failure'); }
    }), async (handler) => {
      let leadHoopCalls = 0;
      global.fetch = async (url) => {
        const target = String(url || '');
        if (target.includes('/incoming/leads')) leadHoopCalls += 1;
        return { ok: true, json: async () => ({ ping_id: 'ping-lookup' }) };
      };

      const result = await handler({
        httpMethod: 'POST',
        body: makeBaseLead(),
        headers: { host: 'example.com', origin: 'https://example.com', 'x-nf-request-id': 'req-lookup-fail' }
      });

      assert.strictEqual(result.statusCode, 503, 'Uncertain storage reads must return HTTP 503');
      assert.strictEqual(JSON.parse(result.body).outcome, 'pending', 'Uncertain reads must produce a pending outcome');
      assert.strictEqual(leadHoopCalls, 0, 'Uncertain reads must not call LeadHoop');
    });
  } finally {
    if (originalSubmissionFlag === undefined) delete process.env.LEAD_SUBMISSION_ENABLED; else process.env.LEAD_SUBMISSION_ENABLED = originalSubmissionFlag;
  }
});

test('D. completed duplicate returns the preserved safe outcome', async () => {
  const originalSubmissionFlag = process.env.LEAD_SUBMISSION_ENABLED;
  process.env.LEAD_SUBMISSION_ENABLED = 'true';
  try {
    await withBlobStore(() => ({
      setJSON: async (key, value, opts) => {
        if (opts && opts.onlyIfNew === true) return { modified: false, etag: 'etag-done' };
        return { modified: true, etag: 'etag-commit' };
      },
      getWithMetadata: async () => ({
        data: {
          submissionId: 'same-submission-id-123456',
          state: 'completed',
          response: { outcome: 'accepted', location: '/thank-you/' },
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        },
        etag: 'etag-done'
      })
    }), async (handler) => {
      let leadHoopCalls = 0;
      global.fetch = async (url) => {
        const target = String(url || '');
        if (target.includes('/incoming/leads')) leadHoopCalls += 1;
        return { ok: true, json: async () => ({ ping_id: 'ping-duplicate' }) };
      };

      const result = await handler({
        httpMethod: 'POST',
        body: makeBaseLead(),
        headers: { host: 'example.com', origin: 'https://example.com', 'x-nf-request-id': 'req-completed' }
      });

      assert.strictEqual(leadHoopCalls, 0, 'Completed duplicates must not trigger LeadHoop');
      assert.strictEqual(result.statusCode, 200, 'Completed duplicates must preserve the safe success response');
      assert.strictEqual(JSON.parse(result.body).outcome, 'accepted', 'Completed duplicates must return the recorded success payload');
    });
  } finally {
    if (originalSubmissionFlag === undefined) delete process.env.LEAD_SUBMISSION_ENABLED; else process.env.LEAD_SUBMISSION_ENABLED = originalSubmissionFlag;
  }
});
