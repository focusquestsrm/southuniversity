'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const programSource = fs.readFileSync(path.join(__dirname, '../public/js/program-availability.js'), 'utf8');

const expectedTitle = 'South University’s Online Programs | Launch Your Degree';
const heroCopy = 'Fill out the form to connect with a representative who can help you explore South University’s online programs';
const oldHeroCopy = 'Fill out the form to connect with a representative who can help you explore South University Online';
const confirmationLines = [
  'Thank you. Your request has been received.',
  "Congratulations. You're one step closer towards your future."
];
const discoverHeading = 'Discover South University’s Online Degree Options';
const whyHeading = 'Why Choose South University’s Online Programs?';
const approvedPrograms = [
  'Allied Health Science (AS)',
  'Medical Assisting (AS)',
  'Paralegal Studies (AS)',
  'Psychology (BA)',
  'Business Administration (BBA)',
  'Accounting (BS)',
  'Criminal Justice (BS)',
  'Healthcare Management (BS)',
  'Information Technology (BS)',
  'Legal Studies (BS)',
  'Public Health (BS)'
];
const approvedProgramIds = [
  '114280',
  '114276',
  '114278',
  '114281',
  '114282',
  '114283',
  '114284',
  '114286',
  '114266',
  '114273',
  '114268'
];

const footnotes = [
  ['footnote-1', 'Programs, including all Clinical/Medical programs, have a required in-person clinical, practicum, or externship. We cannot guarantee flexibility in these components of the program.'],
  ['footnote-2', 'South University does not promise or guarantee licensure, employment, or salary amounts.'],
  ['footnote-3', 'Ask to speak with a Financial Aid Advisor for financial aid, scholarships and grants that may be available to those who qualify.']
];

test('Approved page title and hero copy are present', () => {
  assert.match(html, /<title>South University’s Online Programs \| Launch Your Degree<\/title>/i, 'Approved page title is missing');
  assert.match(html, /Fill out the form to connect with a representative who can help you explore\s+South University’s online programs<sup><a[^>]*href="#footnote-1"[^>]*>1<\/a><\/sup>\./i, 'Approved hero wording is missing');
  assert.doesNotMatch(html, /Fill out the form to connect with a representative who can help you explore\s+South University Online<sup><a[^>]*href="#footnote-1"[^>]*>1<\/a><\/sup>\./i, 'Former hero wording should not appear');
});

test('Confirmation copy uses the approved messaging and no former wording remains', () => {
  confirmationLines.forEach((line) => {
    assert.match(html, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Confirmation line is missing: ${line}`);
  });
  assert.doesNotMatch(html, /a future you deserve/i, 'Former confirmation wording should be absent');
});

test('Program section heading and approved program list are correct', () => {
  assert.match(html, new RegExp(discoverHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'Approved program section heading is missing');
  approvedPrograms.forEach((program) => {
    assert.match(programSource, new RegExp(program.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Program label missing from the program source: ${program}`);
  });
  const orderedMatches = [...programSource.matchAll(/\['(\d+)', '([^']+)'\]/g)].map((match) => match[2]);
  assert.deepEqual(orderedMatches.slice(0, approvedPrograms.length), approvedPrograms, 'Program labels are not in the approved order');
  assert.equal(new Set(orderedMatches).size, approvedPrograms.length, 'Program list contains duplicates');
  assert.equal(approvedProgramIds.length, 11, 'There should be 11 approved campaign programs');
});

test('Get More Info button values retain the existing program IDs', () => {
  approvedProgramIds.forEach((programId) => {
    assert.match(programSource, new RegExp(`\\['${programId}'`, 'i'), `Program ID is missing from the approved list: ${programId}`);
  });
  assert.match(programSource, /link\.dataset\.programId = program\.program_id;/i, 'Program button data binding is missing');
});

test('The internal compliance note is absent from the public HTML', () => {
  assert.doesNotMatch(html, /not all programs are shown/i, 'The internal compliance note should not be visible in public production HTML');
  assert.doesNotMatch(html, /affiliates/i, 'The internal affiliate note should not be public');
});

test('Why Choose section and approved disclosures are present', () => {
  assert.match(html, new RegExp(whyHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'Why Choose heading is missing');
  assert.match(html, /Online Associate and Bachelor’s Degree Programs/i, 'Approved value proposition is missing');
  assert.match(html, /Flexible Online Learning Experience<sup><a[^>]*href="#footnote-1"[^>]*>1<\/a><\/sup>/i, 'Footnote link 1 is missing from the Flexible Learning item');
  assert.match(html, /Programs Designed to Match Industry Standards<sup><a[^>]*href="#footnote-2"[^>]*>2<\/a><\/sup>/i, 'Footnote link 2 is missing from the Standards item');
  assert.match(html, /Grants &amp; Scholarships Available to Those Who Qualify<sup><a[^>]*href="#footnote-3"[^>]*>3<\/a><\/sup>/i, 'Footnote link 3 is missing from the Scholarship item');

  footnotes.forEach(([id, text]) => {
    assert.match(html, new RegExp(`id="${id}"`, 'i'), `Missing footnote target ${id}`);
    assert.match(html, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Missing legal footnote text for ${id}`);
  });
});

test('Explore Your Next Step copy and footer remain approved', () => {
  assert.match(html, /Explore South University’s Online Programs\. Explore South University’s online degree programs and find the option that fits your goals\./i, 'Approved review-your-options copy is missing');
  assert.match(html, /Share your interests to receive additional information about available programs\./i, 'Approved short-form copy is missing');
  assert.match(html, /A representative can help answer questions about the programs you select\./i, 'Approved continue-the-conversation copy is missing');
  assert.match(html, /South University’s online programs/i, 'Footer label is missing');
  assert.match(html, /Powered by Launch Your Degree/i, 'Powered-by label is missing');
});

test('Legal and privacy copy remain intact', () => {
  assert.match(html, /South University is accredited by the Southern Association of Colleges and Schools Commission on Colleges \(SACSCOC\) to award associate, baccalaureate, master’s, and doctorate degrees\./i, 'Accreditation copy is missing');
  assert.match(html, /© 2026 South University\. All rights reserved\./i, 'Copyright copy is missing');
  assert.match(html, /South University’s full <a href="https:\/\/www\.southuniversity\.edu\/compliance\/privacy-and-cookies-policy"/i, 'Privacy policy link is missing');
});