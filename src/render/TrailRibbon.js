/**
 * @fileoverview Trail of 12 fading billboard quads behind the snake's head.
 * The first six are cyan, the rest magenta; opacity and size both decay
 * with distance from the head.
 */
import * as THREE from 'three';

/** Number of trail quads. */
const TRAIL_LEN = 12;

/**
 * Ring-buffered trail mesh group. Each `update()` advances the head, and
 * the visible quads are re-positioned to billboard toward the camera.
 */
export class TrailRibbon {
  /**
   * @param {THREE.Scene} scene - Scene to add the trail group to.
   */
  constructor(scene) {
    /** @type {THREE.Scene} */
    this.scene = scene;
    /** @type {THREE.Group} */
    this.group = new THREE.Group();
    /** @type {Array<{ x: number, y: number, z: number }>} Ring buffer of recorded head positions. */
    this.ring = [];
    /** @type {number} Next write index in `ring`. */
    this.head = 0;
    /** @type {number} Number of valid entries in `ring` (capped at `TRAIL_LEN`). */
    this.count = 0;
    /** @type {THREE.Mesh[]} Trail quad meshes, ordered head → tail. */
    this.meshes = [];
    /** @type {boolean} When `false`, `update()` is a no-op. */
    this.active = true;
    for (let i = 0; i < TRAIL_LEN; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.7),
        new THREE.MeshBasicMaterial({
          color: i < TRAIL_LEN / 2 ? 0x00f6ff : 0xff2bd6,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      m.visible = false;
      this.meshes.push(m);
      this.group.add(m);
    }
    scene.add(this.group);
  }

  /**
   * Record a new head position and refresh the visible quads. The quad at
   * index `i` is placed at the `(head - 1 - i)`-th most recent position,
   * billboards toward the camera, and fades by `1 - i / TRAIL_LEN`.
   *
   * @param {THREE.Vector3} headW - Snake head world position.
   * @param {THREE.Camera} camera - The active camera.
   * @returns {void}
   */
  update(headW, camera) {
    if (!this.active) return;
    this.ring[this.head] = { x: headW.x, y: headW.y + 0.1, z: headW.z };
    this.head = (this.head + 1) % TRAIL_LEN;
    if (this.count < TRAIL_LEN) this.count++;
    for (let i = 0; i < TRAIL_LEN; i++) {
      const idx = (this.head - 1 - i + TRAIL_LEN) % TRAIL_LEN;
      const pos = this.ring[idx];
      const m = this.meshes[i];
      if (!pos || i >= this.count) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(pos.x, pos.y, pos.z);
      m.lookAt(camera.position);
      const k = 1 - i / TRAIL_LEN;
      m.material.opacity = 0.35 * k;
      m.scale.setScalar(0.4 + 0.6 * k);
    }
  }

  /**
   * Reset the trail state and hide every quad.
   *
   * @returns {void}
   */
  clear() {
    this.ring = [];
    this.head = 0;
    this.count = 0;
    for (const m of this.meshes) m.visible = false;
  }
}
