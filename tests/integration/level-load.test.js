// tests/integration/level-load.test.js
// Integration: buildLevel + HeightMap + lethality + reachability
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HeightMap } from '../../src/world/HeightMap.js';
import { buildLevel } from '../../src/world/LevelBuilder.js';
import { Snake } from '../../src/entities/Snake.js';
import { GRID, STEP_CLIMB } from '../../src/config.js';

function findGoal(m) {
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      if (m.isGoal(x, z)) return { gx: x, gz: z };
    }
  }
  return null;
}

// BFS over solid cells only — proves path exists without crossing void.
function reachableThroughSolid(map, start, goal) {
  if (start.gx === goal.gx && start.gz === goal.gz) return true;
  if (!map.isSolid(start.gx, start.gz)) return false;
  const visited = new Set();
  visited.add(`${start.gx},${start.gz}`);
  const queue = [start];
  while (queue.length) {
    const c = queue.shift();
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.gx + dx;
      const nz = c.gz + dz;
      const key = `${nx},${nz}`;
      if (visited.has(key)) continue;
      if (nx < 0 || nx >= GRID || nz < 0 || nz >= GRID) continue;
      if (!map.isSolid(nx, nz)) continue;
      if (nx === goal.gx && nz === goal.gz) return true;
      visited.add(key);
      queue.push({ gx: nx, gz: nz });
    }
  }
  return false;
}

test('every level 1-10 returns a config with startGX/startGZ/startDir', () => {
  for (let n = 1; n <= 10; n++) {
    const m = new HeightMap();
    const cfg = buildLevel(m, n);
    assert.ok(Number.isInteger(cfg.startGX), `level ${n} missing startGX`);
    assert.ok(Number.isInteger(cfg.startGZ), `level ${n} missing startGZ`);
    assert.ok(typeof cfg.startDir === 'string', `level ${n} missing startDir`);
    assert.ok(['up', 'down', 'left', 'right'].includes(cfg.startDir),
      `level ${n} startDir=${cfg.startDir} not a valid direction`);
  }
});

test('every level 1-10 places a goal somewhere on the map', () => {
  for (let n = 1; n <= 10; n++) {
    const m = new HeightMap();
    buildLevel(m, n);
    const goal = findGoal(m);
    assert.ok(goal, `level ${n} did not place a goal`);
  }
});

test('every level 1-10 has a snake start whose 4 cells are all solid', () => {
  for (let n = 1; n <= 10; n++) {
    const m = new HeightMap();
    const cfg = buildLevel(m, n);
    const s = new Snake(m);
    s.reset(cfg.startGX, cfg.startGZ);
    assert.equal(s.length(), 4, `level ${n}: expected 4 cells, got ${s.length()}`);
    for (const c of s.cells) {
      assert.ok(m.isSolid(c.gx, c.gz),
        `level ${n}: snake cell (${c.gx},${c.gz}) is not solid`);
    }
  }
});

test('every level 1-10: goal is reachable from start through solid cells only', () => {
  for (let n = 1; n <= 10; n++) {
    const m = new HeightMap();
    const cfg = buildLevel(m, n);
    const goal = findGoal(m);
    assert.ok(goal, `level ${n}: no goal`);
    // Use snake's actual start (after findNearestSolid snap) so we test the
    // real playable start, not the raw config coords.
    const s = new Snake(m);
    s.reset(cfg.startGX, cfg.startGZ);
    const head = s.head();
    const ok = reachableThroughSolid(m, head, goal);
    assert.ok(ok,
      `level ${n}: BFS could not reach goal ${JSON.stringify(goal)} from start (${head.gx},${head.gz})`);
  }
});

test('computeLethality marks perimeter solid cells as danger and does not flag the start', () => {
  const m = new HeightMap();
  const cfg = buildLevel(m, 1);
  m.computeLethality();
  // Perimeter solid cells → danger (snake would fall off the edge).
  assert.equal(m.isDanger(0, 5), true,  'perimeter (0,5) should be danger');
  assert.equal(m.isDanger(31, 5), true, 'perimeter (31,5) should be danger');
  // Start cell: solid, interior (level 1 island is centered) → not danger.
  assert.equal(m.isDanger(cfg.startGX, cfg.startGZ), false,
    `start (${cfg.startGX},${cfg.startGZ}) should not be danger`);
});

test('computeLethality: step climb > STEP_CLIMB units marks the lower cell danger', () => {
  const m = new HeightMap();
  m.setCell(15, 15, 0, true);
  m.setCell(16, 15, STEP_CLIMB + 1, true);
  m.computeLethality();
  assert.equal(m.isDanger(15, 15), true, 'low cell should be danger due to climb');
});

test('level 6 (ring) and level 7 (tower) produce distinct, valid configs', () => {
  const a = new HeightMap(); const cfgA = buildLevel(a, 6);
  const b = new HeightMap(); const cfgB = buildLevel(b, 7);
  assert.notEqual(`${cfgA.startGX},${cfgA.startGZ}`,
                  `${cfgB.startGX},${cfgB.startGZ}`,
                  'level 6 and 7 should start in different places');
  assert.ok(findGoal(a), 'level 6 has a goal');
  assert.ok(findGoal(b), 'level 7 has a goal');
});
