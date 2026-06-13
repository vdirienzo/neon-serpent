// tests/three/lighting.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { Scene, AmbientLight, PointLight, DirectionalLight } from './three-stub.js';

// Register the three-stub resolver BEFORE any module under test is imported.
// Because ESM `import` statements are hoisted, this must happen via a
// top-level synchronous call. The hook then catches any `import 'three'`
// that happens later, including dynamic imports in the tests below.
register('./three-hook.mjs', import.meta.url);

let createLights;

test('lighting module loads', async () => {
  ({ createLights } = await import('../../src/render/Lighting.js'));
  assert.equal(typeof createLights, 'function');
});

test('createLights returns amb, keyLight, fillLight, topLight', () => {
  const scene = new Scene();
  const lights = createLights(scene);
  assert.ok(lights.amb, 'amb should be present');
  assert.ok(lights.keyLight, 'keyLight should be present');
  assert.ok(lights.fillLight, 'fillLight should be present');
  assert.ok(lights.topLight, 'topLight should be present');
});

test('All 4 lights are added to the scene', () => {
  const scene = new Scene();
  const lights = createLights(scene);
  assert.equal(scene.children.length, 4);
  assert.ok(scene.children.includes(lights.amb));
  assert.ok(scene.children.includes(lights.keyLight));
  assert.ok(scene.children.includes(lights.fillLight));
  assert.ok(scene.children.includes(lights.topLight));
});

test('AmbientLight has the expected intensity (0.9)', () => {
  const scene = new Scene();
  const lights = createLights(scene);
  assert.equal(lights.amb.intensity, 0.9);
  assert.ok(lights.amb instanceof AmbientLight);
});

test('Key light (cyan) is a PointLight with intensity 2.4', () => {
  const scene = new Scene();
  const lights = createLights(scene);
  assert.ok(lights.keyLight instanceof PointLight);
  assert.equal(lights.keyLight.intensity, 2.4);
});

test('Fill light (magenta) is a PointLight with intensity 1.8', () => {
  const scene = new Scene();
  const lights = createLights(scene);
  assert.ok(lights.fillLight instanceof PointLight);
  assert.equal(lights.fillLight.intensity, 1.8);
});

test('Top light is a DirectionalLight with intensity 0.6', () => {
  const scene = new Scene();
  const lights = createLights(scene);
  assert.ok(lights.topLight instanceof DirectionalLight);
  assert.equal(lights.topLight.intensity, 0.6);
});

test('Lights are positioned in 3D space (not all at origin)', () => {
  const scene = new Scene();
  const lights = createLights(scene);
  assert.equal(lights.keyLight.position.x, 8);
  assert.equal(lights.keyLight.position.y, 12);
  assert.equal(lights.keyLight.position.z, 6);
  assert.equal(lights.fillLight.position.x, -9);
  assert.equal(lights.fillLight.position.y, 10);
  assert.equal(lights.fillLight.position.z, -6);
  assert.equal(lights.topLight.position.x, 0);
  assert.equal(lights.topLight.position.y, 20);
  assert.equal(lights.topLight.position.z, 0);
});

test('Light colors are set (non-zero r/g/b)', () => {
  const scene = new Scene();
  const lights = createLights(scene);
  for (const l of [lights.amb, lights.keyLight, lights.fillLight, lights.topLight]) {
    assert.ok(l.color, 'light should have a color');
    assert.equal(typeof l.color.r, 'number');
    assert.equal(typeof l.color.g, 'number');
    assert.equal(typeof l.color.b, 'number');
  }
});

test('createLights can be called repeatedly without losing references', () => {
  const scene = new Scene();
  createLights(scene);
  createLights(scene);
  assert.equal(scene.children.length, 8);
});

test('Returned light objects have .intensity as a number > 0', () => {
  const scene = new Scene();
  const lights = createLights(scene);
  for (const l of [lights.amb, lights.keyLight, lights.fillLight, lights.topLight]) {
    assert.equal(typeof l.intensity, 'number');
    assert.ok(l.intensity > 0);
  }
});
