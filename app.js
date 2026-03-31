/* ══════════════════════════════════════
   CR27 — Panel Layout Tool
   Vanilla ES Module — zero dependencies
   ══════════════════════════════════════ */

// ─── Data ───
const WALL_TYPES = ['Sidewall', 'Gable Endwall'];
const PANEL_PROFILES = ['PBR Panel', 'AG Panel', 'Standing Seam', 'Corrugated'];

const WALL_FIELDS = {
  Sidewall: [
    { id: 'wallLength',     label: 'WALL LENGTH',    unit: 'FT' },
    { id: 'wallHeight',     label: 'WALL HEIGHT',    unit: 'FT' },
    { id: 'panelStopHeight',label: 'PANEL STOP HT',  unit: 'FT' },
  ],
  'Gable Endwall': [
    { id: 'wallLength',     label: 'WALL LENGTH',    unit: 'FT' },
    { id: 'leftEaveHeight', label: 'L EAVE HT',      unit: 'FT' },
    { id: 'leftPanelStop',  label: 'L PANEL STOP',    unit: 'FT' },
    { id: 'ridgeHeight',    label: 'RIDGE HT',        unit: 'FT' },
    { id: 'ridgePanelStop', label: 'RIDGE PANEL STOP',unit: 'FT' },
    { id: 'ridgePosition',  label: 'RIDGE POS (L)',   unit: 'FT' },
    { id: 'rightEaveHeight',label: 'R EAVE HT',       unit: 'FT' },
    { id: 'rightPanelStop', label: 'R PANEL STOP',    unit: 'FT' },
  ],
};

const PROFILE_FIELDS = [
  { id: 'panelCoverage', label: 'PANEL COVERAGE', unit: 'IN' },
  { id: 'ribSpacing',    label: 'RIB SPACING',    unit: 'IN' },
  { id: 'startOffset',   label: 'START OFFSET',   unit: 'IN' },
];

const KEYPAD_KEYS = ['1','2','3','4','5','6','7','8','9',"'",'0','"','/','.','\u232B','\u21B5'];

// ─── State ───
const state = {
  wallType: 'Sidewall',
  panelProfile: 'PBR Panel',
  values: {},
  openings: [{ left: '', width: '', height: '', sill: '' }],
  activeField: null,
  showRibs: true,
  collapsed: { wall: false, profile: false, openings: false },
};

// ─── DOM refs (cached after init) ───
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ─── Helpers ───
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') node.className = v;
    else if (k.startsWith('data')) node.setAttribute(k.replace(/([A-Z])/g, '-$1').toLowerCase(), v);
    else if (k === 'textContent') node.textContent = v;
    else if (k === 'innerHTML') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  }
  return node;
}

// ─── Render: Console Input ───
function renderConInput(field) {
  const val = state.values[field.id] || '';
  const wrapper = el('div', { className: 'con-input' }, [
    el('div', { className: 'con-input__header' }, [
      el('label', { className: 'con-label', textContent: field.label }),
      field.unit ? el('span', { className: 'con-unit', textContent: `[${field.unit}]` }) : null,
    ]),
    el('div', { className: `nm-well con-input__well${state.activeField === field.id ? ' focused' : ''}` }, [
      el('span', { className: 'con-input__dot', textContent: '●' }),
      el('input', {
        className: `con-input__field${val ? ' has-value' : ''}`,
        type: 'text',
        inputMode: 'none',
        readonly: '',
        value: val || '—',
        'data-field-id': field.id,
      }),
    ]),
  ]);
  // focus handler on the input
  const inp = $('input', wrapper);
  inp.addEventListener('focus', () => openKeypad(field.id));
  return wrapper;
}

// ─── Render: Wall Fields ───
function renderWallFields() {
  const container = $('#wallFields');
  container.innerHTML = '';
  for (const f of WALL_FIELDS[state.wallType]) {
    container.appendChild(renderConInput(f));
  }
}

// ─── Render: Profile Fields ───
function renderProfileFields() {
  const container = $('#profileFields');
  container.innerHTML = '';
  for (const f of PROFILE_FIELDS) {
    container.appendChild(renderConInput(f));
  }
}

