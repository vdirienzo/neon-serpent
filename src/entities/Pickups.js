/**
 * @fileoverview Multi-type collectable pickups (orbs, gems, crystals, slow,
 * dice). Different geometries, sizes, and point values. Spawned per level
 * via `populate()` or individually via `spawn()`.
 */
import * as THREE from 'three';
import { COLORS } from '../core/Color.js';
import { g2w } from '../core/Math.js';

/**
 * @typedef {Object} PickupType
 * @property {number} color - Emissive color (`0xRRGGBB`).
 * @property {number} glow - Point light color.
 * @property {number} size - Base size in world units.
 * @property {string} kind - Lowercase identifier.
 * @property {number} points - Score awarded on collect.
 * @property {string} geo - Geometry key consumed by `makeGeometry`.
 */

/**
 * Catalog of pickup archetypes. Values are exported via `TYPES` for tests.
 * @type {Readonly<Record<string, PickupType>>}
 */
const TYPES = {
  orb: { color: 0x00f6ff, glow: 0x00f6ff, size: 0.35, kind: 'orb', points: 10, geo: 'icosa' },
  gem: { color: 0xff2bd6, glow: 0xff2bd6, size: 0.5, kind: 'gem', points: 50, geo: 'octa' },
  crystal: {
    color: 0x39ff14,
    glow: 0x39ff14,
    size: 0.4,
    kind: 'crystal',
    points: 25,
    geo: 'tetra',
  },
  slow: { color: 0xb026ff, glow: 0xb026ff, size: 0.4, kind: 'slow', points: 20, geo: 'dodeca' },
  dice: { color: 0xffc857, glow: 0xffc857, size: 0.42, kind: 'dice', points: 200, geo: 'box' },
};

/**
 * Build the appropriate `THREE.BufferGeometry` for a pickup type.
 *
 * @param {string} kind - One of `'icosa' | 'octa' | 'tetra' | 'dodeca' | 'box'`.
 *   Unknown values fall back to a low-poly sphere.
 * @param {number} size - Base size in world units.
 * @returns {THREE.BufferGeometry}
 */
function makeGeometry(kind, size) {
  switch (kind) {
    case 'icosa':
      return new THREE.IcosahedronGeometry(size, 1);
    case 'octa':
      return new THREE.OctahedronGeometry(size, 0);
    case 'tetra':
      return new THREE.TetrahedronGeometry(size, 0);
    case 'dodeca':
      return new THREE.DodecahedronGeometry(size, 0);
    case 'box':
      return new THREE.BoxGeometry(size * 1.4, size * 1.4, size * 1.4);
  }
  return new THREE.SphereGeometry(size, 8, 6);
}

/**
 * @typedef {Object} PickupEntry
 * @property {THREE.Group} mesh - The scene graph node for the pickup.
 * @property {number} gx - Cell X.
 * @property {number} gz - Cell Z.
 * @property {string} type - Pickup type key from `TYPES`.
 * @property {string} kind - Lowercase kind name.
 * @property {boolean} active - Whether the pickup is still in play.
 * @property {number} t0 - Per-pickup phase offset for animation.
 * @property {number} color - Emissive color.
 * @property {number} size - Base size.
 * @property {number} baseY - Resting Y; bob oscillates around this.
 */

/**
 * Manages all pickups for the current level.
 */
export class Pickups {
  /**
   * @param {THREE.Scene} scene - Scene to attach pickup meshes to.
   */
  constructor(scene) {
    /** @type {THREE.Scene} */
    this.scene = scene;
    /** @type {PickupEntry[]} */
    this.list = [];
  }

