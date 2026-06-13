/**
 * @fileoverview Stars, nebulae, and dust particles for the scene background.
 * Pure factory functions plus an `updateBackground()` per-frame call.
 */
import * as THREE from 'three';
import { rand } from '../core/Math.js';

/**
 * Color generator factory for stars. Three muted blue/pink/white tints.
 * @type {ReadonlyArray<() => THREE.Color>}
 */
const STAR_COLORS = [
  () => new THREE.Color(0x6a8a9a),
  () => new THREE.Color(0x8a6a78),
  () => new THREE.Color(0xc8c8c8),
];

/**
 * Build a `THREE.Points` cloud of stars distributed on a hemisphere
 * around the origin. Y values are clamped to positive (sky only).
 *
 * @param {number} [count=500] - Number of stars.
 * @param {number} [radius=80] - Outer shell radius.
 * @returns {THREE.Points} A new point cloud, ready to add to a scene.
 */
export function makeStars(count = 500, radius = 80) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random(),
      v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = radius * rand(0.6, 1.0);
    pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * rand(0.4, 1.0);
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    const t = Math.random();
    const c = (t < 0.55 ? STAR_COLORS[0] : t < 0.85 ? STAR_COLORS[1] : STAR_COLORS[2])();
    col[i * 3 + 0] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({
    size: rand(0.6, 1.2),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(g, m);
}

/**
 * Build a soft radial nebula sprite using a `CanvasTexture`. The texture
 * uses a radial gradient that fades to transparent at the edges.
 *
 * @param {number} size - World size of the sprite.
 * @param {THREE.Color} color - Tint of the nebula.
 * @param {number} opacity - Peak alpha in the center.
 * @param {number} x - World X.
 * @param {number} y - World Y.
 * @param {number} z - World Z.
 * @returns {THREE.Sprite} A new sprite, ready to add to a scene.
 */
export function makeNebula(size, color, opacity, x, y, z) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(
    0,
    `rgba(${(color.r * 255) | 0},${(color.g * 255) | 0},${(color.b * 255) | 0},${opacity})`
  );
  grd.addColorStop(
    0.4,
    `rgba(${(color.r * 255) | 0},${(color.g * 255) | 0},${(color.b * 255) | 0},${opacity * 0.4})`
  );
  grd.addColorStop(1, `rgba(0,0,0,0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.45,
  });
  const s = new THREE.Sprite(m);
  s.scale.set(size, size, 1);
  s.position.set(x, y, z);
  return s;
}

/**
 * Build a small low-altitude dust point cloud for atmospheric haze.
 *
 * @param {number} [count=120] - Number of dust points.
 * @param {number} span - Half-width of the play area; sets the XZ spread.
 * @returns {THREE.Points}
 */
export function makeDust(count = 120, span) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3 + 0] = rand(-span * 0.6, span * 0.6);
    pos[i * 3 + 1] = rand(0, 8);
    pos[i * 3 + 2] = rand(-span * 0.6, span * 0.6);
    const c = Math.random() < 0.5 ? new THREE.Color(0x008a92) : new THREE.Color(0x8a1f7a);
    col[i * 3 + 0] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.35,
  });
  return new THREE.Points(g, m);
}

/**
 * Assemble the full background (stars, nebula group, dust) into the scene.
 *
 * @param {THREE.Scene} scene - Target scene.
 * @param {number} span - Play-area half-width, passed through to `makeDust`.
 * @returns {{ stars: THREE.Points, nebGroup: THREE.Group, dust: THREE.Points }}
 *   References to the three added objects, for per-frame updates.
 */
export function createBackground(scene, span) {
  const stars = makeStars(500, 80);
  scene.add(stars);

  const nebGroup = new THREE.Group();
  nebGroup.add(makeNebula(40, new THREE.Color(0x004a6a), 0.3, -25, 14, -30));
  nebGroup.add(makeNebula(36, new THREE.Color(0x6a004a), 0.25, 30, 10, -28));
  nebGroup.add(makeNebula(30, new THREE.Color(0x1a2a6a), 0.28, 0, 18, -34));
  scene.add(nebGroup);

  const dust = makeDust(120, span);
  scene.add(dust);

  return { stars, nebGroup, dust };
}

/**
 * Per-frame background animation. Slowly rotates the dust and nebula
 * groups; the star field is static.
 *
 * @param {{ dust: THREE.Object3D, nebGroup: THREE.Object3D }} bg - The handle
 *   returned by `createBackground()`.
 * @param {number} t - Elapsed time in seconds.
 * @returns {void}
 */
export function updateBackground(bg, t) {
  bg.dust.rotation.y = t * 0.05;
  bg.nebGroup.rotation.y = t * 0.01;
}
