# PLAN REFACTOR — NEØN SERPENT
## De monolito HTML a arquitectura modular 2026

**Archivo origen:** `neon-serpent.html` (3704 líneas, 154 KB)
**Composición:** HTML 164 tags / CSS 22 KB / JS 122 KB / 120 funciones top-level / 573 const / 120 let
**Secciones JS detectadas:** 17 (CONFIG, PERSISTENCE, UTIL, RENDERER, SNAKE, FOOD, PARTICLES, GAME STATE, CAMERA, INPUT, HUD, TOASTS, AUDIO, CAMERA CYCLE, PAUSE/TITLE/OVER, STEP LOGIC, RENDER LOOP)

---

# Resumen Ejecutivo

Refactor del monolito HTML+CSS+JS a una **arquitectura modular ES6** con separación estricta de capas, **Web Components** para piezas de UI reutilizables, **Event Bus** para comunicación desacoplada, **CSS moderno con tokens + container queries**, accesibilidad ARIA y mobile-first. El código se organiza en **~70 módulos** agrupados por dominio (core, render, world, entities, game, camera, input, audio, ui, components). Manteniendo **exactamente la misma funcionalidad** del original.

**Estrategia de ejecución:** bottom-up por capas con paralelización dentro de cada capa. Las capas core → render → world → entities → game → ui son **secuenciales** (cada una depende de la anterior). Dentro de cada capa, los módulos son **paralelos** entre sí.

---

# Fases del Proyecto

## FASE 1 — Análisis y Diagnóstico ✅ (ya hecho)
**Status:** completado durante la planificación.

**Entregables:**
- Inventario de 120 funciones, 17 secciones, 59 IDs HTML, 21 botones
- Mapeo de dependencias y dominios
- Identificación de los "god objects" (IIFE monolítico, estado global implícito)

**Complejidad:** Baja

---

## FASE 2 — Diseño de Arquitectura + Estructura de Carpetas
**Objetivo:** establecer la "ciudad" donde vivirá el código.

**Tareas:**
- 2.1 Crear estructura de carpetas vacía
- 2.2 Definir `package.json` (sin dependencias runtime; el dev-server es opcional con `python3 -m http.server`)
- 2.3 Definir contratos de los módulos principales (interfaces en JSDoc, sin implementación)
- 2.4 Definir el **Event Bus API** y el **Store API** (los 2 cimientos)
- 2.5 Definir constantes compartidas en `src/js/config.js`
- 2.6 Escribir `src/main.js` como entry point vacío que solo inicializa el EventBus
- 2.7 Escribir `index.html` minimal con `<script type="module" src="src/main.js"></script>`

**Entregables:**
```
opensake/
├── index.html              # Shell HTML
├── serve.sh
├── PLAN.md
├── PLAN_REFACTOR.md        # este archivo
├── src/
│   ├── main.js             # bootstrap
│   ├── styles/             # CSS modular
│   └── js/                 # código modular
└── tests/
```

**Complejidad:** Media
**Subagentes:** 1 agente puede hacer todo esto en una pasada.
**Dependencias:** ninguna (FASE 1).
**Bloquea:** todas las demás fases.

---

## FASE 3 — HTML Shell + Accesibilidad + Semántica
**Objetivo:** HTML limpio, semántico, accesible, sin inline styles/scripts.

**Tareas:**
- 3.1 Escribir `index.html` con la estructura completa del juego
- 3.2 Aplicar semántica correcta: `<header>`, `<main>`, `<section>`, `<nav>`, `<aside>`, `<dialog>`
- 3.3 Agregar atributos ARIA: `role`, `aria-label`, `aria-live`, `aria-hidden`, `aria-modal`
- 3.4 Mejorar accesibilidad del HUD: roles `status` para toasts, `progressbar` para level bar
- 3.5 Implementar `<dialog>` nativo para modales (donde aplique)
- 3.6 Agregar `prefers-reduced-motion` y `prefers-color-scheme` hooks
- 3.7 Validar estructura con parser de HTML

**Entregables:** `index.html` (≤ 200 líneas, semántico, accesible AA+)
**Complejidad:** Media
**Subagentes:** 1 agente.
**Dependencias:** FASE 2 (carpeta creada).
**Bloquea:** FASE 4 (CSS necesita HTML).

---

