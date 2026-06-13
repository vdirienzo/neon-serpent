/**
 * @fileoverview Maps camera-relative direction inputs to world directions
 * so that "up" always means "away from the camera", regardless of the
 * current camera angle.
 */
import { DIRS, OPP } from '../config.js';

/**
 * Pick the cardinal direction whose `(x, z)` projection best matches the
 * given vector. Uses sign-dot product to compare against each axis.
 *
 * @param {number} vx - X component.
 * @param {number} vz - Z component.
 * @returns {'up' | 'down' | 'left' | 'right'} Best matching direction name.
 */
function bestDirName(vx, vz) {
  const du = vz * -1;
  const dd = vz * 1;
  const dl = vx * -1;
  const dr = vx * 1;
  let best = 'up',
    bestVal = du;
  if (dd > bestVal) {
    best = 'down';
    bestVal = dd;
  }
  if (dl > bestVal) {
    best = 'left';
    bestVal = dl;
  }
  if (dr > bestVal) {
    best = 'right';
  }
  return best;
}

/**
 * Translate a camera-relative direction (`'up' | 'down' | 'left' | 'right'`)
 * into a world direction using the camera's current forward / right basis.
 *
 * @param {'up' | 'down' | 'left' | 'right'} namedDir - Player input direction.
 * @param {{ x: number, y: number, z: number }} cameraPos - Camera position.
 * @param {{ x: number, y: number, z: number }} cameraTarget - Camera look-at target.
 * @returns {'up' | 'down' | 'left' | 'right'} World direction name.
 *
 * @example
 * const dir = mapDirCamera('up', camera.position, cameraTarget);
 * snake.setDir(dir);
 */
export function mapDirCamera(namedDir, cameraPos, cameraTarget) {
  const fx = cameraTarget.x - cameraPos.x;
  const fz = cameraTarget.z - cameraPos.z;
  const fLenSq = fx * fx + fz * fz;
  let fxn, fzn;
  if (fLenSq < 0.0001) {
    fxn = 0;
    fzn = -1;
  } else {
    fxn = fx;
    fzn = fz;
  }
  const mag = Math.sqrt(fxn * fxn + fzn * fzn) || 1;
  fxn /= mag;
  fzn /= mag;
  const rxn = -fzn,
    rzn = fxn;
  const fName = bestDirName(fxn, fzn);
  const rName = bestDirName(rxn, rzn);
  if (namedDir === 'up') return fName;
  if (namedDir === 'down') return OPP[fName];
  if (namedDir === 'right') return rName;
  return OPP[rName];
}
