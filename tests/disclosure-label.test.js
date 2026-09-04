'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

test('Jornaya no-interaction TCPA disclosure is tagged correctly', () => {
  const hiddenMatch = html.match(/<input[^>]*id="([^"]+)"[^>]*type="hidden"[^>]*data-leadid-type="disclosure"[^>]*>/i);
  assert.ok(hiddenMatch, 'Hidden disclosure input is missing data-leadid-type="disclosure"');

  const inputId = hiddenMatch[1];
  const disclosureText = 'By submitting this form, I acknowledge I am providing my contact information to South University and LaunchYourDegree for purposes related to educational opportunities with South University. I understand that representatives may contact me by phone or text using automated dialing technology, and that I am not required to provide consent to enroll. Calls may be recorded.';
  const labelPattern = new RegExp(`<label[^>]*for="${inputId}"[^>]*>\\s*${disclosureText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</label>`, 'i');
  assert.ok(labelPattern.test(html), 'Disclosure label is missing or does not match the hidden disclosure input');
  assert.ok(!/type="checkbox"[^>]*data-leadid-type="disclosure"/i.test(html), 'A disclosure checkbox should not be present');
  assert.ok(!/lead_consent\[tcpa_consent\]/i.test(html), 'TCPA consent checkbox field should remain absent');
});
