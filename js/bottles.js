// Procedural 3D perfume bottles. Every bottle on the site is generated at
// runtime from the fragrance's record: a lathe silhouette, a juice color,
// a cap shape and a canvas-drawn label. No 3D models, no images, no
// copyrighted photography anywhere.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------- materials ----------

const METALS = {
  gold:   { color: 0xD4AF37, metalness: .95, roughness: .28 },
  silver: { color: 0xC9CDD4, metalness: .95, roughness: .22 },
  black:  { color: 0x1B1B1F, metalness: .75, roughness: .3 }
};

function metalMaterial(kind) {
  const m = METALS[kind] || METALS.silver;
  return new THREE.MeshStandardMaterial({ color: m.color, metalness: m.metalness, roughness: m.roughness });
}

function glassMaterial() {
  // near-pure transmission; the diffuse color sits mid-gray because the key
  // light fully illuminates it (envMapIntensity only limits IBL), and a bright
  // surface washes the juice and label into milk
  return new THREE.MeshPhysicalMaterial({
    color: 0xB9B9C2, metalness: 0, roughness: .1,
    transmission: .96, thickness: .35, ior: 1.45,
    clearcoat: 1, clearcoatRoughness: .08,
    attenuationColor: 0xffffff, attenuationDistance: 10,
    envMapIntensity: .18, specularIntensity: .8
  });
}

// The juice must be FULLY opaque: three.js renders transmissive materials in a
// depth-writing pass, so a transparent juice would be depth-rejected and the
// glass would only ever refract the empty buffer behind it. Opaque juice lands
// in the opaque pass, shows up in the glass's transmission buffer, and reads
// as liquid through the shell. Darkened because the glass composites over it.
function juiceMaterial(juice) {
  const c = new THREE.Color(juice).multiplyScalar(.75);
  return new THREE.MeshPhysicalMaterial({
    color: c, roughness: .35, metalness: 0,
    clearcoat: .3, clearcoatRoughness: .3, envMapIntensity: .3
  });
}

// ---------- silhouettes ----------

// control points per shape: [y, radius], bottom to top, smoothed with a spline
const SHAPES = {
  classic: [[0, .30], [.02, .58], [.35, .60], [1.30, .60], [1.62, .52], [1.82, .24], [1.95, .17], [2.02, .20]],
  flask:   [[0, .34], [.03, .62], [.45, .80], [1.05, .78], [1.50, .52], [1.72, .24], [1.84, .17], [1.92, .20]],
  column:  [[0, .26], [.02, .42], [.4, .44], [2.05, .44], [2.22, .26], [2.34, .17], [2.42, .20]],
  slab:    [[0, .30], [.02, .56], [.4, .58], [1.75, .58], [1.98, .30], [2.10, .17], [2.18, .20]],
  orb:     [[.02, .30], [.10, .62], [.45, .80], [.85, .82], [1.25, .70], [1.52, .30], [1.60, .17], [1.68, .20]]
};

function profilePoints(shape, steps = 56) {
  const pts = SHAPES[shape] || SHAPES.classic;
  const curve = new THREE.SplineCurve(pts.map(([y, r]) => new THREE.Vector2(r, y)));
  const sampled = curve.getPoints(steps);
  return [new THREE.Vector2(0.001, 0), ...sampled, new THREE.Vector2(0.16, sampled[sampled.length - 1].y)];
}

function shapeHeight(shape) {
  const pts = SHAPES[shape] || SHAPES.classic;
  return pts[pts.length - 1][0];
}

function maxRadius(shape) {
  const pts = SHAPES[shape] || SHAPES.classic;
  return Math.max(...pts.map(p => p[1]));
}

function liquidGeometry(shape, fill = .68) {
  const full = profilePoints(shape, 40);
  const top = full[full.length - 2].y;
  const limit = top * fill;
  const pts = [new THREE.Vector2(0.001, .04)];
  for (const p of full) { if (p.y >= .04 && p.y <= limit) pts.push(new THREE.Vector2(Math.max(.05, p.x * .88), p.y)); }
  pts.push(new THREE.Vector2(Math.max(.05, (pts[pts.length - 1].x) || .05), limit));
  pts.push(new THREE.Vector2(0.001, limit));
  return new THREE.LatheGeometry(pts, 48);
}

// ---------- label ----------

