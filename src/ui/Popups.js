import * as THREE from 'three';
import { $ } from '../core/DOM.js';

let layer = null;
const pool = [];

function makePopup() {
  const el = document.createElement('div');
  el.className = 'popup cyan';
  el.style.display = 'none';
  layer.appendChild(el);
  return { el, alive: false, t: 0, dur: 1.0, world: new THREE.Vector3(), text: '', kind: 'cyan' };
}

export function init() {
  layer = $('popups');
  for (let i = 0; i < 24; i++) pool.push(makePopup());
}

export function popupAt(world, text, kind) {
  const p = pool.find((x) => !x.alive);
  if (!p) return;
  p.alive = true;
  p.t = 0;
  p.world.copy(world);
  p.text = text;
  p.kind = kind || 'cyan';
  p.el.textContent = text;
  p.el.className = 'popup ' + p.kind;
  p.el.style.display = 'block';
}

export function update(camera, dt) {
  for (const p of pool) {
    if (!p.alive) continue;
    p.t += dt;
    const k = p.t / p.dur;
    const v = p.world.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-v.y * 0.5 + 0.5) * window.innerHeight - k * 60;
    const op = 1 - Math.max(0, (k - 0.4) / 0.6);
    const sc = 0.8 + Math.min(1, k * 4) * 0.4;
    p.el.style.left = x + 'px';
    p.el.style.top = y + 'px';
    p.el.style.opacity = op;
    p.el.style.transform = `translate(-50%,-50%) scale(${sc})`;
    if (k >= 1) {
      p.alive = false;
      p.el.style.display = 'none';
    }
  }
}
