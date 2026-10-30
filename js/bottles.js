// Procedural 3D perfume bottles. Every bottle is generated at runtime from a
// per-fragrance design spec (DESIGNS in data.js) that echoes the real bottle:
// Le Male's torso, Angel's faceted star, 1 Million's gold ingot, Sauvage's
// gradient column, Black Opium's speckled black glass, No.5's white plate.
// No 3D models, no images, no copyrighted photography anywhere.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DESIGNS } from './data.js';

// ---------- materials ----------

function metalMaterial(color) {
  const c = { gold: 0xD4AF37, silver: 0xC9CDD4, black: 0x1B1B1F, white: 0xF2F0EA, pearl: 0xE8E4DE, navy: 0x2A3E5E, red: 0xB8202E }[color] || 0xC9CDD4;
  const matte = color === 'white' || color === 'pearl';
  return new THREE.MeshStandardMaterial({ color: c, metalness: matte ? .35 : .95, roughness: matte ? .38 : .24 });
}

// transmissive glass; tinted bottles carry their color on the shell with
// reduced transmission, opaque ones are solid (porcelain, ink blocks, ingots)
function glassMaterial(d) {
  const finish = d.glass || 'clear';
  if (finish === 'opaque') {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(d.color || 0xEDEDF0), roughness: .34, metalness: 0,
      clearcoat: .5, clearcoatRoughness: .3, envMapIntensity: .5
    });
  }
  const tinted = finish === 'tinted';
  return new THREE.MeshPhysicalMaterial({
    color: tinted ? new THREE.Color(d.color || 0xEDEDF0) : 0xEDF0F2,
    metalness: 0,
    roughness: finish === 'frosted' ? .55 : .1,
    transmission: finish === 'frosted' ? .8 : tinted ? .55 : .96,
    thickness: tinted ? 1.1 : .35,
    ior: 1.45,
    clearcoat: finish === 'frosted' ? .2 : 1,
    clearcoatRoughness: finish === 'frosted' ? .4 : .08,
    attenuationColor: tinted ? new THREE.Color(d.color || 0xffffff) : 0xffffff,
    attenuationDistance: tinted ? 1.2 : 10,
    envMapIntensity: tinted ? .3 : .2,
    specularIntensity: .8
  });
}

// The juice must be fully opaque: transmissive shells render in a depth-writing
// pass, so a transparent juice inside them gets depth-rejected and the glass
// only ever refracts the empty buffer (the white-blowout bug). Gradient juices
// map a small canvas texture over the liquid's height.
function juiceMaterial(d) {
  const j = d.juice || '#C89A3E';
  let color = new THREE.Color(typeof j === 'string' ? j : j.from).multiplyScalar(.8);
  let map = null;
  if (typeof j !== 'string') {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 128, 0, 0);
    grad.addColorStop(0, j.from); grad.addColorStop(1, j.to);
    g.fillStyle = grad; g.fillRect(0, 0, 8, 128);
    map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    color = 0xffffff;
  }
  return new THREE.MeshPhysicalMaterial({
    color, map, roughness: .3, metalness: 0,
    clearcoat: .4, clearcoatRoughness: .3, envMapIntensity: .35
  });
}

