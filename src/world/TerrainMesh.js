/**
 * @fileoverview Renders the heightmap as 3D boxes, edge lines, and contour
 * lines. Also tracks the materials of danger cells so the renderer can
 * pulse them.
 */
import * as THREE from 'three';
import { GRID, CELL, Y_OCEAN } from '../config.js';
import { g2w } from '../core/Math.js';

/** Y values at which a horizontal contour line is drawn. */
const CONTOUR_LEVELS = [-5.0, -3.5, -2.0, -0.5, 1.0, 2.5];

/**
 * Mesh group that visualizes the heightmap. Re-call `build()` to rebuild
 * for a new level.
 */
export class TerrainMesh {
  /** Create an empty group; call `build()` before use. */
  constructor() {
    /** @type {THREE.Group} */
    this.group = new THREE.Group();
    /** @type {THREE.BoxGeometry} Shared tile geometry. */
    this.tileGeo = new THREE.BoxGeometry(CELL * 0.94, 1, CELL * 0.94);
    /** @type {Map<string, THREE.LineBasicMaterial>} Map of `"gx,gz"` → material for danger-cell edge highlighting. */
    this.dangerEdges = new Map();
  }

  /**
   * Build tiles, edges, and contour lines for the current heightmap. Removes
   * any existing children first.
   *
   * @param {import('./HeightMap.js').default} map - Heightmap to render.
   * @param {number} primary - Primary level color as `0xRRGGBB`.
   * @param {number} goalCol - Goal cell edge color.
   * @param {number} dangerCol - Danger cell edge color.
   * @returns {void}
   */
  build(map, primary, goalCol, dangerCol) {
    this.clear();
    const primaryC = new THREE.Color(primary);
    const goalC = new THREE.Color(goalCol);
    const dangerC = new THREE.Color(dangerCol);
    for (let gx = 0; gx < GRID; gx++) {
      for (let gz = 0; gz < GRID; gz++) {
        const cell = map.cells[gx][gz];
        if (!cell.solid) continue;
        const yTop = cell.y;
        const height = yTop - Y_OCEAN;
        if (height < 0.2) continue;
        const tileMat = new THREE.MeshStandardMaterial({
          color: 0x0a1830,
          emissive: primaryC.clone().multiplyScalar(0.25),
          emissiveIntensity: 0.5,
          roughness: 0.35,
          metalness: 0.5,
        });
        const centerY = Y_OCEAN + height / 2;
        const tile = new THREE.Mesh(this.tileGeo, tileMat);
        tile.position.set(g2w(gx), centerY, g2w(gz));
        tile.scale.y = height;
        this.group.add(tile);

        const yLine = yTop + 0.02;
        const e = CELL * 0.5;
        const edgeMat = new THREE.LineBasicMaterial({
          color: cell.goal ? goalC.clone() : cell.danger ? dangerC.clone() : primaryC.clone(),
          transparent: true,
          opacity: cell.goal ? 1.0 : 0.9,
        });
        const edgePts = [
          new THREE.Vector3(-e, 0, -e),
          new THREE.Vector3(e, 0, -e),
          new THREE.Vector3(e, 0, -e),
          new THREE.Vector3(e, 0, e),
          new THREE.Vector3(e, 0, e),
          new THREE.Vector3(-e, 0, e),
          new THREE.Vector3(-e, 0, e),
          new THREE.Vector3(-e, 0, -e),
        ];
        const eg = new THREE.BufferGeometry().setFromPoints(edgePts);
        const el = new THREE.LineSegments(eg, edgeMat);
        el.position.set(g2w(gx), yLine, g2w(gz));
        this.group.add(el);
        if (cell.danger) {
          this.dangerEdges.set(`${gx},${gz}`, edgeMat);
        }
      }
    }

    // Contour lines
    const contourPts = [];
    const ec = CELL * 0.5;
    for (let gx = 0; gx < GRID; gx++) {
      for (let gz = 0; gz < GRID; gz++) {
        const cell = map.cells[gx][gz];
        if (!cell.solid) continue;
        const yA = cell.y;
        const rightN = gx + 1 < GRID ? map.cells[gx + 1][gz] : null;
        if (rightN && rightN.solid) {
          const yB = rightN.y;
          for (const L of CONTOUR_LEVELS) {
            if ((yA >= L && yB < L) || (yA < L && yB >= L)) {
              const t = (L - yA) / (yB - yA);
              contourPts.push(
                new THREE.Vector3(g2w(gx) + CELL * t, yA + (yB - yA) * t + 0.025, g2w(gz) - ec)
              );
              contourPts.push(
                new THREE.Vector3(g2w(gx) + CELL * t, yA + (yB - yA) * t + 0.025, g2w(gz) + ec)
              );
            }
          }
        }
        const botN = gz + 1 < GRID ? map.cells[gx][gz + 1] : null;
        if (botN && botN.solid) {
          const yB = botN.y;
          for (const L of CONTOUR_LEVELS) {
            if ((yA >= L && yB < L) || (yA < L && yB >= L)) {
              const t = (L - yA) / (yB - yA);
              contourPts.push(
                new THREE.Vector3(g2w(gx) - ec, yA + (yB - yA) * t + 0.025, g2w(gz) + CELL * t)
              );
              contourPts.push(
                new THREE.Vector3(g2w(gx) + ec, yA + (yB - yA) * t + 0.025, g2w(gz) + CELL * t)
              );
            }
          }
        }
      }
    }
    if (contourPts.length > 0) {
      const contourGeo = new THREE.BufferGeometry().setFromPoints(contourPts);
      const contourMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this.group.add(new THREE.LineSegments(contourGeo, contourMat));
    }
  }

  /**
   * Remove every child of the group, disposing geometries and materials.
   * Also clears the `dangerEdges` lookup.
   *
   * @returns {void}
   */
  clear() {
    this.dangerEdges.clear();
    while (this.group.children.length > 0) {
      const c = this.group.children.pop();
      if (c.geometry) c.geometry.dispose && c.geometry.dispose();
      if (c.material) c.material.dispose && c.material.dispose();
    }
  }
}
