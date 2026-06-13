// src/main.js — Bootstrap entry point. Wires all modules together and starts the game.

// Web Components (encapsulated UI primitives)
import './components/ns-button.js';
import './components/ns-chip.js';
import './components/ns-modal.js';
import './components/ns-panel.js';
import './components/ns-toast.js';
import './components/ns-progress-bar.js';

import * as THREE from 'three';
import { $, onReady, isTouchDevice, vibrate } from './core/DOM.js';
import { on, emit, clear as clearBus } from './core/EventBus.js';
import * as Store from './core/Store.js';
import {
  GRID,
  CELL,
  HALF,
  Y_TOP,
  Y_MID,
  Y_WATER,
  Y_OCEAN,
  STEP_INIT,
  STEP_DEC,
  STEP_MIN,
  STEP_FAST,
  STEP_CLIMB,
  LVL_CAP,
  BONUS_EVERY,
  BONUS_DUR,
  DIE_DUR,
  MAX_LIVES,
  LEVEL_PALETTES,
  DIRS,
  OPP,
  STATE,
  MODE,
  EVT,
  STORAGE,
} from './config.js';
import { COLORS } from './core/Color.js';
import { g2w, damp, lerp, clamp } from './core/Math.js';
import Logger from './core/Logger.js';
import { t } from './core/i18n.js';
import {
  safeCall,
  setReporter as setErrorReporter,
  setToastHandler as setErrorToastHandler,
} from './core/Errors.js';
import {
  init as initPerfOverlay,
  show as showPerfOverlay,
  hide as hidePerfOverlay,
  recordDrawCalls,
} from './dev/PerfOverlay.js';
import { createEffects } from './ui/Effects.js';

// Render
import { createRenderer, resizeRenderer } from './render/Renderer.js';
import { createComposer } from './render/PostFX.js';
import { createScene } from './render/Scene.js';
import { createCamera } from './render/Camera.js';
import { createLights } from './render/Lighting.js';
import { createBackground, updateBackground } from './render/Background.js';
import { TrailRibbon } from './render/TrailRibbon.js';

// World
import { HeightMap } from './world/HeightMap.js';
import { buildLevel, buildDailyLevel } from './world/LevelBuilder.js';
import { TerrainMesh } from './world/TerrainMesh.js';
import { WaterPlane } from './world/WaterPlane.js';
import { AmbientParticles } from './world/AmbientParticles.js';
import { Goal } from './world/Goal.js';
import { StartMarker } from './world/StartMarker.js';
import { ScanRing } from './world/ScanRing.js';
import { computeReachable, computeGoalReachable } from './world/Reachability.js';

// Entities
import { Snake } from './entities/Snake.js';
import { SnakeView } from './entities/SnakeView.js';
import { Food } from './entities/Food.js';
import { Bonus } from './entities/Bonus.js';
import { Pickups } from './entities/Pickups.js';
import { Checkpoints } from './entities/Checkpoints.js';
import { Particles } from './entities/Particles.js';
import { Waves } from './entities/Waves.js';

// Camera
import { CameraController } from './camera/CameraController.js';

// Audio
import {
  ensureAudio,
  resumeAudio,
  isAudioOn,
  setMasterVolume,
  resetCombo,
} from './audio/AudioContext.js';
import { sfxEat, sfxBonusAppear, sfxBonusEat, sfxDie, sfxStart } from './audio/SFX.js';
import { startMusic, stopMusic } from './audio/Music.js';
import { updateAdaptive } from './audio/AdaptiveLayers.js';
import {
  hapticEat,
  hapticGem,
  hapticCrystal,
  hapticSlow,
  hapticDice,
  hapticCheck,
  hapticBonus,
  hapticLevelUp,
  hapticDie,
  isReducedMotion,
} from './audio/Haptics.js';

// Input
import { createInputWiring } from './input/InputWiring.js';

// Game
import { setState, getState, onStateChange } from './game/GameState.js';
import { startCountdown, getGoStartedAt } from './game/Countdown.js';
import {
  startDying,
  getDyingT,
  updateDying,
  dyingComplete,
  resetDying,
  getDyingFrom,
} from './game/DeathHandler.js';
import { handleWin } from './game/WinHandler.js';
import { StepLogic } from './game/StepLogic.js';
import { updateWarning } from './game/WarningHighlight.js';
import {
  getMode,
  setMode,
  startStory,
  startTimeAttack as startTimeAttackMode,
  startDaily as startDailyMode,
  getTimeRemainingSec,
} from './game/Modes.js';
import {
  getHi,
  getBestBySector,
  getLeaderboard,
  recordScore,
  recordSector,
  pushLeaderboard,
} from './game/Scoring.js';

// UI
import {
  init as initHUD,
  setHi as setHiUI,
  setScore as setScoreUI,
  getScore,
  setLevel,
  getLevel,
  bump as hudBump,
  setSector,
  setTimeRemaining,
  updateScoreDisplay,
  updateCombo,
} from './ui/HUD.js';
import { init as initLivesDisplay, setLives as setLivesUI } from './ui/LivesDisplay.js';
import { init as initCalibPanel } from './ui/CalibrationPanel.js';
import { load as loadCalib, onChange as onCalibChange } from './ui/CalibrationStore.js';
import { init as initToasts, toast } from './ui/Toasts.js';
import { init as initPopups, popupAt, update as updatePopups } from './ui/Popups.js';
import {
  init as initPowerUpChip,
  show as showPowerUp,
  hide as hidePowerUp,
} from './ui/PowerUpChip.js';
import {
  init as initTitleScreen,
  show as showTitle,
  hide as hideTitle,
  showTouchHint,
} from './ui/TitleScreen.js';
import { init as initPause, showPause, hidePause, isOpen as pauseIsOpen } from './ui/PauseModal.js';
import { init as initGameOver, showGameOver, hideGameOver } from './ui/GameOverModal.js';
import {
  init as initLeaderboard,
  open as openLeaderboard,
  close as closeLeaderboard,
} from './ui/LeaderboardModal.js';
import {
  init as initSettings,
  open as openSettings,
  close as closeSettings,
  toggleColorBlind,
  toggleReducedMotion as toggleRMAction,
  toggleSlowMode as toggleSlowAction,
  clearAllData as clearAllDataAction,
  isOpen as settingsIsOpen,
} from './ui/SettingsModal.js';
import {
  init as initLevelSelect,
  show as showLevelSelect,
  setOnSelect,
  setCurrentSector,
} from './ui/LevelSelectModal.js';
import { shareScore } from './ui/Share.js';
import { createUIWiring } from './ui/UIWiring.js';
import { createSettingsActions } from './game/SettingsActions.js';

