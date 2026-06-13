// tests/three/three-stub.js
// Minimal THREE.js stub used by the three-loader hook. Covers only the
// surface exercised by src/render/Lighting, Scene, Background, Popups and
// anything they import.

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.isVector3 = true;
  }
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
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
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  distanceTo(v) {
    return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  lerp(v, t) {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    this.z += (v.z - this.z) * t;
    return this;
  }
  applyQuaternion() {
    return this;
  }
  project(camera) {
    return this;
  }
  unproject() {
    return this;
  }
}

export class Color {
  constructor(v) {
    this.isColor = true;
    if (typeof v === 'number') this.setHex(v);
    else if (v && typeof v === 'object') this.copyFrom(v);
    else {
      this.r = 0;
      this.g = 0;
      this.b = 0;
    }
  }
  clone() {
    const c = new Color();
    c.copyFrom(this);
    return c;
  }
  copyFrom(c) {
    this.r = c.r;
    this.g = c.g;
    this.b = c.b;
    return this;
  }
  setRGB(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }
  setHex(h) {
    this.r = ((h >> 16) & 0xff) / 255;
    this.g = ((h >> 8) & 0xff) / 255;
    this.b = (h & 0xff) / 255;
    return this;
  }
  getHex() {
    return (((this.r * 255) | 0) << 16) | (((this.g * 255) | 0) << 8) | ((this.b * 255) | 0);
  }
  lerpColors(a, b, t) {
    return this.setRGB(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
  }
  multiplyScalar(s) {
    this.r *= s;
    this.g *= s;
    this.b *= s;
    return this;
  }
  offsetHSL() {
    return this;
  }
}

export class FogExp2 {
  constructor(c, d) {
    this.color = new Color(c);
    this.density = d;
    this.isFog = true;
  }
}

export class Scene {
  constructor() {
    this.children = [];
    this.background = null;
    this.fog = null;
    this.isScene = true;
  }
  add(o) {
    this.children.push(o);
    o && (o.parent = this);
    return o;
  }
  remove(o) {
    const i = this.children.indexOf(o);
    if (i >= 0) {
      this.children.splice(i, 1);
      if (o) o.parent = null;
    }
    return o;
  }
  traverse(fn) {
    for (const c of this.children) {
      fn(c);
      if (c.children) c.traverse(fn);
    }
  }
}

export class PerspectiveCamera {
  constructor(fov = 50, aspect = 1, near = 0.1, far = 1000) {
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.position = new Vector3();
    this.rotation = { x: 0, y: 0, z: 0 };
    this.userData = {};
    this.isCamera = true;
  }
  lookAt() {}
  updateProjectionMatrix() {}
}

export class AmbientLight {
  constructor(c, i) {
    this.color = new Color(c);
    this.intensity = i == null ? 1 : i;
    this.position = new Vector3();
    this.isLight = true;
  }
}

export class PointLight {
  constructor(c, i, d, decay) {
    this.color = new Color(c);
    this.intensity = i == null ? 1 : i;
    this.distance = d;
    this.decay = decay;
    this.position = new Vector3();
    this.isLight = true;
  }
}

export class DirectionalLight {
  constructor(c, i) {
    this.color = new Color(c);
    this.intensity = i == null ? 1 : i;
    this.position = new Vector3();
    this.isLight = true;
    this.target = { position: new Vector3() };
  }
}

export class Group {
  constructor() {
    this.children = [];
    this.position = new Vector3();
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = new Vector3(1, 1, 1);
    this.userData = {};
  }
  add(o) {
    this.children.push(o);
    o && (o.parent = this);
    return o;
  }
  remove(o) {
    const i = this.children.indexOf(o);
    if (i >= 0) {
      this.children.splice(i, 1);
      if (o) o.parent = null;
    }
    return o;
  }
  traverse(fn) {
    for (const c of this.children) {
      fn(c);
      if (c.children) c.children.forEach((cc) => cc.traverse && cc.traverse(fn));
    }
  }
}

export class Mesh {
  constructor(geo, mat) {
    this.geometry = geo;
    this.material = mat;
    this.position = new Vector3();
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = new Vector3(1, 1, 1);
    this.visible = true;
    this.userData = {};
    this.parent = null;
    this.isMesh = true;
  }
}

export class Sprite {
  constructor(mat) {
    this.material = mat;
    this.position = new Vector3();
    this.scale = new Vector3(1, 1, 1);
    this.rotation = 0;
    this.parent = null;
    this.isSprite = true;
  }
}

export class Points {
  constructor(geo, mat) {
    this.geometry = geo;
    this.material = mat;
    this.parent = null;
    this.isPoints = true;
    this.rotation = { x: 0, y: 0, z: 0 };
    this.position = new Vector3();
    this.scale = new Vector3(1, 1, 1);
  }
}

export class BufferGeometry {
  constructor() {
    this.attributes = {};
    this.index = null;
    this.boundingSphere = null;
  }
  setAttribute(name, attr) {
    this.attributes[name] = attr;
    return this;
  }
  getAttribute(name) {
    return this.attributes[name] || null;
  }
  setIndex(idx) {
    this.index = idx;
    return this;
  }
  dispose() {}
}

export class BufferAttribute {
  constructor(array, itemSize) {
    this.array = array;
    this.itemSize = itemSize;
    this.count = array.length / itemSize;
    this.needsUpdate = false;
  }
}

export class PlaneGeometry extends BufferGeometry {
  constructor(w = 1, h = 1, ws = 1, hs = 1) {
    super();
    const verts = (ws + 1) * (hs + 1);
    this.attributes.position = new BufferAttribute(new Float32Array(verts * 3), 3);
  }
}

export class BoxGeometry extends BufferGeometry {
  constructor() {
    super();
    this.attributes.position = new BufferAttribute(new Float32Array(24), 3);
  }
}

export class SphereGeometry extends BufferGeometry {
  constructor() {
    super();
    this.attributes.position = new BufferAttribute(new Float32Array(0), 3);
  }
}

export class CylinderGeometry extends BufferGeometry {
  constructor() {
    super();
    this.attributes.position = new BufferAttribute(new Float32Array(0), 3);
  }
}

export class TorusGeometry extends BufferGeometry {
  constructor() {
    super();
    this.attributes.position = new BufferAttribute(new Float32Array(0), 3);
  }
}

export class PointsMaterial {
  constructor(opts = {}) {
    this.size = opts.size ?? 1;
    this.sizeAttenuation = !!opts.sizeAttenuation;
    this.vertexColors = !!opts.vertexColors;
    this.transparent = !!opts.transparent;
    this.opacity = opts.opacity == null ? 1 : opts.opacity;
    this.depthWrite = opts.depthWrite !== false;
    this.blending = opts.blending ?? 0;
    this.color = new Color(opts.color ?? 0xffffff);
  }
}

export class SpriteMaterial {
  constructor(opts = {}) {
    this.map = opts.map || null;
    this.transparent = !!opts.transparent;
    this.opacity = opts.opacity == null ? 1 : opts.opacity;
    this.depthWrite = opts.depthWrite !== false;
    this.blending = opts.blending ?? 0;
    this.color = new Color(opts.color ?? 0xffffff);
  }
}

export class MeshStandardMaterial {
  constructor(opts = {}) {
    Object.assign(this, opts);
    this.color = new Color(opts.color ?? 0xffffff);
    this.emissive = new Color(opts.emissive ?? 0);
    this.opacity = opts.opacity == null ? 1 : opts.opacity;
    this.transparent = !!opts.transparent;
    this.metalness = opts.metalness ?? 0;
    this.roughness = opts.roughness ?? 1;
    this.side = opts.side ?? 0;
  }
}

export class MeshBasicMaterial {
  constructor(opts = {}) {
    Object.assign(this, opts);
    this.color = new Color(opts.color ?? 0xffffff);
    this.opacity = opts.opacity == null ? 1 : opts.opacity;
    this.transparent = !!opts.transparent;
    this.side = opts.side ?? 0;
  }
}

export class MeshPhongMaterial extends MeshStandardMaterial {}

export class Texture {
  constructor() {
    this.image = null;
    this.colorSpace = 'srgb';
    this.needsUpdate = false;
  }
  dispose() {}
}

export class CanvasTexture extends Texture {
  constructor(canvas) {
    super();
    this.image = canvas;
    this.needsUpdate = true;
  }
}

export class DataTexture extends Texture {
  constructor(data, w, h) {
    super();
    this.image = { data, width: w, height: h };
  }
}

export class Raycaster {
  constructor() {
    this.params = {};
    this.ray = { origin: new Vector3(), direction: new Vector3() };
  }
  setFromCamera() {}
  intersectObjects() {
    return [];
  }
}

export const SRGBColorSpace = 'srgb';
export const LinearSRGBColorSpace = 'srgb-linear';
export const NoToneMapping = 0;
export const ACESFilmicToneMapping = 1;
export const ReinhardToneMapping = 2;
export const CineonToneMapping = 3;
export const DoubleSide = 2;
export const FrontSide = 0;
export const BackSide = 1;
export const AdditiveBlending = 3;
export const NormalBlending = 4;
export const SubtractiveBlending = 5;

export default {
  Vector3,
  Color,
  FogExp2,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  PointLight,
  DirectionalLight,
  Group,
  Mesh,
  Sprite,
  Points,
  BufferGeometry,
  BufferAttribute,
  PlaneGeometry,
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  TorusGeometry,
  PointsMaterial,
  SpriteMaterial,
  MeshStandardMaterial,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Texture,
  CanvasTexture,
  DataTexture,
  Raycaster,
  SRGBColorSpace,
  LinearSRGBColorSpace,
  NoToneMapping,
  ACESFilmicToneMapping,
  ReinhardToneMapping,
  CineonToneMapping,
  DoubleSide,
  FrontSide,
  BackSide,
  AdditiveBlending,
  NormalBlending,
  SubtractiveBlending,
};
