// tests/dom/popups.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
register('../three/three-hook.mjs', import.meta.url);

import { installDOM, clearDOM, registerElement, mockElement } from './setup.js';
import { Vector3, PerspectiveCamera } from '../three/three-stub.js';

installDOM();

let Popups;
let popups;
let camera;

test('Popups module loads', async () => {
  clearDOM();
  popups = mockElement('div');
  registerElement('popups', popups);
  Popups = await import('../../src/ui/Popups.js');
  Popups.init();
  camera = new PerspectiveCamera();
});

test('init() creates a pool of 24 popup elements', () => {
  assert.equal(popups.children.length, 24);
  for (const c of popups.children) {
    assert.equal(c.tagName, 'DIV');
    assert.ok(c.classList.contains('popup'));
    assert.equal(c.style.display, 'none');
  }
});

test('popupAt(world, text) activates a popup with the right text and class', () => {
  Popups.popupAt(new Vector3(0, 0, 0), '+10', 'cyan');
  // At least one popup should now be visible with text "+10".
  let visible = null;
  for (const c of popups.children) {
    if (c.style.display === 'block') { visible = c; break; }
  }
  assert.ok(visible, 'one popup should be visible after popupAt');
  assert.equal(visible.textContent, '+10');
  assert.ok(visible.classList.contains('popup'));
  assert.ok(visible.classList.contains('cyan'));
});

test('popupAt defaults to "cyan" when no kind is provided', () => {
  // Wait for the previous popup to die, then reuse the slot.
  Popups.update(camera, 2.0);
  Popups.popupAt(new Vector3(1, 2, 3), 'combo');
  const visible = popups.children.find((c) => c.style.display === 'block');
  assert.ok(visible);
  assert.equal(visible.textContent, 'combo');
  // Without a kind, the className should still be valid (defaults to 'cyan')
  assert.equal(visible.className, 'popup cyan');
  assert.ok(visible.classList.contains('cyan'));
});

test('popupAt("mag") and popupAt("gold") apply their tone classes', () => {
  // Drain the previous popup, then test new tones.
  Popups.update(camera, 2.0);
  Popups.popupAt(new Vector3(0, 0, 0), 'pickup', 'mag');
  const mag = popups.children.find((c) => c.style.display === 'block');
  assert.ok(mag);
  assert.ok(mag.classList.contains('mag'));

  Popups.update(camera, 2.0);
  Popups.popupAt(new Vector3(0, 0, 0), 'gold', 'gold');
  const gold = popups.children.find((c) => c.style.display === 'block');
  assert.ok(gold);
  assert.ok(gold.classList.contains('gold'));
  assert.ok(!gold.classList.contains('mag'));
});

test('update(camera, dt) sets inline position styles on active popups', () => {
  Popups.update(camera, 2.0);
  Popups.popupAt(new Vector3(0.5, 0.5, 0), 'ping');
  Popups.update(camera, 0.016);
  const active = popups.children.find((c) => c.style.display === 'block');
  assert.ok(active);
  assert.ok(active.style.left.endsWith('px'), 'left should be a px value');
  assert.ok(active.style.top.endsWith('px'), 'top should be a px value');
  assert.ok(active.style.opacity !== '');
  assert.ok(active.style.transform.includes('translate'));
});

test('update(camera, dt) hides the popup when its lifetime exceeds dur', () => {
  Popups.update(camera, 2.0);
  Popups.popupAt(new Vector3(0, 0, 0), 'fade');
  // dur is 1.0s; pass a large dt to push past it.
  Popups.update(camera, 2.0);
  for (const c of popups.children) {
    assert.equal(c.style.display, 'none');
  }
});

test('update() leaves inactive popups untouched', () => {
  Popups.update(camera, 2.0);
  // Don't call popupAt — every pool entry is now inactive again.
  // The internal `t`/`alive` state is already cleared from the previous test.
  // Re-run update and verify nothing changes.
  const snapshot = popups.children.map((c) => ({
    left: c.style.left,
    top: c.style.top,
    opacity: c.style.opacity,
    display: c.style.display
  }));
  Popups.update(camera, 0.016);
  popups.children.forEach((c, i) => {
    assert.equal(c.style.left, snapshot[i].left);
    assert.equal(c.style.top, snapshot[i].top);
    assert.equal(c.style.opacity, snapshot[i].opacity);
    assert.equal(c.style.display, snapshot[i].display);
  });
});

test('popupAt reuses dead popups from the pool rather than creating new ones', () => {
  // The pool size is fixed at 24 by init() — calling popupAt more than 24
  // times should never grow the children count.
  Popups.update(camera, 2.0);
  for (let i = 0; i < 30; i++) {
    Popups.popupAt(new Vector3(0, 0, 0), 'x' + i);
    Popups.update(camera, 2.0);
  }
  assert.equal(popups.children.length, 24);
});
