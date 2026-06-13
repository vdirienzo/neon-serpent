// tests/unit/extra/color.test.js
// Unit tests for src/core/Color.js.
//
// Color.js imports * as THREE from 'three'. The real npm package is
// not installed in this repo, so we register the project's shared
// module loader hook (./_three-loader.mjs) that resolves 'three' to
// the minimal in-memory mock (./_three-mock.mjs) before importing
// Color.js. See camera-math.test.js for the same pattern.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

// Install the 'three' -> mock redirect for any subsequent imports.
register('./_three-loader.mjs', import.meta.url);

const { COLORS, hexToColor, cloneColor, lerpColors } = await import('../../../src/core/Color.js');

const EXPECTED_KEYS = ['BG', 'CYAN', 'MAG', 'GOLD', 'GREEN', 'VIO', 'WHITE', 'ORANGE', 'RED'];

test('COLORS is frozen', () => {
  assert.equal(Object.isFrozen(COLORS), true);
});

test('COLORS has exactly the expected keys', () => {
  const keys = Object.keys(COLORS).sort();
  assert.deepEqual(keys, [...EXPECTED_KEYS].sort());
});

test('every color exposes numeric r/g/b in [0, 1]', () => {
  for (const [name, c] of Object.entries(COLORS)) {
    assert.equal(typeof c.r, 'number', `${name}.r must be a number`);
    assert.equal(typeof c.g, 'number', `${name}.g must be a number`);
    assert.equal(typeof c.b, 'number', `${name}.b must be a number`);
    assert.ok(c.r >= 0 && c.r <= 1, `${name}.r out of [0,1]: ${c.r}`);
    assert.ok(c.g >= 0 && c.g <= 1, `${name}.g out of [0,1]: ${c.g}`);
    assert.ok(c.b >= 0 && c.b <= 1, `${name}.b out of [0,1]: ${c.b}`);
  }
});

test('WHITE resolves to (1, 1, 1)', () => {
  assert.equal(COLORS.WHITE.r, 1);
  assert.equal(COLORS.WHITE.g, 1);
  assert.equal(COLORS.WHITE.b, 1);
});

test('BG is a very dark color (near black)', () => {
  assert.ok(COLORS.BG.r < 0.05);
  assert.ok(COLORS.BG.g < 0.05);
  assert.ok(COLORS.BG.b < 0.1);
});

test('hexToColor, cloneColor, lerpColors are exported functions', () => {
  assert.equal(typeof hexToColor, 'function');
  assert.equal(typeof cloneColor, 'function');
  assert.equal(typeof lerpColors, 'function');
});

test('hexToColor(0xff0000) is pure red', () => {
  const c = hexToColor(0xff0000);
  assert.equal(c.r, 1);
  assert.equal(c.g, 0);
  assert.equal(c.b, 0);
});

test('hexToColor(0x00ff00) is pure green', () => {
  const c = hexToColor(0x00ff00);
  assert.equal(c.r, 0);
  assert.equal(c.g, 1);
  assert.equal(c.b, 0);
});

test('hexToColor(0x0000ff) is pure blue', () => {
  const c = hexToColor(0x0000ff);
  assert.equal(c.r, 0);
  assert.equal(c.g, 0);
  assert.equal(c.b, 1);
});

test('cloneColor returns a new instance with equal channels', () => {
  const src = COLORS.CYAN;
  const copy = cloneColor(src);
  assert.notEqual(copy, src, 'must be a different reference');
  assert.equal(copy.r, src.r);
  assert.equal(copy.g, src.g);
  assert.equal(copy.b, src.b);
});

test('mutating a clone does not affect the original', () => {
  const src = COLORS.MAG;
  const copy = cloneColor(src);
  copy.r = 0.5;
  assert.notEqual(copy.r, src.r);
});

test('lerpColors at t=0 returns the first color', () => {
  const a = COLORS.CYAN;
  const b = COLORS.MAG;
  const r = lerpColors(a, b, 0);
  assert.equal(r.r, a.r);
  assert.equal(r.g, a.g);
  assert.equal(r.b, a.b);
});

test('lerpColors at t=1 returns the second color (within fp tolerance)', () => {
  const a = COLORS.CYAN;
  const b = COLORS.MAG;
  const r = lerpColors(a, b, 1);
  // Float math: a + (b - a) * 1 may not be bit-exact b, so compare with tol.
  assert.ok(Math.abs(r.r - b.r) < 1e-9, `r.r=${r.r} vs b.r=${b.r}`);
  assert.ok(Math.abs(r.g - b.g) < 1e-9, `r.g=${r.g} vs b.g=${b.g}`);
  assert.ok(Math.abs(r.b - b.b) < 1e-9, `r.b=${r.b} vs b.b=${b.b}`);
});

test('lerpColors at t=0.5 between black and white is the midpoint', () => {
  const a = hexToColor(0x000000);
  const b = hexToColor(0xffffff);
  const r = lerpColors(a, b, 0.5);
  assert.ok(Math.abs(r.r - 0.5) < 1e-9, `r=${r.r}`);
  assert.ok(Math.abs(r.g - 0.5) < 1e-9, `g=${r.g}`);
  assert.ok(Math.abs(r.b - 0.5) < 1e-9, `b=${r.b}`);
});

test('lerpColors returns a fresh instance (not a or b)', () => {
  const a = COLORS.GOLD;
  const b = COLORS.ORANGE;
  const r = lerpColors(a, b, 0.3);
  assert.notEqual(r, a);
  assert.notEqual(r, b);
});
