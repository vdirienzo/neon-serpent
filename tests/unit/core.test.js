// tests/unit/core.test.js
// Tests for core utility modules.
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mock DOM/localStorage for node environment
globalThis.localStorage = {
  _: {},
  setItem(k, v) { this._[k] = v; },
  getItem(k) { return this._[k] || null; },
  removeItem(k) { delete this._[k]; },
  key(i) { return Object.keys(this._)[i] || null; },
  get length() { return Object.keys(this._).length; }
};

import { clamp, lerp, damp, choice, rand, randi, smoothstepN, g2w, angleDelta } from '../../src/core/Math.js';

test('clamp constrains to range', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(0, 0, 10), 0);
});

test('lerp interpolates linearly', () => {
  assert.equal(lerp(0, 10, 0), 0);
  assert.equal(lerp(0, 10, 0.5), 5);
  assert.equal(lerp(0, 10, 1), 10);
  assert.equal(lerp(2, 4, 0.5), 3);
});

test('damp is framerate-independent', () => {
  // After 1 second at lambda=1, ~63% converged
  const r1 = damp(0, 1, 1, 1);
  assert.ok(r1 > 0.6 && r1 < 0.7, `expected ~0.632, got ${r1}`);
  // Snappier (lambda=10) converges faster
  const r2 = damp(0, 1, 10, 0.5);
  assert.ok(r2 > 0.99, `expected > 0.99, got ${r2}`);
});

test('choice picks random element', () => {
  const arr = [1, 2, 3, 4, 5];
  for (let i = 0; i < 20; i++) {
    const v = choice(arr);
    assert.ok(arr.includes(v));
  }
});

test('rand returns in range', () => {
  for (let i = 0; i < 50; i++) {
    const v = rand(2, 5);
    assert.ok(v >= 2 && v <= 5);
  }
});

test('randi returns integer in range', () => {
  for (let i = 0; i < 50; i++) {
    const v = randi(2, 5);
    assert.ok(Number.isInteger(v));
    assert.ok(v >= 2 && v <= 5);
  }
});

test('smoothstepN is smooth', () => {
  assert.equal(smoothstepN(0), 0);
  assert.equal(smoothstepN(1), 1);
  assert.equal(smoothstepN(0.5), 0.5);
  const v = smoothstepN(0.25);
  assert.ok(v > 0 && v < 0.5);
});

test('g2w centers grid at origin', () => {
  // HALF = 15.5, so g2w(15) = -0.5, g2w(16) = 0.5
  assert.equal(g2w(0), -15.5);
  assert.equal(g2w(31), 15.5);
});

test('angleDelta handles wraparound', () => {
  // Direct angle
  assert.equal(angleDelta(0, Math.PI), Math.PI);
  // Wraparound: 0 to -PI could be +PI (counterclockwise) or -PI (clockwise); magnitude is PI
  assert.ok(Math.abs(angleDelta(0, -Math.PI)) >= Math.PI - 0.01);
  // Going from 5.5 to 0.5: shortest path is +1.28 (counterclockwise wraps through 2*PI)
  const d = angleDelta(5.5, 0.5);
  assert.ok(Math.abs(d) <= Math.PI, `expected within PI, got ${d}`);
  // Going from -PI/2 to PI/2: shortest is +PI (counterclockwise) or -PI
  const d2 = angleDelta(-Math.PI / 2, Math.PI / 2);
  assert.ok(Math.abs(d2) >= Math.PI - 0.01);
});
