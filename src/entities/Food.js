/**
 * @fileoverview Single food orb: spinning icosahedron + wire cage + halo
 * torus + cyan point light. The snake collects food by stepping onto it.
 */
import * as THREE from 'three';
import { COLORS } from '../core/Color.js';
import { g2w } from '../core/Math.js';

/**
 * Holds the (at most one) active food item. Re-spawn by calling `spawn()`.
 */
export class Food {
  /**
   * @param {THREE.Scene} scene - Scene to attach the food mesh to.
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
  }

  /**
   * Dispose any prior mesh and spawn a new food orb at the given cell.
   *
   * @param {number} gx - Cell X in `[0, GRID)`.
   * @param {number} gz - Cell Z in `[0, GRID)`.
   * @returns {void}
   */
  spawn(gx, gz) {
    this.dispose();
    this.gx = gx;
    this.gz = gz;
    const g = new THREE.Group();
    const sz = 0.4;
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(sz, 0),
      new THREE.MeshStandardMaterial({
        color: 0x000,
        emissive: COLORS.CYAN,
        emissiveIntensity: 3.0,
        roughness: 0.3,
        metalness: 0.4,
      })
    );
    g.add(core);
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(sz * 1.25, 0),
      new THREE.MeshBasicMaterial({
        color: COLORS.MAG,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
      })
    );
    g.add(wire);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(sz * 1.6, 0.025, 8, 48),
      new THREE.MeshBasicMaterial({ color: COLORS.CYAN })
    );
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const pl = new THREE.PointLight(COLORS.CYAN.getHex(), 0.8, 4, 2);
    g.add(pl);
    const w = g2w(gx);
    g.position.set(w, 0.6, g2w(gz));
    g.userData = { core, wire, ring, pl, t0: Math.random() * 10 };
    this.mesh = g;
    this.scene.add(g);
  }

  /**
   * Animate the food: rotate geometry, bob vertically, pulse the light.
   * No-op if `spawn()` has not been called.
   *
   * @param {number} t - Elapsed time in seconds.
   * @param {(gx: number, gz: number) => number} [heightAt] - Optional callback
   *   for the surface Y at the food's cell. Currently unused.
   * @returns {void}
   */
  update(t, heightAt) {
    if (!this.mesh) return;
    const u = this.mesh.userData;
    u.t0 += 0.016;
    u.core.rotation.y += 0.02;
    u.core.rotation.x += 0.01;
    u.wire.rotation.y -= 0.015;
    u.wire.rotation.z += 0.008;
    u.ring.rotation.z += 0.025;
    this.mesh.position.y = 0.6 + Math.sin(t * 2 + u.t0) * 0.12;
    u.pl.intensity = 0.9 * (0.8 + 0.2 * Math.sin(t * 8));
  }

  /**
   * Test whether the food currently sits at the given cell.
   *
   * @param {number} gx
   * @param {number} gz
   * @returns {boolean}
   */
  isAt(gx, gz) {
    return this.mesh && this.gx === gx && this.gz === gz;
  }

  /**
   * Remove the food from the scene and dispose its geometry/material.
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
