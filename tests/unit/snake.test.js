// tests/unit/snake.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Snake } from '../../src/entities/Snake.js';
import { HeightMap } from '../../src/world/HeightMap.js';
import { DIRS } from '../../src/config.js';

function newSnakeAt(x, z) {
  const m = new HeightMap();
  const s = new Snake(m);
  s.reset(x, z);
  return s;
}

test('reset creates 4 segments on solid cells', () => {
  const s = newSnakeAt(5, 5);
  assert.equal(s.length(), 4);
  for (const c of s.cells) {
    assert.ok(s.map.isSolid(c.gx, c.gz));
  }
});

test('setDir rejects 180-degree turn', () => {
  const s = newSnakeAt(5, 5);
  s.dir = DIRS.right;
  s.setDir('left'); // should be rejected
  assert.equal(s.pendingTurns.length, 0);
});

test('setDir accepts perpendicular turn', () => {
  const s = newSnakeAt(5, 5);
  s.dir = DIRS.right;
  s.setDir('up');
  assert.equal(s.pendingTurns.length, 1);
  assert.equal(s.pendingTurns[0], 'up');
});

test('invulnerable prevents death', () => {
  const s = newSnakeAt(15, 15);
  s.setInvulnerable(performance.now() + 1000);
  // Try to step into a void cell
  s.dir = DIRS.right;
  s.cells[0] = { gx: 0, gz: 0 };
  s.map.setCell(1, 0, 0, false);
  const r = s.step(performance.now());
  assert.notEqual(r.cause, 'void');
});

test('step into void dies', () => {
  const s = newSnakeAt(15, 15);
  s.dir = DIRS.right;
  s.cells[0] = { gx: 0, gz: 0 };
  s.map.setCell(1, 0, 0, false);
  const r = s.step(performance.now() + 99999);
  assert.equal(r.cause, 'void');
});
