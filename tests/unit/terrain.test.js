// tests/unit/terrain.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HeightMap } from '../../src/world/HeightMap.js';
import { buildTerrainIsland, buildBridge } from '../../src/world/IslandBuilder.js';
import {
  buildLevel1, buildLevel2, buildLevel3, buildLevel4, buildLevel5,
  buildLevel6, buildLevel7, buildLevel8, buildLevel9, buildLevel10,
  buildDailyLevel, buildLevel
} from '../../src/world/LevelBuilder.js';
import { Y_WATER } from '../../src/config.js';

test('buildTerrainIsland creates cells above water', () => {
  const m = new HeightMap();
  buildTerrainIsland(m, { cx: 16, cz: 16, baseR: 5, peakY: 2.0, seed: 42, falloffPower: 1.3 });
  const b = m.bounds();
  assert.ok(b.maxY >= 1.5, `expected peak ~2, got ${b.maxY}`);
  assert.ok(b.solidCount > 50, `expected many solid cells, got ${b.solidCount}`);
});

test('buildBridge connects two points', () => {
  const m = new HeightMap();
  buildBridge(m, 5, 5, 25, 5, 0.5, { width: 1, seed: 99 });
  let count = 0;
  for (let x = 5; x <= 25; x++) {
    if (m.isSolid(x, 5) && m.heightAt(x, 5) > Y_WATER) count++;
  }
  assert.ok(count > 10, `expected bridge cells, got ${count}`);
});

function findGoal(m) {
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      if (m.isGoal(x, z)) return { x, z };
    }
  }
  return null;
}

test('buildLevel1 (INICIO) has a goal and a flat island', () => {
  const m = new HeightMap();
  const cfg = buildLevel1(m);
  assert.ok(cfg.startGX !== undefined);
  const goal = findGoal(m);
  assert.ok(goal, 'expected goal in level 1');
  const b = m.bounds();
  assert.ok(b.maxY < 0.5, `expected flat island, got maxY ${b.maxY}`);
});

test('buildLevel2 (AVANCE) has 2 islands connected by a bridge', () => {
  const m = new HeightMap();
  const cfg = buildLevel2(m);
  const goal = findGoal(m);
  assert.ok(goal, 'expected goal in level 2');
  // Goal should be on the second island (gz ~ 16, gx > 18)
  assert.ok(goal.x > 18, `expected goal on far island, got gx ${goal.x}`);
});

test('buildLevel3 (HUB) is a 3-island hub', () => {
  const m = new HeightMap();
  const cfg = buildLevel3(m);
  const goal = findGoal(m);
  assert.ok(goal, 'expected goal in level 3');
  const b = m.bounds();
  assert.ok(b.solidCount > 50, 'expected substantial solid area');
});

test('buildLevel4 (ESCALERA) has ascending steps', () => {
  const m = new HeightMap();
  const cfg = buildLevel4(m);
  const b = m.bounds();
  assert.ok(b.maxY >= 2.0, `expected tall step, got maxY ${b.maxY}`);
});

test('buildLevel5 (CRUCES) has a cross pattern', () => {
  const m = new HeightMap();
  const cfg = buildLevel5(m);
  const goal = findGoal(m);
  assert.ok(goal, 'expected central goal in level 5');
});

test('buildLevel6 (ISLAS) has a ring of islands', () => {
  const m = new HeightMap();
  const cfg = buildLevel6(m);
  const b = m.bounds();
  assert.ok(b.solidCount > 30, 'expected ring islands');
});

test('buildLevel7 (TORRE) is a tower with spiral', () => {
  const m = new HeightMap();
  buildLevel7(m);
  const b = m.bounds();
  assert.ok(b.maxY >= 4.0, `expected peak >= 4, got ${b.maxY}`);
});

test('buildLevel8 (PILAR) is 3D with 2 stacked platforms', () => {
  const m = new HeightMap();
  const cfg = buildLevel8(m);
  const b = m.bounds();
  // Two platforms with significant height difference
  assert.ok(b.maxY >= 3.0, `expected high upper platform, got maxY ${b.maxY}`);
  assert.ok(b.minY <= 0.5, `expected low base, got minY ${b.minY}`);
  // Should have cells in both low and high Y ranges
  let lowCount = 0, highCount = 0;
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      const c = m.cells[x][z];
      if (c.solid) {
        if (c.y < 1.5) lowCount++;
        else if (c.y > 1.5) highCount++;
      }
    }
  }
  assert.ok(lowCount > 10, `expected low platform cells, got ${lowCount}`);
  assert.ok(highCount > 10, `expected high platform cells, got ${highCount}`);
});

test('buildLevel9 (ASCENSO) is 3D with 3 stacked platforms', () => {
  const m = new HeightMap();
  const cfg = buildLevel9(m);
  const b = m.bounds();
  assert.ok(b.maxY >= 4.5, `expected top platform, got maxY ${b.maxY}`);
  // Three distinct Y bands
  let bands = new Set();
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      const c = m.cells[x][z];
      if (c.solid) {
        const band = Math.floor(c.y / 2);
        bands.add(band);
      }
    }
  }
  assert.ok(bands.size >= 3, `expected 3+ distinct height bands, got ${bands.size}`);
});

test('buildLevel10 (CIMA) is 3D complex with multiple paths', () => {
  const m = new HeightMap();
  const cfg = buildLevel10(m);
  const b = m.bounds();
  assert.ok(b.maxY >= 4.0, `expected tall structure, got maxY ${b.maxY}`);
  assert.ok(b.solidCount > 60, 'expected substantial layout');
});

test('buildDailyLevel uses the seed deterministically', () => {
  const a = new HeightMap();
  const b = new HeightMap();
  const c1 = buildDailyLevel(a, 20260612);
  const c2 = buildDailyLevel(b, 20260612);
  assert.equal(c1.startGX, c2.startGX);
  assert.equal(c1.startGZ, c2.startGZ);
  const c3 = buildDailyLevel(new HeightMap(), 20250101);
  const sameLayout = c1.startGX === c3.startGX && c1.startGZ === c3.startGZ;
  assert.ok(!sameLayout || c1.startGX !== c3.startGX || c1.startGZ !== c3.startGZ);
});

test('buildLevel dispatcher wraps around mod 10', () => {
  const m = new HeightMap();
  const cfg11 = buildLevel(m, 11);
  assert.equal(cfg11.startGX, buildLevel(new HeightMap(), 1).startGX);
  const cfg7 = buildLevel(m, 7);
  assert.ok(cfg7.startGX !== undefined);
});

test('buildLevel dispatcher covers all 10 levels', () => {
  for (let n = 1; n <= 10; n++) {
    const m = new HeightMap();
    const cfg = buildLevel(m, n);
    assert.ok(cfg.startGX !== undefined, `level ${n} missing startGX`);
    assert.ok(findGoal(m), `level ${n} missing goal`);
  }
});
