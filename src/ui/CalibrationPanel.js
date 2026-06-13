// src/ui/CalibrationPanel.js
// Right-side slide-in panel with sliders for runtime visual calibration.
import { getAll, set as setCalib, reset as resetCalib, onChange } from './CalibrationStore.js';
import { t } from '../core/i18n.js';

const SECTIONS = [
  {
    titleKey: 'calibration.sections.lighting',
    controls: [
      {
        key: 'ambient',
        labelKey: 'calibration.labels.ambient',
        min: 0,
        max: 2.0,
        step: 0.01,
        precision: 2,
      },
      {
        key: 'keyLight',
        labelKey: 'calibration.labels.keyLight',
        min: 0,
        max: 5.0,
        step: 0.01,
        precision: 2,
      },
      {
        key: 'fillLight',
        labelKey: 'calibration.labels.fillLight',
        min: 0,
        max: 5.0,
        step: 0.01,
        precision: 2,
      },
      {
        key: 'topLight',
        labelKey: 'calibration.labels.topLight',
        min: 0,
        max: 3.0,
        step: 0.01,
        precision: 2,
      },
      {
        key: 'headLight',
        labelKey: 'calibration.labels.headLight',
        min: 0,
        max: 5.0,
        step: 0.01,
        precision: 2,
      },
    ],
  },
  {
    titleKey: 'calibration.sections.toneMapping',
    controls: [
      {
        key: 'exposure',
        labelKey: 'calibration.labels.exposure',
        min: 0.3,
        max: 2.0,
        step: 0.01,
        precision: 2,
      },
    ],
  },
  {
    titleKey: 'calibration.sections.fog',
    controls: [
      {
        key: 'fogDensity',
        labelKey: 'calibration.labels.fogDensity',
        min: 0,
        max: 0.04,
        step: 0.001,
        precision: 3,
      },
      {
        kind: 'rgb',
        labelKey: 'calibration.labels.color',
        keys: { r: 'fogR', g: 'fogG', b: 'fogB' },
        min: 0,
        max: 255,
        step: 1,
        precision: 0,
      },
    ],
  },
  {
    titleKey: 'calibration.sections.overlays',
    controls: [
      {
        key: 'crtOpacity',
        labelKey: 'calibration.labels.crtOpacity',
        min: 0,
        max: 1,
        step: 0.01,
        precision: 2,
      },
      {
        key: 'crtLineAlpha',
        labelKey: 'calibration.labels.crtLineAlpha',
        min: 0,
        max: 1,
        step: 0.01,
        precision: 2,
      },
      {
        kind: 'rgb',
        labelKey: 'calibration.labels.crtColor',
        keys: { r: 'crtLineR', g: 'crtLineG', b: 'crtLineB' },
        min: 0,
        max: 255,
        step: 1,
        precision: 0,
      },
      {
        key: 'vignetteAlpha',
        labelKey: 'calibration.labels.vignetteAlpha',
        min: 0,
        max: 1,
        step: 0.01,
        precision: 2,
      },
      {
        kind: 'rgb',
        labelKey: 'calibration.labels.vignetteColor',
        keys: { r: 'vignetteR', g: 'vignetteG', b: 'vignetteB' },
        min: 0,
        max: 255,
        step: 1,
        precision: 0,
      },
    ],
  },
  {
    titleKey: 'calibration.sections.render',
    controls: [
      {
        key: 'pixelRatio',
        labelKey: 'calibration.labels.pixelRatio',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        precision: 2,
      },
    ],
  },
  {
    titleKey: 'calibration.sections.entities',
    controls: [
      {
        key: 'snakeEmissive',
        labelKey: 'calibration.labels.snakeEmissive',
        min: 0,
        max: 6.0,
        step: 0.1,
        precision: 2,
      },
      {
        key: 'waterOpacity',
        labelKey: 'calibration.labels.waterOpacity',
        min: 0,
        max: 1.0,
        step: 0.01,
        precision: 2,
      },
    ],
  },
];

let panelEl = null;
let toggleBtn = null;
const rowsByKey = new Map();

function fmt(value, precision) {
  return Number(value).toFixed(precision);
}

function buildSliderRow(c) {
  const v = getAll()[c.key];
  const label = t(c.labelKey);
  return `
    <div class="calib-row" data-key="${c.key}">
      <span class="calib-lbl">${label}</span>
      <input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}" aria-label="${label}" tabindex="0">
      <span class="calib-val">${fmt(v, c.precision)}</span>
    </div>
  `;
}

function buildRgbRow(c) {
  const state = getAll();
  const label = t(c.labelKey);
  return `
    <div class="calib-row calib-rgb" data-rgb="${c.keys.r},${c.keys.g},${c.keys.b}">
      <span class="calib-lbl">${label}</span>
      <div class="calib-rgb-channels">
        <label class="calib-rgb-ch">
          <span class="calib-rgb-lbl">R</span>
          <input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[c.keys.r]}" data-channel="r" aria-label="${label} R">
        </label>
        <label class="calib-rgb-ch">
          <span class="calib-rgb-lbl">G</span>
          <input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[c.keys.g]}" data-channel="g" aria-label="${label} G">
        </label>
        <label class="calib-rgb-ch">
          <span class="calib-rgb-lbl">B</span>
          <input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[c.keys.b]}" data-channel="b" aria-label="${label} B">
        </label>
      </div>
      <span class="calib-val calib-rgb-val">${state[c.keys.r]},${state[c.keys.g]},${state[c.keys.b]}</span>
    </div>
  `;
}

