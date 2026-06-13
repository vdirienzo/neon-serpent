# Contributing to NEØN SERPENT

Thank you for your interest in contributing! This is a 3D browser game
written in vanilla TypeScript with Three.js. Contributions of all kinds
are welcome: bug reports, features, docs, tests, performance work.

## Quick Links

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Architecture](#architecture)
- [Testing](#testing)
- [Style Guide](#style-guide)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/).
By participating, you agree to uphold this code. Report unacceptable behavior
to the maintainers.

## Development Setup

### Prerequisites

- **Node.js** ≥ 18 (use the pinned version in `.nvmrc`)
- **npm** ≥ 9
- A modern browser with WebGL2 (Chrome 90+, Firefox 88+, Safari 15+)

### First-time setup

```bash
git clone https://github.com/vdirienzo/neon-serpent.git
cd neon-serpent
nvm use          # or: nvm install (reads .nvmrc)
npm install
npm run dev      # http://localhost:8765
```

### Recommended editor

VS Code with extensions:
- ESLint
- Prettier
- EditorConfig
- TypeScript Vue Plugin (Volar)

`.vscode/settings.json` ships with sensible defaults.

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full architecture map.

**TL;DR**: Feature-sliced design adapted for a 3D game.

```
src/
├── app/         # Entry point, bootstrap, composition root
├── config/      # Frozen constants, type definitions
├── core/        # Framework-agnostic utilities (EventBus, Store, Math, i18n)
├── engine/      # Rendering, audio, input, camera subsystems
├── game/        # State machine, step logic, entities, world
├── ui/          # HUD, modals, effects, web components
└── styles/      # Vanilla CSS with custom properties and container queries
```

### Key principles

1. **Pure ES modules, no build step required** for the runtime
2. **Vite for dev** (HMR, TypeScript, code splitting)
3. **TypeScript strict** for new code; `allowJs: true` for gradual migration
4. **EventBus** for cross-module communication
5. **Frozen constants** — never mutate config at runtime
6. **Zero runtime deps** for the game itself (Three.js via CDN)

## Testing

```bash
npm test                # Run all tests once
npm run test:watch      # Watch mode (vitest)
npm run test:coverage   # With V8 coverage
```

- **Framework**: Node's built-in `node:test` for existing tests, Vitest for new TypeScript tests
- **Location**: `tests/unit/`, `tests/integration/`, `tests/dom/`, `tests/three/`
- **Style**: arrange-act-assert, descriptive names
- **Coverage target**: 70% (enforced in `vitest.config.ts`)

### Writing a new test

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/core/my-module.js';

describe('myFunction', () => {
  it('returns the expected value for valid input', () => {
    expect(myFunction(42)).toBe(42);
  });

  it('throws on invalid input', () => {
    expect(() => myFunction(-1)).toThrow();
  });
});
```

## Style Guide

- **TypeScript strict** for all new code (`tsconfig.json` enforces this)
- **Prettier** handles formatting (run `npm run format`)
- **ESLint** catches bugs and style issues
- **No magic numbers** — extract to `src/config/constants.ts`
- **Frozen objects** for config: `export const FOO = Object.freeze({...});`
- **JSDoc** on all public APIs
- **No comments unless asked** (project rule from maintainer)

### Commit message convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

Examples:
- `feat(game): add shield power-up`
- `fix(render): correct water refraction on iOS`
- `perf(input): throttle pointer events to 60Hz`
- `docs(readme): add deployment section`

## Pull Request Process

1. **Fork** the repo and create a branch from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/your-feature
   ```

2. **Make your changes** following the style guide

3. **Add tests** for new functionality (target 70% coverage)

4. **Verify all checks pass**:
   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm test
   npm run build
   ```

5. **Commit** with a conventional commit message

6. **Push** and open a PR against `dev` (not `main`)

7. **Fill in the PR template** completely

8. **Wait for CI** — all 5 quality gates must pass

9. **Address review feedback** — we use CODEOWNERS for auto-assignment

10. **Squash and merge** once approved

## Release Process

We use [semantic-release](https://github.com/semantic-release/semantic-release)
for automated versioning:

- `feat:` → minor bump (1.x.0)
- `fix:` → patch bump (1.0.x)
- `BREAKING CHANGE:` → major bump (x.0.0)

Releases are triggered automatically on push to `main` via `.github/workflows/release.yml`.

## Performance Budget

- **Bundle size**: < 200KB gzipped (excluding Three.js)
- **First paint**: < 1s on 3G
- **Frame rate**: 60fps on mid-range mobile
- **Memory**: < 50MB heap

## Accessibility

We follow WCAG 2.2 AA. Every PR should consider:
- Keyboard navigation
- Screen reader labels
- Color contrast (4.5:1 minimum)
- `prefers-reduced-motion` support
- Color-blind modes (3 palettes shipped)

See [`docs/ACCESSIBILITY.md`](./docs/ACCESSIBILITY.md).

## Questions?

- 💬 Open a [GitHub Discussion](https://github.com/vdirienzo/neon-serpent/discussions)
- 🐛 File a [Bug Report](https://github.com/vdirienzo/neon-serpent/issues/new?template=bug_report.md)
- ✨ Request a [Feature](https://github.com/vdirienzo/neon-serpent/issues/new?template=feature_request.md)
- 📧 Email: maintainers@[domain]

## License

By contributing, you agree that your contributions will be licensed under
the [MIT License](./LICENSE).
