/**
 * @fileoverview Valley fog sprites (low cells) + peak sparkles (high cells).
 * Adds atmosphere without expensive particle systems.
 */
import * as THREE from 'three';
import { GRID, Y_MID, Y_TOP } from '../config.js';
import { g2w, rand } from '../core/Math.js';

/**
 * Drifting fog + twinkling sparkles. Spawns a fixed number of sprites on
 * `build()` based on the supplied heightmap, then animates them every frame.
 */
export class AmbientParticles {
  /**
   * @param {THREE.Scene} scene - The Three.js scene to add particles to.
   */
  constructor(scene) {
    /** @type {THREE.Scene} */
    this.scene = scene;
    /** @type {THREE.Group} */
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  /**
   * Rebuild the particle field for the current heightmap. Removes any
   * previous sprites first.
   *
   * @param {import('./HeightMap.js').default | Object} map - Heightmap instance.
   *   Must expose `cells[gx][gz]` with `{ y, solid }`.
   * @returns {void}
   */
  build(map) {
    this.clear();
    const valleyCells = [];
    const peakCells = [];
    for (let gx = 0; gx < GRID; gx++) {
      for (let gz = 0; gz < GRID; gz++) {
        const c = map.cells[gx][gz];
        if (!c.solid) continue;
        if (c.y < Y_MID - 0.5) valleyCells.push({ gx, gz, y: c.y });
        else if (c.y > Y_TOP - 0.5) peakCells.push({ gx, gz, y: c.y });
      }
    }

    for (let i = 0; i < 40; i++) {
      if (!valleyCells.length) break;
      const c = valleyCells[Math.floor(Math.random() * valleyCells.length)];
      const fogMat = new THREE.SpriteMaterial({
        color: 0x00f6ff,
        transparent: true,
        opacity: 0.05 + Math.random() * 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const s = new THREE.Sprite(fogMat);
      const scale = 0.6 + Math.random() * 0.8;
      s.scale.set(scale, scale, 1);
      s.position.set(
        g2w(c.gx) + rand(-0.3, 0.3),
        c.y + 0.4 + Math.random() * 1.2,
        g2w(c.gz) + rand(-0.3, 0.3)
      );
      s.userData = { baseY: s.position.y, t0: Math.random() * 10, drift: rand(0.3, 0.6) };
      this.group.add(s);
    }

    const sparkleColor = Math.random() < 0.5 ? 0xff2bd6 : 0xffc857;
    for (let i = 0; i < 25; i++) {
      if (!peakCells.length) break;
      const c = peakCells[Math.floor(Math.random() * peakCells.length)];
      const sm = new THREE.SpriteMaterial({
        color: sparkleColor,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const s = new THREE.Sprite(sm);
      const scale = 0.15 + Math.random() * 0.2;
      s.scale.set(scale, scale, 1);
      s.position.set(
        g2w(c.gx) + rand(-0.2, 0.2),
        c.y + 0.8 + Math.random() * 0.6,
        g2w(c.gz) + rand(-0.2, 0.2)
      );
      s.userData = { baseY: s.position.y, t0: Math.random() * 10, twinkleSpeed: rand(2, 5) };
      this.group.add(s);
    }
  }

  /**
   * Animate every particle. Fog sprites drift vertically; sparkles twinkle
   * their opacity.
   *
   * @param {number} t - Elapsed time in seconds.
   * @returns {void}
   */
  update(t) {
    for (const c of this.group.children) {
      const u = c.userData;
      if (!u) continue;
      if (u.drift != null) {
        c.position.y = u.baseY + Math.sin(t * u.drift + u.t0) * 0.4;
      } else if (u.twinkleSpeed != null) {
        c.material.opacity = 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(t * u.twinkleSpeed + u.t0));
      }
    }
  }

  /**
   * Remove every sprite, disposing its material to free GPU memory.
   *
   * @returns {void}
   */
  clear() {
    while (this.group.children.length > 0) {
      const c = this.group.children.pop();
      if (c.material) c.material.dispose && c.material.dispose();
    }
    this.group.clear();
  }
}
