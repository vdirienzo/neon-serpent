/**
 * @fileoverview WebGL renderer factory + window resize helper.
 */
import * as THREE from 'three';

/**
 * Build the WebGL renderer with the project's pixel / color settings.
 *
 * - `antialias: false` — bloom hides aliasing; saves a lot of fill rate.
 * - `powerPreference: 'high-performance'` — request the discrete GPU.
 * - `preserveDrawingBuffer: false` — fewer copies, no need for screenshots.
 * - `outputColorSpace: SRGBColorSpace` + `ACESFilmicToneMapping` for the
 *   neon look; `toneMappingExposure: 1.1` slightly brightens midtones.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {THREE.WebGLRenderer}
 * @throws {Error} If `WebGLRenderer` cannot be constructed (e.g. no WebGL).
 */
export function createRenderer(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: false,
      stencil: false,
      depth: true,
    });
  } catch (e) {
    throw new Error('WebGLRenderer failed: ' + e.message);
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x04060e, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  return renderer;
}

/**
 * Resize the renderer, update the camera aspect, and resize the post
 * composer to match the current window. Safe to call on every `resize` event.
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Camera} camera
 * @param {import('three/addons/postprocessing/EffectComposer.js').EffectComposer} [composer]
 * @returns {void}
 */
export function resizeRenderer(renderer, camera, composer) {
  const w = window.innerWidth,
    h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (composer) composer.setSize(w, h);
}