// ====================================================================
// Boot error capture (lightweight mirror of Errors.js — Errors.js is loaded
// below as a side-effect; this block keeps the legacy `window.__bootErr`
// contract that the loader UI reads).
// ====================================================================
window.__bootErr = null;
window.addEventListener('error', (e) => {
  window.__bootErr =
    (e.message || 'err') +
    ' @ ' +
    (e.filename || '?') +
    ':' +
    (e.lineno || 0) +
    ':' +
    (e.colno || 0);
});
window.addEventListener('unhandledrejection', (e) => {
  window.__bootErr = 'REJ: ' + (e.reason && e.reason.message ? e.reason.message : e.reason);
});

// Side-effect: register the global error + unhandledrejection listeners from
// src/core/Errors.js. Safe to import in any environment — install() is a
// no-op in Node.
import './core/Errors.js';

// Wire Errors.js to the in-game toast layer so uncaught errors are visible
// to the player instead of dying silently in the console. `toast()` is a
// no-op before Toasts.init() runs (see UI init section), so wiring it up
// here is safe.
setErrorToastHandler((msg) => {
  try {
    toast(msg, 'mag');
  } catch (e) {
    /* ignore */
  }
});
// Reporter hook (Sentry stub): in dev we just log structured records.
setErrorReporter((rec) => {
  Logger.error('global error', {
    kind: rec.kind || 'error',
    source: rec.source,
    line: rec.line,
    col: rec.col,
  });
});

// ====================================================================
// DOM elements
// ====================================================================
const canvas = $('cv');
const loader = $('loader');
const hudEl = $('hud');
const hudBr = $('hud-br');
const hudBl = $('hud-bl') || document.createElement('div');
const titleEl = $('title-screen');
const tHint = $('tHint');
const tHint2 = $('touch-hint');
const bonusChip = $('bonuschip');
const bonusTEl = $('bonusT');
const powerupChip = $('powerupchip');
const modeIndicator = $('modeIndicator');
const timeAttackEl = $('timeAttackRemaining');
const sectorWrapEl = $('sectorWrap');
const scoreEl = $('scoreVal');
const hiEl = $('hiVal');
const lvlNumEl = $('lvlNum');
const lvlBarEl = $('lvlbar');
const finalScoreEl = $('finalScore');
const newRecEl = $('newRec');
const recTitleEl = $('recTitle');
const recOverEl = $('recOver');
const deathCauseEl = $('deathCause');
const bestOverValEl = $('bestOverVal');
const bestOverSectorEl = $('bestOverSector');
const srStatus = $('sr-status');

const bStart = $('bStart');
const bTimeAttack = $('bTimeAttack');
const bDaily = $('bDaily');
const bLevelSelect = $('bLevelSelect');
const bRestart = $('bRestart');
const bResume = $('bResume');
const bPauseTitle = $('bPauseTitle');
const bOverTitle = $('bOverTitle');
const bAudio = $('bAudio');
const bCam = $('bCam');
const bPause = $('bPause');
const bSettings = $('bSettings');
const bLeaderboard = $('bLeaderboard');
const bShare = $('bShare');
const bCloseLeaderboard = $('bCloseLeaderboard');
const bSettingsSave = $('bSettingsSave');
const bSettingsClose = $('bSettingsClose');
const bSetAudio = $('bSetAudio');
const bSetCB = $('bSetCB');
const bSetRM = $('bSetRM');
const bSetSlow = $('bSetSlow');
const bClearData = $('bClearData');
const pauseMod = $('pauseModal');
const overMod = $('overModal');
const leaderboardMod = $('leaderboardModal');
const settingsMod = $('settingsModal');
const fxFlash = $('fx-flash');
const effects = createEffects({ fxFlash, lvlNumEl });

function announce(text) {
  if (!srStatus) return;
  srStatus.textContent = '';
  // microtask to ensure AT picks up the change
  setTimeout(() => {
    srStatus.textContent = text;
  }, 50);
}

function showLoaderFail() {
  if (!loader) return;
  loader.classList.add('fail');
  const msg = loader.querySelector('.msg');
  if (msg) {
    if (window.__bootErr) {
      msg.innerHTML = t('boot.linkFail', { error: window.__bootErr });
    } else {
      msg.innerHTML = t('boot.initFail');
      msg.style.display = 'block';
    }
  }
}

// ====================================================================
// 3D core
// ====================================================================
let renderer;
try {
  renderer = createRenderer(canvas);
} catch (e) {
  Logger.error('WebGLRenderer init failed', {
    err: e,
    name: e && e.name,
    stage: 'createRenderer',
  });
  showLoaderFail();
  throw e;
}
const scene = createScene();
const camera = createCamera();
const composer = createComposer(renderer, scene, camera);
camera.userData._lookTarget = new THREE.Vector3(0, 0, 0);
loadCalib();
const lights = createLights(scene);
const background = createBackground(scene, GRID * CELL);
const crtEl = document.getElementById('crt');
const vignetteEl = document.getElementById('vignette');

