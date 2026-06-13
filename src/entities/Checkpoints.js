/**
 * @fileoverview Three-checkpoint markers placed between start and goal.
 * Each checkpoint is a torus ring + emissive octahedron marker + point light.
 * Completing them in order scores points and recolors the ring to green.
 */
import * as THREE from 'three';
import { g2w } from '../core/Math.js';

/**
 * @typedef {Object} CheckpointEntry
 * @property {THREE.Mesh} mesh - The torus ring.
 * @property {THREE.Mesh} marker - The octahedron marker above the ring.
 * @property {THREE.PointLight} light - The associated point light.
 * @property {number} gx - Cell X.
 * @property {number} gz - Cell Z.
 * @property {number} idx - 1-based order (1, 2, 3).
 * @property {boolean} done - Whether the snake has passed this checkpoint.
 */

/**
 * Manages a list of checkpoints for the current level.
 */
export class Checkpoints {
  /**
   * @param {THREE.Scene} scene - Scene to attach checkpoint meshes to.
   */
  constructor(scene) {
    /** @type {THREE.Scene} */
    this.scene = scene;
    /** @type {CheckpointEntry[]} */
    this.list = [];
  }

  /**
   * Spawn a single checkpoint at the given cell.
   *
   * @param {number} gx - Cell X in `[0, GRID)`.
   * @param {number} gz - Cell Z in `[0, GRID)`.
   * @param {number} idx - 1-based checkpoint index.
   * @param {import('../world/HeightMap.js').default} map - Heightmap (for Y placement).
   * @returns {void}
   */
  spawn(gx, gz, idx, map) {
    const y = map.heightAt(gx, gz) + 1.4;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.04, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.85 })
    );
    ring.position.set(g2w(gx), y, g2w(gz));
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    const marker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({
        color: 0x000,
        emissive: 0xffc857,
        emissiveIntensity: 2.5,
        roughness: 0.2,
      })
    );
    marker.position.set(g2w(gx), y + 0.5, g2w(gz));
    this.scene.add(marker);
    const pl = new THREE.PointLight(0xffc857, 1.0, 4, 2);
    pl.position.set(g2w(gx), y, g2w(gz));
    this.scene.add(pl);
    this.list.push({ mesh: ring, marker, light: pl, gx, gz, idx, done: false });
  }

  /**
   * Place three checkpoints at 1/4, 1/2, and 3/4 of the way from start to
   * goal. For each, snap to the nearest solid cell within a small radius.
   *
   * @param {{ gx: number, gz: number }} start - Start cell.
   * @param {{ gx: number, gz: number }} goal - Goal cell.
   * @param {import('../world/HeightMap.js').default} map - Heightmap used to test solidity.
   * @returns {void}
   */
  placeBetween(start, goal, map) {
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      const mx = Math.round(start.gx + (goal.gx - start.gx) * t);
      const mz = Math.round(start.gz + (goal.gz - start.gz) * t);
      let found = false;
      for (let r = 0; r < 5 && !found; r++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          for (let dz = -r; dz <= r && !found; dz++) {
            const gx = mx + dx,
              gz = mz + dz;
            if (gx >= 0 && gx < 32 && gz >= 0 && gz < 32 && map.isSolid(gx, gz)) {
              this.spawn(gx, gz, i, map);
              found = true;
            }
          }
        }
      }
    }
  }

  /**
   * Test if the snake just entered a checkpoint cell. If so, mark it done,
   * recolor to green, and invoke the callback.
   *
   * @param {number} gx - Head cell X.
   * @param {number} gz - Head cell Z.
   * @param {(entry: CheckpointEntry) => void} onPass - Callback fired on first pass.
   * @returns {CheckpointEntry | null} The matched entry, or `null`.
   */
  checkPass(gx, gz, onPass) {
    for (const c of this.list) {
      if (!c.done && c.gx === gx && c.gz === gz) {
        c.done = true;
        c.mesh.material.color.set(0x39ff14);
        c.mesh.material.opacity = 0.4;
        if (c.marker) {
          c.marker.material.emissive.set(0x39ff14);
          c.marker.material.emissiveIntensity = 0.8;
        }
        if (c.light) {
          c.light.color.set(0x39ff14);
          c.light.intensity = 0.5;
        }
        onPass(c);
        return c;
      }
    }
    return null;
  }

  /**
   * Whether an active (not-yet-passed) checkpoint sits at the given cell.
   *
   * @param {number} gx
   * @param {number} gz
   * @returns {boolean}
   */
  isOccupied(gx, gz) {
    return this.list.some((c) => !c.done && c.gx === gx && c.gz === gz);
  }

  /**
   * Remove and dispose every checkpoint; clear the list.
   *
   * @returns {void}
   */
  clear() {
    for (const c of this.list) {
      if (c.mesh) {
        this.scene.remove(c.mesh);
        c.mesh.geometry.dispose && c.mesh.geometry.dispose();
        c.mesh.material.dispose && c.mesh.material.dispose();
      }
      if (c.marker) {
        this.scene.remove(c.marker);
        c.marker.geometry.dispose && c.marker.geometry.dispose();
        c.marker.material.dispose && c.marker.material.dispose();
      }
      if (c.light) {
        this.scene.remove(c.light);
      }
    }
    this.list.length = 0;
  }
}
