// tests/unit/extra/level-manager.test.js
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { LevelManager } from '../../../src/game/LevelManager.js';
import { HeightMap } from '../../../src/world/HeightMap.js';
import * as Modes from '../../../src/game/Modes.js';
import { MODE } from '../../../src/config.js';
import * as GameState from '../../../src/game/GameState.js';
import { clear as clearBus } from '../../../src/core/EventBus.js';

function makeCtx() {
  const calls = { terrainBuild: 0, ambientBuild: 0, goalSet: 0, startSet: 0 };
  return {
    map: new HeightMap(),
    terrainMesh: { build: () => { calls.terrainBuild++; } },
    water: null,
    ambient:   { build: () => { calls.ambientBuild++; } },
    goal:      { set:   () => { calls.goalSet++; } },
    startMarker: { set: () => { calls.startSet++; } },
    _calls: calls
  };
}

beforeEach(() => {
  clearBus();
  GameState.setState('playing');
  Modes.setMode(MODE.STORY);
});

test('load(1) returns a valid config with startGX/startGZ/startDir', () => {
  const ctx = makeCtx();
  const lm = new LevelManager(ctx);
  const cfg = lm.load(1);

  assert.ok(typeof cfg.startGX === 'number');
  assert.ok(typeof cfg.startGZ === 'number');
  assert.ok(typeof cfg.startDir === 'string');
  assert.ok(['up', 'down', 'left', 'right'].includes(cfg.startDir));
  assert.ok(ctx.map.isSolid(cfg.startGX, cfg.startGZ), 'start cell must be solid');
  assert.equal(ctx._calls.terrainBuild, 1);
  assert.equal(ctx._calls.ambientBuild, 1);
  assert.equal(ctx._calls.goalSet, 1);
  assert.equal(ctx._calls.startSet, 1);
  assert.equal(ctx.lastStart.gx, cfg.startGX);
  assert.equal(ctx.lastStart.gz, cfg.startGZ);
});

test('load(10) returns a valid config', () => {
  const ctx = makeCtx();
  const lm = new LevelManager(ctx);
  const cfg = lm.load(10);
  assert.ok(ctx.map.isSolid(cfg.startGX, cfg.startGZ));
  assert.equal(cfg.startGX, 7);
  assert.equal(cfg.startGZ, 10);
});

test('load(11) cycles back to level 1 config', () => {
  const cfgA = new LevelManager(makeCtx()).load(1);
  const cfgB = new LevelManager(makeCtx()).load(11);
  assert.equal(cfgB.startGX, cfgA.startGX);
  assert.equal(cfgB.startGZ, cfgA.startGZ);
  assert.equal(cfgB.startDir, cfgA.startDir);
});

test('load(20) cycles to level 10 config', () => {
  const cfgA = new LevelManager(makeCtx()).load(10);
  const cfgB = new LevelManager(makeCtx()).load(20);
  assert.equal(cfgB.startGX, cfgA.startGX);
  assert.equal(cfgB.startGZ, cfgA.startGZ);
  assert.equal(cfgB.startDir, cfgA.startDir);
});

test('cycling: load(n) and load(n+10) yield identical config for n in 1..10', () => {
  for (let n = 1; n <= 10; n++) {
    const cfgA = new LevelManager(makeCtx()).load(n);
    const cfgB = new LevelManager(makeCtx()).load(n + 10);
    assert.equal(cfgB.startGX, cfgA.startGX, `gx differs at n=${n}`);
    assert.equal(cfgB.startGZ, cfgA.startGZ, `gz differs at n=${n}`);
    assert.equal(cfgB.startDir, cfgA.startDir, `dir differs at n=${n}`);
  }
});

test('daily mode uses buildDailyLevel (palette forced to index 0)', () => {
  Modes.setMode(MODE.DAILY);
  const ctx = makeCtx();
  const lm = new LevelManager(ctx);
  const cfg = lm.load(1);
  assert.ok(ctx.map.isSolid(cfg.startGX, cfg.startGZ));
  assert.equal(ctx.levelPalette.name, 'INICIO');
});

test('lastGoal is populated from the map goal cell', () => {
  const ctx = makeCtx();
  const lm = new LevelManager(ctx);
  lm.load(1);
  assert.ok(ctx.map.isGoal(ctx.lastGoal.gx, ctx.lastGoal.gz),
    `lastGoal (${ctx.lastGoal.gx},${ctx.lastGoal.gz}) should be a goal cell`);
});

test('palette selection cycles through LEVEL_PALETTES for n=1..10', () => {
  const seen = new Set();
  for (let n = 1; n <= 10; n++) {
    const ctx = makeCtx();
    new LevelManager(ctx).load(n);
    seen.add(ctx.levelPalette);
  }
  assert.equal(seen.size, 10);
});
