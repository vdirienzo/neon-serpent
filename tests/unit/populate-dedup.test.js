// tests/unit/populate-dedup.test.js
// Unit: Pickups.populate() must place every pickup on a UNIQUE cell.
// This guards against the "orphaned duplicate" bug where overlapping
// pickups caused the user to see objects that "don't disappear" —
// the first collected, the rest left behind at the same coordinates.

import { test } from 'node:test';
import assert from 'node:assert/strict';

function simulatePopulate(freeCells, rng) {
  const free = freeCells.slice();
  const pick = () => {
    if (!free.length) return null;
    const idx = Math.floor(rng() * free.length);
    return free.splice(idx, 1)[0];
  };
  const placed = [];
  for (let i = 0; i < 6; i++) {
    const c = pick();
    if (c) placed.push({ type: 'orb', gx: c.gx, gz: c.gz });
  }
  for (let i = 0; i < 3; i++) {
    const c = pick();
    if (c) placed.push({ type: 'gem', gx: c.gx, gz: c.gz });
  }
  for (let i = 0; i < 2; i++) {
    const c = pick();
    if (c) placed.push({ type: 'crystal', gx: c.gx, gz: c.gz });
  }
  const slowC = pick();
  if (slowC) placed.push({ type: 'slow', gx: slowC.gx, gz: slowC.gz });
  const diceC = pick();
  if (diceC) placed.push({ type: 'dice', gx: diceC.gx, gz: diceC.gz });
  return placed;
}

test('populate never places two pickups on the same cell (100 random seeds)', () => {
  const freeCells = [];
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) freeCells.push({ gx: x, gz: z });
  }
  for (let seed = 0; seed < 100; seed++) {
    let s = seed * 9301 + 49297;
    const rng = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const placed = simulatePopulate(freeCells, rng);
    assert.equal(placed.length, 13, `seed ${seed}: expected 13 pickups`);
    const seen = new Set();
    for (const p of placed) {
      const key = p.gx + ',' + p.gz;
      assert.ok(!seen.has(key), `seed ${seed}: duplicate cell ${key} for type ${p.type}`);
      seen.add(key);
    }
  }
});

test('populate works even when free cells are exactly 13', () => {
  const freeCells = [];
  for (let i = 0; i < 13; i++) freeCells.push({ gx: i, gz: 0 });
  const placed = simulatePopulate(freeCells, Math.random);
  assert.equal(placed.length, 13);
  const seen = new Set();
  for (const p of placed) seen.add(p.gx + ',' + p.gz);
  assert.equal(seen.size, 13, 'all 13 cells should be unique');
});

test('populate returns fewer entries when free cells are scarce', () => {
  const freeCells = [
    { gx: 0, gz: 0 },
    { gx: 1, gz: 1 },
  ];
  const placed = simulatePopulate(freeCells, Math.random);
  assert.ok(placed.length <= 2, 'should not exceed available cells');
  const seen = new Set();
  for (const p of placed) {
    const key = p.gx + ',' + p.gz;
    assert.ok(!seen.has(key), 'no duplicates even with few cells');
    seen.add(key);
  }
});

test('populate leaves no duplicate cells with deterministic seeded rng', () => {
  const freeCells = [];
  for (let i = 0; i < 50; i++) freeCells.push({ gx: i, gz: i });
  let s = 42;
  const rng = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const placed = simulatePopulate(freeCells, rng);
  const seen = new Set();
  for (const p of placed) seen.add(p.gx + ',' + p.gz);
  assert.equal(seen.size, placed.length, 'all placed cells should be unique');
});