function speckleTexture(base, fleck) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.fillStyle = fleck;
  for (let i = 0; i < 900; i++) {
    g.globalAlpha = .25 + Math.random() * .75;
    const r = .6 + Math.random() * 1.8;
    g.beginPath();
    g.arc(Math.random() * 256, Math.random() * 256, r, 0, 7);
    g.fill();
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------- silhouette profiles (y, r) ----------

function profileFor(d) {
  const h = d.h || 2.2, r = d.r || .55;
  switch (d.form) {
    case 'column':
      return [[0, r * .5], [.02, r], [h * .16, r], [h * .78, r], [h * .9, r * .48], [h * .955, r * .3], [h, r * .36]];
    case 'flask':
      return [[0, r * .45], [.03, r * .8], [h * .3, r], [h * .62, r * .92], [h * .84, r * .5], [h * .94, r * .26], [h, r * .32]];
    case 'torso':
      return [[0, r * .38], [.02, r * .72], [h * .14, r], [h * .34, r * .82], [h * .52, r * .68], [h * .7, r * .8], [h * .86, r * .62], [h * .95, r * .3], [h, r * .34]];
    case 'orb': {
      // true squashed sphere, bottom pole to top pole; the cap sits on the pole
      const ry = r * .86, c = ry + .05;
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const a = -Math.PI / 2 + (i / 16) * Math.PI;
        pts.push([c + Math.sin(a) * ry, Math.max(.015, r * Math.cos(a))]);
      }
      return pts;
    }
    case 'taper':
      return [[0, r * .35], [.02, r], [h * .5, r * .92], [h * .86, r * .6], [h * .94, r * .3], [h, r * .34]];
    case 'urn':
      return [[0, r * .3], [.02, r * .55], [h * .22, r * .8], [h * .5, r], [h * .78, r * .72], [h * .92, r * .3], [h, r * .34]];
    case 'ribbed': {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const y = (i / 24) * h * .82;
        pts.push([y, r * (.96 + .04 * Math.sin(i * 2.4))]);
      }
      pts.push([h * .88, r * .5], [h * .95, r * .3], [h, r * .34]);
      return [[0, r * .45], [.01, r], ...pts];
    }
    case 'slab':
    case 'ingot':
    case 'star':
    default:
      return [[0, r * .45], [.02, r], [h * .12, r], [h * .8, r], [h * .9, r * .55], [h * .96, r * .3], [h, r * .36]];
  }
}

function latheFromProfile(profile, segs = 72) {
  const curve = new THREE.SplineCurve(profile.map(([y, r]) => new THREE.Vector2(r, y)));
  const sampled = curve.getPoints(56);
  const pts = [new THREE.Vector2(.001, 0), ...sampled, new THREE.Vector2(.16, sampled[sampled.length - 1].y)];
  return new THREE.LatheGeometry(pts, segs);
}

function liquidGeometry(profile, fill) {
  const top = profile[profile.length - 2][0];
  const limit = top * fill;
  const curve = new THREE.SplineCurve(profile.map(([y, r]) => new THREE.Vector2(r, y)));
  const pts = [new THREE.Vector2(.001, .04)];
  for (const p of curve.getPoints(40)) {
    if (p.y >= .04 && p.y <= limit) pts.push(new THREE.Vector2(Math.max(.05, p.x * .9), p.y));
  }
  pts.push(new THREE.Vector2(Math.max(.05, pts[pts.length - 1].x), limit));
  pts.push(new THREE.Vector2(.001, limit));
  return new THREE.LatheGeometry(pts, 48);
}

function bodyRadius(d) {
  return Math.max(...profileFor(d).map(p => p[1]));
}

// extruded 5-point star for Angel
function starGeometry(r, depth) {
  const shape = new THREE.Shape();
  const spikes = 5, outer = r, inner = r * .5;
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .09, bevelSize: .09, bevelSegments: 3 });
  geo.center();
  return geo;
}

// beveled ingot for 1 Million
function ingotGeometry(r) {
  const shape = new THREE.Shape();
  const w = r * 1.5, hgt = r * .95, ch = r * .3;
  shape.moveTo(-w + ch, -hgt);
  shape.lineTo(w - ch, -hgt); shape.lineTo(w, -hgt + ch);
  shape.lineTo(w, hgt - ch); shape.lineTo(w - ch, hgt);
  shape.lineTo(-w + ch, hgt); shape.lineTo(-w, hgt - ch);
  shape.lineTo(-w, -hgt + ch); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: r * 1.15, bevelEnabled: true, bevelThickness: .07, bevelSize: .07, bevelSegments: 2 });
  geo.center();
  return geo;
}

// ---------- label ----------

