import { $, isTouchDevice } from '../core/DOM.js';
import { show, hide } from './Modal.js';

const ID = 'pauseModal';

export function init() {}
export function showPause() {
  show(ID);
}
export function hidePause() {
  hide(ID);
}
export function isOpen() {
  const m = $(ID);
  return m && m.classList.contains('show');
}
