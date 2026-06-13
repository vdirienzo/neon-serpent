/**
 * @fileoverview Snake renderer. Owns the per-segment meshes, head point
 * light, and frame-to-frame interpolation between `prevCells` and `cells`.
 * Computes lean anticipation, eat-pulse, and post-turn stretch.
 */
import * as THREE from 'three';
import { COLORS, lerpColors, cloneColor } from '../core/Color.js';
import { g2w, damp, lerp, clamp, angleDelta } from '../core/Math.js';
import { DIRS } from '../config.js';

/** Shared cube geometry used for every snake segment. */
const segGeo = new THREE.BoxGeometry(0.78, 0.78, 0.78);

/**
 * Build a single segment mesh. `t` in `[0, 1]` runs head → tail, fading
 * the emissive color from cyan to magenta and the intensity from 3.6 → 1.0.
 *
 * @param {number} t - 0 at head, 1 at tail.
 * @returns {THREE.Mesh}
 */
function makeSeg(t) {
  const col = lerpColors(COLORS.CYAN, COLORS.MAG, t);
  const intensity = lerp(3.6, 1.0, t);
  return new THREE.Mesh(
    segGeo,
    new THREE.MeshStandardMaterial({
      color: 0x05060a,
      emissive: col,
      emissiveIntensity: intensity,
      roughness: 0.25,
      metalness: 0.5,
    })
  );
}

/**
 * Visual representation of a `Snake`. One Group with N segment meshes plus
 * a head point light. Updated by `render()` each frame.
 */
export class SnakeView {
  /**
   * @param {THREE.Scene} scene - Scene to add the snake group to.
   */
  constructor(scene) {
    /** @type {THREE.Group} */
    this.group = new THREE.Group();
    scene.add(this.group);
    /** @type {THREE.Mesh[]} Segment meshes, head at index 0. */
    this.meshes = [];
    /** @type {number} Current head lean Z (radians, around 0). */
    this.headLeanZ = 0;
    /** @type {number} Elapsed time of the last turn. */
    this.lastTurnTime = -Infinity;
    /** @type {THREE.PointLight} Light attached to the head segment. */
    this.headLight = new THREE.PointLight(0x00f6ff, 3.0, 5, 2);
    this.headLight.position.set(0, 0.4, 0);
    this.group.add(this.headLight);
  }

  /**
   * Reconcile the number of segment meshes with the snake's body length.
   * New meshes start scaled to ~0 (grow into place).
   *
   * @param {import('./Snake.js').Snake} snake
   * @returns {void}
   */
  sync(snake, t) {
    while (this.meshes.length < snake.cells.length) {
      const m = makeSeg(
        this.meshes.length === 0 ? 0 : this.meshes.length / (snake.cells.length - 1)
      );
      m.scale.setScalar(0.001);
      this.group.add(m);
      this.meshes.push(m);
    }
    while (this.meshes.length > snake.cells.length) {
      const m = this.meshes.pop();
      this.group.remove(m);
    }
  }

