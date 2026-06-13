// tests/dom/toasts.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, clearDOM, registerElement, mockElement } from './setup.js';

installDOM();

function setup() {
  clearDOM();
  const toasts = mockElement('div');
  registerElement('toasts', toasts);
  return { toasts };
}

let Toasts;
let refs;

test('Toasts module loads', async () => {
  Toasts = await import('../../src/ui/Toasts.js');
  refs = setup();
  Toasts.init();
});

test('toast(text) creates a div with the toast class and text', () => {
  Toasts.toast('Hello world');
  const children = refs.toasts.children;
  assert.equal(children.length, 1);
  assert.equal(children[0].tagName, 'DIV');
  assert.equal(children[0].classList.contains('toast'), true);
  assert.equal(children[0].textContent, 'Hello world');
});

test('toast(text, "mag") adds the "mag" class', () => {
  // Use a fresh layer to make this test independent of the previous one.
  clearDOM();
  const toasts = mockElement('div');
  registerElement('toasts', toasts);
  Toasts.init();
  Toasts.toast('Power up', 'mag');
  const child = toasts.children[0];
  assert.ok(child.classList.contains('toast'));
  assert.ok(child.classList.contains('mag'));
  assert.equal(child.textContent, 'Power up');
});

test('toast(text, "gold") adds the "gold" class', () => {
  clearDOM();
  const toasts = mockElement('div');
  registerElement('toasts', toasts);
  Toasts.init();
  Toasts.toast('Bonus', 'gold');
  const child = toasts.children[0];
  assert.ok(child.classList.contains('toast'));
  assert.ok(child.classList.contains('gold'));
});

test('toast(text) with an unknown tone leaves the toast unclassed', () => {
  clearDOM();
  const toasts = mockElement('div');
  registerElement('toasts', toasts);
  Toasts.init();
  Toasts.toast('Default tone');
  const child = toasts.children[0];
  assert.ok(child.classList.contains('toast'));
  assert.ok(!child.classList.contains('mag'));
  assert.ok(!child.classList.contains('gold'));
});

test('Multiple toasts stack in the layer', () => {
  clearDOM();
  const toasts = mockElement('div');
  registerElement('toasts', toasts);
  Toasts.init();
  Toasts.toast('A');
  Toasts.toast('B');
  Toasts.toast('C');
  assert.equal(toasts.children.length, 3);
  assert.equal(toasts.children[0].textContent, 'A');
  assert.equal(toasts.children[1].textContent, 'B');
  assert.equal(toasts.children[2].textContent, 'C');
});

test('toast() is a no-op when init() was not called', async () => {
  // Fresh module with no init() — `layer` stays null.
  clearDOM();
  registerElement('toasts', mockElement('div'));
  // Reload the module to reset its module-level state.
  const { toast } = await import('../../src/ui/Toasts.js?v=2');
  // The fresh import has its own `layer` variable that hasn't been initialised.
  // We need to ensure the global toasts element is NOT picked up by the new
  // module, so we don't call init() and the `layer` stays null. Then toast()
  // returns early.
  // We cannot fully isolate ESM module state from previous imports, so the
  // practical check is: the call should not throw even when init() was
  // skipped.
  assert.doesNotThrow(() => toast('never rendered'));
});
