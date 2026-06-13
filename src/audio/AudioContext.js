/**
 * @fileoverview Lazily-created `AudioContext` plus the master / bus
 * routing. Exposes the context, the SFX and music buses, and a tiny combo
 * counter used by `sfxEat()`.
 */

/** @type {AudioContext | null} Shared context. */
let actx = null;

/** @type {GainNode | null} Master output gain. */
let masterGain = null;

/** @type {GainNode | null} SFX sub-bus. */
let sfxBus = null;

/** @type {GainNode | null} Music sub-bus. */
let musicBus = null;

/** @type {boolean} Whether the music system is currently playing. */
let musicPlaying = false;

/** @type {any} Handle to the running music graph. Reserved for future use. */
const musicNodes = null;

/** @type {number} Reserved beat counter. */
const musicStep = 0;

/** @type {number} Combo counter incremented by `tickCombo()`. */
let comboStep = 0;

/** @type {boolean} Master audio toggle. */
let audioOn = true;

/** @type {GainNode | null} Hi-hat layer gain (set by AdaptiveLayers). */
const hiHatGain = null;

/** @type {OscillatorNode | null} Sub-bass oscillator (set by AdaptiveLayers). */
const subBass = null;

/** @type {GainNode | null} Sub-bass gain (set by AdaptiveLayers). */
const subBassGain = null;

/** @type {(() => void) | null} Callback fired when music ends. */
let onMusicEnd = null;

/**
 * @returns {boolean} Current value of the master audio toggle.
 */
export function isAudioOn() {
  return audioOn;
}

/**
 * @returns {AudioContext | null} The shared context, or `null` if not yet initialized.
 */
export function getCtx() {
  return actx;
}

/**
 * @returns {GainNode | null} The SFX bus gain node.
 */
export function getSfxBus() {
  return sfxBus;
}

/**
 * @returns {GainNode | null} The music bus gain node.
 */
export function getMusicBus() {
  return musicBus;
}

/**
 * @returns {any} The reserved music nodes handle.
 */
export function getMusicNodes() {
  return musicNodes;
}

/**
 * @returns {boolean} Whether the music system is currently playing.
 */
export function isMusicPlaying() {
  return musicPlaying;
}

/**
 * Set the music-playing flag.
 * @param {boolean} v
 * @returns {void}
 */
export function setMusicPlaying(v) {
  musicPlaying = v;
}

/**
 * Register a callback fired when music ends.
 *
 * @param {(() => void) | null} fn - Callback, or `null` to clear.
 * @returns {void}
 */
export function setOnMusicEnd(fn) {
  onMusicEnd = fn;
}

/**
 * Initialize the audio context and the master / bus routing. Idempotent
 * — calls after the first are no-ops. Silently swallows construction
 * errors (e.g. no `window.AudioContext`).
 *
 * @returns {void}
 */
export function ensureAudio() {
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = actx.createGain();
    masterGain.gain.value = audioOn ? 0.9 : 0.0;
    masterGain.connect(actx.destination);
    sfxBus = actx.createGain();
    sfxBus.gain.value = 0.55;
    sfxBus.connect(masterGain);
    musicBus = actx.createGain();
    musicBus.gain.value = 0.28;
    musicBus.connect(masterGain);
  } catch (e) {
    actx = null;
  }
}

/**
 * Resume the audio context if it's currently suspended (browsers require
 * a user-gesture to start audio).
 *
 * @returns {void}
 */
export function resumeAudio() {
  if (actx && actx.state === 'suspended') actx.resume();
}

/**
 * Set the master volume toggle. Updates the `masterGain` value in place
 * if the context already exists.
 *
 * @param {boolean} on - `true` for audible, `false` for muted.
 * @returns {void}
 */
export function setMasterVolume(on) {
  audioOn = on;
  if (masterGain) masterGain.gain.value = on ? 0.9 : 0.0;
}

/**
 * Increment the combo counter. Used by `sfxEat()` to vary the eat note.
 * @returns {void}
 */
export function tickCombo() {
  comboStep++;
}

/**
 * @returns {number} Current combo counter value.
 */
export function getComboStep() {
  return comboStep;
}

/**
 * Reset the combo counter to 0.
 * @returns {void}
 */
export function resetCombo() {
  comboStep = 0;
}