// Trail + map
const map = new HeightMap();
const trailRibbon = new TrailRibbon(scene);
const scanRing = new ScanRing(scene);

// Terrain + water + ambient
const terrainMesh = new TerrainMesh();
scene.add(terrainMesh.group);
const water = new WaterPlane(scene);
const ambient = new AmbientParticles(scene);
const goal = new Goal(scene);
const startMarker = new StartMarker(scene);

// Snake + view
const snake = new Snake(map);
const snakeView = new SnakeView(scene);

// Calibration: register AFTER snakeView so initial apply hits all refs.
onCalibChange((c) => {
  lights.amb.intensity = c.ambient;
  lights.keyLight.intensity = c.keyLight;
  lights.fillLight.intensity = c.fillLight;
  lights.topLight.intensity = c.topLight;
  if (snakeView && snakeView.headLight) snakeView.headLight.intensity = c.headLight;
  renderer.toneMappingExposure = c.exposure;
  if (scene.fog) {
    scene.fog.density = c.fogDensity;
    scene.fog.color.setRGB(c.fogR / 255, c.fogG / 255, c.fogB / 255);
  }
  if (crtEl) {
    crtEl.style.setProperty('--crt-base-opacity', String(c.crtOpacity));
    crtEl.style.setProperty('--crt-line-alpha', String(c.crtLineAlpha));
    crtEl.style.setProperty('--crt-line-rgb', `${c.crtLineR}, ${c.crtLineG}, ${c.crtLineB}`);
  }
  if (vignetteEl) {
    vignetteEl.style.setProperty('--vignette-alpha', String(c.vignetteAlpha));
    vignetteEl.style.setProperty(
      '--vignette-rgb',
      `${c.vignetteR}, ${c.vignetteG}, ${c.vignetteB}`
    );
  }
  // Pixel ratio (rebuilds render targets on change)
  const pr = Math.max(0.5, Math.min(2.0, c.pixelRatio));
  if (Math.abs(renderer.getPixelRatio() - pr) > 0.001) {
    renderer.setPixelRatio(pr);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
  }
  // Snake head emissive
  if (snakeView && snakeView.meshes && snakeView.meshes[0]) {
    snakeView.meshes[0].material.emissiveIntensity = c.snakeEmissive;
  }
  // Water opacity
  if (water && water.material) {
    water.material.opacity = c.waterOpacity;
  }
});

// Food / Bonus / Pickups / Checkpoints / Particles / Waves
const food = new Food(scene);
const bonus = new Bonus(scene);
const pickups = new Pickups(scene);
const checkpoints = new Checkpoints(scene);
const particles = new Particles(scene);
const waves = new Waves(scene);

// Camera controller
const camController = new CameraController(camera);

// Build the initial level visuals
let levelPalette = LEVEL_PALETTES[0];
let lastStart = { gx: 5, gz: 5 };
let lastGoal = { gx: 26, gz: 26 };

{
  const cfg = buildLevel(map, 1);
  map.computeLethality();
  lastStart = { gx: cfg.startGX, gz: cfg.startGZ };
  for (let gx = 0; gx < GRID; gx++) {
    for (let gz = 0; gz < GRID; gz++) {
      if (map.cells[gx][gz].goal) lastGoal = { gx, gz };
    }
  }
  terrainMesh.build(map, levelPalette.primary, levelPalette.goal, COLORS.RED);
  ambient.build(map);
  goal.set(lastGoal.gx, lastGoal.gz, map.heightAt(lastGoal.gx, lastGoal.gz), levelPalette.goal);
  startMarker.set(
    lastStart.gx,
    lastStart.gz,
    map.heightAt(lastStart.gx, lastStart.gz),
    levelPalette.primary
  );
}

// ====================================================================
// Game state (reactive vars)
// ====================================================================
let stepInterval = STEP_INIT;
let stepAcc = 0;
let foodEaten = 0;
let score = 0;
let scoreDisplay = 0;
let level = 1;
let speedBoostUntil = 0;
let slowMoUntil = 0;
let invulnerableUntil = 0;
let showcaseT = 0;
const lastInputDir = null;
let bonusLeft = 0;
let bonusActive = false;
let isInfinite = false;
let currentSector = 1;
/** @type {Set<string> | null} Reachable cells for the current level. */
let reachableCells = null;
/** @type {number} Remaining lives for the current game. */
let lives = MAX_LIVES;
let slowMode = Store.get(STORAGE.SLOW_MODE, false);

const settings = createSettingsActions({
  buttons: { bAudio, bSetAudio, bSetCB, bSetRM, bSetSlow },
  slowModeRef: {
    get: () => slowMode,
    set: (v) => {
      slowMode = v;
    },
  },
});

function applySpeedMods() {
  let si = stepInterval;
  if (isInfinite) si = STEP_MIN;
  if (slowMode) si = Math.floor(si / 0.7);
  if (speedBoostUntil > performance.now()) si = Math.max(STEP_FAST, Math.floor(si * 0.5));
  else if (slowMoUntil > performance.now()) si = Math.floor(si * 1.5);
  return si;
}

function pickFreeCell() {
  const occ = new Set();
  for (let i = 0; i < snake.cells.length; i++) occ.add(snake.cells[i].gx + ',' + snake.cells[i].gz);
  if (food.mesh) occ.add(food.gx + ',' + food.gz);
  if (bonus.mesh) occ.add(bonus.gx + ',' + bonus.gz);
  for (const p of pickups.list) if (p.active) occ.add(p.gx + ',' + p.gz);
  for (const c of checkpoints.list) if (!c.done) occ.add(c.gx + ',' + c.gz);
  const free = [];
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      if (occ.has(x + ',' + z)) continue;
      if (!map.isSolid(x, z)) continue;
      if (reachableCells && !reachableCells.has(x + ',' + z)) continue;
      free.push({ gx: x, gz: z });
    }
  }
  if (!free.length) return null;
  return free[Math.floor(Math.random() * free.length)];
}

