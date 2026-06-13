/**
 * @fileoverview Persistent score, per-sector best, and leaderboard. Backed
 * by `core/Store.js` so values survive page reloads.
 */
import * as Store from '../core/Store.js';
import { STORAGE, MODE } from '../config.js';
import { getMode } from './Modes.js';

/** @type {number} Highest single-run score. */
let hiScore = Store.get(STORAGE.HI, 0);

/** @type {number[]} Best score per sector, slots `0..4` for sectors `1..5`. */
const bestBySector = Store.get(STORAGE.BEST_BY_SECTOR, [0, 0, 0, 0, 0]);

/** @type {Array<{ score: number, sector: number, date: number }>} */
const leaderboard = Store.get(STORAGE.LEADERBOARD, []);

/**
 * @returns {number} Current high score.
 */
export function getHi() {
  return hiScore;
}

/**
 * @returns {number[]} Best score per sector, slots `0..4` for sectors `1..5`.
 */
export function getBestBySector() {
  return bestBySector;
}

/**
 * @returns {Array<{ score: number, sector: number, date: number }>}
 *   Leaderboard entries, sorted by score desc, capped at 10.
 */
export function getLeaderboard() {
  return leaderboard;
}

/**
 * Update the high score if `score` is strictly greater.
 *
 * @param {number} score - New score to compare against the stored best.
 * @returns {boolean} `true` if a new high was recorded.
 */
export function recordScore(score) {
  if (score > hiScore) {
    hiScore = score;
    Store.set(STORAGE.HI, hiScore);
    return true;
  }
  return false;
}

/**
 * Update the per-sector best. Sectors outside `[1, 5]` are silently ignored.
 *
 * @param {number} sector - Sector index in `[1, 5]`.
 * @param {number} score - Score to compare against the stored best.
 * @returns {boolean} `true` if a new best was recorded.
 */
export function recordSector(sector, score) {
  if (sector < 1 || sector > 5) return false;
  if (score > (bestBySector[sector - 1] || 0)) {
    bestBySector[sector - 1] = score;
    Store.set(STORAGE.BEST_BY_SECTOR, bestBySector);
    return true;
  }
  return false;
}

/**
 * Append a leaderboard entry, re-sort desc by score (ties broken by
 * earliest date), and cap at 10 entries. Zero or negative scores are
 * silently dropped.
 *
 * @param {number} score - Score to record.
 * @param {number} sector - Sector at which the run ended.
 * @returns {void}
 */
export function pushLeaderboard(score, sector) {
  if (score <= 0) return;
  leaderboard.push({ score, sector, date: Date.now() });
  leaderboard.sort((a, b) => b.score - a.score || a.date - b.date);
  if (leaderboard.length > 10) leaderboard.length = 10;
  Store.set(STORAGE.LEADERBOARD, leaderboard);
}
