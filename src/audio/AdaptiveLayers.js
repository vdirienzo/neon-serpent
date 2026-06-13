/**
 * @fileoverview Adaptive music layers that ramp in based on snake length
 * and proximity to the goal. A high-pass filtered hi-hat kicks in at
 * length 5+, and a low-passed sub-bass drone at length 12+.
 */
import { getCtx, getMusicBus, isMusicPlaying } from './AudioContext.js';
import { _setLayerRefs } from './Music.js';

/** @type {GainNode | null} Hi-hat bus gain. Created lazily. */
let hiHatGain = null;

/** @type {OscillatorNode | null} Sub-bass oscillator. Created lazily. */
let subBass = null;

/** @type {GainNode | null} Sub-bass gain stage. Created lazily. */
let subBassGain = null;

/** @type {ReturnType<typeof setInterval> | null} Hi-hat scheduler interval. */
let hiHatInterval = null;

/**
 * Lazily build the hi-hat layer: a `setInterval` that fires 40 ms
 * noise buffers through a high-pass filter. Idempotent.
 *
 * @returns {void}
 */
function ensureHiHatLayer() {
  if (hiHatGain) return;
  const actx = getCtx();
  if (!actx) return;
  hiHatGain = actx.createGain();
  hiHatGain.gain.value = 0;
  hiHatGain.connect(getMusicBus());
  hiHatInterval = setInterval(() => {
    if (!isMusicPlaying()) return;
    const now = actx.currentTime;
    const buf = actx.createBuffer(1, Math.floor(actx.sampleRate * 0.04), actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
    const src = actx.createBufferSource();
    src.buffer = buf;
    const f = actx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 8000;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    src.connect(f);
    f.connect(g);
    g.connect(hiHatGain);
    src.start(now);
  }, 90);
}

/**
 * Lazily build the sub-bass layer: a 35 Hz sine through a 80 Hz low-pass.
 * Idempotent.
 *
 * @returns {void}
 */
function ensureSubBass() {
  if (subBass) return;
  const actx = getCtx();
  if (!actx) return;
  subBass = actx.createOscillator();
  subBass.type = 'sine';
  subBass.frequency.value = 35;
  subBassGain = actx.createGain();
  subBassGain.gain.value = 0;
  const lp = actx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 80;
  subBass.connect(lp);
  lp.connect(subBassGain);
  subBassGain.connect(getMusicBus());
  subBass.start();
}

/**
 * Update the adaptive layer gains based on snake length and proximity to
 * the goal. Called every frame from the main loop. No-op when music is
 * not playing or the audio context is unavailable.
 *
 * - Snake length 5–11: hi-hat at `0.10` (modulated by goal proximity).
 * - Snake length ≥ 12: hi-hat at `0.18`, sub-bass at `0.10`.
 * - Snake length ≥ 20: sub-bass at `0.18`.
 * - Within 6 cells of the goal: 1.4× gain boost.
 *
 * @param {import('../entities/Snake.js').Snake} [snake] - The snake. If
 *   missing, all layer gains ramp to 0.
 * @param {{ gx: number, gz: number }} [lastGoal] - Goal cell for proximity
 *   boost. Ignored when missing.
 * @returns {void}
 */
export function updateAdaptive(snake, lastGoal) {
  if (!isMusicPlaying()) return;
  const actx = getCtx();
  if (!actx) return;
  ensureHiHatLayer();
  ensureSubBass();
  const sl = snake ? snake.length() : 0;
  let nearGoal = 0;
  if (snake && snake.length() && lastGoal) {
    const head = snake.head();
    const dist = Math.hypot(head.gx - lastGoal.gx, head.gz - lastGoal.gz);
    nearGoal = dist < 6 ? 1 : 0;
  }
  const hhTarget = sl >= 5 ? (sl >= 12 ? 0.18 : 0.1) : 0;
  const subTarget = sl >= 12 ? (sl >= 20 ? 0.18 : 0.1) : 0;
  const goalBoost = 1 + 0.4 * nearGoal;
  const t = actx.currentTime;
  hiHatGain.gain.linearRampToValueAtTime(hhTarget * goalBoost, t + 0.3);
  subBassGain.gain.linearRampToValueAtTime(subTarget * goalBoost, t + 0.3);
  _setLayerRefs(hiHatGain, subBassGain);
}

/**
 * Stop and dispose adaptive layers. Called from stopMusic().
 * @returns {void}
 */
export function stopAdaptiveLayers() {
  if (hiHatInterval) {
    clearInterval(hiHatInterval);
    hiHatInterval = null;
  }
  if (subBass) {
    try {
      subBass.stop();
    } catch (e) {}
    subBass = null;
  }
  if (subBassGain) {
    subBassGain.disconnect();
    subBassGain = null;
  }
  if (hiHatGain) {
    hiHatGain.disconnect();
    hiHatGain = null;
  }
}
