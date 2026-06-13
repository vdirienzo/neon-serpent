// tests/smoke/boot.test.js
// Smoke test: verify the bundled main.js doesn't have obvious syntax errors
// and all imports resolve to files that exist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../../', import.meta.url).pathname);
const SRC = path.join(ROOT, 'src');

test('All src files exist', () => {
  const count = countFiles(SRC, '.js');
  assert.ok(count > 50, `expected 50+ files, got ${count}`);
});

test('main.js exists and imports from src/core', () => {
  const main = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  assert.match(main, /import.*core\/EventBus/);
  assert.match(main, /import.*core\/Store/);
  assert.match(main, /import.*render\/Renderer/);
  assert.match(main, /import.*world\/HeightMap/);
  assert.match(main, /import.*entities\/Snake/);
  // GameLoop may be imported OR inlined as function loop() — both are valid
  const hasGameLoop = /import.*game\/GameLoop/.test(main) || /function\s+loop\s*\(/.test(main);
  assert.ok(hasGameLoop, 'expected GameLoop import or inline loop() function');
});

test('Every imported file exists', () => {
  const allJs = collectAllJs(SRC);
  for (const f of allJs) {
    const imports = extractImports(f);
    for (const imp of imports) {
      if (imp.startsWith('.')) {
        const resolved = resolveImport(f, imp);
        assert.ok(fs.existsSync(resolved), `broken import in ${f}: ${imp} -> ${resolved}`);
      }
    }
  }
});

test('CSS files exist and main.css imports all partials', () => {
  const mainCss = fs.readFileSync(path.join(SRC, 'styles/main.css'), 'utf8');
  for (const partial of ['tokens', 'reset', 'base', 'layout/loader', 'layout/hud', 'fx/crt']) {
    assert.match(mainCss, new RegExp(partial));
  }
  // All referenced files exist
  for (const partial of [
    'tokens.css',
    'reset.css',
    'base.css',
    'layout/loader.css',
    'layout/hud.css',
    'fx/crt.css',
  ]) {
    const p = path.join(SRC, 'styles', partial);
    assert.ok(fs.existsSync(p), `missing CSS: ${p}`);
  }
});

test('index.html exists and is semantic', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /<main[^>]+id="game"/);
  assert.match(html, /<header[^>]+id="title-screen"/);
  assert.match(html, /<nav[^>]+id="hud-br"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /<noscript>/);
  assert.match(html, /type="module"/);
});

function countFiles(dir, ext) {
  let n = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) n += countFiles(p, ext);
    else if (f.endsWith(ext)) n++;
  }
  return n;
}

function collectAllJs(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) out.push(...collectAllJs(p));
    else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}

function extractImports(file) {
  const code = fs.readFileSync(file, 'utf8');
  const matches = [...code.matchAll(/import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g)];
  return matches.map((m) => m[1]);
}

function resolveImport(fromFile, spec) {
  const dir = path.dirname(fromFile);
  let p = path.resolve(dir, spec);
  if (!p.endsWith('.js') && fs.existsSync(p + '.js')) p = p + '.js';
  else if (!p.endsWith('.js') && fs.existsSync(path.join(p, 'index.js')))
    p = path.join(p, 'index.js');
  return p;
}
