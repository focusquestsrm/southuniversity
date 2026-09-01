(function (root, factory) {
  'use strict';

  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SOUTH_GRADUATION_YEARS = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const MINIMUM_YEAR = 1985;
  const MAXIMUM_YEAR = 2025;

  function isValid(value) {
    const normalized = String(value || '').trim();
    if (!/^\d{4}$/.test(normalized)) return false;
    const year = Number(normalized);
    return year >= MINIMUM_YEAR && year <= MAXIMUM_YEAR;
  }

  function populateSelect(select) {
    if (!select) return;
    select.replaceChildren(new Option('Please Select', '', true, false));
    select.options[0].disabled = true;
    for (let year = MAXIMUM_YEAR; year >= MINIMUM_YEAR; year -= 1) {
      select.add(new Option(String(year), String(year)));
    }
  }

  return Object.freeze({
    MINIMUM_YEAR,
    MAXIMUM_YEAR,
    isValid,
    populateSelect
  });
});
