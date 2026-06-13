/**
 * @fileoverview Pure pose math for the three camera modes. Each function
 * returns a `{ pos, target }` pair, where `pos` is a `THREE.Vector3` for
 * the camera position and `target` is the world point the camera looks at.
 */
import * as THREE from 'three';

/**
 * @typedef {Object} CameraPose
 * @property {THREE.Vector3} pos - Camera world position.
 * @property {THREE.Vector3} target - World point to look at.
 */

/**
 * Cinematic pose: a slow orbit around the origin at a fixed height.
 * The camera Y bobs gently to add life.
 *
 * @param {number} t - Elapsed time in seconds; drives the orbit angle.
 * @param {number} gridSize - World size of the play area; sets the orbit radius.
 * @param {number} yFocus - Y to center the look-at on.
 * @returns {CameraPose}
 */
export function cinematicPose(t, gridSize, yFocus) {
  const camR = gridSize * 1.05;
  const camH = gridSize * 0.9;
  const ang = t * 0.08;
  return {
    pos: new THREE.Vector3(
      Math.sin(ang) * camR,
      camH + Math.sin(t * 0.5) * 0.6,
      Math.cos(ang) * camR
    ),
    target: new THREE.Vector3(0, yFocus, 0),
  };
}

/**
 * Top-down pose: directly above the play area. A tiny `(0.01, 0.01)` XZ
 * offset prevents `lookAt` from collapsing the up vector.
 *
 * @param {number} gridSize - World size of the play area.
 * @param {number} yFocus - Y to center the look-at on.
 * @returns {CameraPose}
 */
export function topDownPose(gridSize, yFocus) {
  return {
    pos: new THREE.Vector3(0.01, gridSize * 1.1, 0.01),
    target: new THREE.Vector3(0, yFocus, 0),
  };
}

/**
 * Chase pose: behind the snake head, looking forward.
 *
 * @param {THREE.Vector3} headWorld - Snake head world position.
 * @param {{ x: number, z: number }} dirWorld - Snake direction in the XZ plane.
 * @param {number} yFocus - Y to center the look-at on.
 * @returns {CameraPose}
 */
export function chasePose(headWorld, dirWorld, yFocus) {
  const back = new THREE.Vector3(-dirWorld.x, 0, -dirWorld.z);
  if (back.lengthSq() < 0.01) back.set(0, 0, 1);
  back.normalize();
  const d = 6.0;
  const pos = headWorld.clone().add(back.multiplyScalar(d));
  pos.y = headWorld.y + 3.5;
  const fwd = new THREE.Vector3(dirWorld.x, 0, dirWorld.z);
  const target = headWorld.clone().add(fwd.multiplyScalar(3.0));
  target.y = yFocus;
  return { pos, target };
}
