(function () {
  'use strict';

  function normalizePhone(value) {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (!/^\+?[\d\s().-]+$/.test(text)) return null;
    const digits = text.replace(/\D/g, '');
    let normalized = null;
    if (digits.length === 10 && text.charAt(0) !== '+') normalized = digits;
    else if (digits.length === 11 && digits.charAt(0) === '1') normalized = digits.slice(1);
    return normalized && normalized.charAt(0) !== '1' ? normalized : null;
  }

  const SOUTH_PHONE = Object.freeze({
    MESSAGE: 'Phone number is not valid',
    normalize: normalizePhone
  });
  window.SOUTH_PHONE = SOUTH_PHONE;

  const form = document.getElementById('leadform');
  if (!form) return;

  const endpoint = '/.netlify/functions/submit-lead';
  let submissionInProgress = false;
  let submissionHandled = false;
  let submissionId = '';
  const pendingStorageKey = 'southLeadSubmissionState';
  const pendingRetentionMs = 24 * 60 * 60 * 1000;
  const genericError = 'We’re unable to process your request at this time. Please try again shortly.';
  const ambiguousError = 'Your request is being processed. Please do not submit it again.';

  if (!form.dataset) form.dataset = {};
  if (form.dataset.submissionHandlerBound === 'true') return;
  form.dataset.submissionHandlerBound = 'true';

  function createSubmissionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const values = new Uint32Array(4);
      window.crypto.getRandomValues(values);
      return 'south-' + Array.from(values, function (value) { return value.toString(16).padStart(8, '0'); }).join('');
    }
    return 'south-' + Date.now() + '-' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }

  function persistSubmissionState(state) {
    try {
      sessionStorage.setItem(pendingStorageKey, JSON.stringify({
        submissionId,
        state,
        expiresAt: Date.now() + pendingRetentionMs
      }));
    } catch (error) {}
  }

  function clearSubmissionState() {
    try { sessionStorage.removeItem(pendingStorageKey); } catch (error) {}
  }

  function restoreSubmissionState() {
    let stored;
    try { stored = JSON.parse(sessionStorage.getItem(pendingStorageKey) || 'null'); } catch (error) { stored = null; }
    if (!stored || !/^[A-Za-z0-9][A-Za-z0-9_-]{15,127}$/.test(String(stored.submissionId || '')) ||
        !Number.isFinite(stored.expiresAt) || stored.expiresAt <= Date.now()) {
      clearSubmissionState();
      return;
    }
    submissionId = stored.submissionId;
    const submissionField = document.getElementById('submission_id');
    if (submissionField) submissionField.value = submissionId;
    if (stored.state !== 'pending') return;
    submissionInProgress = true;
    submissionHandled = true;
    const button = document.getElementById('submitButton');
    if (button) {
      button.disabled = true;
      button.textContent = 'Processing...';
    }
    displayStatus(ambiguousError, 'error');
  }

  function setError(elementId, message) {
    const target = document.getElementById(elementId);
    if (!target) return;
    target.textContent = message || '';
    target.classList.toggle('is-error', Boolean(message));
  }

  function displayStatus(message, type) {
    const status = document.getElementById('status-message');
    if (!status) return;
    status.textContent = message;
    status.className = 'status-message' + (type === 'error' ? ' is-error' : '');
  }

  function resolveLeadIdValue() {
    const field = document.getElementById('leadid_token');
    const candidates = [
      field && field.value,
      window.leadid_token,
      window.leadiD,
      window.leadId,
      window.LeadID,
      window.__leadid,
      document.querySelector('input[name="lead[service_leadid]"]') && document.querySelector('input[name="lead[service_leadid]"]').value
    ];
    for (const candidate of candidates) {
      const value = String(candidate || '').trim();
      if (value) return value;
    }
    return '';
  }

  function syncLeadIdField() {
    const field = document.getElementById('leadid_token');
    if (!field) return false;
    const value = resolveLeadIdValue();
    if (!value) return false;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function captureAttribution() {
    const params = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'campaign_id'].forEach(function (key) {
      const field = document.getElementById(key);
      const value = params.get(key);
      if (field && value) field.value = value.slice(0, 250);
    });
    const clickId = params.get('fbclid');
    const clickField = document.getElementById('subid4');
    let storedClickId = clickId;
    try {
      storedClickId = clickId || sessionStorage.getItem('fbclid') || localStorage.getItem('fbclid');
      if (clickId) {
        sessionStorage.setItem('fbclid', clickId.slice(0, 250));
        localStorage.setItem('fbclid', clickId.slice(0, 250));
      }
    } catch (error) {
      storedClickId = clickId;
    }
    const cookieValue = function (name) {
      const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : '';
    };
    let fbc = cookieValue('_fbc');
    let fbp = cookieValue('_fbp');
    try {
      fbc = fbc || sessionStorage.getItem('fbc') || localStorage.getItem('fbc');
      fbp = fbp || sessionStorage.getItem('fbp') || localStorage.getItem('fbp');
    } catch (error) {
      fbc = fbc || '';
      fbp = fbp || '';
    }
    if (!fbc && storedClickId) {
      fbc = 'fb.1.' + Date.now() + '.' + storedClickId;
      document.cookie = '_fbc=' + encodeURIComponent(fbc) + '; path=/; max-age=7776000; SameSite=Lax';
    }
    const fbcField = document.getElementById('subid2');
    const fbpField = document.getElementById('subid3');
    if (fbcField && fbc) fbcField.value = fbc.slice(0, 500);
    if (fbpField && fbp) fbpField.value = fbp.slice(0, 500);
    if (clickField && storedClickId) clickField.value = storedClickId.slice(0, 500);
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
  }

  async function hydrateProgramSelection() {
    const select = document.getElementById('lead_education_program_id');
    if (!select) return false;
    select.disabled = true;
    try {
      const programs = await window.SOUTH_PROGRAM_AVAILABILITY.loadPrograms();
      window.SOUTH_PROGRAM_AVAILABILITY.populateSelect(select, programs);
      const cardList = document.getElementById('program-card-list');
      if (cardList) {
        window.SOUTH_PROGRAM_AVAILABILITY.renderCards(cardList, programs);
        cardList.querySelectorAll('[data-program-id]').forEach(function (link) {
          link.addEventListener('click', function (event) {
            event.preventDefault();
            const programId = String(link.dataset.programId || '');
            if (!programs.some(function (program) { return program.program_id === programId; })) return;
            select.value = programId;
            sessionStorage.setItem('southProgramId', programId);
            updateStep(1);
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            select.focus({ preventScroll: true });
          });
        });
      }
      const storedProgram = sessionStorage.getItem('southProgramId');
      if (storedProgram && programs.some(function (program) { return program.program_id === storedProgram; })) {
        select.value = storedProgram;
      } else {
        sessionStorage.removeItem('southProgramId');
      }
      select.addEventListener('change', function () {
        if (select.value) sessionStorage.setItem('southProgramId', select.value);
      });
      return true;
    } catch (error) {
      setError('step1-error', 'We’re unable to load program options at this time. Please try again shortly.');
      const nextButton = form.querySelector('[data-next-step="2"]');
      const loadError = document.getElementById('program-load-error');
      if (loadError) loadError.textContent = 'Program options are currently unavailable. Please try again shortly.';
      if (nextButton) nextButton.disabled = true;
      return false;
    }
  }

  const SOUTH_US_STATE_CODES = Object.freeze([
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
    const text = normalizeLocationValue(value).toUpperCase();
    return SOUTH_US_STATE_CODES.includes(text);
  }

  function isValidZipCode(value) {
    return /^\d{5}$/.test(normalizeLocationValue(value));
  }

  function trimLocationFields() {
    const addressVisible = document.getElementById('lead_address_address_visible');
    const addressHidden = document.getElementById('lead_address_address');
    const city = document.getElementById('lead_address_city');
    const state = document.getElementById('lead_address_state');
    const zip = document.getElementById('lead_address_zip');

    if (addressVisible) {
      const value = normalizeLocationValue(addressVisible.value);
      addressVisible.value = value;
      if (addressHidden) addressHidden.value = value;
    }
    if (city) city.value = normalizeLocationValue(city.value);
    if (state) state.value = normalizeLocationValue(state.value).toUpperCase();
    if (zip) zip.value = normalizeLocationValue(zip.value);
  }

  window.SOUTH_ADDRESS_VALIDATION = Object.freeze({
    isValidStreetAddress,
    isValidCity,
    isValidStateCode,
    isValidZipCode,
    trimLocationFields
  });

  function validateStepOne() {
    const field = document.getElementById('lead_education_program_id');
    if (field && field.value) {
      setError('step1-error', '');
      return true;
    }
    setError('step1-error', 'Please select a program before continuing.');
    if (field) field.focus();
    return false;
  }

  function validateStepTwo() {
    const checks = [
      ['lead_education_grad_year', 'Please select your graduation year.', 'grad-year-error', function (value) {
        return Boolean(window.SOUTH_GRADUATION_YEARS && window.SOUTH_GRADUATION_YEARS.isValid(value));
      }],
      ['lead_education_education_level_id', 'Please select your highest level of education.', 'education-error', function (value) { return Boolean(value); }],
      ['lead_address_address_visible', 'Please enter a valid street address', 'addressValidationMessage', isValidStreetAddress],
      ['lead_address_city', 'Please enter a valid city', 'city-error', isValidCity],
      ['lead_address_state', 'Please select your state.', 'state-error', isValidStateCode],
      ['lead_address_zip', 'Please enter a valid 5-digit ZIP code', 'zip-error', isValidZipCode]
    ];
    for (const check of checks) {
      const field = document.getElementById(check[0]);
      const value = field ? normalizeLocationValue(field.value) : '';
      const valid = check[3] ? check[3](value) : Boolean(value);
      if (!valid) {
        if (check[2]) setError(check[2], check[1]);
        if (field) field.focus();
        return false;
      }
      if (check[2]) setError(check[2], '');
      if (field && ['lead_address_address_visible', 'lead_address_city', 'lead_address_zip'].includes(field.id)) {
        field.value = value;
      }
    }
    trimLocationFields();
    return true;
  }

  function validateStepThree() {
    const checks = [
      ['lead_firstname', 'Please enter your first name.', 'first-name-error', function (value) { return value.length >= 2; }],
      ['lead_lastname', 'Please enter your last name.', 'last-name-error', function (value) { return value.length >= 2; }],
      ['lead_email', 'Please enter a valid email address.', 'email-error', function (value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }],
      ['lead_phone1', SOUTH_PHONE.MESSAGE, 'phone-error', function (value) { return SOUTH_PHONE.normalize(value) !== null; }]
    ];
    for (const check of checks) {
      const field = document.getElementById(check[0]);
      const value = field ? String(field.value || '').trim() : '';
      if (!check[3](value)) {
        setError(check[2], check[1]);
        if (field) field.focus();
        return false;
      }
      setError(check[2], '');
    }
    const phoneField = document.getElementById('lead_phone1');
    if (phoneField) phoneField.value = SOUTH_PHONE.normalize(String(phoneField.value || '').trim()) || '';
    setError('consent-error', '');
    return true;
  }

  function updateStep(stepNumber) {
    Array.from(form.querySelectorAll('.form-step[data-step]')).forEach(function (step) {
      const visible = Number(step.dataset.step) === Number(stepNumber);
      step.classList.toggle('is-visible', visible);
      step.classList.toggle('hidden', !visible);
    });
    displayStatus('', '');
  }

  function setAddressValue() {
    const visible = document.getElementById('lead_address_address_visible');
    const hidden = document.getElementById('lead_address_address');
    if (!visible || !hidden) return;
    visible.addEventListener('input', function () {
      hidden.value = visible.value;
      const text = normalizeLocationValue(visible.value);
      if (text && isValidStreetAddress(text)) {
        setError('addressValidationMessage', '');
      } else if (text) {
        setError('addressValidationMessage', 'Please enter a valid street address');
      }
    });
  }

  function wireNavigation() {
    form.querySelectorAll('[data-next-step]').forEach(function (button) {
      button.addEventListener('click', function () {
        const current = Number(form.querySelector('.form-step.is-visible').dataset.step);
        const valid = current === 1 ? validateStepOne() : validateStepTwo();
        if (!valid) return;
        updateStep(Number(button.dataset.nextStep));
        const nextField = form.querySelector('.form-step.is-visible input, .form-step.is-visible select');
        if (nextField) nextField.focus();
      });
    });
    form.querySelectorAll('[data-back-step]').forEach(function (button) {
      button.addEventListener('click', function () { updateStep(Number(button.dataset.backStep)); });
    });
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const visibleStep = form.querySelector('.form-step.is-visible');
    const addressInput = document.getElementById('lead_address_address_visible');
    if (visibleStep && visibleStep.dataset.step === '2' && document.activeElement === addressInput) return;
    if (submissionInProgress || submissionHandled) return;
    if (!validateStepTwo()) {
      updateStep(2);
      return;
    }
    trimLocationFields();
    if (!validateStepThree()) return;

    const leadIdField = document.getElementById('leadid_token');
    if (!leadIdField || !String(leadIdField.value || '').trim()) {
      syncLeadIdField();
      if (!leadIdField || !String(leadIdField && leadIdField.value || '').trim()) {
        displayStatus('Your session is still preparing your lead identification. Please wait a moment and try again.', 'error');
        return;
      }
    }

    if (!submissionId) {
      submissionId = createSubmissionId();
      const submissionField = document.getElementById('submission_id');
      if (submissionField) submissionField.value = submissionId;
    }
    persistSubmissionState('pending');
    submissionInProgress = true;
    const button = document.getElementById('submitButton');
    if (button) {
      button.disabled = true;
      button.textContent = 'Submitting...';
    }
    displayStatus('', '');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams(new FormData(form)).toString(),
        credentials: 'same-origin',
        redirect: 'error'
      });
      const result = await response.json();

      if (result && result.outcome === 'pending') {
        submissionInProgress = true;
        submissionHandled = true;
        persistSubmissionState('pending');
        if (button) {
          button.disabled = true;
          button.textContent = 'Processing...';
        }
        displayStatus(ambiguousError, 'error');
        return;
      }

      if (result && result.outcome === 'unavailable' && result.retryable === true) {
        clearSubmissionState();
        submissionInProgress = false;
        submissionHandled = false;
        if (button) {
          button.disabled = false;
          button.textContent = 'Request Info';
        }
        displayStatus(genericError, 'error');
        return;
      }

      if (result && result.outcome === 'unavailable' && result.retryable === false) {
        submissionInProgress = true;
        submissionHandled = true;
        persistSubmissionState('pending');
        if (button) {
          button.disabled = true;
          button.textContent = 'Processing...';
        }
        displayStatus(ambiguousError, 'error');
        return;
      }

      if (response.ok && (result.outcome === 'accepted' || result.outcome === 'failed') && result.location) {
        submissionHandled = true;
        clearSubmissionState();
        const eventId = String(document.getElementById('meta_event_id').value || '');
        form.reset();
        sessionStorage.removeItem('southProgramId');
        updateStep(4);
        if (result.outcome === 'accepted') {
          window.dispatchEvent(new CustomEvent('south:lead-accepted', { detail: { eventId } }));
        }
        window.setTimeout(function () { window.location.assign(result.location); }, 3000);
        return;
      }
      throw new Error('Unable to complete request');
    } catch (error) {
      submissionInProgress = true;
      submissionHandled = true;
      persistSubmissionState('pending');
      displayStatus(ambiguousError, 'error');
      if (button) {
        button.disabled = true;
        button.textContent = 'Processing...';
      }
    }
  });

  async function initialize() {
    const phone = document.getElementById('lead_phone1');
    if (phone) {
      phone.setAttribute('type', 'tel');
      phone.setAttribute('inputmode', 'tel');
      phone.setAttribute('autocomplete', 'tel');
      phone.removeAttribute('maxlength');
      phone.removeAttribute('pattern');
      phone.addEventListener('input', function () { /* Preserve the full typed value until validation */ });
    }
    const consentField = document.getElementById('lead_consent_tcpa_consent');
    if (consentField && !consentField.value) consentField.value = 'Y';
    const leadIdField = document.getElementById('leadid_token');
    if (leadIdField) {
      const syncLeadIdTimer = window.setInterval(function () {
        if (syncLeadIdField()) {
          window.clearInterval(syncLeadIdTimer);
        }
      }, 250);
      window.setTimeout(function () { window.clearInterval(syncLeadIdTimer); }, 15000);
    }
    const eventField = document.getElementById('meta_event_id');
    if (eventField && !eventField.value) {
      eventField.value = window.crypto && typeof window.crypto.randomUUID === 'function' ? window.crypto.randomUUID() :
        'south-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    }
    restoreSubmissionState();
    captureAttribution();
    setAddressValue();
    ['lead_address_city', 'lead_address_state', 'lead_address_zip'].forEach(function (fieldId) {
      const field = document.getElementById(fieldId);
      if (!field) return;
      const errorId = fieldId === 'lead_address_city' ? 'city-error' : fieldId === 'lead_address_state' ? 'state-error' : 'zip-error';
      field.addEventListener('input', function () {
        const value = normalizeLocationValue(field.value);
        const valid = fieldId === 'lead_address_city' ? isValidCity(value) : fieldId === 'lead_address_state' ? isValidStateCode(value) : isValidZipCode(value);
        if (value && valid) setError(errorId, '');
        if (fieldId === 'lead_address_state' && !value) setError(errorId, 'Please select your state.');
      });
    });
    if (window.SOUTH_GRADUATION_YEARS) {
      window.SOUTH_GRADUATION_YEARS.populateSelect(document.getElementById('lead_education_grad_year'));
    }
    wireNavigation();
    updateStep(1);
    await hydrateProgramSelection();
  }

  initialize();
})();
