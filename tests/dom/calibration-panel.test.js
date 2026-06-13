// tests/dom/calibration-panel.test.js
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, clearDOM, registerElement, mockElement } from './setup.js';
import {
  get as getCalib, set as setCalib, reset as resetCalib, onChange, flushSave, DEFAULTS
} from '../../src/ui/CalibrationStore.js';

installDOM();

function setup() {
  clearDOM();
  // The real panel is built dynamically from innerHTML, so the only DOM
  // contract init() needs is two pre-existing nodes with the expected IDs.
  const calibPanel = mockElement('aside');
  const bCalib = mockElement('button');
  registerElement('calibPanel', calibPanel);
  registerElement('bCalib', bCalib);
  return { calibPanel, bCalib };
}

let CP;
let refs;

test('CalibrationPanel module loads', async () => {
  CP = await import('../../src/ui/CalibrationPanel.js');
  refs = setup();
  resetCalib();
  CP.init();
});

test('init() builds the panel DOM with header, body, and reset button', () => {
  assert.ok(refs.calibPanel.querySelector('#calibClose'), 'should have a close button');
  assert.ok(refs.calibPanel.querySelector('#calibReset'), 'should have a reset button');
  assert.ok(refs.calibPanel.querySelector('.calib-header'), 'should have a header section');
  assert.ok(refs.calibPanel.querySelector('.calib-body'), 'should have a body section');
});

test('init() creates one slider per non-RGB control', () => {
  const sliders = refs.calibPanel.querySelectorAll('input[type="range"]');
  // 5 lighting + 1 exposure + 1 fogDensity + 1 crtOpacity + 1 crtLineAlpha +
  // 1 vignetteAlpha + 1 pixelRatio + 1 snakeEmissive + 1 waterOpacity = 13
  // single-channel sliders.
  // Plus 3 fog RGB + 3 crt RGB + 3 vignette RGB = 9 RGB sliders.
  // Total: 22 sliders.
  assert.equal(sliders.length, 22);
});

test('init() lays out all 6 sections with their titles', () => {
  const sections = refs.calibPanel.querySelectorAll('.calib-section');
  assert.equal(sections.length, 6);
  const titles = [...refs.calibPanel.querySelectorAll('.calib-section h3')].map((h) => h.textContent);
  assert.ok(titles.includes('ILUMINACIÓN 3D'));
  assert.ok(titles.includes('TONE MAPPING'));
  assert.ok(titles.includes('NIEBLA'));
  assert.ok(titles.includes('OVERLAYS CSS'));
  assert.ok(titles.includes('RENDER'));
  assert.ok(titles.includes('ENTIDADES'));
});

test('init() sets initial slider values from the calibration store', () => {
  const ambient = refs.calibPanel.querySelector('.calib-row[data-key="ambient"] input[type="range"]');
  assert.ok(ambient);
  assert.equal(Number(ambient.value), DEFAULTS.ambient);
  const exposure = refs.calibPanel.querySelector('.calib-row[data-key="exposure"] input[type="range"]');
  assert.equal(Number(exposure.value), DEFAULTS.exposure);
});

test('Slider input event calls setCalib with the parsed value', () => {
  const slider = refs.calibPanel.querySelector('.calib-row[data-key="ambient"] input[type="range"]');
  slider.value = '0.42';
  slider.dispatchEvent({ type: 'input', target: slider, currentTarget: slider });
  assert.equal(getCalib('ambient'), 0.42);
});

test('RGB slider events call setCalib for each channel', () => {
  // fogR/G/B all share a row identified by data-rgb="fogR,fogG,fogB".
  const row = refs.calibPanel.querySelector('.calib-row[data-rgb="fogR,fogG,fogB"]');
  assert.ok(row, 'fog RGB row should exist');
  const r = row.querySelector('[data-channel="r"]');
  const g = row.querySelector('[data-channel="g"]');
  const b = row.querySelector('[data-channel="b"]');
  r.value = '40'; r.dispatchEvent({ type: 'input', target: r });
  g.value = '50'; g.dispatchEvent({ type: 'input', target: g });
  b.value = '60'; b.dispatchEvent({ type: 'input', target: b });
  assert.equal(getCalib('fogR'), 40);
  assert.equal(getCalib('fogG'), 50);
  assert.equal(getCalib('fogB'), 60);
});

test('RGB composite display updates on setCalib notifications', () => {
  // Mutate the store and let the onChange subscriber (syncFromStore) update DOM.
  setCalib('vignetteR', 100);
  setCalib('vignetteG', 50);
  setCalib('vignetteB', 25);
  const row = refs.calibPanel.querySelector('.calib-row[data-rgb="vignetteR,vignetteG,vignetteB"]');
  const val = row.querySelector('.calib-rgb-val');
  assert.equal(val.textContent, '100,50,25');
});