function spawnFoodAtFree() {
  const c = pickFreeCell();
  if (!c) return;
  food.spawn(c.gx, c.gz);
}

function spawnBonusAtFree() {
  const c = pickFreeCell();
  if (!c) return;
  bonus.spawn(c.gx, c.gz, BONUS_DUR);
  bonusLeft = BONUS_DUR;
  bonusActive = true;
  bonusChip.classList.add('show');
  toast(t('toast.coreDetected'), 'cyan');
  sfxBonusAppear();
}

function clearBonusNow() {
  bonus.dispose();
  bonusActive = false;
  bonusLeft = 0;
  bonusChip.classList.remove('show', 'flash');
}

function gx2world(gx, gz) {
  return new THREE.Vector3(g2w(gx), map.heightAt(gx, gz) + 0.4, g2w(gz));
}

function worldCell(gx, gz) {
  return { x: g2w(gx), y: map.heightAt(gx, gz), z: g2w(gz) };
}

function updateLvlBar() {
  if (!lvlBarEl) return;
  const cells = lvlBarEl.querySelectorAll('i');
  cells.forEach((c, i) => c.classList.toggle('on', i < level));
}

// ====================================================================
// Pickup collection
// ====================================================================
const POINTS = { orb: 10, gem: 50, crystal: 25, slow: 20, dice: 200 };

function collectPickup(p) {
  const pts = POINTS[p.type] || 0;
  hudBump();
  const w = gx2world(p.gx, p.gz);
  const now = performance.now();
  if (p.type === 'orb') {
    particles.emit(w.x, w.y, w.z, COLORS.CYAN, 22, false);
    popupAt(w, '+' + pts, 'cyan');
    effects.triggerFlash('eat');
    sfxEat();
    hapticEat();
  } else if (p.type === 'gem') {
    particles.emit(w.x, w.y, w.z, COLORS.MAG, 32, true);
    popupAt(w, '+' + pts, 'cyan');
    effects.triggerFlash('bonus');
    sfxBonusEat();
    hapticGem();
  } else if (p.type === 'crystal') {
    showPowerUp('speed', 6000);
    toast(t('powerUp.speedToast'), 'mag');
    particles.emit(w.x, w.y, w.z, COLORS.GREEN, 30, true);
    popupAt(w, '+' + pts, 'gold');
    effects.triggerFlash('bonus');
    hapticCrystal();
  } else if (p.type === 'slow') {
    showPowerUp('slow', 4000);
    toast(t('powerUp.slowToast'), 'cyan');
    particles.emit(w.x, w.y, w.z, COLORS.VIO, 30, true);
    popupAt(w, '+' + pts, 'cyan');
    hapticSlow();
  } else if (p.type === 'dice') {
    toast(t('powerUp.diceToast'), 'gold');
    particles.emit(w.x, w.y, w.z, COLORS.GOLD, 50, true);
    effects.triggerFlash('bonus');
    effects.triggerGlitch(500);
    sfxBonusEat();
    hapticDice();
    setTimeout(() => loadLevel(currentSector + 1), 700);
  }
  return pts;
}

// ====================================================================
// Game flow
// ====================================================================
function loadLevel(n) {
  isInfinite = n > 10;
  const target = isInfinite ? ((n - 11) % 10) + 1 : n;
  currentSector = n;
  let cfg;
  if (getMode() === MODE.DAILY) {
    const seed = (() => {
      const d = new Date();
      return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    })();
    cfg = buildDailyLevel(map, seed);
    levelPalette = LEVEL_PALETTES[0];
  } else {
    cfg = buildLevel(map, target);
    levelPalette = LEVEL_PALETTES[(((n - 1) % 10) + 10) % 10];
  }
  map.computeLethality();
  terrainMesh.build(map, levelPalette.primary, levelPalette.goal, COLORS.RED);
  ambient.build(map);
  lastStart = { gx: cfg.startGX, gz: cfg.startGZ };
  lastGoal = { gx: cfg.startGX, gz: cfg.startGZ };
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      if (map.cells[x][z].goal) lastGoal = { gx: x, gz: z };
    }
  }
  goal.set(lastGoal.gx, lastGoal.gz, map.heightAt(lastGoal.gx, lastGoal.gz), levelPalette.goal);
  startMarker.set(
    lastStart.gx,
    lastStart.gz,
    map.heightAt(lastStart.gx, lastStart.gz),
    levelPalette.primary
  );

  const goalReachable = computeGoalReachable(map, lastGoal.gx, lastGoal.gz);
  const startCandidates = [];
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      if (goalReachable.has(x + ',' + z) && map.isSolid(x, z)) {
        const dist = Math.hypot(x - lastGoal.gx, z - lastGoal.gz);
        if (dist > 5) startCandidates.push({ gx: x, gz: z });
      }
    }
  }
  if (startCandidates.length > 0) {
    const pick = startCandidates[Math.floor(Math.random() * startCandidates.length)];
    lastStart = { gx: pick.gx, gz: pick.gz };
  }
  startMarker.set(
    lastStart.gx,
    lastStart.gz,
    map.heightAt(lastStart.gx, lastStart.gz),
    levelPalette.primary
  );

  snake.reset(lastStart.gx, lastStart.gz);
  snake.dir = DIRS[cfg.startDir] || DIRS.right;
  snake.pendingTurns = [];
  reachableCells = computeReachable(map, lastStart.gx, lastStart.gz);

  stepInterval = isInfinite ? STEP_MIN : STEP_INIT;
  if (slowMode) stepInterval = Math.floor(stepInterval / 0.7);
  stepAcc = 0;
  foodEaten = 0;
  level = 1;
  score = 0;
  scoreDisplay = 0;
  speedBoostUntil = 0;
  slowMoUntil = 0;
  invulnerableUntil = performance.now() + 4500;

  setScoreUI(score);
  setLevel(level);
  updateLvlBar();
  if (scoreEl) scoreEl.textContent = '0';

  food.dispose();
  clearBonusNow();
  pickups.clear();
  checkpoints.clear();
  spawnFoodAtFree();
  pickups.populate(Math.random, pickFreeCell);
  checkpoints.placeBetween(lastStart, lastGoal, map);

  setSector(currentSector, levelPalette, getMode());
  setCurrentSector(currentSector);
  if (modeIndicator) {
    let label = 'MODO: HISTORIA';
    if (getMode() === MODE.TIME) label = 'MODO: TIME ATTACK';
    else if (getMode() === MODE.DAILY) label = 'MODO: DAILY SEED';
    if (timeAttackEl) timeAttackEl.textContent = getMode() === MODE.TIME ? '60.0s' : '';
    const first = modeIndicator.firstChild;
    if (first && first.nodeType === 3) first.nodeValue = label + ' ';
    else if (timeAttackEl)
      modeIndicator.insertBefore(document.createTextNode(label + ' '), timeAttackEl);
  }

  setState(STATE.COUNTDOWN);
  clearBonusNow();
  trailRibbon.clear();

  startCountdown(() => {
    if (getState() === STATE.COUNTDOWN) {
      setState(STATE.PLAYING);
      announce(t('toast.letsPlay'));
    }
  });

  if (isAudioOn()) startMusic();
}

