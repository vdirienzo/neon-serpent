/**
 * @fileoverview Four-light rig: ambient, two colored point lights, and a
 * top-down directional. Returns references for runtime tweaking.
 */
import * as THREE from 'three';

/**
 * Add the global lighting rig to the scene.
 *
 * @param {THREE.Scene} scene - Target scene.
 * @returns {{ amb: THREE.AmbientLight, keyLight: THREE.PointLight, fillLight: THREE.PointLight, topLight: THREE.DirectionalLight }}
 */
export function createLights(scene) {
  const amb = new THREE.AmbientLight(0x335577, 0.9);
  scene.add(amb);

  const keyLight = new THREE.PointLight(0x00f6ff, 2.4, 60, 1.5);
  keyLight.position.set(8, 12, 6);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xff2bd6, 1.8, 60, 1.5);
  fillLight.position.set(-9, 10, -6);
  scene.add(fillLight);

  const topLight = new THREE.DirectionalLight(0x88aaff, 0.6);
  topLight.position.set(0, 20, 0);
  scene.add(topLight);

  return { amb, keyLight, fillLight, topLight };
}
