/**
 * @fileoverview Camera factory. Builds the `THREE.PerspectiveCamera` used
 * by the scene; aspect ratio is taken from the current window size.
 */
import * as THREE from 'three';

/**
 * Build the main perspective camera. Field of view is `55°`, near `0.1`,
 * far `200`. Position `(0, 28, 38)` matches the default cinematic pose.
 *
 * @returns {THREE.PerspectiveCamera}
 */
export function createCamera() {
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 28, 38);
  camera.lookAt(0, -1.5, 0);
  return camera;
}