// ─── Render: Openings ───
function renderOpenings() {
  const container = $('#openingsList');
  container.innerHTML = '';
  const fields = ['left', 'width', 'height', 'sill'];

  state.openings.forEach((opening, i) => {
    const fieldsGrid = el('div', { className: 'opening-row__fields' },
      fields.map(f =>
        el('div', { className: 'opening-row__cell' }, [
          el('span', { className: 'opening-row__field-label', textContent: f }),
          el('input', {
            className: 'opening-row__input',
            type: 'text',
            value: opening[f] || '',
            'data-opening-idx': String(i),
            'data-opening-field': f,
          }),
        ])
      )
    );

    const delBtn = el('button', {
      className: 'opening-row__del',
      textContent: 'DEL',
      'data-opening-del': String(i),
    });

    const row = el('div', { className: 'opening-row nm-well' }, [
      el('span', { className: 'opening-row__idx', textContent: String(i + 1).padStart(2, '0') }),
      fieldsGrid,
      delBtn,
    ]);
    container.appendChild(row);
  });

  $('#openingCount').textContent =
    `${state.openings.length} OPENING${state.openings.length !== 1 ? 'S' : ''} DEFINED`;

  // update LED
  const hasData = state.openings.some(o => o.width);
  const led = $('[data-led="openings"]');
  led.className = `led${hasData ? ' led--ok' : ''}`;
}

// ─── Render: Keypad ───
function renderKeypad() {
  const grid = $('#keypadGrid');
  grid.innerHTML = '';
  for (const k of KEYPAD_KEYS) {
    const isAction = k === '\u21B5';
    const isDel = k === '\u232B';
    const cls = `nm-btn keypad-key${isAction ? ' keypad-key--action' : ''}${isDel ? ' keypad-key--del' : ''}`;
    const btn = el('button', { className: cls, textContent: k, 'data-key': k });
    grid.appendChild(btn);
  }
}

// ─── Render: Select dropdown ───
function populateSelect(selectEl, options, current, onSelect) {
  const dropdown = $('.con-select__dropdown', selectEl);
  dropdown.innerHTML = '';
  for (const opt of options) {
    const btn = el('button', {
      className: `con-select__option${opt === current ? ' active' : ''}`,
      innerHTML: `<span class="dot">●</span> ${opt}`,
    });
    btn.addEventListener('click', () => {
      onSelect(opt);
      dropdown.hidden = true;
    });
    dropdown.appendChild(btn);
  }
}

// ─── Keypad logic ───
function openKeypad(fieldId) {
  state.activeField = fieldId;
  const overlay = $('#keypadOverlay');
  overlay.classList.add('open');
  $('#bottomNav').classList.add('hidden');
  updateKeypadDisplay();
  updateAllInputStates();
}

function closeKeypad() {
  state.activeField = null;
  $('#keypadOverlay').classList.remove('open');
  $('#bottomNav').classList.remove('hidden');
  updateAllInputStates();
}

function handleKeyPress(key) {
  if (!state.activeField) return;
  const id = state.activeField;

  if (key === '\u232B') {
    state.values[id] = (state.values[id] || '').slice(0, -1);
  } else if (key === '\u21B5') {
    closeKeypad();
    return;
  } else {
    state.values[id] = (state.values[id] || '') + key;
  }

  updateKeypadDisplay();
  updateFieldValue(id);
  updateStatusIndicators();
}

function updateKeypadDisplay() {
  const id = state.activeField;
  const val = id ? (state.values[id] || '') : '';
  $('#keypadFieldName').textContent = id ? `INPUT → ${id}` : 'INPUT → —';
  $('#keypadValue').textContent = val || '—';
}

function updateFieldValue(fieldId) {
  const inp = $(`[data-field-id="${fieldId}"]`);
  if (!inp) return;
  const val = state.values[fieldId] || '';
  inp.value = val || '—';
  inp.classList.toggle('has-value', !!val);
}

function updateAllInputStates() {
  $$('.con-input__well').forEach(well => {
    const inp = $('input', well);
    if (inp) {
      const id = inp.getAttribute('data-field-id');
      well.classList.toggle('focused', id === state.activeField);
    }
  });
}

// ─── Status indicators ───
function updateStatusIndicators() {
  const wallFields = WALL_FIELDS[state.wallType];
  const allFields = [...wallFields, ...PROFILE_FIELDS];
  const filled = allFields.filter(f => state.values[f.id]).length;
  const total = allFields.length;
  const status = filled >= total ? 'ok' : filled > 0 ? 'warn' : '';

  // header count
  $('#paramCount').textContent = `${filled}/${total} PARAMS SET`;

  // header LED
  const statusLed = $('#statusLed');
  statusLed.className = `led led--xs${status === 'ok' ? ' led--ok' : status === 'warn' ? ' led--warn' : ''}`;

  // wall card LED
  const wallLed = $('[data-led="wall"]');
  wallLed.className = `led${status === 'ok' ? ' led--ok' : status === 'warn' ? ' led--warn' : ''}`;
}