## FASE 4 — CSS Modular + Moderno
**Objetivo:** CSS dividido por concern, con tokens, mobile-first, BEM-light.

**Tareas (cada una paralelizable):**
- 4.1 `tokens.css` — variables CSS (colores, espaciado, tipografía, motion, z-index)
- 4.2 `reset.css` — reset/normalize moderno
- 4.3 `base.css` — body, tipografía base, scroll behavior
- 4.4 `layout/loader.css` — pantalla de carga
- 4.5 `layout/title-screen.css`
- 4.6 `layout/hud.css`
- 4.7 `layout/modal.css` (compartido entre modales)
- 4.8 `components/button.css` — `.btn` y variantes
- 4.9 `components/chip.css` — `.chipbtn`
- 4.10 `components/panel.css` — `.panel` con clip-path
- 4.11 `components/toast.css`
- 4.12 `components/popup.css`
- 4.13 `components/progress-bar.css` — powerup chip bar
- 4.14 `components/clipboard.css` — death cause y similares
- 4.15 `fx/crt.css`, `fx/vignette.css`, `fx/flash.css`
- 4.16 `main.css` — `@import` de todos los anteriores en orden
- 4.17 Container queries donde aporten (botones, modales)

**Convenciones:**
- Naming: BEM-light: `.block__element--modifier`
- Custom properties: `--color-cyan`, `--space-3`, `--motion-fast`
- Mobile-first: `min-width` queries
- `@layer` para especificidad predecible

**Entregables:** 16 archivos CSS, ~25 KB total.
**Complejidad:** Alta (muchos archivos, convenciones estrictas).
**Subagentes:** 2-3 agentes en paralelo (uno para tokens/reset/base, otro para layout, otro para components).
**Dependencias:** FASE 3 (HTML).
**Bloquea:** las pantallas necesitan CSS antes de poder testear.

---

## FASE 5 — Core Utilities (sin dependencias)
**Objetivo:** los cimientos reutilizables del juego.

**Tareas (paralelas entre sí):**
- 5.1 `core/Math.js` — `clamp`, `lerp`, `damp`, `smoothstep`, `choice`, `rand`, `randi`
- 5.2 `core/Random.js` — RNG con seed (Mulberry32) + helpers deterministas
- 5.3 `core/EventBus.js` — Pub/sub simple (`on`, `off`, `emit`)
- 5.4 `core/Store.js` — Wrapper localStorage con fallback en memoria
- 5.5 `core/Log.js` — Logger con niveles (debug/info/warn/error)
- 5.6 `core/config.js` — Constantes globales (GRID, Y_*, STEP_*, etc.)
- 5.7 `core/DOM.js` — Helpers para `getElementById`, `qs`, `qsa`, `create`
- 5.8 `core/Assert.js` — `assert(cond, msg)` con throw

**Entregables:** 8 módulos, ~10 KB total.
**Complejidad:** Baja.
**Subagentes:** 1-2 agentes.
**Dependencias:** FASE 2.
**Bloquea:** FASE 6 en adelante (todas las capas usan core).

---

## FASE 6 — Render Layer (Three.js setup)
**Objetivo:** encapsular el setup de WebGL/Three.js.

**Tareas (paralelas entre sí):**
- 6.1 `render/Renderer.js` — WebGLRenderer + tone mapping + resize
- 6.2 `render/Scene.js` — Scene + fog + background
- 6.3 `render/Camera.js` — PerspectiveCamera + aspect
- 6.4 `render/Lighting.js` — Ambient + key/fill point lights + headlight + top
- 6.5 `render/PostFX.js` — Scan ring + FX flash divs + triggers
- 6.6 `render/Background.js` — Estrellas, nebulosas, dust (los sprites del fondo)

**Entregables:** 6 módulos, ~8 KB.
**Complejidad:** Media.
**Subagentes:** 1 agente puede hacerlos todos.
**Dependencias:** FASE 5 (usa EventBus, Math).
**Bloquea:** FASE 7 (world necesita scene).

---

## FASE 7 — World / Terrain
**Objetivo:** la generación procedural de niveles y la representación visual.

