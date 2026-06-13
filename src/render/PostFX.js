/**
 * @fileoverview Post-processing pipeline: `EffectComposer` + `UnrealBloomPass`
 * for the neon glow + a `GammaCorrectionShader` for sRGB output.
 *
 * Without bloom, emissive materials look like flat colors instead of
 * glowing. `three@0.149` does not have `OutputPass` (added in r152), so we
 * use `GammaCorrectionShader` via `ShaderPass` as the final sRGB conversion
 * step.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';

/**
 * Build the post-processing composer. The pipeline is:
 *  1. `RenderPass` — main scene render.
 *  2. `UnrealBloomPass` — selective bloom (strength `0.45`, radius `0.4`,
 *     threshold `0.95`). Only the brightest emissives bloom, so terrain
 *     and water stay clean.
 *  3. `GammaCorrectionShader` — final sRGB conversion.
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @returns {import('three/addons/postprocessing/EffectComposer.js').EffectComposer}
 */
export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.4, 0.95)
  );
  composer.addPass(new ShaderPass(GammaCorrectionShader));
  return composer;
}
