// tests/dom/level-select-modal.test.js
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, clearDOM, registerElement, mockElement } from './setup.js';
import { setState, getState } from '../../src/game/GameState.js';
import { STATE } from '../../src/config.js';

installDOM();

function setup() {
  clearDOM();
  // Build the modal structure inline. The real index.html has:
  //   <div id="levelSelectModal">
  //     <div class="lvl-modal-panel">
  //       <div class="lvl-modal-header">
  //         <h2 class="lvl-modal-title">SALTAR A SECTOR</h2>
  //         <button id="lvlModalClose">✕</button>
  //       </div>
  //       <div class="lvl-modal-grid"></div>
  //     </div>
  //   </div>
  const modalEl = mockElement('div');
  modalEl.innerHTML = `
    <div class="lvl-modal-panel">
      <div class="lvl-modal-header">
        <h2 class="lvl-modal-title">SALTAR A SECTOR</h2>
        <button id="lvlModalClose" type="button" aria-label="Cerrar">✕</button>
      </div>
      <div class="lvl-modal-grid"></div>
    </div>
  `;
  registerElement('levelSelectModal', modalEl);
  return { modalEl };
}

let LSM;
let refs;
let onSelectCalls;

test('LevelSelectModal module loads', async () => {
  LSM = await import('../../src/ui/LevelSelectModal.js');
  refs = setup();
  onSelectCalls = [];
  LSM.setOnSelect((n) => onSelectCalls.push(n));
  LSM.init();
});

test('init() populates the grid with 10 cells', () => {
  const grid = refs.modalEl.querySelector('.lvl-modal-grid');
  const cells = grid.querySelectorAll('.level-cell');
  assert.equal(cells.length, 10);
});

test('Each cell has a level number and palette name', () => {
  const grid = refs.modalEl.querySelector('.lvl-modal-grid');
  const cells = [...grid.querySelectorAll('.level-cell')];
  for (let i = 0; i < 10; i++) {
    const cell = cells[i];
    const n = i + 1;
    assert.equal(cell.dataset.n, String(n));
    const numEl = cell.querySelector('.level-num');
    const nameEl = cell.querySelector('.level-name');
    assert.ok(numEl, `cell ${n} should have .level-num`);
    assert.ok(nameEl, `cell ${n} should have .level-name`);
    assert.equal(numEl.textContent, String(n));
    assert.ok(nameEl.textContent.length > 0, `cell ${n} should have a palette name`);
  }
});

test('Cell 1 starts with the "current" class (default currentSector=1)', () => {
  const grid = refs.modalEl.querySelector('.lvl-modal-grid');
  const cells = grid.querySelectorAll('.level-cell');
  assert.ok(cells[0].classList.contains('current'));
  for (let i = 1; i < 10; i++) {
    assert.ok(!cells[i].classList.contains('current'));
  }
});

test('Current cell shows the "EN JUEGO" tag', () => {
  const grid = refs.modalEl.querySelector('.lvl-modal-grid');
  const cell = grid.querySelector('.level-cell.current');
  const tag = cell.querySelector('.level-tag');
  assert.ok(tag);
  assert.equal(tag.textContent, 'EN JUEGO');
});

test('setCurrentSector(n) re-renders the grid with the new current cell', () => {
  LSM.setCurrentSector(7);
  const grid = refs.modalEl.querySelector('.lvl-modal-grid');
  const cells = grid.querySelectorAll('.level-cell');
  assert.ok(!cells[0].classList.contains('current'));
  assert.ok(cells[6].classList.contains('current'));
  const tag = cells[6].querySelector('.level-tag');
  assert.ok(tag, 'cell 7 should now show the EN JUEGO tag');
  // Reset for downstream tests
  LSM.setCurrentSector(1);
});

test('show() and hide() toggle the .show class on the modal', () => {
  assert.ok(!refs.modalEl.classList.contains('show'));
  LSM.show();
  assert.ok(refs.modalEl.classList.contains('show'));
  assert.equal(refs.modalEl.getAttribute('aria-hidden'), 'false');
  LSM.hide();
  assert.ok(!refs.modalEl.classList.contains('show'));
  assert.equal(refs.modalEl.getAttribute('aria-hidden'), 'true');
});

test('close button click calls hide()', () => {
  LSM.show();
  assert.ok(refs.modalEl.classList.contains('show'));
  const closeBtn = refs.modalEl.querySelector('#lvlModalClose');
  closeBtn.dispatchEvent({ type: 'click', target: closeBtn, currentTarget: closeBtn });
  assert.ok(!refs.modalEl.classList.contains('show'));
});

