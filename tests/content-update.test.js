'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

const headlineText = 'Explore South University’s Online Programs';
const discoverText = 'Discover South University’s Online Degree Programs';
const reviewText = 'Explore South University’s online degree programs';
const sectionHeading = 'Why Choose South University Online?';

const footnotes = [
  ['footnote-1', 'Programs, including all Clinical/Medical programs, have a required in-person clinical, practicum, or externship. We cannot guarantee flexibility in these components of the program.'],
  ['footnote-2', 'South University does not promise or guarantee licensure, employment, or salary amounts.'],
  ['footnote-3', 'Ask to speak with a Financial Aid Advisor for financial aid, scholarships and grants that may be available to those who qualify.']
];

test('Approved South University wording is present in the page copy', () => {
  assert.match(html, new RegExp(headlineText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'Approved headline text is missing');
  assert.match(html, new RegExp(discoverText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'Approved discover text is missing');
  assert.match(html, new RegExp(reviewText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'Approved review text is missing');
});

test('The new value-proposition section and footnotes are present', () => {
  assert.match(html, new RegExp(sectionHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'Value proposition heading is missing');
  assert.match(html, /Online Associate and Bachelor’s Degree Programs/i, 'Approved value proposition is missing');
  assert.match(html, /Flexible Online Learning Experience/i, 'Flexible learning value proposition is missing');
  assert.match(html, /Programs Designed to Match Industry Standards/i, 'Industry standards value proposition is missing');
  assert.match(html, /Grants\s*&(?:amp;)?\s*Scholarships Available to Those Who Qualify/i, 'Scholarship value proposition is missing');

  footnotes.forEach(([id, text]) => {
    assert.match(html, new RegExp(`id="${id}"`, 'i'), `Missing footnote target ${id}`);
    assert.match(html, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'The exact legal footnote text is missing');
  });
});

test('The first visible online reference includes a working footnote link', () => {
  assert.match(html, /South University Online<sup><a[^>]*href="#footnote-1"[^>]*>1<\/a><\/sup>/i, 'The first visible online reference is missing the footnote link');
  assert.match(html, /href="#footnote-1"/i, 'Footnote marker 1 is missing from the page');
});
