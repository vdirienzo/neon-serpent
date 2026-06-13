import { $ } from '../core/DOM.js';

export function show(id) {
  const m = $(id);
  if (m) m.classList.add('show');
}
export function hide(id) {
  const m = $(id);
  if (m) m.classList.remove('show');
}
export function toggle(id) {
  const m = $(id);
  if (m) m.classList.toggle('show');
}
export function isOpen(id) {
  const m = $(id);
  return m && m.classList.contains('show');
}