// ─── Section collapse ───
function toggleSection(name) {
  state.collapsed[name] = !state.collapsed[name];
  const card = $(`[data-section="${name}"]`);
  const body = $(`[data-body="${name}"]`);
  card.classList.toggle('collapsed', state.collapsed[name]);
  body.hidden = state.collapsed[name];
}

// ─── Clock ───
function startClock() {
  const clockEl = $('#clock');
  const tick = () => {
    clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  };
  tick();
  setInterval(tick, 1000);
}

// ─── Init ───
function init() {
  startClock();
  renderWallFields();
  renderProfileFields();
  renderOpenings();
  renderKeypad();
  updateStatusIndicators();

  // Section toggles
  $$('[data-toggle]').forEach(btn => {
    const section = btn.getAttribute('data-toggle');
    // only collapse sections (not the switch toggle)
    if (state.collapsed[section] !== undefined) {
      btn.addEventListener('click', () => toggleSection(section));
    }
  });

  // Wall type select
  const wallSelect = $('[data-select="wallType"]');
  const wallTrigger = $('.con-select__trigger', wallSelect);
  const wallDropdown = $('.con-select__dropdown', wallSelect);
  populateSelect(wallSelect, WALL_TYPES, state.wallType, (val) => {
    state.wallType = val;
    $('[data-select-text]', wallSelect).textContent = val;
    renderWallFields();
    updateStatusIndicators();
  });
  wallTrigger.addEventListener('click', () => {
    wallDropdown.hidden = !wallDropdown.hidden;
  });

  // Panel profile select
  const profileSelect = $('[data-select="panelProfile"]');
  const profileTrigger = $('.con-select__trigger', profileSelect);
  const profileDropdown = $('.con-select__dropdown', profileSelect);
  populateSelect(profileSelect, PANEL_PROFILES, state.panelProfile, (val) => {
    state.panelProfile = val;
    $('[data-select-text]', profileSelect).textContent = val;
  });
  profileTrigger.addEventListener('click', () => {
    profileDropdown.hidden = !profileDropdown.hidden;
  });

  // Toggle switch (ribs)
  const ribToggle = $('[data-toggle-switch="showRibs"]');
  ribToggle.addEventListener('click', () => {
    state.showRibs = !state.showRibs;
    ribToggle.setAttribute('data-on', String(state.showRibs));
    $('.con-toggle__label', ribToggle).textContent = state.showRibs ? 'ON' : 'OFF';
  });

  // Openings — delegate events
  document.addEventListener('click', (e) => {
    // Delete opening
    const delBtn = e.target.closest('[data-opening-del]');
    if (delBtn) {
      const idx = parseInt(delBtn.getAttribute('data-opening-del'));
      state.openings.splice(idx, 1);
      if (state.openings.length === 0) {
        state.openings.push({ left: '', width: '', height: '', sill: '' });
      }
      renderOpenings();
      return;
    }
  });

  document.addEventListener('input', (e) => {
    // Opening field input
    const inp = e.target.closest('[data-opening-idx]');
    if (inp) {
      const idx = parseInt(inp.getAttribute('data-opening-idx'));
      const field = inp.getAttribute('data-opening-field');
      state.openings[idx][field] = inp.value;
      // update LED
      const hasData = state.openings.some(o => o.width);
      $('[data-led="openings"]').className = `led${hasData ? ' led--ok' : ''}`;
    }
  });

  // Add opening
  $('#addOpening').addEventListener('click', () => {
    state.openings.push({ left: '', width: '', height: '', sill: '' });
    renderOpenings();
  });

  // Keypad key presses — delegate
  $('#keypadGrid').addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('[data-key]');
    if (btn) btn.classList.add('nm-btn--pressed');
  });
  $('#keypadGrid').addEventListener('pointerup', (e) => {
    const btn = e.target.closest('[data-key]');
    if (btn) {
      btn.classList.remove('nm-btn--pressed');
      handleKeyPress(btn.getAttribute('data-key'));
    }
  });
  $('#keypadGrid').addEventListener('pointerleave', (e) => {
    const btn = e.target.closest('[data-key]');
    if (btn) btn.classList.remove('nm-btn--pressed');
  }, true);

  // Keypad done
  $('#keypadDone').addEventListener('click', closeKeypad);

  // Bottom nav
  $$('.bottom-nav__item').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.bottom-nav__item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.con-select')) {
      $$('.con-select__dropdown').forEach(d => d.hidden = true);
    }
  });
}

// ─── Boot ───
document.addEventListener('DOMContentLoaded', init);