  /**
   * Spawn one pickup of the given type at the given cell. Returns the new
   * entry, or `null` if the type is unknown.
   *
   * @param {string} type - Key from `TYPES` (`'orb' | 'gem' | 'crystal' | 'slow' | 'dice'`).
   * @param {number} gx - Cell X in `[0, GRID)`.
   * @param {number} gz - Cell Z in `[0, GRID)`.
   * @returns {PickupEntry | null}
   */
  spawn(type, gx, gz) {
    const t = TYPES[type];
    if (!t) return null;
    const g = new THREE.Group();
    const baseY = g2w(gx);
    const y = 0.6;
    const core = new THREE.Mesh(
      makeGeometry(t.geo, t.size),
      new THREE.MeshStandardMaterial({
        color: 0x000,
        emissive: t.color,
        emissiveIntensity: type === 'crystal' ? 4.5 : type === 'dice' ? 4.2 : 3.2,
        roughness: 0.3,
        metalness: 0.4,
      })
    );
    g.add(core);
    if (type === 'crystal') {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(t.size * 1.8, 0.02, 6, 24),
        new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.8 })
      );
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
    }
    const pl = new THREE.PointLight(t.glow, 2.5, 5, 2);
    g.add(pl);
    g.position.set(g2w(gx), y, g2w(gz));
    g.userData = { core, pl, t0: Math.random() * 10 };
    this.scene.add(g);
    const entry = {
      mesh: g,
      gx,
      gz,
      type,
      kind: t.kind,
      active: true,
      t0: Math.random() * 10,
      color: t.color,
      size: t.size,
      baseY: y,
    };
    this.list.push(entry);
    return entry;
  }

  /**
   * Populate a level with a fixed mix of pickups drawn from the free-cell
   * callback. Mix: 6 orbs, 3 gems, 2 crystals, 1 slow, 1 dice.
   *
   * @param {() => number} rng - Deterministic PRNG (e.g. from `core/Random.js`).
   * @param {() => Array<{ gx: number, gz: number }>} freeCellsFn - Returns
   *   the list of free cell coordinates. Called once.
   * @returns {void}
   */
  populate(rng, freeCellsFn) {
    const free = freeCellsFn();
    if (!free.length) return;
    const pick = () => {
      if (!free.length) return null;
      const idx = Math.floor(rng() * free.length);
      return free.splice(idx, 1)[0];
    };
    for (let i = 0; i < 6; i++) {
      const c = pick();
      if (c) this.spawn('orb', c.gx, c.gz);
    }
    for (let i = 0; i < 3; i++) {
      const c = pick();
      if (c) this.spawn('gem', c.gx, c.gz);
    }
    for (let i = 0; i < 2; i++) {
      const c = pick();
      if (c) this.spawn('crystal', c.gx, c.gz);
    }
    const slowC = pick();
    if (slowC) this.spawn('slow', slowC.gx, slowC.gz);
    const diceC = pick();
    if (diceC) this.spawn('dice', diceC.gx, diceC.gz);
  }

  /**
   * Animate every active pickup: rotate core, bob vertically, pulse light.
   *
   * @param {number} t - Elapsed time in seconds.
   * @returns {void}
   */
  update(t) {
    for (const p of this.list) {
      if (!p.active) continue;
      const u = p.mesh.userData;
      u.core.rotation.y += 0.02;
      u.core.rotation.x += 0.01;
      p.mesh.position.y = p.baseY + Math.sin(t * 2 + p.t0) * 0.12;
      u.pl.intensity = 2.5 * (0.8 + 0.2 * Math.sin(t * 6 + p.t0));
    }
  }

  /**
   * Test whether the snake just entered a cell containing an active pickup.
   * If so, the entry is removed from the list and the callback is invoked
   * with it. Iterates LIFO so pickups stacked at the same cell resolve
   * deterministically.
   *
   * @param {number} gx - Head cell X.
   * @param {number} gz - Head cell Z.
   * @param {(entry: PickupEntry) => void} onCollect - Callback fired with the entry.
   * @returns {PickupEntry | null} The collected entry, or `null`.
   */
  checkCollect(gx, gz, onCollect) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (p.active && p.gx === gx && p.gz === gz) {
        onCollect(p);
        p.active = false;
        this.disposeOne(p);
        this.list.splice(i, 1);
        return p;
      }
    }
    return null;
  }

  /**
   * Whether an active pickup sits at the given cell.
   *
   * @param {number} gx
   * @param {number} gz
   * @returns {boolean}
   */
  isOccupied(gx, gz) {
    return this.list.some((p) => p.active && p.gx === gx && p.gz === gz);
  }

  /**
   * Remove and dispose a single pickup's mesh + material.
   *
   * @param {PickupEntry} p
   * @returns {void}
   */
  disposeOne(p) {
    if (p.mesh) {
      this.scene.remove(p.mesh);
      p.mesh.traverse((c) => {
        if (c.geometry) c.geometry.dispose && c.geometry.dispose();
        if (c.material) c.material.dispose && c.material.dispose();
      });
    }
  }

  /**
   * Dispose every pickup and empty the list.
   *
   * @returns {void}
   */
  clear() {
    for (const p of this.list) this.disposeOne(p);
    this.list.length = 0;
  }
}