**Tareas (algunas paralelas):**
- 7.1 `world/noise.js` — hash2D, valueNoise, FBM (las funciones puras)
- 7.2 `world/HeightMap.js` — Modelo de datos + queries (`heightAt`, `isSolid`, `isGoal`, `setGoal`, `findNearestSolid`)
- 7.3 `world/IslandBuilder.js` — `buildTerrainIsland`, `buildBridge`
- 7.4 `world/LevelBuilder.js` — `buildLevel1-5`, `buildDailyLevel`, `buildLevel` dispatcher
- 7.5 `world/TerrainMesh.js` — Render de tiles + edges + peak meshes
- 7.6 `world/ContourLines.js` — Marching squares 1D para isobaras
- 7.7 `world/WaterPlane.js` — Plano de agua con vertex animation
- 7.8 `world/AmbientParticles.js` — Niebla de valle + chispas de pico
- 7.9 `world/Goal.js` — Faro del goal
- 7.10 `world/Stars.js` — Helper para crear puntos (estrellas)

**Entregables:** 10 módulos, ~25 KB.
**Complejidad:** Alta.
**Subagentes:** 2 agentes (uno para lógica pura 7.1-7.4, otro para visuals 7.5-7.10).
**Dependencias:** FASE 5 (Math, Random), FASE 6 (Scene, Lighting).
**Bloquea:** FASE 8 (entities necesitan world).

---

## FASE 8 — Entities (Snake + Food)
**Objetivo:** la serpiente y los pickups.

**Tareas (paralelas entre sí):**
- 8.1 `entities/Snake.js` — Lógica pura: `snake` array, `step`, `grow`, `collide`
- 8.2 `entities/SnakeView.js` — Render: segmentos, lean, squash, eat-pop
- 8.3 `entities/Food.js` — Comida estándar (orbe)
- 8.4 `entities/Pickups.js` — Orbs + gems + crystals + slow + dice
- 8.5 `entities/Checkpoints.js` — Anillos dorados
- 8.6 `entities/Bonus.js` — Núcleo de datos
- 8.7 `entities/Particles.js` — Sistema de partículas
- 8.8 `entities/Waves.js` — Ondas de shock

**Entregables:** 8 módulos, ~20 KB.
**Complejidad:** Alta.
**Subagentes:** 2 agentes (uno lógica 8.1, otro visuals 8.2-8.8).
**Dependencias:** FASE 5, FASE 7 (necesita HeightMap para colisiones).
**Bloquea:** FASE 9 (game logic usa snake).

---

## FASE 9 — Game Logic + State Machine
**Objetivo:** el corazón del juego: state machine, step logic, modos.

**Tareas (paralelas entre sí):**
- 9.1 `game/GameState.js` — Estados: loading, title, countdown, playing, paused, dying, over, win
- 9.2 `game/GameLoop.js` — requestAnimationFrame + delta time
- 9.3 `game/StepLogic.js` — `step()` con todas las reglas (collision, climbing, pickups)
- 9.4 `game/Collision.js` — Wall, void, climb, self-collision
- 9.5 `game/Modes.js` — `story`, `time`, `daily` (con lógica de fin de modo)
- 9.6 `game/LevelManager.js` — loadLevel, jumpToLevel, buildLevelVisuals glue
- 9.7 `game/Scoring.js` — Score, hi-score, per-sector best, level-up logic
- 9.8 `game/Countdown.js` — 3-2-1-GO con invulnerabilidad
- 9.9 `game/DeathHandler.js` — startDying, death cause tracking
- 9.10 `game/WinHandler.js` — winLevel, sector transition

**Entregables:** 10 módulos, ~18 KB.
**Complejidad:** Alta.
**Subagentes:** 2-3 agentes (state machine + step + modes, death + win + scoring, level manager).
**Dependencias:** FASE 5, FASE 7, FASE 8.
**Bloquea:** FASE 12 (UI muestra state del game).

---

## FASE 10 — Camera + Input
**Objetivo:** los 3 modos de cámara + input handling.

**Tareas (paralelas entre sí):**
- 10.1 `camera/CameraModes.js` — CINEMATICA, CENITAL, PERSECUCION
- 10.2 `camera/CameraController.js` — Pose interpolation, smooth blend, shake
- 10.3 `camera/CameraMath.js` — Calcular pose según modo
- 10.4 `input/KeyboardInput.js` — Keydown listener, keyDirs map
- 10.5 `input/TouchInput.js` — Pointer events, swipe detection
- 10.6 `input/InputMapper.js` — Camera-relative direction mapping
- 10.7 `input/InputQueue.js` — pendingTurns buffer

