/**
 * @fileoverview Procedural music engine. Builds a graph of oscillators
 * (drone + arp + occasional kick / hat) and schedules it via a small
 * look-ahead loop.
 */
import { getCtx, getMusicBus, isAudioOn, isMusicPlaying, setMusicPlaying } from './AudioContext.js';
import { stopAdaptiveLayers } from './AdaptiveLayers.js';

/**
 * Internal "is the music system currently scheduled" flag. Distinct from
 * `isMusicPlaying()` on the bus side, which checks the bus gain.
 * @type {{ playing: boolean }}
 */
const musicStateRef = { playing: false };

/** @type {ReturnType<typeof setInterval> | null} Scheduler timer. */
let musicTimer = null;

/** @type {any | null} Reference to the active node graph, used to tear down. */
let musicNodesHandle = null;

/** @type {GainNode | null} Hi-hat gain ref, updated by AdaptiveLayers. */
let hiHatGainRef = null;

/** @type {GainNode | null} Sub-bass gain ref, updated by AdaptiveLayers. */
let subBassGainRef = null;

/**
 * Set the adaptive layer gain references. Called from `AdaptiveLayers.js`.
 *
 * @param {GainNode | null} hi
 * @param {GainNode | null} sub
 * @returns {void}
 */
export function _setLayerRefs(hi, sub) {
  hiHatGainRef = hi;
  subBassGainRef = sub;
}

/**
 * Read the current adaptive layer gain references (for tests).
 *
 * @returns {{ hiHat: GainNode | null, subBass: GainNode | null }}
 */
export function _getLayerRefs() {
  return { hiHat: hiHatGainRef, subBass: subBassGainRef };
}

/**
 * Start the music system. No-op if audio is off, the context is missing,
 * or music is already playing. Fades the music bus in over 400 ms while
 * scheduling arpeggio + kick + hat notes via a look-ahead interval.
 *
 * @returns {void}
 */
export function startMusic() {
  if (!isAudioOn()) return;
  const actx = getCtx();
  if (!actx) return;
  if (isMusicPlaying()) return;
  musicStateRef.playing = true;
  setMusicPlaying(true);
  const musicBus = getMusicBus();
  musicBus.gain.cancelScheduledValues(actx.currentTime);
  musicBus.gain.setValueAtTime(0, actx.currentTime);
  musicBus.gain.linearRampToValueAtTime(0.32, actx.currentTime + 0.4);

  const d1 = actx.createOscillator();
  d1.type = 'sawtooth';
  d1.frequency.value = 55;
  const d2 = actx.createOscillator();
  d2.type = 'sawtooth';
  d2.frequency.value = 55 * 1.005;
  const df = actx.createBiquadFilter();
  df.type = 'lowpass';
  df.frequency.value = 420;
  df.Q.value = 2;
  const dg = actx.createGain();
  dg.gain.value = 0.18;
  d1.connect(df);
  d2.connect(df);
  df.connect(dg);
  dg.connect(musicBus);
  d1.start();
  d2.start();

  const pad = actx.createGain();
  pad.gain.value = 0.0;
  const pf = actx.createBiquadFilter();
  pf.type = 'lowpass';
  pf.frequency.value = 900;
  pad.connect(pf);
  pf.connect(musicBus);
  pad.gain.linearRampToValueAtTime(0.1, actx.currentTime + 1.2);
  const po = [];
  [110, 164.81, 220].forEach((f) => {
    const o = actx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    const og = actx.createGain();
    og.gain.value = 0.5;
    o.connect(og);
    og.connect(pad);
    o.start();
    po.push({ o, og, f });
  });

  const arpScale = [0, 3, 5, 7, 10, 12, 10, 7];
  const arpRoot = 220;
  const stepMs = 132;
  const lookahead = 0.18;
  let nextStepTime = actx.currentTime + 0.05;
  let arpIndex = 0;
  let subCycle = 0;
  function scheduler() {
    if (!musicStateRef.playing || !actx) return;
    while (nextStepTime < actx.currentTime + lookahead) {
      const t = nextStepTime;
      const semi = arpScale[arpIndex % arpScale.length];
      const cycleSemi = subCycle % 2 === 0 ? 0 : 7;
      const freq = arpRoot * Math.pow(2, (semi + 12 + cycleSemi) / 12);
      const o = actx.createOscillator();
      o.type = 'square';
      const og = actx.createGain();
      const of = actx.createBiquadFilter();
      of.type = 'lowpass';
      of.frequency.value = 2400;
      o.frequency.value = freq;
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(0.18, t + 0.005);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(og);
      og.connect(of);
      of.connect(musicBus);
      o.start(t);
      o.stop(t + 0.22);

      if (arpIndex % 4 === 0) {
        const ko = actx.createOscillator();
        ko.type = 'sine';
        const kg = actx.createGain();
        ko.frequency.setValueAtTime(120, t);
        ko.frequency.exponentialRampToValueAtTime(40, t + 0.18);
        kg.gain.setValueAtTime(0.4, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        ko.connect(kg);
        kg.connect(musicBus);
        ko.start(t);
        ko.stop(t + 0.25);
      }
      if (arpIndex % 4 === 2) {
        const hb = actx.createBuffer(1, Math.floor(actx.sampleRate * 0.05), actx.sampleRate);
        const hd = hb.getChannelData(0);
        for (let i = 0; i < hd.length; i++) hd[i] = Math.random() * 2 - 1;
        const hs = actx.createBufferSource();
        hs.buffer = hb;
        const hf = actx.createBiquadFilter();
        hf.type = 'highpass';
        hf.frequency.value = 6000;
        const hg = actx.createGain();
        hg.gain.setValueAtTime(0.18, t);
        hg.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        hs.connect(hf);
        hf.connect(hg);
        hg.connect(musicBus);
        hs.start(t);
      }
      arpIndex++;
      if (arpIndex % 32 === 0) subCycle++;
      nextStepTime += stepMs / 1000;
    }
  }
  musicTimer = setInterval(scheduler, 25);
  musicNodesHandle = { d1, d2, df, dg, pad, pf, po };
}

/**
 * Stop the music system. Fades the music bus out over 250 ms, then
 * stops every oscillator. No-op if the context is missing.
 *
 * @returns {void}
 */
export function stopMusic() {
  const actx = getCtx();
  if (!actx) return;
  musicStateRef.playing = false;
  setMusicPlaying(false);
  stopAdaptiveLayers();
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicNodesHandle) {
    try {
      const musicBus = getMusicBus();
      musicBus.gain.cancelScheduledValues(actx.currentTime);
      musicBus.gain.setValueAtTime(musicBus.gain.value, actx.currentTime);
      musicBus.gain.linearRampToValueAtTime(0, actx.currentTime + 0.25);
      setTimeout(() => {
        try {
          musicNodesHandle.d1.stop();
          musicNodesHandle.d2.stop();
          musicNodesHandle.po.forEach((p) => p.o.stop());
        } catch (e) {}
        musicNodesHandle = null;
      }, 350);
    } catch (e) {
      musicNodesHandle = null;
    }
  }
  if (hiHatGainRef) hiHatGainRef.gain.value = 0;
  if (subBassGainRef) subBassGainRef.gain.value = 0;
}
