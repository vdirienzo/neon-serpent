/**
 * @fileoverview Tiny SFX synth built on the Web Audio API. Three envelope
 * helpers (`envBlip`, `envSweep`, `noiseBurst`) plus high-level effects
 * (`sfxEat`, `sfxBonusAppear`, `sfxBonusEat`, `sfxDie`, `sfxStart`).
 */
import { getCtx, getSfxBus, isAudioOn, tickCombo, getComboStep } from './AudioContext.js';

/**
 * Schedule a short ADSR-like envelope on an oscillator and play it once.
 * Skips silently if audio is off or the context is missing.
 *
 * @param {number} freq - Oscillator frequency in Hz.
 * @param {number} dur - Total envelope length in seconds.
 * @param {OscillatorType} [type='sine'] - Oscillator type.
 * @param {number} [vol=0.5] - Peak gain.
 * @returns {void}
 */
function envBlip(freq, dur, type = 'sine', vol = 0.5) {
  if (!isAudioOn()) return;
  const actx = getCtx();
  if (!actx) return;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = 0;
  o.connect(g);
  g.connect(getSfxBus());
  const t = actx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/**
 * Schedule a downward or upward frequency sweep with a low-pass filter.
 *
 * @param {number} f0 - Start frequency in Hz.
 * @param {number} f1 - End frequency in Hz (clamped to `>= 20`).
 * @param {number} dur - Sweep duration in seconds.
 * @param {OscillatorType} [type='sawtooth'] - Oscillator type.
 * @param {number} [vol=0.4] - Peak gain.
 * @returns {void}
 */
function envSweep(f0, f1, dur, type = 'sawtooth', vol = 0.4) {
  if (!isAudioOn()) return;
  const actx = getCtx();
  if (!actx) return;
  const o = actx.createOscillator();
  const g = actx.createGain();
  const f = actx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 1800;
  o.type = type;
  o.connect(f);
  f.connect(g);
  g.connect(getSfxBus());
  g.gain.value = 0;
  const t = actx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/**
 * Schedule a band-passed white-noise burst. Used for the explosion tail
 * of the death SFX.
 *
 * @param {number} dur - Burst duration in seconds.
 * @param {number} [vol=0.3] - Peak gain.
 * @param {number} [hp=400] - High-pass cutoff in Hz.
 * @returns {void}
 */
function noiseBurst(dur, vol = 0.3, hp = 400) {
  if (!isAudioOn()) return;
  const actx = getCtx();
  if (!actx) return;
  const bufSize = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, bufSize, actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource();
  src.buffer = buf;
  const f = actx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = actx.createGain();
  const t = actx.currentTime;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(getSfxBus());
  src.start(t);
}

/**
 * Eat SFX: a two-note arp whose pitch advances every 8 calls (one
 * "combo step"). Bumps the combo counter on every call.
 *
 * @returns {void}
 */
export function sfxEat() {
  const base = 440 * Math.pow(2, (getComboStep() % 8) / 12);
  envBlip(base, 0.09, 'square', 0.35);
  envBlip(base * 1.5, 0.07, 'sine', 0.25);
  tickCombo();
}

/**
 * Bonus pickup appearance: an upward sawtooth sweep from 160 Hz → 1800 Hz.
 * @returns {void}
 */
export function sfxBonusAppear() {
  envSweep(160, 1800, 0.45, 'sawtooth', 0.35);
}

/**
 * Bonus pickup eaten: a four-note triangle-wave arpeggio (C5, E5, G5, C6).
 * @returns {void}
 */
export function sfxBonusEat() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => setTimeout(() => envBlip(f, 0.18, 'triangle', 0.4), i * 70));
}

/**
 * Death SFX: a falling sawtooth sweep (900 → 60 Hz) followed by a
 * low-frequency noise burst.
 * @returns {void}
 */
export function sfxDie() {
  envSweep(900, 60, 0.8, 'sawtooth', 0.55);
  setTimeout(() => noiseBurst(0.45, 0.4, 200), 60);
}

/**
 * Match-start SFX: two upward square-wave sweeps.
 * @returns {void}
 */
export function sfxStart() {
  envSweep(220, 1200, 0.35, 'square', 0.4);
  setTimeout(() => envSweep(330, 1600, 0.35, 'square', 0.4), 200);
}