**Entregables:** 7 módulos, ~12 KB.
**Complejidad:** Media.
**Subagentes:** 1-2 agentes.
**Dependencias:** FASE 5, FASE 6, FASE 9.
**Bloquea:** puede ir en paralelo con FASE 11, 12.

---

## FASE 11 — Audio
**Objetivo:** música adaptativa + SFX.

**Tareas (paralelas entre sí):**
- 11.1 `audio/AudioContext.js` — Lazy init + master gain
- 11.2 `audio/SFX.js` — One-shots (eat, bonus, die, start)
- 11.3 `audio/Music.js` — Loop synthwave con arp
- 11.4 `audio/AdaptiveLayers.js` — Hi-hat + sub-bass que se suman según snake.length
- 11.5 `audio/Volume.js` — setMasterVolume + categorías
- 11.6 `audio/Haptics.js` — Wrapper navigator.vibrate con guards

**Entregables:** 6 módulos, ~12 KB.
**Complejidad:** Media.
**Subagentes:** 1-2 agentes.
**Dependencias:** FASE 5.
**Bloquea:** puede ir en paralelo con FASE 10, 12.

---

## FASE 12 — UI (HUD + Modales + Toasts)
**Objetivo:** toda la interfaz de usuario no-Canvas.

**Tareas (paralelas entre sí):**
- 12.1 `ui/HUD.js` — Score, level bar, sector, mode indicator
- 12.2 `ui/PowerUpChip.js` — El chip de speed/slow
- 12.3 `ui/Countdown.js` (visual) — El overlay 3-2-1-GO
- 12.4 `ui/Toasts.js` — Sistema de toasts efímeros
- 12.5 `ui/Popups.js` — Floating popups en el mundo
- 12.6 `ui/Modal.js` (base) — Wrapper genérico de modal
- 12.7 `ui/TitleScreen.js`
- 12.8 `ui/PauseModal.js`
- 12.9 `ui/GameOverModal.js` + DeathCause + Share
- 12.10 `ui/LeaderboardModal.js` — Top 10
- 12.11 `ui/SettingsModal.js` — Toggles de accesibilidad + clear data
- 12.12 `ui/Haptics.js` — (mover desde audio/)

**Entregables:** 12 módulos, ~25 KB.
**Complejidad:** Alta.
**Subagentes:** 3-4 agentes (HUD+PowerUp+Countdown, Toasts+Popups+Modal base, modales específicos).
**Dependencias:** FASE 3 (HTML), FASE 5 (core).
**Bloquea:** FASE 13 (Web Components envuelven UI).

---

## FASE 13 — Web Components
**Objetivo:** custom elements que encapsulan piezas de UI reutilizables.

**Tareas (paralelas entre sí):**
- 13.1 `components/ns-button.js` — `<ns-button variant="ghost|gold|mag">`
- 13.2 `components/ns-modal.js` — `<ns-modal title="...">...</ns-modal>`
- 13.3 `components/ns-chip.js` — `<ns-chip type="speed|slow" duration="6000">`
- 13.4 `components/ns-panel.js` — `<ns-panel variant="cyan|mag|gold">`
- 13.5 `components/ns-toast.js` — `<ns-toast kind="cyan|mag|gold" duration="1300">`
- 13.6 `components/ns-progress-bar.js` — `<ns-progress-bar value="0.5" color="cyan">`

**Entregables:** 6 custom elements.
**Complejidad:** Media.
**Subagentes:** 1-2 agentes.
**Dependencias:** FASE 12 (toman piezas de UI como referencia).
**Bloquea:** FASE 14 (el bootstrap registra los components).

---

## FASE 14 — Bootstrap + Integración
**Objetivo:** el `main.js` que conecta todo.

**Tareas:**
- 14.1 `main.js` — Inicialización en orden:
  1. EventBus
  2. Store + Log
  3. Renderer + Scene + Camera + Lighting
  4. Input handlers
  5. World/Level inicial
  6. GameState
  7. GameLoop.start()
  8. UI inicial
  9. Web Components register
  10. EventBus.emit('app:ready')
- 14.2 Cablear EventBus: subscribir UI al estado del game, game a input, etc.
- 14.3 Verificar que el juego arranca end-to-end
- 14.4 Asegurar que el primer frame renderiza sin errores