function labelCanvas(frag, d, ink, plate) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 736;
  const g = c.getContext('2d');
  g.fillStyle = plate; g.fillRect(0, 0, 1024, 736);
  g.textAlign = 'center';
  g.fillStyle = d.juice && typeof d.juice === 'string' ? d.juice : '#B4A26A';
  g.fillRect(400, 148, 224, 13);
  g.fillStyle = ink;
  g.font = '500 48px "Hanken Grotesk", -apple-system, "Segoe UI", sans-serif';
  spaced(g, frag.house.toUpperCase(), 512, 106, 13);
  g.font = '400 99px Italiana, Georgia, serif';
  const name = frag.name.toUpperCase();
  if (g.measureText(name).width > 900) g.font = '400 74px Italiana, Georgia, serif';
  g.fillText(name, 512, 384, 900);
  g.fillStyle = ink; g.globalAlpha = .65;
  g.font = '500 42px "Hanken Grotesk", -apple-system, "Segoe UI", sans-serif';
  spaced(g, (Object.entries(frag.mix).sort((a, b) => b[1] - a[1])[0] || ['citrus'])[0].toUpperCase(), 512, 528, 11);
  g.globalAlpha = 1;
  g.strokeStyle = ink; g.globalAlpha = .4; g.lineWidth = 5;
  g.strokeRect(32, 32, 960, 672);
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function spaced(g, text, cx, y, gap) {
  const widths = [...text].map(ch => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
  let x = cx - total / 2;
  [...text].forEach((ch, i) => { g.fillText(ch, x + widths[i] / 2, y); x += widths[i] + gap; });
}

// ---------- bottle assembly ----------

function capMesh(cap) {
  if (!cap || cap.form === 'none') return null;
  const mat = metalMaterial(cap.material);
  const h = cap.h || .3, r = cap.r || .25;
  let m;
  switch (cap.form) {
    case 'column': m = new THREE.Mesh(new THREE.CylinderGeometry(r * .95, r, h, 48), mat); break;
    case 'sphere': m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat); m.scale.y = .85; break;
    case 'dome': m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28, 0, Math.PI * 2, 0, Math.PI / 2), mat); m.scale.y = h / r; break;
    case 'disc': m = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.12, h, 48), mat); break;
    case 'cone': m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 48), mat); break;
    case 'puck':
    default: m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.06, h, 48), mat);
  }
  m.castShadow = true;
  return m;
}

export function buildBottle(frag) {
  const d = DESIGNS[frag.id] || { form: 'column', h: 2.2, r: .55, glass: 'clear', juice: frag.bottle.juice, cap: { form: 'puck', material: frag.bottle.metal, h: .3, r: .25 }, label: 'band' };
  const group = new THREE.Group();
  const body = new THREE.Group();
  const profile = profileFor(d);
  const H = d.h;
  const R = bodyRadius(d);

  // dedicated bodies for the star (Angel) and the ingot (1 Million)
  if (d.form === 'star' || d.form === 'ingot') {
    const shellMat = glassMaterial(d);
    const mesh = new THREE.Mesh(
      d.form === 'star' ? starGeometry(R * 1.15, .4) : ingotGeometry(R),
      shellMat
    );
    mesh.castShadow = true;
    mesh.position.y = d.form === 'star' ? R * 1.2 : R * 1.0;
    body.add(mesh);
    group.add(body);
    const box = new THREE.Box3().setFromObject(group);
    const baseScale = 2.5 / (box.max.y - box.min.y);
    group.scale.setScalar(baseScale);
    group.userData.baseScale = baseScale;
    return group;
  }

  const shellGeo = latheFromProfile(profile);

  const shellMat = glassMaterial(d);
  if (d.speckle) shellMat.map = speckleTexture(d.color || '#17131A', d.speckle);
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.castShadow = true;
  body.add(shell);

  const opaque = d.glass === 'opaque';
  if (!opaque) {
    body.add(new THREE.Mesh(liquidGeometry(profile, .68), juiceMaterial(d)));
  }

  // labels: curved band around the body, or a flat plate on the front face
  const labelInk = d.ink || '#2A2A2E';
  const labelPlate = d.plate || '#F7F4EE';
  if (d.label === 'band') {
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(R + .012, R + .012, .42, 48, 1, true, -.62, 1.24),
      new THREE.MeshBasicMaterial({ map: labelCanvas(frag, d, labelInk, labelPlate) })
    );
    label.position.y = H * .44;
    body.add(label);
  } else if (d.label === 'plate' || d.label === 'plaque' || d.label === 'tall') {
    const big = d.label === 'tall';
    const w = big ? .62 : .52, hgt = big ? .8 : .46;
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(w, hgt),
      new THREE.MeshBasicMaterial({ map: labelCanvas(frag, d, labelInk, labelPlate) })
    );
    label.position.set(0, H * (big ? .46 : .44), R * (d.scaleX ? 1 : .99) + .012);
    body.add(label);
  }

  // extra metal rings around the body (Chance's band, Spicebomb's ribs)
  for (let i = 0; i < (d.bandRings?.length || 0); i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(R * .98, .028, 12, 64),
      metalMaterial(d.bandRings[i])
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = H * (.38 + i * .16);
    body.add(ring);
  }

  if (d.scaleX) body.scale.x = d.scaleX;
  group.add(body);

  // the profile's top decides where cap and collar sit (sphere poles vs necks)
  const topY = profile[profile.length - 1][0];
  const topR = profile[profile.length - 1][1];

  if (topR >= .12) {
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(.16, .18, .1, 32),
      metalMaterial(d.ring || d.cap?.material || 'silver')
    );
    collar.position.y = topY + .04;
    group.add(collar);
  }

  const cap = capMesh(d.cap);
  if (cap) {
    const capH = d.cap.form === 'sphere' ? d.cap.r * 1.7 : (d.cap.h || .3);
    cap.position.y = topY + .06 + capH / 2;
    group.add(cap);
  }

  // normalize overall height so every bottle frames the same
  const total = H + (cap ? (d.cap.h || .3) * 2 : .25);
  const baseScale = 2.55 / total;
  group.scale.setScalar(baseScale);
  group.userData.baseScale = baseScale;
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