function respawnLevel() {
  snake.reset(lastStart.gx, lastStart.gz);
  snake.dir = DIRS.right;
  snake.pendingTurns = [];
  reachableCells = computeReachable(map, lastStart.gx, lastStart.gz);
  stepAcc = 0;
  invulnerableUntil = performance.now() + 3000;
  setState(STATE.COUNTDOWN);
  trailRibbon.clear();
  startCountdown(() => {
    if (getState() === STATE.COUNTDOWN) {
      setState(STATE.PLAYING);
      announce(t('toast.letsPlay'));
    }
  });
  if (isAudioOn()) startMusic();
}

function startGame() {
  lives = MAX_LIVES;
  emit(EVT.LIFE_LOST, { lives });
  ensureAudio();
  resumeAudio();
  sfxStart();
  startStory();
  setMode(MODE.STORY);
  hideTitle();
  if (hudEl) {
    hudEl.hidden = false;
  }
  if (hudBr) {
    hudBr.hidden = false;
  }
  if (isTouchDevice() && tHint) {
    tHint.hidden = false;
    if (tHint2) {
      tHint2.classList.add('show');
      setTimeout(() => tHint2.classList.remove('show'), 3500);
    }
  } else if (tHint) {
    tHint.hidden = true;
  }
  loadLevel(1);
  toast(t('toast.connected'), 'cyan');
  setTimeout(() => effects.triggerFlash('eat'), 50);
}

function jumpToLevel(n) {
  ensureAudio();
  resumeAudio();
  sfxStart();
  startStory();
  setMode(MODE.STORY);
  hideTitle();
  if (hudEl) {
    hudEl.hidden = false;
  }
  if (hudBr) {
    hudBr.hidden = false;
  }
  if (tHint) tHint.hidden = true;
  if (tHint2) tHint2.classList.remove('show');
  loadLevel(n);
  setCurrentSector(n);
  toast(t('toast.sectorJump', { n, name: levelPalette ? levelPalette.name : '' }), 'cyan');
  setTimeout(() => effects.triggerFlash('eat'), 50);
}

function startTimeAttack() {
  ensureAudio();
  resumeAudio();
  sfxStart();
  startTimeAttackMode();
  setMode(MODE.TIME);
  hideTitle();
  if (hudEl) hudEl.hidden = false;
  if (hudBr) hudBr.hidden = false;
  loadLevel(1);
  toast(t('toast.timeAttackStart'), 'gold');
  setTimeout(() => effects.triggerFlash('eat'), 50);
}

function startDaily() {
  ensureAudio();
  resumeAudio();
  sfxStart();
  startDailyMode();
  setMode(MODE.DAILY);
  hideTitle();
  if (hudEl) hudEl.hidden = false;
  if (hudBr) hudBr.hidden = false;
  loadLevel(1);
  const d = new Date();
  toast(t('toast.dailyStart', { date: d.toLocaleDateString('es') }), 'mag');
  setTimeout(() => effects.triggerFlash('eat'), 50);
}

function goTitle() {
  hidePause();
  hideGameOver();
  startStory();
  setMode(MODE.STORY);
  if (titleEl) {
    titleEl.hidden = false;
    requestAnimationFrame(() => titleEl.classList.add('show'));
  }
  if (hudEl) hudEl.hidden = true;
  if (hudBr) hudBr.hidden = true;
  setState(STATE.TITLE);
  showcaseT = 0;
  stopMusic();
  food.dispose();
  clearBonusNow();
  snakeView.setVisible(false);
  snake.pendingTurns = [];
}

function setPaused(p) {
  if (getState() === STATE.PLAYING && p) {
    setState(STATE.PAUSED);
    if (pauseMod) pauseMod.classList.add('show');
    stopMusic();
  } else if (getState() === STATE.PAUSED && !p) {
    setState(STATE.PLAYING);
    if (pauseMod) pauseMod.classList.remove('show');
    ensureAudio();
    resumeAudio();
    stopMusic();
    if (isAudioOn()) startMusic();
  }
}

