/**
 * @fileoverview Single-instance bonus pickup: spinning icosahedron + wire
 * cage + glow torus + point light. Spawned periodically by the game loop.
 */
import * as THREE from 'three';
import { COLORS } from '../core/Color.js';
import { g2w } from '../core/Math.js';

/**
 * One active bonus at a time. Re-spawn by calling `spawn()` again.
 */
export class Bonus {
  /**
   * @param {THREE.Scene} scene - Scene to attach the bonus mesh to.
   */
  constructor(scene) {
    /** @type {THREE.Scene} */
    this.scene = scene;
    /** @type {THREE.Group | null} */
    this.mesh = null;
    /** @type {number} Current cell X. */
    this.gx = 0;
    /** @type {number} Current cell Z. */
    this.gz = 0;
    /** @type {number} Total seconds the bonus should remain before despawn. */
    this.duration = 0;
  }

  /**
   * Dispose any prior mesh and spawn a new bonus at the given cell.
   *
   * @param {number} gx - Cell X in `[0, GRID)`.
   * @param {number} gz - Cell Z in `[0, GRID)`.
   * @param {number} duration - Lifetime in seconds.
   * @returns {void}
   */
  spawn(gx, gz, duration) {
    this.dispose();
    this.gx = gx;
    this.gz = gz;
    this.duration = duration;
    const g = new THREE.Group();
    const sz = 0.55;
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(sz, 0),
      new THREE.MeshStandardMaterial({
        color: 0x000,
        emissive: COLORS.GOLD,
        emissiveIntensity: 3.6,
        roughness: 0.3,
        metalness: 0.4,
      })
    );
    g.add(core);
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(sz * 1.25, 0),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
      })
    );
    g.add(wire);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(sz * 1.6, 0.025, 8, 48),
      new THREE.MeshBasicMaterial({ color: COLORS.GOLD })
    );
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const pl = new THREE.PointLight(COLORS.GOLD.getHex(), 0.8, 4, 2);
    g.add(pl);
    g.position.set(g2w(gx), 0.7, g2w(gz));
    g.userData = { core, wire, ring, pl, t0: Math.random() * 10 };
    this.mesh = g;
    this.scene.add(g);
  }

  /**
   * Animate the bonus: rotate inner geometry, bob vertically, pulse the light.
   *
   * @param {number} t - Elapsed time in seconds.
   * @returns {void}
   */
  update(t) {
    if (!this.mesh) return;
    const u = this.mesh.userData;
    u.core.rotation.y += 0.016;
    u.core.rotation.z += 0.008;
    u.wire.rotation.y -= 0.012;
    u.wire.rotation.x += 0.005;
    u.ring.rotation.z -= 0.02;
    this.mesh.position.y = 0.7 + Math.sin(t * 2.2 + u.t0) * 0.15;
    u.pl.intensity = 1.1 + 0.3 * Math.sin(t * 9);
  }

  /**
   * Test whether the bonus currently sits at the given cell.
   *
   * @param {number} gx
   * @param {number} gz
   * @returns {boolean} `true` if a bonus is alive at `(gx, gz)`.
   */
  isAt(gx, gz) {
    return this.mesh && this.gx === gx && this.gz === gz;
  }

  /**
   * Remove the bonus from the scene and dispose its geometry/material.
   *
   * @returns {void}
   */
  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.traverse((c) => {
        if (c.geometry) c.geometry.dispose && c.geometry.dispose();
        if (c.material) c.material.dispose && c.material.dispose();
      });
      this.mesh = null;
    }
  }
}
