/**
 * @fileoverview Animated water plane and the deep abyss below it. Vertex
 * positions are displaced each frame to fake waves.
 */
import * as THREE from 'three';
import { Y_WATER, Y_OCEAN } from '../config.js';

/**
 * Two horizontal planes that fill the play area: a reflective water surface
 * at `Y_WATER` and a solid abyss plate at `Y_OCEAN`.
 */
export class WaterPlane {
  /**
   * @param {THREE.Scene} scene - Scene to add the water to.
   */
  constructor(scene) {
    /** @type {THREE.PlaneGeometry} */
    this.geometry = new THREE.PlaneGeometry(80, 80, 32, 32);
    /** @type {Float32Array} Snapshot of the original (rest) positions. */
    this.basePositions = new Float32Array(this.geometry.attributes.position.array);
    /** @type {THREE.MeshStandardMaterial} */
    this.material = new THREE.MeshStandardMaterial({
      color: 0x001428,
      emissive: 0x003a5c,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.78,
      roughness: 0.15,
      metalness: 0.7,
      side: THREE.DoubleSide,
    });
    /** @type {THREE.Mesh} */
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = Y_WATER;
    scene.add(this.mesh);

    /** @type {THREE.Mesh} The solid dark plate at the bottom of the world. */
    this.abyss = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshBasicMaterial({ color: 0x010205 })
    );
    this.abyss.rotation.x = -Math.PI / 2;
    this.abyss.position.y = Y_OCEAN;
    scene.add(this.abyss);
  }

  /**
   * Animate the water surface. Each vertex's Z is displaced by a small
   * sinusoid of `(x, t)`. The plane geometry attribute is marked dirty so
   * the GPU picks up the new positions.
   *
   * @param {number} t - Elapsed time in seconds.
   * @returns {void}
   */
  update(t) {
    const pos = this.geometry.attributes.position;
    const arr = pos.array;
    const base = this.basePositions;
    for (let i = 0; i < arr.length; i += 3) {
      const ox = base[i],
        oz = base[i + 1];
      arr[i + 2] =
        ox * 0.05 + Math.sin(ox * 1.4 + t * 1.1) * 0.08 + Math.cos(oz * 1.2 + t * 0.9) * 0.06;
    }
    pos.needsUpdate = true;
  }
}