function showGameOverScreen(cause) {
  if (overMod) overMod.classList.add('show');
  if (finalScoreEl) finalScoreEl.textContent = String(score);
  const isNewRec = recordScore(score);
  if (isNewRec) {
    if (newRecEl) newRecEl.hidden = false;
    if (hiEl) hiEl.textContent = String(getHi());
    if (recTitleEl) recTitleEl.textContent = String(getHi());
    if (recOverEl) recOverEl.textContent = String(getHi());
    setHiUI(getHi());
  } else if (newRecEl) {
    newRecEl.hidden = true;
  }
  if (deathCauseEl) {
    deathCauseEl.className = 'death-cause';
    let text = '',
      cls = '';
    if (cause === 'wall') {
      text = t('gameOver.deathCauses.wall');
      cls = 'cyan';
    } else if (cause === 'void') {
      text = t('gameOver.deathCauses.void');
      cls = 'mag';
    } else if (cause === 'climb') {
      text = t('gameOver.deathCauses.climb');
      cls = 'gold';
    } else if (cause === 'self') {
      text = t('gameOver.deathCauses.self');
      cls = 'mag';
    } else if (cause === 'time') {
      text = t('gameOver.deathCauses.time');
      cls = 'cyan';
    }
    deathCauseEl.textContent = text;
    if (cls) deathCauseEl.classList.add(cls);
  }
  const isNewSec = recordSector(currentSector, score);
  pushLeaderboard(score, currentSector);
  if (bestOverValEl && bestOverSectorEl) {
    if (currentSector >= 1 && currentSector <= 5) {
      bestOverSectorEl.textContent = String(currentSector);
      bestOverValEl.textContent = String(getBestBySector()[currentSector - 1] || 0);
      if (isNewSec) {
        bestOverValEl.classList.remove('lb-bump');
        void bestOverValEl.offsetWidth;
        bestOverValEl.classList.add('lb-bump');
      }
    } else {
      bestOverSectorEl.textContent = '∞';
      bestOverValEl.textContent = '—';
    }
  }
  setState(STATE.OVER);
  stopMusic();
  announce(t('toast.gameOver', { score }));
}

function winLevelNow() {
  const bonusPts = 500 * (currentSector > 5 ? 5 : currentSector);
  score += bonusPts;
  hudBump();
  toast(t('toast.sectorCompleted', { n: currentSector, points: bonusPts }), 'gold');
  effects.triggerFlash('bonus');
  const headW = gx2world(snake.cells[0].gx, snake.cells[0].gz);
  particles.emit(headW.x, headW.y, headW.z, COLORS.GOLD, 50, true);
  particles.emit(headW.x, headW.y, headW.z, new THREE.Color(levelPalette.goal), 30, true);
  effects.triggerGlitch(450);
  sfxBonusEat();
  vibrate([50, 30, 50, 30, 100]);
  hapticBonus();
  if (getMode() === MODE.TIME || getMode() === MODE.DAILY) {
    recordSector(currentSector, score);
    setTimeout(() => showGameOverScreen('win'), 600);
    return;
  }
  setState(STATE.WIN);
  recordSector(currentSector, score);
  announce('Sector ' + currentSector + ' completado');
  setTimeout(() => {
    loadLevel(currentSector + 1);
    toast(t('toast.sectorStarted', { n: currentSector + 1 }), 'cyan');
  }, 1500);
}

// ====================================================================
// Step logic
// ====================================================================
const stepLogic = new StepLogic({
  map,
  snake,
  food,
  bonus,
  pickups,
  checkpoints,
  get level() {
    return level;
  },
  get score() {
    return score;
  },
  set score(v) {
    score = v;
  },
  get stepInterval() {
    return stepInterval;
  },
  set stepInterval(v) {
    stepInterval = v;
  },
  get foodEaten() {
    return foodEaten;
  },
  set foodEaten(v) {
    foodEaten = v;
  },
  get speedBoostUntil() {
    return speedBoostUntil;
  },
  set speedBoostUntil(v) {
    speedBoostUntil = v;
  },
  get slowMoUntil() {
    return slowMoUntil;
  },
  set slowMoUntil(v) {
    slowMoUntil = v;
  },
  pickFreeCell,
  spawnBonus: spawnBonusAtFree,
  onPickupCollect: collectPickup,
});

// Forward EVT events to UI
on(EVT.SCORE, (v) => {
  setScoreUI(v);
});
on(EVT.LEVEL_UP, (lvl) => {
  setLevel(lvl);
  updateLvlBar();
  effects.levelPop();
  hapticLevelUp();
});
on(EVT.FOOD_EATEN, () => {
  /* hook for future */
});
on(EVT.BONUS_SPAWN, () => {
  /* hook for future */
});
on(EVT.BONUS_CLEAR, () => {
  clearBonusNow();
});
on(EVT.GOAL_REACHED, () => {
  winLevelNow();
});
on(EVT.DYING, ({ cause }) => {
  camController.triggerShake(1.4);
  showGameOverScreen(cause);
  resetCombo();
});
on(EVT.GAME_OVER, () => {
  showGameOverScreen('time');
  resetCombo();
});

// ====================================================================
// Input wiring
// ====================================================================
const inputWiring = createInputWiring({ canvas, snake, camera, getState, camController, bCam });
const { cycleCam } = inputWiring;

