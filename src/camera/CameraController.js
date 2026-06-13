/**
 * @fileoverview Camera mode controller. Switches between three poses
 * (cinematic, top-down, chase) and smoothly damps the camera position and
 * look-at target. Also handles a screen-space shake amplitude.
 */
import * as THREE from 'three';
import { damp } from '../core/Math.js';
import { cinematicPose, topDownPose, chasePose } from './CameraMath.js';

/** Human-readable labels for the three camera modes. */
const MODES = ['CINEMÁTICA', 'CENITAL', 'PERSECUCIÓN'];

/**
 * Owns the camera, current mode, and damped state. Updates the camera each
 * frame via `update()`.
 */
export class CameraController {
  /**
   * @param {THREE.Camera} camera - The Three.js camera to control.
   */
  constructor(camera) {
    /** @type {THREE.Camera} */
    this.camera = camera;
    /** @type {number} Mode index: 0 cinematic, 1 top-down, 2 chase. */
    this.mode = 0;
    /** @type {{ pos: THREE.Vector3, target: THREE.Vector3, shake: number, shakeT: number }} Damped pose + shake state. */
    this.blend = {
      pos: camera.position.clone(),
      target: new THREE.Vector3(0, 0, 0),
      shake: 0,
      shakeT: 0,
    };
  }

  /**
   * Set the mode by index. Negative values wrap via `MODES.length`.
   *
   * @param {number} m - Mode index.
   * @returns {void}
   */
  setMode(m) {
    this.mode = ((m % MODES.length) + MODES.length) % MODES.length;
  }

  /**
   * Advance to the next mode (wrapping).
   *
   * @returns {string} The new mode's display name.
   */
  cycle() {
    this.setMode(this.mode + 1);
    return this.modeName();
  }

  /**
   * @returns {string} Display name of the current mode.
   */
  modeName() {
    return MODES[this.mode];
  }

  /**
   * @returns {string[]} The list of all mode names, in order.
   */
  modes() {
    return MODES;
  }

  /**
   * Per-frame update. Computes the target pose for the current mode,
   * optionally adds a shake offset, damps toward the target, and writes
   * the result back to the camera.
   *
   * @param {number} t - Elapsed time in seconds.
   * @param {number} dt - Delta time in seconds.
   * @param {THREE.Vector3} headWorld - Snake head world position.
   * @param {{ x: number, z: number }} dirWorld - Snake direction in the XZ plane.
   * @param {number} yFocus - Y to keep in the center of the look-at.
   * @param {number} gridSize - World size of the play area.
   * @param {boolean} shakeAllowed - Whether shake is currently enabled.
   * @returns {void}
   */
  update(t, dt, headWorld, dirWorld, yFocus, gridSize, shakeAllowed) {
    let pose;
    if (this.mode === 0) pose = cinematicPose(t, gridSize, yFocus);
    else if (this.mode === 1) pose = topDownPose(gridSize, yFocus);
    else pose = chasePose(headWorld, dirWorld, yFocus);

    const tp = pose.pos;
    if (this.blend.shake > 0 && shakeAllowed) {
      const s = this.blend.shake;
      tp.x += (Math.random() - 0.5) * s * 0.6;
      tp.y += (Math.random() - 0.5) * s * 0.6;
      tp.z += (Math.random() - 0.5) * s * 0.6;
    }

    const lambda = 5.0;
    this.blend.pos.x = damp(this.blend.pos.x, tp.x, lambda, dt);
    this.blend.pos.y = damp(this.blend.pos.y, tp.y, lambda, dt);
    this.blend.pos.z = damp(this.blend.pos.z, tp.z, lambda, dt);
    this.blend.target.x = damp(this.blend.target.x, pose.target.x, lambda, dt);
    this.blend.target.y = damp(this.blend.target.y, pose.target.y, lambda, dt);
    this.blend.target.z = damp(this.blend.target.z, pose.target.z, lambda, dt);

    if (this.blend.shake > 0 && !shakeAllowed) this.blend.shake = 0;
    this.blend.shake = Math.max(0, this.blend.shake - dt * 1.2);

    this.camera.position.copy(this.blend.pos);
    this.camera.lookAt(this.blend.target);
  }

  /**
   * Set the shake amplitude. Decays automatically in `update()`.
   *
   * @param {number} [amp=1.4] - Initial shake amplitude.
   * @returns {void}
   */
  triggerShake(amp = 1.4) {
    this.blend.shake = amp;
  }

  /**
   * Snap the camera to an explicit pose without damping. Used at level
   * transitions to avoid a long ease-in.
   *
   * @param {{ pos: THREE.Vector3, target: THREE.Vector3 }} target - Pose to snap to.
   * @returns {void}
   */
  snap(target) {
    this.blend.pos.copy(target.pos);
    this.blend.target.copy(target.target);
    this.camera.position.copy(this.blend.pos);
    this.camera.lookAt(this.blend.target);
  }
}

/** Re-exported under a public name for UI modules. */
export { MODES as CAMERA_MODES };
