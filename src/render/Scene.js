/**
 * @fileoverview Scene factory. Creates a `THREE.Scene` with the project's
 * deep-space background color and exponential-squared fog.
 */
import * as THREE from 'three';
import { COLORS } from '../core/Color.js';

/**
 * Build a new scene.
 *
 * @returns {THREE.Scene} Scene with `background = COLORS.BG` and
 *   `FogExp2(0x04060e, 0.010)` applied.
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = COLORS.BG;
  scene.fog = new THREE.FogExp2(0x04060e, 0.01);
  return scene;
}
