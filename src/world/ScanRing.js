/**
 * @fileoverview Radar-pulse ring rendered at level-center. Pure decoration,
 * can be enabled/disabled per level or for accessibility.
 */
import * as THREE from 'three';
import { Y_MID } from '../config.js';

/**
 * Slowly expanding ring with fading opacity. Updates each frame via
 * `update(dt)`.
 */
export class ScanRing {
  /**
   * @param {THREE.Scene} scene - Scene to add the ring to.
   */
  constructor(scene) {
    /** @type {THREE.MeshBasicMaterial} */
    this.mat = new THREE.MeshBasicMaterial({
      color: 0x00f6ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    /** @type {THREE.Mesh} */
    this.mesh = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.55, 64), this.mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = Y_MID + 0.05;
    scene.add(this.mesh);
    /** @type {number} Animation phase in `[0, 1)`. */
    this.t = 0;
    /** @type {boolean} Whether the ring is visible / animating. */
    this.enabled = true;
  }

  /**
   * Toggle the ring. When disabling, fades opacity to 0 immediately.
   *
   * @param {boolean} v - `true` to show, `false` to hide.
   * @returns {void}
   */
  setEnabled(v) {
    this.enabled = v;
    if (!v) this.mat.opacity = 0;
  }

  /**
   * Advance the pulse animation. When disabled, the ring is forced invisible.
   *
   * @param {number} dt - Delta time in seconds.
   * @returns {void}
   */
  update(dt) {
    if (!this.enabled) {
      this.mat.opacity = 0;
      return;
    }
    this.t = (this.t + dt * 1.6) % 1.0;
    const radius = 0.5 + this.t * 9.0;
    this.mesh.scale.set(radius, radius, radius);
    this.mat.opacity = (1.0 - this.t) * 0.55;
  }
}
