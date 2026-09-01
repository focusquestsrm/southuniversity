(function () {
  'use strict';

  const programs = [
    { program_id: '114281', program_name: 'B.A. - Psychology', active: true, display_order: 1 },
    { program_id: '114282', program_name: 'B.B.A. - Business Administration', active: true, display_order: 2 },
    { program_id: '114283', program_name: 'B.S. - Accounting', active: true, display_order: 3 },
    { program_id: '114284', program_name: 'B.S. - Criminal Justice', active: true, display_order: 4 },
    { program_id: '114286', program_name: 'B.S. - Healthcare Management', active: true, display_order: 5 },
    { program_id: '114266', program_name: 'B.S. - Information Technology', active: true, display_order: 6 },
    { program_id: '114273', program_name: 'B.S. - Legal Studies', active: true, display_order: 7 },
    { program_id: '114268', program_name: 'B.S. - Public Health', active: true, display_order: 8 }
  ];

  function loadPrograms() {
    return Promise.resolve(programs.slice());
  }

  function populateSelect(select, availablePrograms) {
    if (!select) return;
    select.replaceChildren(new Option('Please Select', '', true, false));
    select.options[0].disabled = true;
    availablePrograms.forEach(function (program) {
      select.add(new Option(program.program_name, program.program_id));
    });
    select.disabled = false;
  }

  function renderCards(container, availablePrograms) {
    if (!container) return;
    container.replaceChildren();
    availablePrograms.forEach(function (program) {
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

  window.SOUTH_PROGRAM_AVAILABILITY = { loadPrograms, populateSelect, renderCards };
})();
