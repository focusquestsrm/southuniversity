'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const runtimeConfig = fs.readFileSync(path.join(__dirname, '../public/js/runtime-config.js'), 'utf8');
const submitLead = fs.readFileSync(path.join(__dirname, '../netlify/functions/submit-lead.js'), 'utf8');

test('Jornaya script configuration is populated from runtime config and not blank', () => {
  assert.match(html, /id="LeadiDscript"/i, 'LeadiD script tag is missing');
  assert.match(html, /jornayaCampaignId|JORNAYA_CAMPAIGN_ID/i, 'Jornaya campaign runtime config is missing');
  assert.doesNotMatch(html, /s\.src\s*=\s*''/i, 'Jornaya script source must not be blank');
  assert.doesNotMatch(html, /s\.src\s*=\s*['"]\s*['"]/i, 'Jornaya script source must not be empty');
});

test('Runtime config exposes the minimum public Jornaya values for the browser', () => {
  assert.match(runtimeConfig, /jornayaCampaignId/i, 'Runtime config is missing the public Jornaya campaign ID');
  assert.doesNotMatch(runtimeConfig, /LEADHOOP|leadhoop|LEAD_SUBMISSION_ENABLED|LEAD_TEST_MODE/i, 'Runtime config must not expose unrelated Netlify secrets or LeadHoop settings');
});

test('The hidden LeadiD field remains present for submission payloads', () => {
  assert.match(html, /name="lead\[service_leadid\]"/i, 'The hidden LeadID field is missing');
  assert.match(html, /id="leadid_token"/i, 'The hidden LeadID field id is missing');
});

test('Test submissions keep the LeadHoop boolean flag in true mode and reject empty LeadiD values', () => {
  assert.match(submitLead, /lead\[test\].*'true'\s*:\s*'true'|lead\[test\].*\?\s*'true'\s*:\s*'false'/i, 'LeadHoop test flag is not set to true when enabled');
  assert.match(submitLead, /lead\[service_leadid\].*trim\(\).*!leadId|if \(!leadId\)/i, 'The server must refuse empty LeadID values before submission');
});
