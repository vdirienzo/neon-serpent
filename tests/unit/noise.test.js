// tests/unit/noise.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hash2D, valueNoise, fbm } from '../../src/world/noise.js';

test('hash2D returns in [0, 1)', () => {
  for (let i = 0; i < 100; i++) {
    const v = hash2D(i, i * 2, 42);
    assert.ok(v >= 0 && v < 1);
  }
});

test('hash2D is deterministic for same input', () => {
  assert.equal(hash2D(3, 4, 5), hash2D(3, 4, 5));
  assert.notEqual(hash2D(3, 4, 5), hash2D(3, 4, 6));
});

test('valueNoise is smooth (small input delta -> small output delta)', () => {
  const a = valueNoise(1.5, 2.5, 1);
  const b = valueNoise(1.51, 2.5, 1);
  assert.ok(Math.abs(a - b) < 0.05, `expected smooth, got ${a} vs ${b}`);
});

test('FBM averages around 0.5 with low amplitude', () => {
  let sum = 0;
  const N = 200;
  for (let i = 0; i < N; i++) {
    sum += fbm(i * 0.7, i * 0.3, 99);
  }
  const avg = sum / N;
  // FBM with 4 octaves has amplitude < 1, so values cluster near 0.5
  assert.ok(avg > 0.3 && avg < 0.7, `expected ~0.5, got ${avg}`);
});