// ====================================================================
// Wire all UI buttons
// ====================================================================
const uiWiring = createUIWiring({
  buttons: {
    bStart,
    bTimeAttack,
    bDaily,
    bLevelSelect,
    bRestart,
    bResume,
    bPauseTitle,
    bOverTitle,
    bAudio,
    bCam,
    bPause,
    bLeaderboard,
    bShare,
    bCloseLeaderboard,
    leaderboardMod,
    bSettings,
    bSettingsSave,
    bSettingsClose,
    bSetAudio,
    bSetCB,
    bSetRM,
    bSetSlow,
    bClearData,
    settingsMod,
  },
  gameActions: {
    startGame,
    setPaused,
    goTitle,
    jumpToLevel,
    startTimeAttack,
    startDaily,
    cycleCam,
  },
  settingsActions: {
    onToggleAudio: settings.onToggleAudio,
    syncSettingsPanelUI: settings.syncSettingsPanelUI,
    toggleColorBlindAction: settings.toggleColorBlindAction,
    toggleRMActionLocal: settings.toggleRMActionLocal,
    toggleSlowActionLocal: settings.toggleSlowActionLocal,
    clearAllDataLocal: settings.clearAllDataLocal,
  },
  uiModules: {
    showLevelSelect,
    openLeaderboard,
    closeLeaderboard,
    openSettings,
    closeSettings,
    initHUD,
    initCalibPanel,
    initLevelSelect,
    setOnSelect,
    initToasts,
    initPopups,
    initPowerUpChip,
    initTitleScreen,
    initPause,
    initGameOver,
    initLeaderboard,
    initSettings,
    initLivesDisplay,
  },
  state: { getState, STATE, getScore: () => score, getCurrentSector: () => currentSector },
  elements: { lvlBarEl, hiEl, recTitleEl, recOverEl },
  deps: { shareScore, toast, updateLvlBar, getHi, setHiUI },
});
uiWiring.wireButtons();
uiWiring.wireVisibilityHandlers();

// Global keyboard handler (system-level: pause/restart/ESC)
window.addEventListener(
  'keydown',
  (e) => {
    if (e.repeat) return;
    if (e.code === 'KeyO') {
      if (settingsMod && settingsMod.classList.contains('show')) closeSettings();
      else {
        settings.syncSettingsPanelUI();
        openSettings();
      }
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyP' || e.code === 'Enter' || e.code === 'Space') {
      if (getState() === STATE.TITLE) {
        startGame();
        e.preventDefault();
        return;
      }
      if (getState() === STATE.PLAYING) {
        setPaused(true);
        e.preventDefault();
        return;
      }
      if (getState() === STATE.PAUSED) {
        setPaused(false);
        e.preventDefault();
        return;
      }
      if (getState() === STATE.OVER) {
        startGame();
        e.preventDefault();
        return;
      }
    }
    if (e.code === 'KeyC') {
      cycleCam();
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyM') {
      settings.onToggleAudio();
      e.preventDefault();
      return;
    }
    if (e.code === 'Escape') {
      if (settingsMod && settingsMod.classList.contains('show')) {
        closeSettings();
        e.preventDefault();
        return;
      }
      if (leaderboardMod && leaderboardMod.classList.contains('show')) {
        closeLeaderboard();
        e.preventDefault();
        return;
      }
      if (getState() === STATE.PAUSED || getState() === STATE.OVER) {
        goTitle();
        e.preventDefault();
        return;
      }
    }
    if (/^Digit[0-9]$/.test(e.code)) {
      const n = e.code === 'Digit0' ? 10 : parseInt(e.code.replace('Digit', ''), 10);
      if (n >= 1 && n <= 10 && (getState() === STATE.TITLE || getState() === STATE.OVER)) {
        jumpToLevel(n);
        e.preventDefault();
      }
    }
  },
  { passive: false }
);

// Resize
window.addEventListener('resize', () => resizeRenderer(renderer, camera, composer));

// ====================================================================
// Init UI modules
// ====================================================================
uiWiring.initUI();