test('RGB slider input values mirror the store on sync', () => {
  // syncFromStore pushes the store value back into each channel slider's
  // `value` attribute (unless that input is focused). RGB rows are tagged
  // `kind: 'slider'` in the rowsByKey map, so they go through this branch.
  setCalib('fogR', 100);
  const row = refs.calibPanel.querySelector('.calib-row[data-rgb="fogR,fogG,fogB"]');
  const r = row.querySelector('[data-channel="r"]');
  assert.equal(Number(r.value), 100);
});

test('Multiple RGB sliders reflect multiple channel updates', () => {
  setCalib('crtLineR', 200);
  setCalib('crtLineG', 100);
  setCalib('crtLineB', 50);
  const row = refs.calibPanel.querySelector('.calib-row[data-rgb="crtLineR,crtLineG,crtLineB"]');
  assert.equal(Number(row.querySelector('[data-channel="r"]').value), 200);
  assert.equal(Number(row.querySelector('[data-channel="g"]').value), 100);
  assert.equal(Number(row.querySelector('[data-channel="b"]').value), 50);
});

test('show() / hide() / toggle() drive the .show class on the panel', () => {
  assert.ok(!refs.calibPanel.classList.contains('show'), 'starts hidden');
  CP.show();
  assert.ok(refs.calibPanel.classList.contains('show'));
  assert.equal(refs.calibPanel.getAttribute('aria-hidden'), 'false');
  CP.hide();
  assert.ok(!refs.calibPanel.classList.contains('show'));
  assert.equal(refs.calibPanel.getAttribute('aria-hidden'), 'true');
  CP.toggle();
  assert.ok(refs.calibPanel.classList.contains('show'));
  CP.toggle();
  assert.ok(!refs.calibPanel.classList.contains('show'));
});

test('show()/hide() update aria-expanded on the toggle button', () => {
  CP.show();
  assert.equal(refs.bCalib.getAttribute('aria-expanded'), 'true');
  CP.hide();
  assert.equal(refs.bCalib.getAttribute('aria-expanded'), 'false');
});

test('Reset button calls resetCalib()', () => {
  // First, move some values away from defaults.
  setCalib('ambient', 0.10);
  setCalib('exposure', 1.95);
  assert.notEqual(getCalib('ambient'), DEFAULTS.ambient);
  // Click the reset button.
  const resetBtn = refs.calibPanel.querySelector('#calibReset');
  resetBtn.dispatchEvent({ type: 'click', target: resetBtn, currentTarget: resetBtn });
  assert.equal(getCalib('ambient'), DEFAULTS.ambient);
  assert.equal(getCalib('exposure'), DEFAULTS.exposure);
});

test('Pressing the L key toggles the panel open', () => {
  CP.hide();
  assert.ok(!refs.calibPanel.classList.contains('show'));
  document.dispatchEvent({ type: 'keydown', key: 'l', target: document.body, preventDefault() {} });
  assert.ok(refs.calibPanel.classList.contains('show'));
});

test('Pressing ESC closes the panel when open', () => {
  CP.show();
  assert.ok(refs.calibPanel.classList.contains('show'));
  document.dispatchEvent({ type: 'keydown', key: 'Escape', target: document.body, preventDefault() {} });
  assert.ok(!refs.calibPanel.classList.contains('show'));
});

test('ESC does nothing when the panel is already closed', () => {
  CP.hide();
  let prevented = false;
  document.dispatchEvent({ type: 'keydown', key: 'Escape', target: document.body, preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
});

test('Pressing L inside a range input blurs the input', () => {
  CP.hide();
  const slider = refs.calibPanel.querySelector('.calib-row[data-key="ambient"] input[type="range"]');
  assert.ok(slider, 'ambient slider should be findable');
  let blurred = false;
  slider.blur = () => { blurred = true; };
  document.dispatchEvent({ type: 'keydown', key: 'l', target: slider, currentTarget: slider, preventDefault() {} });
  assert.equal(blurred, true, 'slider should be blurred when L is pressed inside it');
});

test('Pressing a non-L key inside a range input is a no-op (early return)', () => {
  CP.hide();
  const slider = refs.calibPanel.querySelector('.calib-row[data-key="ambient"] input[type="range"]');
  let prevented = false;
  document.dispatchEvent({ type: 'keydown', key: 'a', target: slider, currentTarget: slider, preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  assert.ok(!refs.calibPanel.classList.contains('show'));
});
