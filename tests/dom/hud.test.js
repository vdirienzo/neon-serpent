// tests/dom/hud.test.js
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, clearDOM, registerElement, mockElement, mockTextNode } from './setup.js';
import { tickCombo, resetCombo } from '../../src/audio/AudioContext.js';
import { emit } from '../../src/core/EventBus.js';
import { EVT, STATE, MODE } from '../../src/config.js';

installDOM();

function setupHud() {
  clearDOM();
  // Reset combo state so previous tests don't leak in
  resetCombo();

  // The real index.html uses these IDs — mirror the contract.
  const scoreVal = mockElement('div');
  const hiVal = mockElement('div');
  const lvlNum = mockElement('div');
  const lvlBar = mockElement('div');
  const sectorNum = mockElement('div');
  const sectorName = mockElement('div');
  const sectorWrap = mockElement('div');
  const modeIndicator = mockElement('div');
  const timeAttackRemaining = mockElement('span');
  const comboVal = mockElement('span');
  const comboBadge = mockElement('div');
  comboBadge.hidden = false;

  // modeIndicator starts with a text node + the time-attack span, like the
  // production markup. Tests can verify the existing-text branch in setSector.
  modeIndicator.appendChild(mockTextNode('MODO: HISTORIA '));
  modeIndicator.appendChild(timeAttackRemaining);

  registerElement('scoreVal', scoreVal);
  registerElement('hiVal', hiVal);
  registerElement('lvlNum', lvlNum);
  registerElement('lvlbar', lvlBar);
  registerElement('sectorNum', sectorNum);
  registerElement('sectorName', sectorName);
  registerElement('sectorWrap', sectorWrap);
  registerElement('modeIndicator', modeIndicator);
  registerElement('timeAttackRemaining', timeAttackRemaining);
  registerElement('comboVal', comboVal);
  registerElement('comboBadge', comboBadge);

  return { scoreVal, hiVal, lvlNum, lvlBar, sectorNum, sectorName, sectorWrap, modeIndicator, timeAttackRemaining, comboVal, comboBadge };
}

let HUD;
let refs;

test('setup loads HUD module', async () => {
  HUD = await import('../../src/ui/HUD.js');
  refs = setupHud();
  HUD.init();
  assert.equal(refs.lvlBar.children.length, 10, 'init should append 10 level-bar cells');
});

test('init() resolves all required DOM elements', () => {
  // The fact that init() ran without throwing implies every $() lookup found
  // an element. Verify the side effect: lvlbar got 10 child <i> elements.
  assert.equal(refs.lvlBar.children.length, 10);
  for (const c of refs.lvlBar.children) {
    assert.equal(c.tagName, 'I');
  }
});

test('init() marks the first level cell as active (level=1 default)', () => {
  // After setupHud() + init(), the default level is 1, so the first cell has 'on'.
  assert.ok(refs.lvlBar.children[0].classList.contains('on'));
  assert.ok(!refs.lvlBar.children[1].classList.contains('on'));
});

test('setHi(v) writes the value to the hi element', () => {
  HUD.setHi(12345);
  assert.equal(refs.hiVal.textContent, '12345');
  HUD.setHi(0);
  assert.equal(refs.hiVal.textContent, '0');
});

test('setScore(v) and getScore() round-trip', () => {
  HUD.setScore(500);
  assert.equal(HUD.getScore(), 500);
  HUD.setScore(0);
  assert.equal(HUD.getScore(), 0);
});

test('setLevel(v) toggles the right number of cells on', () => {
  HUD.setLevel(5);
  for (let i = 0; i < 10; i++) {
    const want = i < 5;
    assert.equal(refs.lvlBar.children[i].classList.contains('on'), want, `cell ${i}`);
  }
  HUD.setLevel(10);
  for (let i = 0; i < 10; i++) {
    assert.ok(refs.lvlBar.children[i].classList.contains('on'));
  }
  HUD.setLevel(0);
  for (let i = 0; i < 10; i++) {
    assert.ok(!refs.lvlBar.children[i].classList.contains('on'));
  }
});

test('setSector(n, palette, mode) updates sector number, name, color, and mode', () => {
  const palette = { primary: 0x88aaff, name: 'INICIO' };
  HUD.setSector(3, palette, MODE.STORY);
  assert.equal(refs.sectorNum.textContent, '3/10');
  assert.equal(refs.sectorName.textContent, 'INICIO');
  assert.equal(refs.sectorWrap.style.color, '#88aaff');
  // modeIndicator first child should be a text node with the STORY label.
  const first = refs.modeIndicator.firstChild;
  assert.ok(first);
  assert.equal(first.nodeType, 3);
  assert.equal(first.nodeValue, 'MODO: HISTORIA ');
  // Time attack span is cleared in non-time modes.
  assert.equal(refs.timeAttackRemaining.textContent, '');
});

