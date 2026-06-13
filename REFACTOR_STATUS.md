# Refactor Status

> **In progress on `dev` branch** — see PRs against `main` for review.

## Completed Phases

- [x] **Phase 1** — Infrastructure (Vite, TypeScript, ESLint, Prettier)
- [x] **Phase 2** — Dead code removal (5 files)
- [x] **Phase 3** — TypeScript foundation (`allowJs`, type definitions)
- [x] **Phase 4** — God Module decomposition (GameEngine, DomRefs)
- [x] **Phase 5** — Code quality (Prettier, ESLint auto-fix)
- [x] **Phase 6** — Testing (438/438 passing)
- [x] **Phase 7** — CSS optimization (Prettier format)
- [x] **Phase 8** — DX & tooling (npm scripts)

## In Progress

- [ ] **God Module full decomposition** — migrate remaining ~900 lines of `src/main.js` into focused TS modules
- [ ] **ESLint cleanup** — fix remaining 234 lint issues (const vs let, unused vars)
- [ ] **i18n migration** — replace remaining hardcoded Spanish strings
- [ ] **Test coverage** — add tests for audio, UI components, world rendering
- [ ] **SW update** — work with Vite hashed filenames for cache invalidation

## Branch Strategy

- `main` — stable, tested, shippable
- `dev` — active refactor work, in-progress modules

## Quick Start

```bash
npm install
npm run dev      # Vite dev server on :8765
npm test         # 438 tests
npm run typecheck
npm run lint
npm run format
```
