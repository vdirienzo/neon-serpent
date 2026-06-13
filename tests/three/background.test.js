// tests/three/background.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { Scene, Points, Group, Sprite, BufferGeometry, BufferAttribute } from './three-stub.js';

register('./three-hook.mjs', import.meta.url);

let Background;

test('background module loads', async () => {
  // Background.js calls document.createElement('canvas') inside makeNebula.
  // The DOM is not installed in this test file, so we have to install it
  // before the import resolves.
  const { installDOM } = await import('../dom/setup.js');
  installDOM();

  Background = await import('../../src/render/Background.js');
  assert.equal(typeof Background.createBackground, 'function');
  assert.equal(typeof Background.updateBackground, 'function');
});

test('createBackground(scene, span) returns stars, nebGroup, dust', () => {
  const scene = new Scene();
  const bg = Background.createBackground(scene, 100);
  assert.ok(bg.stars, 'stars should be present');
  assert.ok(bg.nebGroup, 'nebGroup should be present');
  assert.ok(bg.dust, 'dust should be present');
});

test('All 3 background elements are added to the scene', () => {
  const scene = new Scene();
  const bg = Background.createBackground(scene, 100);
  // Stars + nebGroup + dust = 3 children
  assert.equal(scene.children.length, 3);
  assert.ok(scene.children.includes(bg.stars));
  assert.ok(scene.children.includes(bg.nebGroup));
  assert.ok(scene.children.includes(bg.dust));
});

test('stars is a Points object backed by a BufferGeometry', () => {
  const scene = new Scene();
  const bg = Background.createBackground(scene, 100);
  assert.ok(bg.stars instanceof Points);
  assert.ok(bg.stars.geometry instanceof BufferGeometry);
  // The geometry should expose `position` and `color` BufferAttributes
  // (each with 3 components per vertex).
  const pos = bg.stars.geometry.getAttribute('position');
  const col = bg.stars.geometry.getAttribute('color');
  assert.ok(pos);
  assert.ok(col);
  assert.equal(pos.itemSize, 3);
  assert.equal(col.itemSize, 3);
  // Default count is 500 stars.
  assert.equal(pos.count, 500);
  assert.equal(col.count, 500);
});

test('dust is a Points object with the requested span', () => {
  const scene = new Scene();
  const bg = Background.createBackground(scene, 200);
  assert.ok(bg.dust instanceof Points);
  const pos = bg.dust.geometry.getAttribute('position');
  assert.equal(pos.itemSize, 3);
  // 120 dust particles by default.
  assert.equal(pos.count, 120);
});

test('nebGroup is a Group containing 3 nebula Sprites', () => {
  const scene = new Scene();
  const bg = Background.createBackground(scene, 100);
  assert.ok(bg.nebGroup instanceof Group);
  assert.equal(bg.nebGroup.children.length, 3);
  for (const c of bg.nebGroup.children) {
    assert.ok(c instanceof Sprite);
  }
});

test('Each sprite has a SpriteMaterial with a CanvasTexture map', () => {
  const scene = new Scene();
  const bg = Background.createBackground(scene, 100);
  for (const sprite of bg.nebGroup.children) {
    assert.ok(sprite.material);
    assert.ok(sprite.material.map, 'sprite material should have a map texture');
  }
});

test('Stars are positioned at positive y (above the playfield)', () => {
  const scene = new Scene();
  const bg = Background.createBackground(scene, 100);
  const pos = bg.stars.geometry.getAttribute('position').array;
  // Check that y values are non-negative and bounded by the radius (80).
  for (let i = 0; i < pos.length; i += 3) {
    const y = pos[i + 1];
    assert.ok(y >= 0, `star y should be >= 0, got ${y}`);
    assert.ok(y <= 80, `star y should be <= radius (80), got ${y}`);
  }
});

test('updateBackground(bg, t) rotates nebGroup and dust', () => {
  const scene = new Scene();
  const bg = Background.createBackground(scene, 100);
  // Initial state — rotation.y should be 0.
  assert.equal(bg.dust.rotation.y, 0);
  assert.equal(bg.nebGroup.rotation.y, 0);
  // After update with t=1, both should be positive.
  Background.updateBackground(bg, 1);
  assert.ok(bg.dust.rotation.y > 0, 'dust should rotate forward');
  assert.ok(bg.nebGroup.rotation.y > 0, 'nebGroup should rotate forward');
  // dust rotates 5x faster than nebGroup (0.05 vs 0.01).
  assert.equal(bg.dust.rotation.y, 0.05);
  assert.equal(bg.nebGroup.rotation.y, 0.01);
  // t=2 doubles the angle.
  Background.updateBackground(bg, 2);
  assert.equal(bg.dust.rotation.y, 0.1);
  assert.equal(bg.nebGroup.rotation.y, 0.02);
});

test('updateBackground(bg, 0) leaves rotations at zero', () => {
  const scene = new Scene();
  const bg = Background.createBackground(scene, 100);
  Background.updateBackground(bg, 0);
  assert.equal(bg.dust.rotation.y, 0);
  assert.equal(bg.nebGroup.rotation.y, 0);
});

test('createBackground is idempotent (two calls produce two independent backgrounds)', () => {
  const scene = new Scene();
  const a = Background.createBackground(scene, 100);
  const b = Background.createBackground(scene, 100);
  assert.notEqual(a.stars, b.stars);
  assert.notEqual(a.nebGroup, b.nebGroup);
  assert.notEqual(a.dust, b.dust);
  // The scene now holds 6 children.
  assert.equal(scene.children.length, 6);
});