function buildRow(c) {
  return c.kind === 'rgb' ? buildRgbRow(c) : buildSliderRow(c);
}

function buildPanel() {
  panelEl.innerHTML = `
    <div class="calib-header">
      <h2>${t('calibration.title')}</h2>
      <button class="calib-close" id="calibClose" type="button" aria-label="${t('calibration.closeLabel')}">✕</button>
    </div>
    <div class="calib-body">
      ${SECTIONS.map(
        (sec) => `
        <section class="calib-section">
          <h3>${t(sec.titleKey)}</h3>
          ${sec.controls.map(buildRow).join('')}
        </section>
      `
      ).join('')}
    </div>
    <button class="calib-reset" id="calibReset" type="button">${t('calibration.reset')}</button>
  `;

  for (const sec of SECTIONS) {
    for (const c of sec.controls) {
      if (c.kind === 'rgb') {
        const row = panelEl.querySelector(
          `.calib-row[data-rgb="${c.keys.r},${c.keys.g},${c.keys.b}"]`
        );
        const inputs = {
          r: row.querySelector('[data-channel="r"]'),
          g: row.querySelector('[data-channel="g"]'),
          b: row.querySelector('[data-channel="b"]'),
        };
        const val = row.querySelector('.calib-rgb-val');
        rowsByKey.set(c.keys.r, { input: inputs.r, display: null, kind: 'slider' });
        rowsByKey.set(c.keys.g, { input: inputs.g, display: null, kind: 'slider' });
        rowsByKey.set(c.keys.b, { input: inputs.b, display: null, kind: 'slider' });
        const update = (ch) => (e) => setCalib(c.keys[ch], parseFloat(e.target.value));
        inputs.r.addEventListener('input', update('r'));
        inputs.g.addEventListener('input', update('g'));
        inputs.b.addEventListener('input', update('b'));
        // Store the val element on each input's row data for the swatch
        inputs.r._rgbVal = val;
        inputs.g._rgbVal = val;
        inputs.b._rgbVal = val;
      } else {
        const row = panelEl.querySelector(`.calib-row[data-key="${c.key}"]`);
        const input = row.querySelector('input[type="range"]');
        const display = row.querySelector('.calib-val');
        rowsByKey.set(c.key, { input, display, precision: c.precision });
        input.addEventListener('input', (e) => {
          setCalib(c.key, parseFloat(e.target.value));
        });
      }
    }
  }

  panelEl.querySelector('#calibClose').addEventListener('click', hide);
  panelEl.querySelector('#calibReset').addEventListener('click', () => {
    resetCalib();
  });
}

function syncFromStore(state) {
  for (const [key, ref] of rowsByKey) {
    if (state[key] !== undefined) {
      if (ref.input && document.activeElement !== ref.input) ref.input.value = state[key];
      if (ref.display) ref.display.textContent = fmt(state[key], ref.precision);
    }
  }
  // Update RGB composite displays
  for (const sec of SECTIONS) {
    for (const c of sec.controls) {
      if (c.kind === 'rgb') {
        const r = state[c.keys.r],
          g = state[c.keys.g],
          b = state[c.keys.b];
        const row = panelEl.querySelector(
          `.calib-row[data-rgb="${c.keys.r},${c.keys.g},${c.keys.b}"]`
        );
        if (!row) continue;
        const val = row.querySelector('.calib-rgb-val');
        if (val) val.textContent = `${r},${g},${b}`;
        const swatch = row.querySelector('.calib-rgb-swatch');
        if (swatch) swatch.style.background = `rgb(${r},${g},${b})`;
      }
    }
  }
}

function isOpen() {
  return panelEl && panelEl.classList.contains('show');
}

export function show() {
  if (!panelEl) return;
  panelEl.classList.add('show');
  panelEl.setAttribute('aria-hidden', 'false');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
}

export function hide() {
  if (!panelEl) return;
  panelEl.classList.remove('show');
  panelEl.setAttribute('aria-hidden', 'true');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
}

export function toggle() {
  isOpen() ? hide() : show();
}

function onKeyDown(e) {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
    if (e.target.type === 'range' && (e.key === 'l' || e.key === 'L')) {
      e.target.blur();
    } else {
      return;
    }
  }
  if (e.key === 'l' || e.key === 'L') {
    e.preventDefault();
    toggle();
  } else if (e.key === 'Escape' && isOpen()) {
    e.preventDefault();
    hide();
  }
}

export function init() {
  panelEl = document.getElementById('calibPanel');
  toggleBtn = document.getElementById('bCalib');
  if (!panelEl) return;
  buildPanel();
  onChange(syncFromStore);
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggle);
  }
  document.addEventListener('keydown', onKeyDown);
}
