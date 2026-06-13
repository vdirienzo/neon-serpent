/**
 * @fileoverview Expanding ring effect used for snake eat/bonus feedback.
 * Each wave is a single mesh whose scale grows and opacity fades over a
 * short lifetime, then auto-disposes.
 */
import * as THREE from 'three';

/**
 * @typedef {Object} WaveEntry
 * @property {THREE.Mesh} mesh - The expanding ring.
 * @property {number} t - Time elapsed since spawn in seconds.
 * @property {number} dur - Total lifetime in seconds.
 */

/**
 * Manages a short-lived list of expanding rings. Two color materials
 * (`goldMat` and `cyanMat`) are cloned per wave.
 */
export class Waves {
  /**
   * @param {THREE.Scene} scene - Scene to attach waves to.
   */
  constructor(scene) {
    /** @type {THREE.Scene} */
    this.scene = scene;
    /** @type {THREE.RingGeometry} Shared ring geometry. */
    this.geo = new THREE.RingGeometry(0.42, 0.5, 64);
    /** @type {THREE.MeshBasicMaterial} Prototype gold material. */
    this.goldMat = new THREE.MeshBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    /** @type {THREE.MeshBasicMaterial} Prototype cyan material. */
    this.cyanMat = new THREE.MeshBasicMaterial({
      color: 0x00f6ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    /** @type {WaveEntry[]} */
    this.list = [];
  }

  /**
   * Spawn a new expanding wave at `(x, z)`.
   *
   * @param {number} x - World X.
   * @param {number} z - World Z.
   * @param {boolean} gold - `true` for gold color, `false` for cyan.
   * @returns {void}
   */
  spawn(x, z, gold) {
    const mat = (gold ? this.goldMat : this.cyanMat).clone();
    const m = new THREE.Mesh(this.geo, mat);
    m.position.set(x, 0.06, z);
    m.scale.set(0.1, 0.1, 0.1);
    this.scene.add(m);
    this.list.push({ mesh: m, t: 0, dur: 0.7 });
  }

  /**
   * Advance every wave. Once `t / dur >= 1`, the mesh is removed and
   * disposed. Iterates backwards so splicing is safe.
   *
   * @param {number} dt - Delta time in seconds.
   * @returns {void}
   */
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const w = this.list[i];
      w.t += dt;
      const k = w.t / w.dur;
      const s = 0.1 + (8.5 - 0.1) * k;
      w.mesh.scale.set(s, s, s);
      w.mesh.material.opacity = 1 - k;
      if (k >= 1) {
        this.scene.remove(w.mesh);
        w.mesh.material.dispose();
        this.list.splice(i, 1);
      }
    }
  }
}