  /**
   * Per-frame update. Interpolates segment positions between `prevCells`
   * and `cells` using `stepT` (0 = prev, 1 = current), updates head
   * rotation/lean/scale, and moves the head point light.
   *
   * @param {import('./Snake.js').Snake} snake
   * @param {number} t - Elapsed time in seconds.
   * @param {number} dt - Delta time in seconds.
   * @param {number} stepT - Interpolation factor between prev and current cells.
   * @returns {THREE.Vector3} The head's world position.
   */
  render(snake, t, dt, stepT) {
    this.sync(snake, t);
    const head = snake.cells[0];
    const headW = new THREE.Vector3(g2w(head.gx), this.mapHeight(snake, head) + 0.4, g2w(head.gz));
    for (let i = 0; i < snake.cells.length; i++) {
      const cur = snake.cells[i];
      const prev = snake.prevCells[i] || cur;
      const curW = new THREE.Vector3(g2w(cur.gx), this.mapHeight(snake, cur) + 0.4, g2w(cur.gz));
      const prevW = new THREE.Vector3(
        g2w(prev.gx),
        this.mapHeight(snake, prev) + 0.4,
        g2w(prev.gz)
      );
      const x = lerp(prevW.x, curW.x, stepT);
      const z = lerp(prevW.z, curW.z, stepT);
      const pulse = 1.0 + 0.05 * Math.sin(t * 4 - i * 0.35);
      const m = this.meshes[i];
      if (!m.userData) m.userData = {};
      if (m.userData.s == null) m.userData.s = 0.001;
      m.userData.s = damp(m.userData.s, pulse, 18, dt);
      const y = lerp(prevW.y, curW.y, stepT);
      const yBob = i === 0 ? Math.sin(t * 6) * 0.06 : 0;
      m.position.set(x, y + yBob, z);
      const tFrac = snake.cells.length <= 1 ? 0 : i / (snake.cells.length - 1);
      const col = lerpColors(COLORS.CYAN, COLORS.MAG, tFrac);
      const intensity = lerp(4.5, 1.8, tFrac);
      m.material.emissive.copy(col);
      m.material.emissiveIntensity = intensity;
    }

    if (this.headLight && headW) {
      this.headLight.position.set(headW.x, headW.y + 0.2, headW.z);
    }

    const headMesh = this.meshes[0];
    if (headMesh) {
      const targetYaw = Math.atan2(snake.dir.x, snake.dir.z);
      const d = angleDelta(headMesh.rotation.y, targetYaw);
      headMesh.rotation.y += d * Math.min(1, dt * 12);

      let leanTarget = 0;
      if (snake.pendingTurns.length > 0) {
        const nxt = DIRS[snake.pendingTurns[0]];
        if (nxt) {
          const cross = snake.dir.x * nxt.z - snake.dir.z * nxt.x;
          leanTarget = clamp(cross, -1, 1) * 0.35;
        }
      }
      this.headLeanZ = damp(this.headLeanZ, leanTarget, 14, dt);
      headMesh.rotation.z = this.headLeanZ;

      const baseS = headMesh.userData.s > 0.8 ? headMesh.userData.s * 1.08 : headMesh.userData.s;
      if (headMesh.userData.eatT == null) headMesh.userData.eatT = 0;
      if (headMesh.userData.eatT > 0)
        headMesh.userData.eatT = Math.max(0, headMesh.userData.eatT - dt);
      const EAT_DUR = 0.3;
      const eatK = clamp(headMesh.userData.eatT / EAT_DUR, 0, 1);
      const eatScale = 1.0 + 0.3 * eatK;
      let stretchZ = 1.0,
        squeezeXY = 1.0;
      const sinceTurnMs = (t - this.lastTurnTime) * 1000;
      const winMs = (snake.stepInterval || 130) * 0.4;
      if (sinceTurnMs < winMs) {
        const k = 1 - sinceTurnMs / winMs;
        stretchZ = 1.0 + 0.15 * k;
        squeezeXY = 1.0 - 0.1 * k;
      }
      headMesh.scale.set(
        baseS * eatScale * squeezeXY,
        baseS * eatScale * squeezeXY,
        baseS * eatScale * stretchZ
      );
    }
    return headW;
  }

  /**
   * World Y of the surface under a snake cell.
   *
   * @param {import('./Snake.js').Snake} snake
   * @param {{ gx: number, gz: number }} cell
   * @returns {number}
   */
  mapHeight(snake, cell) {
    return snake.map.heightAt(cell.gx, cell.gz);
  }

  /**
   * Trigger the brief "eat" pulse on the head segment.
   *
   * @param {number} [t=0.3] - Duration in seconds.
   * @returns {void}
   */
  triggerEat(t = 0.3) {
    if (this.meshes[0]) {
      if (!this.meshes[0].userData) this.meshes[0].userData = {};
      this.meshes[0].userData.eatT = t;
    }
  }

  /**
   * Record the current time as the most recent turn. Used to time the
   * post-turn stretch animation.
   *
   * @param {number} t - Elapsed time in seconds.
   * @returns {void}
   */
  noteTurn(t) {
    this.lastTurnTime = t;
  }

  /**
   * Toggle visibility of every segment and the head light.
   *
   * @param {boolean} v
   * @returns {void}
   */
  setVisible(v) {
    for (const m of this.meshes) m.visible = v;
    if (this.headLight) this.headLight.visible = v;
  }
}
