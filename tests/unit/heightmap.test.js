// tests/unit/heightmap.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HeightMap } from '../../src/world/HeightMap.js';

test('Initial map is all solid mid-level', () => {
  const m = new HeightMap();
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      assert.ok(m.isSolid(x, z));
      assert.equal(m.heightAt(x, z), -2.4);
    }
  }
});

test('reset restores defaults', () => {
  const m = new HeightMap();
  m.setCell(5, 5, 5, false);
  m.setGoal(10, 10);
  m.reset();
  assert.ok(m.isSolid(5, 5));
  assert.equal(m.isGoal(10, 10), false);
});

test('setGoal snaps to nearest solid if cell is void', () => {
  const m = new HeightMap();
  m.setCell(5, 5, -10, false);
  m.setGoal(5, 5);
  // The nearest solid (4,4) due to ring scan including diagonals
  let found = false;
  for (let x = 0; x < 32 && !found; x++) for (let z = 0; z < 32 && !found; z++) {
    if (m.isGoal(x, z)) found = true;
  }
  assert.ok(found, 'expected goal to be placed on some solid cell');
});

test('findNearestSolid returns null if no solid nearby', () => {
  const m = new HeightMap();
  for (let x = 0; x < 32; x++) for (let z = 0; z < 32; z++) m.setCell(x, z, 0, false);
  const r = m.findNearestSolid(15, 15, 5);
  assert.equal(r, null);
});

test('bounds returns min/max/solidCount', () => {
  const m = new HeightMap();
  m.setCell(5, 5, 2, true);
  m.setCell(10, 10, -5, true);
  const b = m.bounds();
  assert.equal(b.minY, -5);
  assert.equal(b.maxY, 2);
  assert.equal(b.solidCount, 32 * 32); // reset to all solid
});

test('computeLethality: 3x3 solid island in 5x5 void area — island safe, ring danger', () => {
  const m = new HeightMap();
  // Carve a 5x5 void patch (indices 14..18, well away from the 32-cell perimeter)
  for (let x = 14; x <= 18; x++) {
    for (let z = 14; z <= 18; z++) {
      m.setCell(x, z, -2.4, false);
    }
  }
  // Build a 3x3 solid island in the middle (15..17)
  for (let x = 15; x <= 17; x++) {
    for (let z = 15; z <= 17; z++) {
      m.setCell(x, z, 0, true);
    }
  }
  m.computeLethality();
  // Island cells: solid, interior, neighbors all at y=-2.4 → not danger
  for (let x = 15; x <= 17; x++) {
    for (let z = 15; z <= 17; z++) {
      assert.equal(m.isDanger(x, z), false, `island (${x},${z}) should not be danger`);
    }
  }
  // Outer ring of the 5x5 (the 16 void cells) → danger
  for (let x = 14; x <= 18; x++) {
    for (let z = 14; z <= 18; z++) {
      if (x >= 15 && x <= 17 && z >= 15 && z <= 17) continue;
      assert.equal(m.isDanger(x, z), true, `void ring (${x},${z}) should be danger`);
    }
  }
});

test('computeLethality: solid cell on the grid perimeter is danger', () => {
  const m = new HeightMap();
  m.computeLethality();
  assert.equal(m.isDanger(0, 5), true, '(0,5) should be danger');
  assert.equal(m.isDanger(31, 5), true, '(31,5) should be danger');
  assert.equal(m.isDanger(5, 0), true, '(5,0) should be danger');
  assert.equal(m.isDanger(5, 31), true, '(5,31) should be danger');
});

test('computeLethality: neighbor height diff > STEP_CLIMB (9.0) marks cell danger', () => {
  const m = new HeightMap();
  m.setCell(15, 15, 0, true);
  m.setCell(16, 15, 10.0, true); // |0 - 10.0| = 10.0 > 9.0
  m.computeLethality();
  assert.equal(m.isDanger(15, 15), true, 'should be danger due to climb');
});

test('computeLethality: climb diff below STEP_CLIMB (9.0) is safe', () => {
  const m = new HeightMap();
  m.setCell(15, 15, 0, true);
  m.setCell(16, 15, 5.0, true); // |0 - 5.0| = 5.0 < 9.0
  m.computeLethality();
  assert.equal(m.isDanger(15, 15), false, 'should NOT be danger (5.0 < 9.0)');
});

test('computeLethality: normal cell (solid, interior, flat neighbors) is not danger', () => {
  const m = new HeightMap();
  m.computeLethality();
  assert.equal(m.isDanger(15, 15), false);
  assert.equal(m.isDanger(16, 16), false);
  assert.equal(m.isDanger(1, 1), false);
});

test('computeLethality: idempotent — second call yields identical results', () => {
  const m = new HeightMap();
  m.setCell(15, 15, 0, true);
  m.setCell(16, 15, 3.0, true); // climb pair
  m.setCell(5, 5, 0, false);    // a void cell
  m.computeLethality();
  const snap = [];
  for (let x = 0; x < 32; x++) {
    snap[x] = [];
    for (let z = 0; z < 32; z++) snap[x][z] = m.isDanger(x, z);
  }
  m.computeLethality();
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      assert.equal(m.isDanger(x, z), snap[x][z], `(${x},${z}) differs on 2nd run`);
    }
  }
});
