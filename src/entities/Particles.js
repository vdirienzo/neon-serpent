/**
 * @fileoverview Pooled point-sprite particle system. Used for explosions,
 * eat sparkles, and bonus bursts. Particles are integrated with simple
 * gravity, bounce off the ground, and despawn when their life reaches 0.
 */
import * as THREE from 'three';
import { rand } from '../core/Math.js';

/** Maximum number of live particles. Older slots are reused. */
const PARTICLE_MAX = 600;

/**
 * Ring-buffer of additive points. `emit()` spawns N particles, `update(dt)`
 * integrates them.
 */
export class Particles {
  /**
   * @param {THREE.Scene} scene - Scene to add the points object to.
   */
  constructor(scene) {
    /** @type {THREE.BufferGeometry} */
    this.geo = new THREE.BufferGeometry();
    /** @type {Float32Array} Position attribute (xyz per particle). */
    this.pos = new Float32Array(PARTICLE_MAX * 3);
    /** @type {Float32Array} Velocity attribute (xyz per particle). */
    this.vel = new Float32Array(PARTICLE_MAX * 3);
    /** @type {Float32Array} Color attribute (rgb per particle). */
    this.col = new Float32Array(PARTICLE_MAX * 3);
    /** @type {Float32Array} Remaining life in seconds per particle. */
    this.life = new Float32Array(PARTICLE_MAX);
    for (let i = 0; i < PARTICLE_MAX; i++) this.pos[i * 3 + 1] = -100;
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    /** @type {THREE.PointsMaterial} */
    this.mat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });
    /** @type {THREE.Points} */
    this.points = new THREE.Points(this.geo, this.mat);
    scene.add(this.points);
    /** @type {number} Next free slot in the ring buffer. */
    this.cursor = 0;
  }

  /**
   * Spawn `count` particles at `(x, y, z)` with the given color. Velocities
   * are randomized outward and upward. `big` produces larger, faster bursts.
   *
   * @param {number} x - World X.
   * @param {number} y - World Y.
   * @param {number} z - World Z.
   * @param {THREE.Color} color - Per-particle base color.
   * @param {number} count - Number of particles to emit.
   * @param {boolean} [big=false] - Larger burst preset.
   * @returns {void}
   */
  emit(x, y, z, color, count, big = false) {
    for (let i = 0; i < count; i++) {
      const i3 = this.cursor * 3;
      this.pos[i3] = x;
      this.pos[i3 + 1] = y;
      this.pos[i3 + 2] = z;
      const ang = Math.random() * Math.PI * 2;
      const sp = rand(big ? 2.6 : 1.6, big ? 5.5 : 3.6);
      this.vel[i3] = Math.cos(ang) * sp;
      this.vel[i3 + 1] = rand(2.0, big ? 5.5 : 4.0);
      this.vel[i3 + 2] = Math.sin(ang) * sp;
      this.col[i3] = color.r;
      this.col[i3 + 1] = color.g;
      this.col[i3 + 2] = color.b;
      this.life[this.cursor] = rand(0.7, 1.4);
      this.cursor = (this.cursor + 1) % PARTICLE_MAX;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }

  /**
   * Integrate every live particle. Applies gravity, ground bounce, and
   * despawns particles whose life reaches 0 (sent offscreen to `y = -100`).
   *
   * @param {number} dt - Delta time in seconds.
   * @returns {void}
   */
  update(dt) {
    for (let i = 0; i < PARTICLE_MAX; i++) {
      if (this.life[i] <= 0) continue;
      const i3 = i * 3;
      this.vel[i3 + 1] -= 9.0 * dt;
      this.pos[i3] += this.vel[i3] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
      if (this.pos[i3 + 1] < 0.05) {
        this.pos[i3 + 1] = 0.05;
        this.vel[i3 + 1] *= -0.45;
        this.vel[i3] *= 0.7;
        this.vel[i3 + 2] *= 0.7;
      }
      this.life[i] -= dt;
      if (this.life[i] <= 0) this.pos[i3 + 1] = -100;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}