function labelTexture(frag, familyLabel) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 368;
  const g = c.getContext('2d');
  g.fillStyle = '#F3EFE6'; g.fillRect(0, 0, 512, 368);
  g.strokeStyle = '#B4A88E'; g.lineWidth = 4; g.strokeRect(14, 14, 484, 340);
  g.fillStyle = '#1D1D1F';
  g.textAlign = 'center';
  g.font = '500 26px -apple-system, "Segoe UI", Roboto, sans-serif';
  spaced(g, frag.house.toUpperCase(), 256, 96, 7);
  g.fillStyle = frag.bottle.juice;
  g.fillRect(216, 128, 80, 6);
  g.fillStyle = '#1D1D1F';
  g.font = '700 52px Georgia, "Times New Roman", serif';
  const name = frag.name.toUpperCase();
  if (g.measureText(name).width > 430) g.font = '700 38px Georgia, "Times New Roman", serif';
  g.fillText(name, 256, 214, 430);
  g.fillStyle = '#6E6858';
  g.font = '500 23px -apple-system, "Segoe UI", Roboto, sans-serif';
  spaced(g, familyLabel.toUpperCase(), 256, 286, 6);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function spaced(g, text, cx, y, gap) {
  let widths = [...text].map(ch => g.measureText(ch).width);
  let total = widths.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
  let x = cx - total / 2;
  [...text].forEach((ch, i) => { g.fillText(ch, x + widths[i] / 2, y); x += widths[i] + gap; });
}

// ---------- bottle assembly ----------

function capMesh(cap, metal) {
  const mat = metalMaterial(metal);
  switch (cap) {
    case 'column': return new THREE.Mesh(new THREE.CylinderGeometry(.20, .21, .60, 48), mat);
    case 'sphere': { const m = new THREE.Mesh(new THREE.SphereGeometry(.27, 40, 28), mat); m.scale.y = .82; return m; }
    case 'cone': return new THREE.Mesh(new THREE.ConeGeometry(.30, .48, 48), mat);
    case 'puck':
    default: return new THREE.Mesh(new THREE.CylinderGeometry(.27, .29, .26, 48), mat);
  }
}

// cap half-heights, matching capMesh geometry (boundingSphere is null pre-render)
const CAP_HALF = { puck: .13, column: .30, sphere: .22, cone: .24 };

export function buildBottle(frag) {
  const group = new THREE.Group();
  const familyLabel = (Object.entries(frag.mix).sort((a, b) => b[1] - a[1])[0] || [])[0];
  const famKey = familyLabel || 'citrus';
  const juice = frag.bottle.juice;
  const shape = frag.bottle.shape;
  const H = shapeHeight(shape);
  const body = new THREE.Group();

  const shell = new THREE.Mesh(new THREE.LatheGeometry(profilePoints(shape), 72), glassMaterial());
  shell.castShadow = true;
  body.add(shell);

  const juiceMesh = new THREE.Mesh(liquidGeometry(shape), juiceMaterial(juice));
  body.add(juiceMesh);

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(maxRadius(shape) + (shape === 'orb' ? .028 : .008),
      maxRadius(shape) + (shape === 'orb' ? .028 : .008), .34, 48, 1, true, -0.55, 1.1),
    new THREE.MeshBasicMaterial({ map: labelTexture(frag, famKey) })
  );
  // orb bottles are widest mid-belly; pin the label there so it doesn't clip
  label.position.y = shape === 'orb' ? .85 : H * .42;
  body.add(label);

  if (shape === 'slab') body.scale.x = .62;

  const neckY = H;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.19, .21, .12, 32), metalMaterial(frag.bottle.metal));
  collar.position.y = neckY + .04;
  group.add(body, collar);

  const cap = capMesh(frag.bottle.cap, frag.bottle.metal);
  cap.position.y = neckY + .12 + (CAP_HALF[frag.bottle.cap] ?? .2);
  cap.castShadow = true;
  group.add(cap);

  return group;
}

export function disposeGroup(group) {
  group.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.map) m.map.dispose();
        m.dispose();
      }
    }
  });
}

// ---------- in-scene backdrop for the live viewer ----------
// gives the glass head something real to refract (an empty transmission
// buffer renders as flat white). Themed, unlike the transparent snapshots.

