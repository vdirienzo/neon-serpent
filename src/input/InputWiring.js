// src/input/InputWiring.js — Input setup and camera control
import { KeyboardInput } from './KeyboardInput.js';
import { TouchInput } from './TouchInput.js';
import { InputQueue } from './InputQueue.js';
import { t } from '../core/i18n.js';
import { toast } from '../ui/Toasts.js';

export function createInputWiring({ canvas, snake, camera, getState, camController, bCam }) {
  const keyboard = new KeyboardInput();
  const touch = new TouchInput(canvas);
  const input = new InputQueue(snake, camera, keyboard, touch);
  input.attach(() => getState());
  keyboard.attach();
  touch.attach(() => getState());

  // Camera-relative input bridge: InputQueue mutates snake.pendingTurns directly,
  // but the rest of the game reads from our own `pendingTurns` array.
  let _pendingTurns = [];
  let _lastTurnTime = -Infinity;
  const _origSetDir = snake.setDir.bind(snake);
  snake.setDir = function (name) {
    _origSetDir(name);
    _pendingTurns = snake.pendingTurns;
    if (snake.pendingTurns.length) {
      _lastTurnTime = performance.now() / 1000;
    }
  };
  snake.pendingTurns = _pendingTurns;

  function cycleCam() {
    camController.cycle();
    if (bCam) bCam.textContent = t('camera.label', { mode: camController.modeName() });
    toast(t('camera.label', { mode: camController.modeName() }), 'cyan');
  }

  // Set initial camera button text
  if (bCam) bCam.textContent = t('camera.label', { mode: camController.modeName() });

  function getPendingTurns() {
    return _pendingTurns;
  }
  function getLastTurnTime() {
    return _lastTurnTime;
  }

  return { keyboard, touch, input, cycleCam, getPendingTurns, getLastTurnTime };
}
