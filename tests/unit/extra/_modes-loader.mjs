// tests/unit/extra/_modes-loader.mjs
// Custom Node.js loader that stubs the `three` package (not installed in
// this no-npm project). StepLogic.js → core/Color.js → import * as THREE
// from 'three' needs to resolve to something. We provide a minimal Color
// class so module loading does not fail in a Node test environment.
//
// IMPORTANT: this loader must be `await register(...)`-ed BEFORE any
// import (static or dynamic) of src/game/* or anything that loads
// Color.js.

const THREE_STUB = `
class Color {
  constructor(v) { this.value = v; this.r = 0; this.g = 0; this.b = 0; }
  clone() { return new Color(this.value); }
  lerpColors() { return this; }
  set() { return this; }
  getHex() { return this.value || 0; }
  copy() { return this; }
  multiplyScalar() { return this; }
}
export { Color };
export default { Color };
`;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'three') {
    return {
      url: 'test-stub:three',
      shortCircuit: true,
      format: 'module'
    };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url === 'test-stub:three') {
    return {
      format: 'module',
      source: THREE_STUB,
      shortCircuit: true
    };
  }
  return nextLoad(url, context);
}