function backdropTexture(dark) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  if (dark) {
    grad.addColorStop(0, '#141418'); grad.addColorStop(1, '#1F1F26');
  } else {
    grad.addColorStop(0, '#F6F6F9'); grad.addColorStop(1, '#E4E4EE');
  }
  g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
  const glow = g.createRadialGradient(256, 340, 40, 256, 340, 300);
  glow.addColorStop(0, dark ? 'rgba(140,150,190,.14)' : 'rgba(255,255,255,.85)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = glow; g.fillRect(0, 0, 512, 512);
  // fade all four edges out so the plane blends into the page
  const fade = g.createRadialGradient(256, 256, 60, 256, 256, 298);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = fade; g.fillRect(0, 0, 512, 512);
  g.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function backdropPlane() {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 16),
    new THREE.MeshBasicMaterial({ map: backdropTexture(false), transparent: true, depthWrite: false })
  );
  mesh.position.set(0, 1.4, -4.5);
  mesh.renderOrder = -1;
  return mesh;
}

// ---------- shared scene dressing ----------

function dressScene(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(2.6, 4.2, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 8;
  key.shadow.camera.left = -2.5; key.shadow.camera.right = 2.5;
  key.shadow.camera.top = 4.5; key.shadow.camera.bottom = -1;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xBFD8FF, .9);
  rim.position.set(-3, 2.5, -2.5);
  scene.add(rim);

  const shadowPlane = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 48),
    new THREE.ShadowMaterial({ opacity: .16 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);
}

function applyRendererDefaults(renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

// ---------- live viewer (hero) ----------

export class BottleViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    applyRendererDefaults(this.renderer);
    this.scene = new THREE.Scene();
    dressScene(this.scene, this.renderer);
    this.camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
    this.camera.position.set(0, 2.0, 5.6);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 1.15, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .06;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.4;
    this.controls.maxDistance = 8.5;
    this.controls.minPolarAngle = .5;
    this.controls.maxPolarAngle = 1.42;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.1;

    this.group = null;
    this.bornAt = 0;
    this.clock = new THREE.Clock();
    this.raf = 0;
    this.backdrop = backdropPlane();
    this.scene.add(this.backdrop);
    this.setBackdrop(document.documentElement.dataset.theme === 'dark');
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    this.raf = requestAnimationFrame(this.loop);
    window.addEventListener('resize', this.resize);
  }

  setBackdrop(dark) {
    this.backdrop.material.map.dispose();
    this.backdrop.material.map = backdropTexture(dark);
    this.backdrop.material.needsUpdate = true;
  }

  setFrag(frag) {
    if (this.group) { this.scene.remove(this.group); disposeGroup(this.group); }
    this.group = buildBottle(frag);
    this.scene.add(this.group);
    this.bornAt = performance.now();
  }

  setAutoRotate(on) { this.controls.autoRotate = on; }

  resize() {
    const w = this.canvas.clientWidth || this.canvas.parentElement.clientWidth;
    const h = this.canvas.clientHeight || 420;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  loop() {
    this.raf = requestAnimationFrame(this.loop);
    if (this.group) {
      const k = Math.min(1, (performance.now() - this.bornAt) / 650);
      const e = 1 - Math.pow(1 - k, 3);
      const s = .86 + .14 * e;
      this.group.scale.setScalar(s);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    if (this.group) disposeGroup(this.group);
    this.controls.dispose();
    this.renderer.dispose();
  }
}

// ---------- static snapshots (runner-up cards + shelf) ----------

let snap = null;

function getSnapRig() {
  if (snap) return snap;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  applyRendererDefaults(renderer);
  const scene = new THREE.Scene();
  dressScene(scene, renderer);
  const camera = new THREE.PerspectiveCamera(34, .8, .1, 40);
  camera.position.set(0, 2.0, 5.6);
  camera.lookAt(0, 1.15, 0);
  snap = { renderer, scene, camera };
  return snap;
}

const snapCache = new Map();

export function snapshotBottle(frag, width = 420) {
  const key = `${frag.id}:${width}`;
  if (snapCache.has(key)) return snapCache.get(key);
  const { renderer, scene, camera } = getSnapRig();
  const group = buildBottle(frag);
  scene.add(group);
  const h = Math.round(width * 1.25);
  renderer.setSize(width, h, false);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(group);
  disposeGroup(group);
  snapCache.set(key, url);
  return url;
}