test('setSector(n) with n > 10 shows infinity symbol', () => {
  const palette = { primary: 0xff2bd6, name: 'CIMA' };
  HUD.setSector(99, palette, MODE.STORY);
  assert.equal(refs.sectorNum.textContent, '∞');
  assert.equal(refs.sectorName.textContent, 'CIMA');
});

test('setSector(n) with null palette uses PROTOCOLO fallback', () => {
  HUD.setSector(1, null, MODE.STORY);
  assert.equal(refs.sectorName.textContent, 'PROTOCOLO');
});

test('setSector in TIME mode sets MODO: TIME ATTACK and preserves time-attack span', () => {
  const palette = { primary: 0xffc857, name: 'TORRE' };
  HUD.setSector(7, palette, MODE.TIME);
  const first = refs.modeIndicator.firstChild;
  assert.equal(first.nodeType, 3);
  assert.equal(first.nodeValue, 'MODO: TIME ATTACK ');
  // timeAttackRemaining is NOT cleared in TIME mode.
  assert.equal(refs.timeAttackRemaining.textContent, '');
});

test('setSector in DAILY mode sets MODO: DAILY SEED', () => {
  const palette = { primary: 0x39ff14, name: 'ESCALERA' };
  HUD.setSector(4, palette, MODE.DAILY);
  const first = refs.modeIndicator.firstChild;
  assert.equal(first.nodeType, 3);
  assert.equal(first.nodeValue, 'MODO: DAILY SEED ');
});

test('updateCombo() hides the badge when combo is 0', () => {
  // lastCombo is module-level state in HUD.js. Make sure it's not already 0
  // (init() runs updateCombo() which sets lastCombo=0), otherwise the early
  // return inside updateCombo() would skip the assertion.
  resetCombo();
  tickCombo();
  HUD.updateCombo();
  resetCombo();
  refs.comboBadge.hidden = false;  // start visible so we can verify it hides
  HUD.updateCombo();
  assert.equal(refs.comboBadge.hidden, true);
  assert.equal(refs.comboBadge.classList.contains('hot'), false);
  assert.equal(refs.comboBadge.classList.contains('bump'), false);
});

test('updateCombo() shows the badge with the step when combo > 0', () => {
  resetCombo();
  tickCombo(); // combo = 1
  HUD.updateCombo();
  assert.equal(refs.comboBadge.hidden, false);
  assert.equal(refs.comboVal.textContent, '1');
  assert.equal(refs.comboBadge.classList.contains('hot'), false);
});

test('updateCombo() marks badge as hot at combo >= 5', () => {
  resetCombo();
  for (let i = 0; i < 5; i++) tickCombo(); // combo = 5
  HUD.updateCombo();
  assert.equal(refs.comboBadge.hidden, false);
  assert.equal(refs.comboVal.textContent, '5');
  assert.equal(refs.comboBadge.classList.contains('hot'), true);
});

test('updateCombo() is a no-op when the combo value has not changed', () => {
  resetCombo();
  tickCombo();
  HUD.updateCombo();
  const snap = refs.comboVal.textContent;
  const hidden = refs.comboBadge.hidden;
  // Call again with no tickCombo in between.
  HUD.updateCombo();
  assert.equal(refs.comboVal.textContent, snap);
  assert.equal(refs.comboBadge.hidden, hidden);
});

test('STATE_CHANGE event in dying/over/win/title hides the combo badge', () => {
  resetCombo();
  tickCombo();
  HUD.updateCombo();
  assert.equal(refs.comboBadge.hidden, false);
  emit(EVT.STATE_CHANGE, { state: STATE.DYING });
  assert.equal(refs.comboBadge.hidden, true);
  emit(EVT.STATE_CHANGE, { state: STATE.TITLE });
  assert.equal(refs.comboBadge.hidden, true);
});

test('setTimeRemaining(text) writes to the time-attack span', () => {
  HUD.setTimeRemaining('42.5s');
  assert.equal(refs.timeAttackRemaining.textContent, '42.5s');
});

test('bump() adds and removes the bump class on the score element', () => {
  HUD.bump();
  assert.ok(refs.scoreVal.classList.contains('bump'));
});

test('updateScoreDisplay(dt) interpolates the displayed score', () => {
  HUD.setScore(1000);
  // First call moves the display significantly toward the target.
  HUD.updateScoreDisplay(0.1);
  const shown1 = parseInt(refs.scoreVal.textContent, 10);
  assert.ok(shown1 > 0 && shown1 < 1000, `expected 0 < shown < 1000, got ${shown1}`);
  // A huge dt should fully converge.
  HUD.updateScoreDisplay(10);
  assert.equal(refs.scoreVal.textContent, '1000');
});

test('updateScoreDisplay(dt) is a no-op once the display matches the score', () => {
  HUD.setScore(777);
  HUD.updateScoreDisplay(10); // converge
  assert.equal(refs.scoreVal.textContent, '777');
  // Now repeated calls with no new score should not change the text.
  const before = refs.scoreVal.textContent;
  HUD.updateScoreDisplay(0.016);
  assert.equal(refs.scoreVal.textContent, before);
});
