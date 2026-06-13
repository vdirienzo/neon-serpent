# Plan: NEØN SERPENT — Rework SOTA completo

**Archivo único:** `/home/user/Projects/_test/opensake/neon-serpent.html` (2512 líneas)
**Estrategia:** Foundation propia (terreno) + features aditivos en paralelo.

---

## FASE 0 — Setup (sync)
- [ ] Crear backup
- [ ] Crear PLAN.md (este doc)
- [ ] Crear lista de TODOs

---

## FASE 1 — Foundation: Terreno con relieve (1 agente, secuencial, profundo)
Toca múltiples secciones del archivo. Lo hace el orquestador.

- [ ] 1.1 Utilidades de ruido (FBM, value noise, hash2D)
- [ ] 1.2 `buildTerrainIsland()` + `buildBridge()` + `findNearestSolid()`
- [ ] 1.3 Update `isSolid()` para que use `y > Y_WATER`
- [ ] 1.4 Update `step()` con regla de `STEP_CLIMB`
- [ ] 1.5 Reemplazar `voidPlane` por water plane emisivo
- [ ] 1.6 Peak mesh decoration en `buildLevelVisuals()`
- [ ] 1.7 Contour lines (marching squares 1D, BufferGeometry batch)
- [ ] 1.8 Partículas ambientales (niebla de valle + chispas de pico)
- [ ] 1.9 Camera Y focus dinámico
- [ ] 1.10 Reescribir `buildLevel1()` a `buildLevel5()` con terreno procedural

## FASE 2 — Bug fixes & quick wins (paralelo, 4 subagentes)
Cada subagente edita un área no superpuesta del archivo.

- [ ] 2.1 **Bug #1**: `loadLevel.lastN` undefined en toast (l.2039)
- [ ] 2.2 **Bug #2**: `goalBeacon` hardcoded a (15,15) (l.2225)
- [ ] 2.3 **Bug #3**: `lastGoal` default hardcoded (l.685)
- [ ] 2.4 **Bug #4**: Spawn inseguro si celda no es sólida (l.1971)
- [ ] 2.5 **Haptics** mobile (5 puntos: eat, level-up, die, climb, pickup-bonus)
- [ ] 2.6 **HUD chip de power-up** activo (speed/slow)

## FASE 3 — Onboarding (paralelo, 2 subagentes)
- [ ] 3.1 **Countdown 3-2-1** antes de empezar nivel + invulnerabilidad 1.5s con escudo
- [ ] 3.2 **Ghost trail** de 2s al spawn (siguiente movimiento sugerido)
- [ ] 3.3 **HUD: longitud de serpiente** + combo multiplier
- [ ] 3.4 **Indicador de causa de muerte** en game over

## FASE 4 — Game feel (paralelo, 2 subagentes)
- [ ] 4.1 **Snake lean** anticipado + squash/stretch en giro y pickup
- [ ] 4.2 **Trail ribbon** detrás de la cabeza (quads o MeshLine)
- [ ] 4.3 **Audio adaptativo**: layers según `snake.length` y proximidad a goal
- [ ] 4.4 **Sub-bass rumble** en base al multiplicador

## FASE 5 — Meta-game & progresión (paralelo, 2 subagentes)
- [ ] 5.1 **Per-sector best score** + leaderboard local top 10
- [ ] 5.2 **Skins** desbloqueables (5-6 paletas alternativas)
- [ ] 5.3 **Achievements** (10-15) con notificaciones
- [ ] 5.4 **Stats screen** (partidas, comida, longest, tiempo)

## FASE 6 — Accessibility (paralelo, 1-2 subagentes)
- [ ] 6.1 **Color blind mode** (3 paletas)
- [ ] 6.2 **Reduced motion** (toggle global)
- [ ] 6.3 **D-pad on screen** (botones táctiles)
- [ ] 6.4 **Slow mode global** (multiplicador 0.7x permanente)
- [ ] 6.5 **Large text** (toggle HUD)

## FASE 7 — Settings & modos (paralelo, 2 subagentes)
- [ ] 7.1 **Settings menu** (audio categories, accessibility, controles)
- [ ] 7.2 **TIME ATTACK** mode (60s, score máximo)
- [ ] 7.3 **SURVIVAL** mode (tablero se reduce cada 10s)
- [ ] 7.4 **DAILY SEED** mode (nivel procedural + seed del día)

## FASE 8 — Social & polish (secuencial, 1 subagente)
- [ ] 8.1 **Share score** (clipboard formateado)
- [ ] 8.2 **Replay** (buffer 1000 posiciones, botón en game over)
- [ ] 8.3 **Adaptive music layers** (bass drop en long snake)

---

## Reglas de dispatch

### Subagentes en paralelo (Fase 2-7)
- Cada subagente recibe una tarea AISLADA
- Devuelve **código como bloque de texto** (no escribe al archivo)
- Especifica: dónde insertar, line numbers o marcadores
- Si dos subagentes tocan la misma sección, son SECUENCIALES no paralelos

### El orquestador (yo)
- Integra los bloques de código con Edit
- Resuelve conflictos de orden
- Verifica la integridad del archivo entre fases

### Verificación
- Después de cada fase: leer el archivo y validar sintaxis básica
- Si es posible: `node -c` o equivalente para validar JS embebido
- Commit conceptual al final de cada fase (registro en plan)

---

## Riesgos

1. **Tamaño del archivo**: 2512 líneas → ~3500 después. Manejable.
2. **Conflictos de merge**: minimizados por diseño de tareas aisladas
3. **Performance**: validar que no baje FPS
4. **Compatibilidad de constantes**: cualquier constante nueva debe ser usada consistentemente

## Definition of Done

- Todas las fases marcadas
- Archivo compila sin errores de sintaxis
- Sin bugs de los listados en FASE 2
- Sin regresiones: lo que ya funcionaba sigue funcionando
