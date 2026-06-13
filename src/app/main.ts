/**
 * @fileoverview New TypeScript entry point. Acts as a thin orchestrator that
 * imports the existing main.js (which is still the working bootstrap) and
 * prepares the ground for gradual migration to TypeScript.
 *
 * In future iterations, this file will absorb the responsibilities currently
 * held by src/main.js once the decomposition is complete.
 */

// Re-export the working bootstrap. This file exists as the TypeScript entry
// point for tooling (tsc, Vite, ESLint) and will incrementally replace
// src/main.js as modules are migrated.
import '../main.js';

// Side-effect imports for new TypeScript modules
export { createGameEngine } from './game-engine.js';
export { lookupDomRefs } from './dom-refs.js';
export type { GameStateRefs, EngineDeps, GameEngine } from './game-engine.js';
export type { DomRefs } from './dom-refs.js';
