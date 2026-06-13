/**
 * @fileoverview SOTA 2026 performance overlay. Opt-in: hidden until toggled.
 *
 * Public API
 *   init()              — wire the overlay DOM element + backtick key. Idempotent.
 *   show()              — make the overlay visible and start the rAF loop
 *   hide()              — hide the overlay and stop the rAF loop
 *   toggle()            — flip visibility
 *   isVisible()         — current visibility flag
 *   recordDrawCalls(n)  — record a frame's draw-call count (set by the renderer)
 *   destroy()           — remove DOM, listener, and rAF state
 *
 * Display
 *   - Bottom-right fixed element, neon-styled
 *   - FPS (60-frame rolling average)
 *   - Frame time (ms)
 *   - Draw calls (set by the renderer via recordDrawCalls)
 *   - JS heap memory (when performance.memory is available)
 *   - Color: green >55, yellow 30-55, red <30
 *
 * Toggle key
 *   Backquote (`) — not when modifier keys are held or focus is in an input.
 */

import { log } from '../core/Log.js';

const MAX_FRAMES = 60;
const ROLLING_WINDOW_MS = 1000;

let _win = null;
let _doc = null;
let overlay = null;
let visible = false;
let frameTimes = [];
let lastFrameTime = 0;
let drawCalls = 0;
let rafId = null;
let keyHandler = null;
let installed = false;

function getEnv() {
  if (_win && _doc) return;
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    _win = window;
    _doc = document;
  }
}

function getMemory() {
  try {
    if (typeof performance !== 'undefined' && performance && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize / 1048576,
        total: performance.memory.totalJSHeapSize / 1048576,
        limit: performance.memory.jsHeapSizeLimit / 1048576,
      };
    }
  } catch (e) {
    /* not available */
  }
  return null;
}

function colorForFps(fps) {
  if (fps > 55) return '#00ff88';
  if (fps >= 30) return '#ffcc00';
  return '#ff4466';
}

function buildOverlay() {
  if (!_doc) return null;
  const el = _doc.createElement('div');
  el.id = 'perf-overlay';
  el.setAttribute('data-perf-overlay', '1');
  el.style.cssText = [
    'position: fixed',
    'bottom: 12px',
    'right: 12px',
    'padding: 8px 12px',
    'background: rgba(0, 0, 0, 0.72)',
    'color: #00ff88',
    'font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    'font-size: 11px',
    'line-height: 1.45',
    'border-radius: 4px',
    'border: 1px solid rgba(0, 255, 136, 0.4)',
    'box-shadow: 0 0 12px rgba(0, 255, 136, 0.3)',
    'z-index: 999999',
    'pointer-events: none',
    'display: none',
    'min-width: 150px',
    'text-shadow: 0 0 4px currentColor',
    'user-select: none',
    '-webkit-user-select: none',
    'white-space: pre',
  ].join(';');
  return el;
}

function shouldIgnoreKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  const t = e.target;
  if (!t) return false;
  const tag = (t.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (t.isContentEditable) return true;
  return false;
}

function tick(now) {
  if (!visible) {
    rafId = null;
    return;
  }
  if (lastFrameTime) {
    const dt = now - lastFrameTime;
    if (dt > 0 && dt < ROLLING_WINDOW_MS) {
      frameTimes.push(dt);
      if (frameTimes.length > MAX_FRAMES) frameTimes.shift();
    }
  }
  lastFrameTime = now;

  if (overlay && frameTimes.length > 0) {
    let sum = 0;
    for (const t of frameTimes) sum += t;
    const avgDt = sum / frameTimes.length;
    const fps = avgDt > 0 ? 1000 / avgDt : 0;
    overlay.style.color = colorForFps(fps);
    const mem = getMemory();
    const memStr = mem ? mem.used.toFixed(1) + 'MB' : 'n/a';
    const lines = [
      'FPS:    ' + fps.toFixed(1),
      'Frame:  ' + avgDt.toFixed(2) + ' ms',
      'Draws:  ' + drawCalls,
      'Memory: ' + memStr,
    ];
    overlay.textContent = lines.join('\n');
  }
  drawCalls = 0;
  if (_win && typeof _win.requestAnimationFrame === 'function') {
    rafId = _win.requestAnimationFrame(tick);
  } else {
    rafId = null;
  }
}

export function init() {
  if (installed) return true;
  getEnv();
  if (!_doc || !_win) {
    log.warn('PerfOverlay: no window/document, skipping');
    return false;
  }
  overlay = buildOverlay();
  if (!overlay) return false;
  _doc.body.appendChild(overlay);

  keyHandler = (e) => {
    if (e.code !== 'Backquote') return;
    if (shouldIgnoreKey(e)) return;
    toggle();
    e.preventDefault();
  };
  _win.addEventListener('keydown', keyHandler);
  installed = true;
  return true;
}

export function show() {
  if (!installed) init();
  if (!overlay) return false;
  visible = true;
  overlay.style.display = 'block';
  frameTimes = [];
  lastFrameTime = 0;
  drawCalls = 0;
  if (rafId == null && _win && typeof _win.requestAnimationFrame === 'function') {
    rafId = _win.requestAnimationFrame(tick);
  }
  return true;
}

export function hide() {
  visible = false;
  if (overlay) overlay.style.display = 'none';
  if (rafId != null) {
    if (_win && typeof _win.cancelAnimationFrame === 'function') {
      try {
        _win.cancelAnimationFrame(rafId);
      } catch (e) {
        /* ignore */
      }
    }
    rafId = null;
  }
  return true;
}

export function toggle() {
  return visible ? hide() : show();
}

export function isVisible() {
  return visible;
}

export function recordDrawCalls(n) {
  const v = Number(n);
  if (Number.isFinite(v) && v >= 0) drawCalls = v;
}

export function destroy() {
  hide();
  if (keyHandler && _win && typeof _win.removeEventListener === 'function') {
    try {
      _win.removeEventListener('keydown', keyHandler);
    } catch (e) {
      /* ignore */
    }
  }
  keyHandler = null;
  if (overlay && overlay.parentNode) {
    try {
      overlay.parentNode.removeChild(overlay);
    } catch (e) {
      /* ignore */
    }
  }
  overlay = null;
  installed = false;
  frameTimes = [];
  lastFrameTime = 0;
  drawCalls = 0;
}
