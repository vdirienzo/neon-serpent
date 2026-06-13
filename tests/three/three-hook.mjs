// tests/three/three-hook.mjs
// Resolver hook that maps bare `three` imports to the local stub. Used by the
// three/*.test.js files via `register('./three-hook.mjs', import.meta.url)`.

export function resolve(specifier, context, nextResolve) {
  if (specifier === 'three') {
    return {
      url: new URL('./three-stub.js', import.meta.url).href,
      shortCircuit: true,
      format: 'module'
    };
  }
  return nextResolve(specifier, context);
}
