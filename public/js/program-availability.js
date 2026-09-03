(function () {
  'use strict';

  const approvedPrograms = [
    ['114281', 'Psychology'],
    ['114282', 'Business Administration'],
    ['114283', 'Accounting'],
    ['114284', 'Criminal Justice'],
    ['114286', 'Healthcare Management'],
    ['114266', 'Information Technology'],
    ['114273', 'Legal Studies'],
    ['114268', 'Public Health']
  ].map(function (entry, index) {
    return { program_id: entry[0], program_name: entry[1], active: true, display_order: index + 1 };
  });
  let cachedPrograms = null;

  function validatePrograms(value) {
    if (!Array.isArray(value) || value.length === 0) throw new Error('Program configuration is unavailable.');
    const ids = new Set();
    const orders = new Set();
    value.forEach(function (program) {
      if (!program || !/^\d+$/.test(String(program.program_id || ''))) throw new Error('Program configuration contains an invalid ID.');
      if (!String(program.program_name || '').trim()) throw new Error('Program configuration contains a blank name.');
      if (typeof program.active !== 'boolean') throw new Error('Program configuration contains an invalid active value.');
      if (!Number.isInteger(program.display_order) || program.display_order < 1) throw new Error('Program configuration contains an invalid display order.');
      if (ids.has(String(program.program_id))) throw new Error('Program configuration contains a duplicate ID.');
      if (orders.has(program.display_order)) throw new Error('Program configuration contains a duplicate display order.');
      ids.add(String(program.program_id));
      orders.add(program.display_order);
    });
    const active = value.filter(function (program) { return program.active; }).sort(function (left, right) {
      return left.display_order - right.display_order;
    });
    if (active.length === 0) throw new Error('No program options are available.');
    return active;
  }

  async function loadPrograms() {
    if (cachedPrograms) return cachedPrograms.slice();
    cachedPrograms = validatePrograms(approvedPrograms);
    return cachedPrograms.slice();
  }

  function populateSelect(select, programs) {
    if (!select) return;
    select.replaceChildren(new Option('Please Select', '', true, false));
    select.options[0].disabled = true;
    programs.forEach(function (program) {
      select.add(new Option(program.program_name, program.program_id));
    });
    select.disabled = false;
  }

  function renderCards(container, programs) {
    if (!container) return;
    container.replaceChildren();
    programs.forEach(function (program) {
      const column = document.createElement('div');
      column.className = 'col-md-6 col-lg-3';
      const card = document.createElement('div');
      card.className = 'program-card';
      const heading = document.createElement('h3');
      heading.className = 'program-title';
      heading.textContent = program.program_name;
      const link = document.createElement('a');
      link.href = '#leadform';
      link.dataset.programId = program.program_id;
      link.className = 'btn btn-primary';
      link.textContent = 'Get More Info';
      card.append(heading, link);
      column.appendChild(card);
      container.appendChild(column);
    });
  }

  window.SOUTH_PROGRAM_AVAILABILITY = { loadPrograms, populateSelect, renderCards, validatePrograms };
})();
