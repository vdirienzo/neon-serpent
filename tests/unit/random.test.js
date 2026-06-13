// tests/unit/random.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRNG, randRange, randInt, randChoice } from '../../src/core/Random.js';

test('Mulberry32 is deterministic', () => {
  const a = createRNG(42);
  const b = createRNG(42);
  for (let i = 0; i < 10; i++) {
    assert.equal(a(), b(), `mismatch at step ${i}`);
  }
});

test('Different seeds give different sequences', () => {
  const a = createRNG(1);
  const b = createRNG(2);
  let diff = 0;
  for (let i = 0; i < 20; i++) if (a() !== b()) diff++;
  assert.ok(diff > 15, 'expected mostly different outputs');
});

test('randRange returns in [a, b)', () => {
  const rng = createRNG(7);
  for (let i = 0; i < 100; i++) {
    const v = randRange(rng, 2, 5);
    assert.ok(v >= 2 && v < 5);
  }
});

test('randInt returns integer in [a, b)', () => {
  const rng = createRNG(7);
  for (let i = 0; i < 100; i++) {
    const v = randInt(rng, 2, 5);
    assert.ok(Number.isInteger(v));
    assert.ok(v >= 2 && v < 5);
  }
});

test('randChoice picks from array', () => {
  const rng = createRNG(99);
  const arr = [10, 20, 30];
  for (let i = 0; i < 30; i++) {
    assert.ok(arr.includes(randChoice(rng, arr)));
  }
});

test('RNG distribution is roughly uniform', () => {
  const rng = createRNG(123);
  const counts = [0, 0, 0, 0];
  const N = 4000;
  for (let i = 0; i < N; i++) counts[randInt(rng, 0, 4)]++;
  // Each bucket should have ~25% (1000). Allow ±10% variance.
  for (const c of counts) {
    assert.ok(c > 900 && c < 1100, `expected ~1000, got ${c}`);
  }
});
