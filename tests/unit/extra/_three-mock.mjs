// tests/unit/extra/_three-mock.mjs
// Minimal stand-in for the real `three` package. Implements the subset
// used by the source modules tested here:
//   - Vector3 (CameraMath.js)
//   - Color   (core/Color.js)
//
// Vector3 surface used by src/camera/CameraMath.js:
//   - Vector3 constructor (x, y, z)
//   - Vector3#clone
//   - Vector3#add
//   - Vector3#multiplyScalar
//   - Vector3#normalize
//   - Vector3#set
//   - Vector3#lengthSq
// Methods return `this` where the real API does, to mimic chaining.

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }
  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }
  normalize() {
    const l = Math.hypot(this.x, this.y, this.z) || 1;
    this.x /= l;
    this.y /= l;
    this.z /= l;
    return this;
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
}

// Color surface used by src/core/Color.js:
//   - new Color(hex)            — hex is a 0xRRGGBB number
//   - .r, .g, .b               — numeric channels in [0, 1]
//   - .clone()                 — returns a new Color with same channels
//   - .lerpColors(a, b, t)     — instance method, mutates and returns this
export class Color {
  constructor(hex = 0) {
    if (typeof hex === 'number') {
      this.r = ((hex >> 16) & 0xff) / 255;
      this.g = ((hex >> 8) & 0xff) / 255;
      this.b = (hex & 0xff) / 255;
    } else {
      this.r = 0;
      this.g = 0;
      this.b = 0;
    }
  }
  clone() {
    const c = new Color();
    c.r = this.r;
    c.g = this.g;
    c.b = this.b;
    return c;
  }
  lerpColors(a, b, t) {
    this.r = a.r + (b.r - a.r) * t;
    this.g = a.g + (b.g - a.g) * t;
    this.b = a.b + (b.b - a.b) * t;
    return this;
  }
}