**Entregables:** `main.js` funcional, ~3 KB.
**Complejidad:** Alta (integración).
**Subagentes:** 1 agente (el orquestador, yo).
**Dependencias:** FASE 5-13.
**Bloquea:** FASE 15 (testing).

---

## FASE 15 — Testing
**Objetivo:** tests unitarios + smoke test E2E.

**Tareas (paralelas entre sí):**
- 15.1 `tests/unit/math.test.js` — clamp, lerp, damp
- 15.2 `tests/unit/noise.test.js` — FBM determinista
- 15.3 `tests/unit/heightmap.test.js` — setGoal, findNearestSolid
- 15.4 `tests/unit/snake.test.js` — colisiones, growth
- 15.5 `tests/unit/scoring.test.js` — per-sector best
- 15.6 `tests/unit/eventbus.test.js`
- 15.7 `tests/unit/store.test.js`
- 15.8 `tests/smoke/game.boot.js` — Verifica que `index.html` carga sin errores de consola
- 15.9 Setup de runner: usar `node --test` nativo (sin dependencias)

**Entregables:** ~9 archivos de tests.
**Complejidad:** Media.
**Subagentes:** 2-3 agentes.
**Dependencias:** FASE 14 (código integrado).
**Bloquea:** FASE 16.

---

## FASE 16 — Optimización + Documentación
**Objetivo:** perf + docs.

**Tareas:**
- 16.1 **Code splitting**: dynamic imports para los modos (time attack, daily) → solo cargan cuando se eligen
- 16.2 **Tree shaking verification**: ningún export no usado
- 16.3 **Minify production build**: setup de esbuild como build step (opcional, dev usa sin minificar)
- 16.4 **Lazy load three.js**: si el browser no soporta WebGL2, fallback
- 16.5 **Performance audit**: DevTools coverage, eliminar dead code
- 16.6 **Lighthouse audit**: perf, accessibility, best practices, SEO
- 16.7 **README.md**: cómo correr, cómo contribuir, arquitectura
- 16.8 **JSDoc en APIs públicas**: cada módulo exporta interfaces tipadas
- 16.9 **ARCHITECTURE.md**: diagramas de cómo se conectan los módulos
- 16.10 **CHANGELOG.md**: qué cambió del monolito

**Entregables:** 10 entregables.
**Complejidad:** Media.
**Subagentes:** 1-2 agentes.
**Dependencias:** FASE 15.

---

# Estructura Final de Carpetas

