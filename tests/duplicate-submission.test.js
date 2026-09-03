'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
      focus: () => {}
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

(async function () {
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

  console.log('duplicate-submission browser tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
