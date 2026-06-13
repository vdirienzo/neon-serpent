/**
 * @fileoverview Animated goal beacon: spinning core + halo ring + point light.
 * The beacon sits above the goal cell and is the only thing the snake can
 * collide with to win the level.
 */
import * as THREE from 'three';
import { g2w } from '../core/Math.js';

/**
 * Manages a single goal beacon instance. Re-call `set()` to retarget.
 */
export class Goal {
  /**
   * @param {THREE.Scene} scene - Scene that the beacon will be added to.
   */
  constructor(scene) {
    /** @type {THREE.Scene} */
    this.scene = scene;
    /** @type {THREE.Group} */
    this.group = new THREE.Group();
    /** @type {THREE.Object3D | null} The current beacon root. */
    this.mesh = null;
  }

  /**
   * Build (or rebuild) the beacon at the supplied grid cell with the given
   * emissive color. The previous beacon is disposed.
   *
   * @param {number} gx - Goal cell X in `[0, GRID)`.
   * @param {number} gz - Goal cell Z in `[0, GRID)`.
   * @param {number} y - Goal Y in world units (top of the goal cell).
   * @param {number} goalCol - Color as a `0xRRGGBB` hex integer.
   * @returns {void}
   */
  set(gx, gz, y, goalCol) {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.traverse((o) => {
        if (o.geometry) o.geometry.dispose && o.geometry.dispose();
        if (o.material) o.material.dispose && o.material.dispose();
      });
    }
    const beacon = new THREE.Group();
    const c = new THREE.Color(goalCol);
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({
        color: 0x000,
        emissive: c.clone(),
        emissiveIntensity: 4.0,
        roughness: 0.2,
      })
    );
    core.position.y = 0.6;
    beacon.add(core);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.04, 8, 32),
      new THREE.MeshBasicMaterial({ color: c.clone(), transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.4;
    beacon.add(ring);
    const light = new THREE.PointLight(c.getHex(), 4.0, 8, 2);
    light.position.y = 0.6;
    beacon.add(light);
    beacon.position.set(g2w(gx), y + 0.3, g2w(gz));
    this.mesh = beacon;
    this.scene.add(beacon);
  }

  /**
   * Per-frame animation: spin the beacon and add a small vertical hover.
   * No-op if `set()` has not been called yet.
   *
   * @param {number} t - Elapsed time in seconds.
   * @param {number} gx - Current goal X (kept for API compatibility).
   * @param {number} gz - Current goal Z.
   * @param {number} y - Current goal Y.
   * @returns {void}
   */
  update(t, gx, gz, y) {
    if (!this.mesh) return;
    this.mesh.rotation.y = t * 0.6;
    this.mesh.position.y = y + 0.3 + Math.sin(t * 2) * 0.08;
  }
}
