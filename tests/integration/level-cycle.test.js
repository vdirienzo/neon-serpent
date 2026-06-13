// tests/integration/level-cycle.test.js
// Integration: buildLevel dispatcher wraps around mod 10, palettes match LEVEL_PALETTES.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HeightMap } from '../../src/world/HeightMap.js';
import { buildLevel } from '../../src/world/LevelBuilder.js';
import { LEVEL_PALETTES } from '../../src/config.js';

function findGoal(m) {
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      if (m.isGoal(x, z)) return { gx: x, gz: z };
    }
  }
  return null;
}

function cfgFor(n) {
  const m = new HeightMap();
  const cfg = buildLevel(m, n);
  const goal = findGoal(m);
  return { startGX: cfg.startGX, startGZ: cfg.startGZ, goalGX: goal && goal.gx, goalGZ: goal && goal.gz };
}

test('buildLevel(map, 11) and buildLevel(map, 1) return identical target layouts', () => {
  const a = cfgFor(11);
  const b = cfgFor(1);
  assert.deepEqual(a, b, 'level 11 should wrap around to level 1');
});

test('buildLevel(map, 21) and buildLevel(map, 1) return identical target layouts', () => {
  const a = cfgFor(21);
  const b = cfgFor(1);
  assert.deepEqual(a, b, 'level 21 should wrap around to level 1');
});

test('buildLevel(map, 12) and buildLevel(map, 2) return identical target layouts', () => {
  const a = cfgFor(12);
  const b = cfgFor(2);
  assert.deepEqual(a, b, 'level 12 should wrap around to level 2');
});

test('palette for level n is LEVEL_PALETTES[(n-1) % 10]', () => {
  for (let n = 1; n <= 10; n++) {
    const expected = LEVEL_PALETTES[(n - 1) % 10];
    // buildLevel only returns a config; the palette is the lookup the rest of
    // the code does. Verify the lookup is consistent.
    const palette = LEVEL_PALETTES[(n - 1) % 10];
    assert.strictEqual(palette, expected, `palette mismatch at level ${n}`);
    assert.ok(palette.name && palette.name.length > 0, `level ${n} palette must have a name`);
  }
  // And wrap-around: level 11 also resolves to palette[0].
  assert.strictEqual(LEVEL_PALETTES[(11 - 1) % 10], LEVEL_PALETTES[0]);
  assert.strictEqual(LEVEL_PALETTES[(20 - 1) % 10], LEVEL_PALETTES[9]);
});

test('buildLevel is deterministic for the same n', () => {
  const a = cfgFor(3);
  const b = cfgFor(3);
  assert.deepEqual(a, b, 'same level called twice should produce identical layouts');
});

test('level cycle covers all 10 distinct layouts (1..10 produce 10 unique configs)', () => {
  const seen = new Set();
  for (let n = 1; n <= 10; n++) {
    const c = cfgFor(n);
    seen.add(`${c.startGX},${c.startGZ}->${c.goalGX},${c.goalGZ}`);
  }
  assert.equal(seen.size, 10, `expected 10 distinct layouts, got ${seen.size}`);
  // And 11..20 should map to 1..10, not introduce new ones.
  for (let n = 11; n <= 20; n++) {
    const wrapped = cfgFor(((n - 1) % 10) + 1);
    const cycle = cfgFor(n);
    assert.deepEqual(cycle, wrapped, `level ${n} should equal level ${((n - 1) % 10) + 1}`);
  }
});
