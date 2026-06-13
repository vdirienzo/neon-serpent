// tests/three/scene.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { Scene, FogExp2, Color } from './three-stub.js';

register('./three-hook.mjs', import.meta.url);

let createScene;

test('scene module loads', async () => {
  ({ createScene } = await import('../../src/render/Scene.js'));
  assert.equal(typeof createScene, 'function');
});

test('createScene() returns a scene-like object with .background and .fog', () => {
  const scene = createScene();
  assert.ok(scene);
  assert.ok('background' in scene);
  assert.ok('fog' in scene);
});

test('Returned object is a Scene instance', () => {
  const scene = createScene();
  assert.ok(scene instanceof Scene);
});

test('scene.background is the BG color (0x04060e)', () => {
  const scene = createScene();
  // COLORS.BG = new THREE.Color(0x04060e)
  assert.ok(scene.background, 'background should be set');
  assert.ok(scene.background.isColor, 'background should be a Color instance');
  // r, g, b are normalized to [0, 1] in our stub.
  const hex = scene.background.getHex();
  assert.equal(hex, 0x04060e);
});

test('scene.fog is a FogExp2 with the expected color and density', () => {
  const scene = createScene();
  assert.ok(scene.fog, 'fog should be set');
  assert.ok(scene.fog instanceof FogExp2);
  assert.equal(scene.fog.density, 0.01);
  // Color of fog is 0x04060e (matches background).
  assert.equal(scene.fog.color.getHex(), 0x04060e);
});

test('createScene() returns a fresh scene each call (not shared)', () => {
  const a = createScene();
  const b = createScene();
  assert.notEqual(a, b);
  // They have the same defaults but distinct references.
  assert.equal(a.background.getHex(), b.background.getHex());
  assert.equal(a.fog.density, b.fog.density);
});

test('Returned scene has an .add() method that mutates children', () => {
  const scene = createScene();
  const obj = { tag: 'thing' };
  scene.add(obj);
  assert.ok(scene.children.includes(obj));
});