// ---------- scene dressing: deep water, lamp key, bioluminescent accent ----------

function applyRendererDefaults(renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function dressScene(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  pmrem.dispose();
  scene.environmentIntensity = .35;

  const lamp = new THREE.DirectionalLight(0xFFE7C2, 2.6);   // the diver's lamp, warm
  lamp.position.set(2.4, 4.0, 2.4);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.radius = 10;
  lamp.shadow.camera.left = -2.5; lamp.shadow.camera.right = 2.5;
  lamp.shadow.camera.top = 4.5; lamp.shadow.camera.bottom = -1;
  scene.add(lamp);

  const rim = new THREE.DirectionalLight(0x7FB8D8, .7);     // cold water rim
  rim.position.set(-3, 2.2, -2.6);
  scene.add(rim);

  const accent = new THREE.PointLight(0x6FB0E0, 14, 9, 1.8); // bioluminescence, tinted per juice
  accent.position.set(-1.4, 1.6, -2.2);
  scene.add(accent);
  scene.userData.accent = accent;

  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48), new THREE.ShadowMaterial({ opacity: .3 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
}

// ---------- live viewer ----------

export class BottleViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    applyRendererDefaults(this.renderer);
    this.scene = new THREE.Scene();
    dressScene(this.scene, this.renderer);
    this.camera = new THREE.PerspectiveCamera(33, 1, .1, 40);
    this.camera.position.set(0, 1.9, 5.8);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 1.15, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .06;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.4;
    this.controls.maxDistance = 8.5;
    this.controls.minPolarAngle = .55;
    this.controls.maxPolarAngle = 1.4;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.0;

    this.group = null;
    this.bornAt = 0;
    this.raf = 0;
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    this.raf = requestAnimationFrame(this.loop);
    window.addEventListener('resize', this.resize);
  }

  setFrag(frag) {
    if (this.group) { this.scene.remove(this.group); disposeGroup(this.group); }
    this.group = buildBottle(frag);
    this.scene.add(this.group);
    this.bornAt = performance.now();
    const juice = new THREE.Color(typeof frag.bottle.juice === 'string' ? frag.bottle.juice : frag.bottle.juice.from);
    const accent = this.scene.userData.accent;
    if (accent) accent.color.lerp(juice, 1);
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
      const k = Math.min(1, (performance.now() - this.bornAt) / 700);
      const e = 1 - Math.pow(1 - k, 3);
      this.group.scale.setScalar(this.group.userData.baseScale * (.88 + .12 * e));
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

// ---------- static snapshots ----------

let snap = null;

function getSnapRig() {
  if (snap) return snap;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  applyRendererDefaults(renderer);
  const scene = new THREE.Scene();
  dressScene(scene, renderer);
  const camera = new THREE.PerspectiveCamera(33, .8, .1, 40);
  camera.position.set(0, 1.9, 5.8);
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
