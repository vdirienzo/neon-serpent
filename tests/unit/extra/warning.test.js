// tests/unit/extra/warning.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { updateWarning } from '../../../src/game/WarningHighlight.js';

function mkMat() {
  return { opacity: -1 };
}

test('cells adjacent to head that are danger receive pulse opacity', () => {
  // Head at (10, 10). Cell to the right (11, 10) is danger.
  const snake = { cells: [{ gx: 10, gz: 10 }] };
  const map = {
    isDanger(x, z) {
      return x === 11 && z === 10;
    },
  };
  const matAdj = mkMat();
  const matOther = mkMat();
  const terrainMesh = {
    dangerEdges: new Map([
      ['11,10', matAdj],
      ['5,5', matOther],
    ]),
  };

  // Pick t=0 -> sin(0) = 0 -> k = 0.5 -> pulse = 0.4 + 0.6 * 0.5 = 0.7
  updateWarning(snake, map, terrainMesh, 0);

  assert.equal(matAdj.opacity, 0.7);
  assert.equal(matOther.opacity, 0.9, 'non-adjacent danger keeps BASE_OPACITY');
});

test('pulse opacity varies with t in [0.4, 1.0]', () => {
  const snake = { cells: [{ gx: 10, gz: 10 }] };
  const map = { isDanger: (x, z) => x === 11 && z === 10 };
  const mat = mkMat();
  const tm = { dangerEdges: new Map([['11,10', mat]]) };

  // Sweep a few time values and assert the pulse stays in bounds.
  for (let t = 0; t < 4; t += 0.1) {
    updateWarning(snake, map, tm, t);
    assert.ok(mat.opacity >= 0.4 - 1e-9, `opacity ${mat.opacity} below PULSE_MIN`);
    assert.ok(mat.opacity <= 1.0 + 1e-9, `opacity ${mat.opacity} above PULSE_MAX`);
  }

  // At t = pi/8, sin(t*4) = sin(pi/2) = 1 -> k = 1 -> pulse = 1.0
  updateWarning(snake, map, tm, Math.PI / 8);
  assert.equal(mat.opacity, 1.0);
});

test('non-adjacent danger cells get BASE_OPACITY (0.9)', () => {
  const snake = { cells: [{ gx: 10, gz: 10 }] };
  // No cells around the head are danger.
  const map = { isDanger: () => false };
  const mat = mkMat();
  const tm = { dangerEdges: new Map([['20,20', mat]]) };

  updateWarning(snake, map, tm, 1.234);

  assert.equal(mat.opacity, 0.9);
});

test('empty dangerEdges map is a no-op (no throw)', () => {
  const snake = { cells: [{ gx: 5, gz: 5 }] };
  const map = { isDanger: () => true };
  const tm = { dangerEdges: new Map() };

  // Should not throw.
  updateWarning(snake, map, tm, 0);
  assert.ok(true);
});

test('missing snake or terrainMesh is a no-op', () => {
  // snake missing
  updateWarning(null, { isDanger: () => true }, { dangerEdges: new Map() }, 0);
  // terrainMesh missing
  updateWarning({ cells: [{ gx: 1, gz: 1 }] }, { isDanger: () => true }, null, 0);
  // empty cells
  updateWarning({ cells: [] }, { isDanger: () => true }, { dangerEdges: new Map() }, 0);
  assert.ok(true);
});

test('only the 4 cardinal neighbors of head are considered adjacent', () => {
  // Diagonal cell (11, 11) is danger but the head's 4 neighbors are not.
  const snake = { cells: [{ gx: 10, gz: 10 }] };
  const map = { isDanger: (x, z) => x === 11 && z === 11 };
  const mat = mkMat();
  const tm = { dangerEdges: new Map([['11,11', mat]]) };

  updateWarning(snake, map, tm, 0);

  // Diagonals are NOT adjacent, so this cell gets BASE_OPACITY.
  assert.equal(mat.opacity, 0.9);
});