```
opensake/
├── index.html                          # Shell HTML semántico
├── serve.sh
├── package.json                        # Cero deps runtime
├── README.md
├── ARCHITECTURE.md
├── CHANGELOG.md
├── PLAN.md                             # Plan de features (anterior)
├── PLAN_REFACTOR.md                    # este plan
│
├── src/
│   ├── main.js                         # Bootstrap + cableado
│   │
│   ├── config.js                       # Constantes globales
│   │
│   ├── core/
│   │   ├── Math.js
│   │   ├── Random.js                   # RNG con seed
│   │   ├── EventBus.js                 # Pub/sub
│   │   ├── Store.js                    # localStorage wrapper
│   │   ├── Log.js
│   │   ├── DOM.js
│   │   └── Assert.js
│   │
│   ├── render/
│   │   ├── Renderer.js                 # WebGL setup
│   │   ├── Scene.js
│   │   ├── Camera.js                   # Perspective camera
│   │   ├── Lighting.js
│   │   ├── Background.js               # Estrellas + nebulosas
│   │   ├── TrailRibbon.js
│   │   └── PostFX.js                   # CSS FX divs
│   │
│   ├── world/
│   │   ├── noise.js
│   │   ├── HeightMap.js
│   │   ├── IslandBuilder.js
│   │   ├── LevelBuilder.js
│   │   ├── TerrainMesh.js
│   │   ├── ContourLines.js
│   │   ├── WaterPlane.js
│   │   ├── AmbientParticles.js
│   │   ├── Goal.js
│   │   └── Stars.js
│   │
│   ├── entities/
│   │   ├── Snake.js                    # Lógica
│   │   ├── SnakeView.js                # Render
│   │   ├── Food.js
│   │   ├── Pickups.js
│   │   ├── Checkpoints.js
│   │   ├── Bonus.js
│   │   ├── Particles.js
│   │   └── Waves.js
│   │
│   ├── game/
│   │   ├── GameState.js                # State machine
│   │   ├── GameLoop.js
│   │   ├── StepLogic.js
│   │   ├── Collision.js
│   │   ├── Modes.js
│   │   ├── LevelManager.js
│   │   ├── Scoring.js
│   │   ├── Countdown.js
│   │   ├── DeathHandler.js
│   │   └── WinHandler.js
│   │
│   ├── camera/
│   │   ├── CameraModes.js
│   │   ├── CameraController.js
│   │   └── CameraMath.js
│   │
│   ├── input/
│   │   ├── KeyboardInput.js
│   │   ├── TouchInput.js
│   │   ├── InputMapper.js
│   │   └── InputQueue.js
│   │
│   ├── audio/
│   │   ├── AudioContext.js
│   │   ├── SFX.js
│   │   ├── Music.js
│   │   ├── AdaptiveLayers.js
│   │   ├── Volume.js
│   │   └── Haptics.js
│   │
│   ├── ui/
│   │   ├── HUD.js
│   │   ├── PowerUpChip.js
│   │   ├── Countdown.js                # UI
│   │   ├── Toasts.js
│   │   ├── Popups.js
│   │   ├── Modal.js                    # Base
│   │   ├── TitleScreen.js
│   │   ├── PauseModal.js
│   │   ├── GameOverModal.js
│   │   ├── LeaderboardModal.js
│   │   ├── SettingsModal.js
│   │   └── Flash.js
│   │
│   ├── components/                     # Web Components
│   │   ├── ns-button.js
│   │   ├── ns-modal.js
│   │   ├── ns-chip.js
│   │   ├── ns-panel.js
│   │   ├── ns-toast.js
│   │   └── ns-progress-bar.js
│   │
│   └── styles/
│       ├── main.css                    # Entry: @import todo
│       ├── tokens.css
│       ├── reset.css
│       ├── base.css
│       ├── layout/
│       │   ├── loader.css
│       │   ├── title-screen.css
│       │   ├── hud.css
│       │   └── modal.css
│       ├── components/
│       │   ├── button.css
│       │   ├── chip.css
│       │   ├── panel.css
│       │   ├── toast.css
│       │   ├── popup.css
│       │   ├── progress-bar.css
│       │   └── flash.css
│       └── fx/
│           ├── crt.css
│           ├── vignette.css
│           └── effects.css
│
└── tests/
    ├── unit/
    │   ├── math.test.js
    │   ├── noise.test.js
    │   ├── heightmap.test.js
    │   ├── snake.test.js
    │   ├── scoring.test.js
    │   ├── eventbus.test.js
    │   └── store.test.js
    └── smoke/
        └── boot.test.js
```

**Total estimado:**
- 1 `index.html` (~200 líneas)
- 1 `main.js` (~150 líneas)
- 1 `config.js` (~50 líneas)
- ~70 módulos JS (~200-400 líneas c/u = ~20-30 KB c/u)
- ~16 archivos CSS
- ~9 archivos de tests
- 3 archivos de docs

**Tamaño total estimado:** ~250-300 KB de código fuente, comparable al monolito actual.

---

# Dependencias entre Fases

```
FASE 1 ✅ → FASE 2 → FASE 3 → FASE 4
                              ↓
FASE 5 (core) → FASE 6 (render) → FASE 7 (world) → FASE 8 (entities) → FASE 9 (game)
                                          ↓                                ↓
                                       FASE 10 (camera+input)  ←───────────┤
                                                                  ↓
                                       FASE 11 (audio) ←────── FASE 12 (UI)
                                                                      ↓
                                                                  FASE 13 (Components)
                                                                      ↓
                                                                  FASE 14 (Bootstrap)
                                                                      ↓
                                                                  FASE 15 (Tests)
                                                                      ↓
                                                                  FASE 16 (Optim+Docs)
```

**Paralelización segura:**
- FASE 5 (core) puede correr en paralelo con FASE 3 (HTML) y FASE 4 (CSS)
- FASE 10 (camera+input), FASE 11 (audio), FASE 12 (UI) pueden correr en paralelo entre sí después de FASE 9
- FASE 13 (components) puede correr en paralelo con FASE 14, siempre que el registro sea tolerante a orden

---