// ====================================================================
// Render loop
// ====================================================================
let lastT = performance.now();
let trailAcc = 0;
let headWorld = new THREE.Vector3();

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const t = now / 1000;

  // Background animation
  updateBackground(background, t);
  water.update(t);
  ambient.update(t);
  scanRing.update(dt);

  // Stepping & dying
  if (getState() === STATE.PLAYING) {
    updateDying(performance.now());
    if (updateAdaptive) updateAdaptive(snake, lastGoal);
    const eff = applySpeedMods();
    stepInterval = eff;
    stepAcc += dt * 1000;
    while (stepAcc >= stepInterval) {
      stepAcc -= stepInterval;
      const result = stepLogic.step();
      if (result && result.died) {
        startDying(result.cause, snake);
        // visual death: emit particles, sfx, etc.
        for (let i = 0; i < snake.cells.length; i++) {
          const s = snake.cells[i];
          const tFrac = snake.cells.length <= 1 ? 0 : i / (snake.cells.length - 1);
          const col = new THREE.Color().lerpColors(COLORS.CYAN, COLORS.MAG, tFrac);
          const w = gx2world(s.gx, s.gz);
          particles.emit(w.x, 0.5, w.z, col, 26, false);
        }
        sfxDie();
        hapticDie();
        vibrate(120);
        effects.triggerFlash('death');
        effects.triggerGlitch(550);
        trailRibbon.clear();
        lives--;
        emit(EVT.LIFE_LOST, { lives });
        break;
      } else if (result && result.won) {
        break;
      }
    }
    if (bonusActive) {
      bonusLeft -= dt;
      if (bonusTEl) bonusTEl.textContent = Math.max(0, bonusLeft).toFixed(1);
      if (bonusLeft <= 3.0) bonusChip.classList.add('flash');
      else bonusChip.classList.remove('flash');
      if (bonusLeft <= 0) {
        clearBonusNow();
        toast('NÚCLEO PERDIDO', 'mag');
      }
    }
    if (
      speedBoostUntil <= performance.now() &&
      slowMoUntil <= performance.now() &&
      powerupChip &&
      powerupChip.classList.contains('show')
    ) {
      // chip auto-hides after timer expires
    }
  } else if (getState() === STATE.DYING) {
    updateDying(performance.now());
    if (dyingComplete()) {
      const cause = getDyingFrom();
      resetDying();
      if (lives > 0) {
        respawnLevel();
      } else {
        showGameOverScreen(cause);
      }
    }
  } else if (getState() === STATE.TITLE || getState() === STATE.OVER) {
    showcaseT += dt;
  }

  // Score damp display
  if (scoreDisplay !== score) {
    scoreDisplay = damp(scoreDisplay, score, 8, dt);
    if (Math.abs(scoreDisplay - score) < 0.5) scoreDisplay = score;
    if (scoreEl) scoreEl.textContent = String(Math.round(scoreDisplay));
  }
  updateScoreDisplay(dt);
  updateCombo();

  // Time attack countdown
  if (getState() === STATE.PLAYING && getMode() === MODE.TIME) {
    const remain = getTimeRemainingSec();
    if (remain == null || remain <= 0) {
      toast('TIEMPO AGOTADO', 'mag');
      showGameOverScreen('time');
    } else if (timeAttackEl) {
      timeAttackEl.textContent = remain.toFixed(1) + 's';
    }
  }

  // Snake visuals (only during play/paused/dying/over)
  if (
    getState() === STATE.PLAYING ||
    getState() === STATE.PAUSED ||
    getState() === STATE.DYING ||
    getState() === STATE.OVER
  ) {
    const stepT = getState() === STATE.PLAYING ? stepAcc / Math.max(1, stepInterval) : 1;
    headWorld = snakeView.render(snake, t, dt, stepT);
    if (getState() === STATE.DYING || getState() === STATE.OVER) {
      snakeView.setVisible(false);
    } else {
      snakeView.setVisible(true);
    }
    if (getState() === STATE.PLAYING || getState() === STATE.PAUSED) {
      updateWarning(snake, map, terrainMesh, t);
    }
    // Trail
    if (getState() === STATE.PLAYING && headWorld) {
      trailAcc += dt * 1000;
      if (trailAcc > 50) {
        trailAcc = 0;
        const tCol = new THREE.Color().lerpColors(COLORS.CYAN, COLORS.MAG, 0.2);
        if (headWorld) particles.emit(headWorld.x, 0.45, headWorld.z, tCol, 1, false);
        trailRibbon.update(headWorld, camera);
      }
    }
  } else {
    snakeView.setVisible(false);
  }

  // Food, bonus & pickup anim
  food.update(t, map.heightAt);
  bonus.update(t);
  pickups.update(t);

  // Particles / waves / popups
  particles.update(dt);
  waves.update(dt);
  updatePopups(camera, dt);

  // Sector update
  setSector(currentSector, levelPalette, getMode());
  setCurrentSector(currentSector);

  // Camera
  let targetPos, targetLook;
  if (snake.cells.length) {
    headWorld = gx2world(snake.cells[0].gx, snake.cells[0].gz);
  } else {
    headWorld = new THREE.Vector3(0, 0, 0);
  }
  const dirW = new THREE.Vector3(snake.dir.x, 0, snake.dir.z);
  const tb = map.bounds();
  const yFocus = (tb.minY + tb.maxY) * 0.5;
  if (getState() === STATE.TITLE || getState() === STATE.OVER) {
    const ang = showcaseT * 0.12;
    const r = GRID * 1.05;
    targetPos = new THREE.Vector3(
      Math.sin(ang) * r,
      GRID * 0.9 + Math.sin(showcaseT * 0.5) * 0.6,
      Math.cos(ang) * r
    );
    targetLook = new THREE.Vector3(0, Y_MID * 0.5, 0);
  } else {
    camController.update(t, dt, headWorld, dirW, yFocus, GRID, true);
    if (camera.userData._lookTarget) {
      camera.userData._lookTarget.copy(camController.blend.target);
    }
    targetPos = camera.position;
    targetLook = camController.blend.target;
  }
  if (getState() === STATE.TITLE || getState() === STATE.OVER) {
    camController.snap({ pos: targetPos, target: targetLook });
  }

  // Render
  composer.render();
}

// ====================================================================
// Init sequence
// ====================================================================
function init() {
  if (window.__initialized) return;
  window.__initialized = true;

  resizeRenderer(renderer, camera);
  // First paint
  composer.render();

  // Wire the dev perf overlay. Hidden by default; press ` (backtick) to
  // toggle. Safe to call in any environment — no-op without a window.
  initPerfOverlay();
  // Expose for the dev console.
  window.__perf = { show: showPerfOverlay, hide: hidePerfOverlay, recordDrawCalls };

  requestAnimationFrame(() => {
    composer.render();
    setTimeout(() => {
      if (loader) {
        loader.classList.add('hide');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 700);
      }
      showTitle();
      setState(STATE.TITLE);
      requestAnimationFrame(loop);
    }, 350);
  });
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => init());
} else {
  setTimeout(init, 200);
}
setTimeout(() => {
  if (!window.__initialized) init();
}, 1500);

// Watchdog: show fail after 4s if not initialized
setTimeout(() => {
  if (!window.__initialized) {
    showLoaderFail();
  }
}, 4000);

// Expose for debugging
window.__NS = {
  scene,
  camera,
  renderer,
  snake,
  map,
  snakeView,
  loadLevel,
  startGame,
  goTitle,
  setPaused,
  camController,
  pickups,
  checkpoints,
  food,
  bonus,
  particles,
  waves,
  scanRing,
  water,
  ambient,
  terrainMesh,
  goal,
  startMarker,
  lights,
  background,
  trailRibbon,
  setState,
  getState,
};
