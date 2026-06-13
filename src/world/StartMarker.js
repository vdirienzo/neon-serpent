/**
 * @fileoverview Pulsing ring placed at the snake's start cell. Decorative
 * indicator that fades and pulses until the snake first moves.
 */
import * as THREE from 'three';
import { g2w } from '../core/Math.js';

/**
 * Single-quad pulsing ring oriented horizontally at the spawn cell.
 */
export class StartMarker {
  /**
   * @param {THREE.Scene} scene - Scene to add the marker to.
   */
  constructor(scene) {
    /** @type {THREE.Group} */
    this.group = new THREE.Group();
    /** @type {THREE.Mesh} */
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.45, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00f6ff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.05;
    this.group.add(this.ring);
    scene.add(this.group);
  }

  /**
   * Move the marker to the given grid cell and recolor it to the level
   * primary color.
   *
   * @param {number} gx - Start cell X in `[0, GRID)`.
   * @param {number} gz - Start cell Z in `[0, GRID)`.
   * @param {number} y - Cell surface Y in world units.
   * @param {number} primaryCol - Color as `0xRRGGBB` hex integer.
   * @returns {void}
   */
  set(gx, gz, y, primaryCol) {
    this.group.position.set(g2w(gx), y + 0.06, g2w(gz));
    this.ring.material.color.set(primaryCol);
  }

  /**
   * Per-frame pulse: scale oscillates around 1.0.
   *
   * @param {number} t - Elapsed time in seconds.
   * @returns {void}
   */
  update(t) {
    this.ring.scale.setScalar(1.0 + 0.15 * Math.sin(t * 3));
  }
}