test('Clicking the backdrop (the modal element itself) closes the modal', () => {
  LSM.show();
  assert.ok(refs.modalEl.classList.contains('show'));
  refs.modalEl.dispatchEvent({ type: 'click', target: refs.modalEl, currentTarget: refs.modalEl });
  assert.ok(!refs.modalEl.classList.contains('show'));
});

test('Clicking inside the panel does NOT close the modal (event target is not the modal)', () => {
  LSM.show();
  const panel = refs.modalEl.querySelector('.lvl-modal-panel');
  // When the user clicks inside the panel, the click bubbles up to the modal,
  // but the original event target is the panel — so the modal stays open.
  panel.dispatchEvent({ type: 'click', target: panel, currentTarget: panel });
  assert.ok(refs.modalEl.classList.contains('show'));
});

test('Clicking a cell triggers onSelect with the level number', () => {
  LSM.show();
  const grid = refs.modalEl.querySelector('.lvl-modal-grid');
  const cells = grid.querySelectorAll('.level-cell');
  // Make sure onSelect calls are reset.
  onSelectCalls.length = 0;
  cells[3].dispatchEvent({ type: 'click', target: cells[3], currentTarget: cells[3] });
  assert.deepEqual(onSelectCalls, [4]);
});

test('Selecting a level closes the modal', () => {
  LSM.show();
  const grid = refs.modalEl.querySelector('.lvl-modal-grid');
  const cells = grid.querySelectorAll('.level-cell');
  onSelectCalls.length = 0;
  cells[8].dispatchEvent({ type: 'click', target: cells[8], currentTarget: cells[8] });
  assert.ok(!refs.modalEl.classList.contains('show'));
  assert.deepEqual(onSelectCalls, [9]);
});

test('Pressing J opens the modal in PLAYING state', () => {
  LSM.hide();
  setState(STATE.PLAYING);
  document.dispatchEvent({ type: 'keydown', key: 'j', target: document.body, preventDefault() {} });
  assert.ok(refs.modalEl.classList.contains('show'));
});

test('Pressing J opens the modal in PAUSED state', () => {
  LSM.hide();
  setState(STATE.PAUSED);
  document.dispatchEvent({ type: 'keydown', key: 'j', target: document.body, preventDefault() {} });
  assert.ok(refs.modalEl.classList.contains('show'));
});

test('Pressing J opens the modal in TITLE state', () => {
  LSM.hide();
  setState(STATE.TITLE);
  document.dispatchEvent({ type: 'keydown', key: 'j', target: document.body, preventDefault() {} });
  assert.ok(refs.modalEl.classList.contains('show'));
});

test('Pressing J opens the modal in OVER state', () => {
  LSM.hide();
  setState(STATE.OVER);
  document.dispatchEvent({ type: 'keydown', key: 'j', target: document.body, preventDefault() {} });
  assert.ok(refs.modalEl.classList.contains('show'));
});

test('Pressing J does nothing in unsupported states (e.g. LOADING)', () => {
  LSM.hide();
  setState(STATE.LOADING);
  let prevented = false;
  document.dispatchEvent({
    type: 'keydown',
    key: 'j',
    target: document.body,
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, false);
  assert.ok(!refs.modalEl.classList.contains('show'));
});

test('Pressing ESC closes the modal when it is open', () => {
  LSM.show();
  assert.ok(refs.modalEl.classList.contains('show'));
  document.dispatchEvent({
    type: 'keydown',
    key: 'Escape',
    target: document.body,
    preventDefault() {},
  });
  assert.ok(!refs.modalEl.classList.contains('show'));
});

test('Cells use palette.primary as the CSS custom property --cell-color', () => {
  const grid = refs.modalEl.querySelector('.lvl-modal-grid');
  const cells = grid.querySelectorAll('.level-cell');
  // Cell 1 corresponds to palette { primary: 0x88aaff, name: 'INICIO' }
  // → expected hex '#88aaff'.
  const style1 = cells[0].style.getPropertyValue('--cell-color');
  assert.equal(style1, '#88aaff');
});

test('Cells have accessible labels referencing the level and palette name', () => {
  const grid = refs.modalEl.querySelector('.lvl-modal-grid');
  const cells = grid.querySelectorAll('.level-cell');
  for (let i = 0; i < 10; i++) {
    const label = cells[i].getAttribute('aria-label');
    assert.ok(label);
    assert.ok(label.includes(String(i + 1)), `label should contain level number ${i + 1}`);
  }
});