# Estimación de Tamaño

| Fase | LOC estimadas | Subagentes | Tiempo paralelo |
|------|---------------|------------|-----------------|
| 1    | ~50 (análisis) | 0 (hecho) | - |
| 2    | ~100          | 1          | rápido |
| 3    | ~200          | 1          | medio |
| 4    | ~700 (CSS)    | 2-3        | medio |
| 5    | ~400 (core)   | 1-2        | rápido |
| 6    | ~300          | 1          | rápido |
| 7    | ~900          | 2          | medio |
| 8    | ~700          | 2          | medio |
| 9    | ~800          | 2-3        | medio |
| 10   | ~500          | 1-2        | medio |
| 11   | ~500          | 1-2        | medio |
| 12   | ~1200         | 3-4        | medio-largo |
| 13   | ~400          | 1-2        | medio |
| 14   | ~150          | 1          | corto |
| 15   | ~400          | 2-3        | medio |
| 16   | ~300          | 1-2        | medio |
| **TOTAL** | **~7100** | **~30 sub-tareas** | |

---

# Asignación de Subagentes

| Subagente | Fase | Rol |
|-----------|------|-----|
| A1        | 2-3  | HTML shell |
| A2        | 4a   | CSS tokens + reset + base |
| A3        | 4b   | CSS layout |
| A4        | 4c   | CSS components |
| A5        | 5    | Core utilities (todo) |
| A6        | 6    | Render layer |
| A7        | 7a   | World logic (noise + heightmap + builders) |
| A8        | 7b   | World visuals (terrain mesh, water, ambient, goal) |
| A9        | 8a   | Snake logic |
| A10       | 8b   | Snake view + entities visuals |
| A11       | 9a   | GameState + GameLoop + StepLogic |
| A12       | 9b   | Modes + LevelManager + Scoring |
| A13       | 9c   | Death + Win + Countdown handlers |
| A14       | 10   | Camera + Input |
| A15       | 11   | Audio + Haptics |
| A16       | 12a  | HUD + PowerUpChip + Countdown UI |
| A17       | 12b  | Toasts + Popups + Modal base |
| A18       | 12c  | Modales específicos (gameover, leaderboard, settings) |
| A19       | 13   | Web Components |
| Orquestador | 14, 15, 16 | Bootstrap, tests, optim |

**Reglas:**
- Cada subagente recibe su tarea con: contexto del codebase actual, qué módulo crear, qué interfaz respetar, dónde insertar.
- Cada subagente devuelve código como texto, no escribe al archivo.
- El orquestador integra secuencialmente y valida sintaxis entre fases.
- Si un subagente reporta BLOCKED o NEEDS_CONTEXT, se re-despacha con más info.

---

# Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Pérdida de funcionalidad durante el refactor | Tests E2E (FASE 15) que comparan comportamiento |
| Cambio de orden de eventos por EventBus | La versión monolítica se mantiene como `.bak` + se puede comparar |
| Performance regression (muchos módulos = más imports) | Code splitting + dynamic imports para modos (FASE 16) |
| Three.js no carga via file:// | Mensaje claro en loader (ya hecho) + `serve.sh` (ya hecho) |
| Naming inconsistente entre subagentes | Convenciones definidas en FASE 2, validadas en cada fase |
| Tests difíciles sin browser | Tests unitarios con `node --test` (lógica pura) + smoke test con `playwright` o `puppeteer` opcional |

---

# Definition of Done (por fase)

- **FASE 1**: docs completas
- **FASE 2**: estructura existe, `main.js` carga sin errores
- **FASE 3**: HTML valida, accesibilidad AA
- **FASE 4**: CSS compila, layout idéntico al original
- **FASE 5-13**: cada módulo exporta lo esperado, sintaxis OK
- **FASE 14**: juego arranca end-to-end
- **FASE 15**: tests pasan
- **FASE 16**: perf ≤ monolito, docs completas

---

# Confirmación

✅ Planning completo, listo para ejecutar fase por fase o en paralelo.
- Las fases 2-5 pueden arrancar en paralelo entre sí (parcial)
- Las fases 10-12 son totalmente paralelas entre sí
- Cada fase tiene entregables verificables
- 0 cambios de comportamiento del juego

¿Apruebas para que empiece a despachar sub-agentes en la **FASE 2** (estructura + contratos)?
