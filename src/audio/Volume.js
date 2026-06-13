/**
 * @fileoverview Master volume toggle. Wraps `ensureAudio` + `resumeAudio`
 * + `setMasterVolume` for one-call UI integration.
 */
import { isAudioOn, setMasterVolume, ensureAudio, resumeAudio } from './AudioContext.js';

/**
 * Toggle the master audio. Ensures the context exists and is resumed (so
 * the toggle works on the first user gesture), then flips the volume.
 *
 * @returns {boolean} The new audio state (`true` = audible, `false` = muted).
 */
export function toggleAudio() {
  ensureAudio();
  resumeAudio();
  setMasterVolume(!isAudioOn());
  return isAudioOn();
}
