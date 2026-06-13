# NEØN SERPENT — Accessibility

> A practical a11y checklist for the game: keyboard, ARIA, screen
> reader, motion, and focus.

NEØN SERPENT is a fast-paced 3D action game, but accessibility is
non-negotiable. The 2026 SOTA refactor added skip-links, ARIA on
every interactive control, screen-reader live regions, reduced
motion, and a 0.7× slow-mode toggle. This document is the source
of truth for the contract.

---

## Table of contents

- [Keyboard controls (complete)](#keyboard-controls-complete)
- [Touch controls](#touch-controls)
- [ARIA patterns used](#aria-patterns-used)
- [Screen reader support](#screen-reader-support)
- [Reduced motion](#reduced-motion)
- [Focus management](#focus-management)
- [Color blindness](#color-blindness)
- [Haptics on touch devices](#haptics-on-touch-devices)
- [Visual calibration](#visual-calibration)
- [Settings persistence](#settings-persistence)
- [Known limitations](#known-limitations)

---

## Keyboard controls (complete)

The full keyboard map. Some keys are gated by the current `state`
(see `src/game/GameState.js`).

### Movement

| Key                  | Action                                  |
| -------------------- | --------------------------------------- |
| `W` / `ArrowUp`      | Move forward (camera-relative)          |
| `S` / `ArrowDown`    | Move backward                           |
| `A` / `ArrowLeft`    | Strafe left                             |
| `D` / `ArrowRight`   | Strafe right                            |

Direction is mapped to the **camera basis** by `InputMapper`, so
"up" always means "away from the camera" regardless of mode.

### Game flow

| Key                | State                 | Action                  |
| ------------------ | --------------------- | ----------------------- |
| `P`                | playing               | Pause                   |
| `P` / `Enter` / `Space` | paused              | Resume                  |
| `P` / `Enter` / `Space` | title              | Start game              |
| `P` / `Enter` / `Space` | over               | Restart                 |
| `Esc`              | paused / over         | Back to title           |
| `Esc`              | modal open            | Close modal             |
| `J`                | title / playing / paused / over | Open level select |
| `1` … `9`          | title / over          | Jump to level N         |
| `0`                | title / over          | Jump to level 10        |

### Camera

| Key  | Action                                   |
| ---- | ---------------------------------------- |
| `C`  | Cycle camera (CINEMÁTICA → CENITAL → PERSECUCIÓN) |

### Audio

| Key  | Action                       |
| ---- | ---------------------------- |
| `M`  | Toggle audio on / off        |

### UI

| Key  | Action                                                  |
| ---- | ------------------------------------------------------- |
| `O`  | Open / close Settings modal                              |
| `L`  | Open / close Calibration panel                           |

> The `L` binding was added in the SOTA refactor. It also blurs
> any active `<input type="range">` before toggling, so the
> arrow-key sliders stop capturing events.

### Edges

- The `KeyboardInput` listener uses `e.repeat` filtering, so holding
  a key never auto-fires.
- When the Calibration panel is open, the `L` handler explicitly
  blurs the active element to release the focused slider.

---

## Touch controls

| Gesture            | Action                                |
| ------------------ | ------------------------------------- |
| Swipe (≥ 26 px)    | Steer the snake (camera-relative)     |
| Tap on a button    | Activate the button                   |
| Tap on canvas      | (no-op; reserved for future gestures) |

Swipe detection lives in `src/input/TouchInput.js`. The threshold
is 26 px to avoid accidental turns on small screens.

A first-time touch hint appears for ~3.5 s when the game starts on
a touch device:

```html
<div id="touch-hint" class="touch-hint">DESLIZÁ EN PANTALLA PARA MOVER</div>
```

---

## ARIA patterns used

### Landmarks

The HTML shell defines clear regions:

```html
<a class="skip" href="#game">Saltar al tablero</a>
<main id="game" aria-label="Tablero del juego">…</main>
<nav id="hud-br" aria-label="Controles del juego">…</nav>
<header id="title-screen" role="region" aria-label="Menú principal">…</header>
```

- The skip link is the **first focusable element** in the page.
- `<canvas>` has `aria-label="Tablero del juego"` so a screen
  reader announces the play area when focused.

### Modals

Every modal is a `role="dialog"`, `aria-modal="true"`, and
`aria-labelledby` pointing at its heading:

```html
<div id="pauseModal" role="dialog" aria-modal="true"
     aria-labelledby="pauseModalH" hidden>
  <div class="panel modal">
    <h2 class="h cyan" id="pauseModalH">SISTEMA EN PAUSA</h2>
    …
  </div>
</div>
```

The same pattern is used for `overModal`, `leaderboardModal`,
`settingsModal`, and `levelSelectModal`.

### Live numbers

The score, hi-score, level, sector, and time-remaining are all
`aria-live="polite"`, so a screen reader announces updates without
interrupting speech.

```html
<div class="val s" id="scoreVal" aria-live="polite">0</div>
<div class="val m" id="hiVal"     aria-live="polite">0</div>
<div id="sectorNum" class="sectornum" aria-live="polite">1/10</div>
<div id="lvlNum"   class="lvlnum"    aria-live="polite">1</div>
```

### Toggle buttons

`aria-pressed` reflects the boolean state of every toggle:

```html
<button id="bAudio" type="button" aria-pressed="true">AUDIO: ON</button>
<button id="bSetCB"  type="button" aria-pressed="false">DALTÓNICO: NO</button>
<button id="bSetRM"  type="button" aria-pressed="false">MOV. REDUCIDO: OFF</button>
<button id="bSetSlow" type="button" aria-pressed="false">VEL. LENTA: OFF</button>
```

`aria-pressed` is **re-synced on every state change** (see
`syncSettingsPanelUI()` in `src/main.js`).

### Progress bar

The level bar is an `aria-valuemin/max/now` meter:

```html
<div id="lvlbar" role="meter" aria-label="Barra de progreso de nivel"
     aria-valuemin="1" aria-valuemax="10" aria-valuenow="1"></div>
```

### Decorative overlays

Decorative elements are explicitly hidden from AT:

```html
<div id="vignette" aria-hidden="true"></div>
<div id="crt"      aria-hidden="true"></div>
<div id="fx-flash" aria-hidden="true"></div>
<div id="countdown" class="countdown-overlay" aria-hidden="true"></div>
```

### Web Components

All `ns-*` components are in Shadow DOM. Public attributes are
reflected to `aria-*` on the inner element (e.g. `<ns-button
pressed="true">` → `aria-pressed="true"` on the inner button).

---

## Screen reader support

A dedicated polite live region is hidden offscreen but addressable
by AT:

```html
<div id="sr-status" class="sr-only" role="status"
     aria-live="polite" aria-atomic="true"></div>
```

`announce(text)` (in `src/main.js`) writes to it. The double-write
pattern (clear, then set after a 50 ms timeout) is intentional:
some screen readers don't pick up identical text in a row, so we
nudge them with a brief empty state.

Current announcements:

| Event            | Text                                           |
| ---------------- | ---------------------------------------------- |
| Game starts      | "A jugar"                                      |
| Sector cleared   | "Sector N completado"                          |
| Game over        | "Partida terminada, puntaje {score}"           |

> The game text is in Spanish. A future i18n pass will surface
> these strings through a locale catalog (see the `dev/` roadmap
> item).

### `.sr-only` utility

The helper class is in `src/styles/base.css`:

```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
```

It is the canonical "visible to AT, invisible to sighted users"
pattern. Reuse it whenever you add a status message that doesn't
need a visual treatment.

---

## Reduced motion

The Settings modal exposes a **MOVIMIENTO REDUCIDO** toggle
(`bSetRM`). It flips `body.rm` and propagates to
`Haptics.setReducedMotion()`. The CSS rule:

```css
@media (prefers-reduced-motion: reduce) {
  /* global override applied via base.css */
}
```

…disables:

- `body.glitch` (the death shake)
- `lvlNumEl.lvl-pop` (the level-up animation)
- `body` background parallax
- `crt` scanline animation
- `WebComponent` internal `@keyframes btnpulse`

The 3D scene itself keeps running; only the **overlays** are
toned down. This is intentional — the snake still moves, but the
chromatic-aberration / bloom punch is reduced.

---

## Focus management

### Skip-to-content

```html
<a class="skip" href="#game">Saltar al tablero</a>
```

The link is the first tab stop. Pressing <kbd>Tab</kbd> from a
fresh load skips the canvas and lands on the title-screen buttons.

### `:focus-visible`

All interactive elements have a focus ring that only appears with
keyboard focus:

```css
button:focus-visible,
input[type="range"]:focus-visible,
.level-cell:focus-visible {
  outline: 2px solid var(--color-cyan);
  outline-offset: 3px;
}
```

Mouse clicks don't show the ring; <kbd>Tab</kbd> does.

### Modal focus

When a modal opens (`<pauseModal>`, `<overModal>`, …), focus is
**not** automatically moved into it — this is a deliberate choice
to avoid stealing focus from the in-game button that triggered the
modal (e.g. the Pause button keeps its `aria-pressed` state). To
navigate into a modal, press <kbd>Tab</kbd> from the trigger
button; the modal's first action button is the next stop.

### Calibration slider blur

When the Calibration panel is open and the user presses <kbd>L</kbd>
on a focused range input, the `L` handler explicitly blurs the
active element first so the key doesn't re-trigger a slider step.

---

## Color blindness

Three palettes available via **DALTÓNICO** toggle
(`bSetCB` / `O` → settings):

| Mode    | Body class    | Use case                                    |
| ------- | ------------- | ------------------------------------------- |
| `off`   | (none)        | Default neon palette                        |
| `deuter`| `cb-deuter`   | Deuteranopia (most common)                  |
| `protan`| `cb-protan`   | Protanopia                                  |
| `tritan`| `cb-tritan`   | Tritanopia (rare)                           |

The palettes are layered via CSS:

```css
body.cb-deuter { --color-cyan: …; --color-mag: …; }
body.cb-protan { … }
body.cb-tritan { … }
```

All UI surfaces reference `var(--color-*)`, so the swap is instant
and applies to HUD, modals, buttons, and popups in one go. The 3D
scene's per-level `LEVEL_PALETTES` colors are **not** recolored —
level identity is preserved.

---

## Haptics on touch devices

`src/audio/Haptics.js` wraps `navigator.vibrate` with 10 named
patterns. All haptics are **silenced** when:

- `reducedMotion === true`, or
- `isAudioOn() === false` (treat mute as "no feedback at all"), or
- `isTouchDevice() === false`.

Patterns:

| Helper        | Pattern          | Trigger                |
| ------------- | ---------------- | ---------------------- |
| `hapticEat`   | `[10]`           | Eat food               |
| `hapticGem`   | `[15, 20, 15]`   | Pickup gem             |
| `hapticCrystal` | `[20, 30]`    | Pickup crystal         |
| `hapticSlow`  | `[15]`           | Pickup slow pickup     |
| `hapticDice`  | `[30, 20, 30, 20, 30]` | Pickup dice    |
| `hapticCheck` | `[20]`           | Pass checkpoint        |
| `hapticBonus` | `[10, 10, 10, 10, 10, 30]` | Pickup bonus |
| `hapticLevelUp` | `[15]`        | Level up               |
| `hapticDie`   | `[120]`          | Death                  |
| `hapticWin`   | `[50, 30, 50, 30, 100]` | Sector cleared   |

---

## Visual calibration

`src/ui/CalibrationPanel.js` is a runtime-tunable panel for users
who find the default scene too dark, too bright, or too washed-out.
It exposes:

| Section          | Controls                                            |
| ---------------- | --------------------------------------------------- |
| Iluminación 3D   | Ambient, Key (cyan), Fill (mag), Top, Head light   |
| Tone mapping     | Exposure                                            |
| Niebla           | Density, Color (R / G / B)                          |
| Overlays CSS     | CRT scanline opacity, line alpha + color, vignette |
| Render           | Pixel ratio                                         |
| Entidades        | Snake emissive, water opacity                       |

Each value is persisted in `localStorage` under the versioned
`ns:calib` key (schema v2) and applied live. See
[MODULES.md → `ui/`](./MODULES.md#ui--dom-ui) for the store API.

Press <kbd>L</kbd> to toggle the panel, or click **LUZ [L]** in
the HUD nav.

---

## Settings persistence

User preferences are stored in `localStorage` under the `ns_`
prefix (see `src/core/Store.js`):

| Key                        | Default | Effect                                    |
| -------------------------- | ------- | ----------------------------------------- |
| `ns_audio`                 | `true`  | Audio on / off                            |
| `ns_colorBlind`            | `'off'` | `off` / `deuter` / `protan` / `tritan`    |
| `ns_reducedMotion`         | `false` | Reduced motion on / off                   |
| `ns_slowMode`              | `false` | Slow mode (0.7×) on / off                 |
| `ns:calib`                 | (defaults) | Calibration values (versioned schema) |

If `localStorage` is unavailable (private mode, sandboxed iframe),
the store falls back to an in-memory `Map` for the session.

The Settings modal also offers **BORRAR DATOS**, which clears every
`ns_*` key and reloads the page.

---

## Known limitations

These are honest, not excuses. Tracking them in
`PLAN_REFACTOR.md` keeps us accountable.

1. **In-game text is Spanish-only.** The `dev/` roadmap includes
   `src/core/i18n.js` and a `src/locales/` catalog (currently
   scaffolded but empty). Until then, screen-reader announcements
   are also Spanish.
2. **No focus trap inside modals.** Modals can be tabbed out of.
   Acceptable because the game pauses when modals are open, so
   nothing in the background steals focus, but a future PR will
   add `inert` on the background.
3. **No audio description track.** The 3D scene is decorative; a
   non-sighted player relies on the live region. Future work:
   expose snake length and nearest pickup via `announce()` on
   demand (e.g. a `?` key).
4. **Calibration panel is not keyboard-reorderable.** Users can
   tweak any value, but the order is fixed. Acceptable trade-off
   for a power-user feature.
5. **Haptics are gated by audio state.** If audio is off, no
   haptics. Some users want haptics-without-audio. Tracking as a
   follow-up in `SettingsModal`.

If you find another gap, file it with the `a11y` label so we can
triage.
