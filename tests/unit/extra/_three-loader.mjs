// tests/unit/extra/_three-loader.mjs
// Module loader hook: when something tries to `import ... from 'three'`,
// resolve it to our minimal in-memory mock instead of failing.
// Used by tests that need to load source modules that depend on three.js
// (e.g. src/camera/CameraMath.js) without installing the real package.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'three') {
    return {
      url: new URL('./_three-mock.mjs', import.meta.url).href,
      shortCircuit: true
    };
  }
  return nextResolve(specifier, context);
}
