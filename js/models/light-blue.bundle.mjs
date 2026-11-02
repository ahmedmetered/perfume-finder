// ../../perfume-finder/js/models/light-blue.ts
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
function buildLatheGeometry(profile) {
  const points = profile.points.map(([x, y]) => new THREE.Vector2(Math.max(1e-4, x), y));
  return new THREE.LatheGeometry(points, profile.segments ?? 24);
}
function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function readLayerNumber(value, keys, fallback) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    const record = value;
    for (const key of keys) {
      if (typeof record[key] === "number") return record[key];
    }
  }
  return fallback;
}
function hexToRgb(hex) {
  const normalized = /^#[0-9a-f]{3}$/i.test(hex) ? "#" + hex.slice(1).split("").map((part) => part + part).join("") : hex;
  const value = /^#[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized.slice(1), 16) : 9075295;
  return [clampAlbedoChannel(value >> 16 & 255), clampAlbedoChannel(value >> 8 & 255), clampAlbedoChannel(value & 255)];
}
function materialPalette(spec) {
  const palette = spec.colorVariation?.palette;
  if (Array.isArray(palette) && palette.length > 0) return palette.filter((value) => typeof value === "string");
  const secondary = spec.albedo?.secondary;
  const colors = [spec.baseColor ?? spec.color ?? spec.albedo?.dominant, ...Array.isArray(secondary) ? secondary : []];
  return colors.filter((value) => typeof value === "string" && value.startsWith("#"));
}
function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
function clampAlbedoChannel(value) {
  return Math.max(30, Math.min(240, Math.round(value)));
}
function clampPbrF0(value) {
  return Math.max(0.02, Math.min(1, value));
}
function clampPbrIor(value) {
  return Math.max(1, Math.min(2.5, value));
}
function clampPbrMetalness(value) {
  return value >= 0.5 ? 1 : 0;
}
function clampedAlbedoColor(spec) {
  const source = typeof spec.baseColor === "string" ? spec.baseColor : "#8A7A5F";
  return new THREE.Color().setStyle(source, THREE.SRGBColorSpace);
}
function smoothCurve(value) {
  return value * value * (3 - 2 * value);
}
function periodicHash(x, y, seed, periodX, periodY) {
  const wrappedX = (x % periodX + periodX) % periodX;
  const wrappedY = (y % periodY + periodY) % periodY;
  let value = Math.imul(wrappedX + seed * 17, 374761393) ^ Math.imul(wrappedY + seed * 31, 668265263);
  value = Math.imul(value ^ value >>> 13, 1274126177);
  return ((value ^ value >>> 16) >>> 0) / 4294967295;
}
function periodicValueNoise(u, v, seed, periodX, periodY) {
  const x = u * periodX;
  const y = v * periodY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothCurve(x - x0);
  const ty = smoothCurve(y - y0);
  const a = periodicHash(x0, y0, seed, periodX, periodY);
  const b = periodicHash(x0 + 1, y0, seed, periodX, periodY);
  const c = periodicHash(x0, y0 + 1, seed, periodX, periodY);
  const d = periodicHash(x0 + 1, y0 + 1, seed, periodX, periodY);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}
function surfaceBands(spec) {
  const source = Array.isArray(spec.surfaceFrequencyBands) ? spec.surfaceFrequencyBands : [];
  const parsed = source.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const band = item;
    const frequency = typeof band.frequency === "number" ? band.frequency : 0;
    const amplitude = typeof band.amplitude === "number" ? band.amplitude : 0;
    if (frequency <= 0 || amplitude <= 0) return [];
    const stretch = Array.isArray(band.stretch) ? band.stretch : [1, 1];
    const description = `${String(band.pattern ?? "")} ${String(band.role ?? "")}`.toLowerCase();
    return [{
      frequency,
      amplitude,
      stretchX: typeof stretch[0] === "number" ? Math.max(0.1, stretch[0]) : 1,
      stretchY: typeof stretch[1] === "number" ? Math.max(0.1, stretch[1]) : 1,
      ridge: /(ridge|groove|grain|fiber|striated|crack)/.test(description)
    }];
  });
  return parsed.length > 0 ? parsed : [
    { frequency: 2, amplitude: 0.42, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 12, amplitude: 0.22, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 56, amplitude: 0.08, stretchX: 1, stretchY: 1, ridge: false }
  ];
}
function sampleSurface(u, v, bands, seed) {
  let value = 0;
  let weight = 0;
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const periodX = Math.max(1, Math.round(band.frequency * band.stretchX));
    const periodY = Math.max(1, Math.round(band.frequency * band.stretchY));
    let sample = periodicValueNoise(u, v, seed + index * 1013, periodX, periodY);
    if (band.ridge) sample = 1 - Math.abs(sample * 2 - 1);
    value += sample * band.amplitude;
    weight += band.amplitude;
  }
  return weight > 0 ? clamp01(value / weight) : 0.5;
}
function mixPalette(colors, value) {
  if (colors.length === 1) return colors[0];
  const scaled = clamp01(value) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = colors[index];
  const b = colors[index + 1];
  return [
    Math.round(THREE.MathUtils.lerp(a[0], b[0], mix)),
    Math.round(THREE.MathUtils.lerp(a[1], b[1], mix)),
    Math.round(THREE.MathUtils.lerp(a[2], b[2], mix))
  ];
}
function parseRgba(value) {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
  if (!match) return [138, 122, 95];
  return [clampAlbedoChannel(Number(match[1])), clampAlbedoChannel(Number(match[2])), clampAlbedoChannel(Number(match[3]))];
}
function sampleColorGradient(gradient, u, v) {
  const stops = gradient.stops.length >= 2 ? gradient.stops : [{ offset: 0, color: "rgba(138,122,95,1)" }, { offset: 1, color: "rgba(138,122,95,1)" }];
  let t;
  if (gradient.type === "radial") {
    const [cx, cy] = gradient.axis;
    const dx = u - cx;
    const dy = v - cy;
    const maxRadius = Math.max(1e-3, Math.hypot(Math.max(cx, 1 - cx), Math.max(cy, 1 - cy)));
    t = clamp01(Math.hypot(dx, dy) / maxRadius);
  } else {
    const [ax, ay] = gradient.axis;
    const projection = (u - 0.5) * ax + (v - 0.5) * ay;
    const maxProjection = 0.5 * (Math.abs(ax) + Math.abs(ay)) || 0.5;
    t = clamp01(projection / maxProjection + 0.5);
  }
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.max(0, Math.floor(scaled)));
  const mix = scaled - index;
  const a = parseRgba(stops[index].color);
  const b = parseRgba(stops[index + 1].color);
  return [
    THREE.MathUtils.lerp(a[0], b[0], mix),
    THREE.MathUtils.lerp(a[1], b[1], mix),
    THREE.MathUtils.lerp(a[2], b[2], mix)
  ];
}
function writePixel(data, offset, red, green, blue) {
  data[offset] = Math.max(0, Math.min(255, Math.round(red)));
  data[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
  data[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
  data[offset + 3] = 255;
}
function makeCanvas(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}
function createMapTexture(canvas, colorSpace, spec, options) {
  const texture = new THREE.CanvasTexture(canvas);
  const projection = spec.textureProjection && typeof spec.textureProjection === "object" ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [2, 2];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === "number" ? repeat[0] : 2,
    typeof repeat[1] === "number" ? repeat[1] : 2
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}
function referenceMapUrl(spec, channel) {
  const reference = spec.referencePbr;
  if (!reference || typeof reference !== "object") return null;
  if (reference.usable === false) return null;
  const confidence = typeof reference.confidence === "number" ? reference.confidence : typeof reference.estimatedFidelity === "number" ? reference.estimatedFidelity : 0;
  const threshold = typeof reference.targetThreshold === "number" ? reference.targetThreshold : 0.7;
  if (confidence < threshold) return null;
  const maps = reference.maps;
  if (!maps || typeof maps !== "object") return null;
  const map = maps[channel];
  if (!map || typeof map !== "object") return null;
  const record = map;
  const url = typeof record.url === "string" && record.url.trim() ? record.url : record.path;
  return typeof url === "string" && url.trim() ? url : null;
}
function createLoadedMapTexture(url, colorSpace, spec, options) {
  const texture = new THREE.TextureLoader().load(url);
  const projection = spec.textureProjection && typeof spec.textureProjection === "object" ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [1, 1];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === "number" ? repeat[0] : 1,
    typeof repeat[1] === "number" ? repeat[1] : 1
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}
function makeReferenceTextureSet(spec, options) {
  const albedo = referenceMapUrl(spec, "albedo");
  const roughness = referenceMapUrl(spec, "roughness");
  const height = referenceMapUrl(spec, "height");
  const normal = referenceMapUrl(spec, "normal");
  const ao = referenceMapUrl(spec, "ao");
  if (!albedo || !roughness || !height || !normal || !ao) return null;
  return {
    albedo: createLoadedMapTexture(albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createLoadedMapTexture(roughness, THREE.NoColorSpace, spec, options),
    height: createLoadedMapTexture(height, THREE.NoColorSpace, spec, options),
    normal: createLoadedMapTexture(normal, THREE.NoColorSpace, spec, options),
    ao: createLoadedMapTexture(ao, THREE.NoColorSpace, spec, options),
    source: "reference-pixel-extraction"
  };
}
function makeProceduralTextureSet(id, spec, options) {
  if (typeof document === "undefined") return null;
  const qualityFirst = (options.qualityPriority ?? "reference-fidelity") === "reference-fidelity";
  const requested = options.textureSize ?? spec.textureResolution;
  const requestedSize = typeof requested === "number" && Number.isFinite(requested) ? requested : qualityFirst ? 1024 : 512;
  const size = Math.max(256, Math.min(2048, 2 ** Math.round(Math.log2(requestedSize))));
  const canvases = {
    albedo: makeCanvas(size),
    roughness: makeCanvas(size),
    height: makeCanvas(size),
    normal: makeCanvas(size),
    ao: makeCanvas(size)
  };
  const contexts = {
    albedo: canvases.albedo.getContext("2d"),
    roughness: canvases.roughness.getContext("2d"),
    height: canvases.height.getContext("2d"),
    normal: canvases.normal.getContext("2d"),
    ao: canvases.ao.getContext("2d")
  };
  if (!contexts.albedo || !contexts.roughness || !contexts.height || !contexts.normal || !contexts.ao) return null;
  const images = {
    albedo: contexts.albedo.createImageData(size, size),
    roughness: contexts.roughness.createImageData(size, size),
    height: contexts.height.createImageData(size, size),
    normal: contexts.normal.createImageData(size, size),
    ao: contexts.ao.createImageData(size, size)
  };
  const seed = hashString(id);
  const bands = surfaceBands(spec);
  const heightField = new Float32Array(size * size);
  const roughnessField = new Float32Array(size * size);
  const palette = materialPalette(spec);
  const fallback = typeof spec.baseColor === "string" ? spec.baseColor : "#8A7A5F";
  const colors = (palette.length >= 2 ? palette : [fallback, "#6E614B", "#A08F70"]).map(hexToRgb);
  const baseRoughness = clamp01(readLayerNumber(spec.roughness, ["base"], 0.76));
  const roughnessVariation = clamp01(readLayerNumber(spec.roughness, ["variation"], 0.18));
  const colorAmplitude = clamp01(readLayerNumber(spec.colorVariation, ["amplitude", "variation"], 0.18));
  const heightCorrelation = clamp01(readLayerNumber(spec.colorVariation, ["heightCorrelation"], 0.3));
  const colorGradient = spec.colorGradient;
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const index = y * size + x;
      const height = sampleSurface(u, v, bands, seed + 101);
      const roughNoise = sampleSurface(u, v, bands, seed + 7001);
      const colorNoise = sampleSurface(u, v, bands, seed + 15013);
      heightField[index] = height;
      roughnessField[index] = clamp01(baseRoughness + (roughNoise - 0.5) * roughnessVariation * 2);
      let color;
      if (colorGradient) {
        color = sampleColorGradient(colorGradient, u, v);
      } else {
        const paletteValue = clamp01(
          0.5 + (colorNoise - 0.5) * colorAmplitude * 2 + (height - 0.5) * heightCorrelation
        );
        color = mixPalette(colors, paletteValue);
      }
      writePixel(images.albedo.data, index * 4, color[0], color[1], color[2]);
    }
  }
  const normalStrength = Math.max(0.05, readLayerNumber(spec.normal, ["strength", "amplitude"], 0.35));
  const aoStrength = clamp01(readLayerNumber(spec.ambientOcclusion, ["cavityStrength", "strength"], 0.35));
  for (let y = 0; y < size; y += 1) {
    const up = (y - 1 + size) % size * size;
    const down = (y + 1) % size * size;
    for (let x = 0; x < size; x += 1) {
      const left = (x - 1 + size) % size;
      const right = (x + 1) % size;
      const index = y * size + x;
      const center = heightField[index];
      const dx = (heightField[y * size + right] - heightField[y * size + left]) * normalStrength * 6;
      const dy = (heightField[down + x] - heightField[up + x]) * normalStrength * 6;
      const inverseLength = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const normalX = -dx * inverseLength;
      const normalY = -dy * inverseLength;
      const normalZ = inverseLength;
      const neighborAverage = (heightField[y * size + left] + heightField[y * size + right] + heightField[up + x] + heightField[down + x]) * 0.25;
      const cavity = Math.max(0, neighborAverage - center);
      const ao = clamp01(1 - aoStrength * (cavity * 12 + (1 - center) * 0.16));
      const offset = index * 4;
      const heightByte = center * 255;
      const roughnessByte = roughnessField[index] * 255;
      writePixel(images.height.data, offset, heightByte, heightByte, heightByte);
      writePixel(images.roughness.data, offset, roughnessByte, roughnessByte, roughnessByte);
      writePixel(
        images.normal.data,
        offset,
        (normalX * 0.5 + 0.5) * 255,
        (normalY * 0.5 + 0.5) * 255,
        (normalZ * 0.5 + 0.5) * 255
      );
      writePixel(images.ao.data, offset, ao * 255, ao * 255, ao * 255);
    }
  }
  contexts.albedo.putImageData(images.albedo, 0, 0);
  contexts.roughness.putImageData(images.roughness, 0, 0);
  contexts.height.putImageData(images.height, 0, 0);
  contexts.normal.putImageData(images.normal, 0, 0);
  contexts.ao.putImageData(images.ao, 0, 0);
  return {
    albedo: createMapTexture(canvases.albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createMapTexture(canvases.roughness, THREE.NoColorSpace, spec, options),
    height: createMapTexture(canvases.height, THREE.NoColorSpace, spec, options),
    normal: createMapTexture(canvases.normal, THREE.NoColorSpace, spec, options),
    ao: createMapTexture(canvases.ao, THREE.NoColorSpace, spec, options),
    source: "procedural"
  };
}
function createSculptMaterial(id, spec, options, denseComponent = false) {
  const textureless = spec.textureless?.declared === true;
  const textures = textureless ? null : makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);
  const material = new THREE.MeshPhysicalMaterial({
    color: textures ? 16777215 : clampedAlbedoColor(spec),
    roughness: textures ? 1 : clamp01(readLayerNumber(spec.roughness, ["base"], 0.76)),
    metalness: clampPbrMetalness(readLayerNumber(spec.metalness, ["base"], 0)),
    clearcoat: clamp01(readLayerNumber(spec.clearcoat, ["base", "amount"], 0)),
    clearcoatRoughness: clamp01(readLayerNumber(spec.clearcoatRoughness, ["base"], 0.25)),
    transmission: clamp01(readLayerNumber(spec.transmission, ["base", "amount"], 0)),
    ior: clampPbrIor(readLayerNumber(spec.ior, ["base", "value"], 1.5)),
    thickness: Math.max(0, readLayerNumber(spec.thickness, ["base", "amount"], 0)),
    attenuationDistance: Math.max(1e-3, readLayerNumber(spec.attenuationDistance, ["base", "value"], Infinity)),
    attenuationColor: new THREE.Color(typeof spec.attenuationColor === "string" ? spec.attenuationColor : "#ffffff"),
    sheen: clamp01(readLayerNumber(spec.sheen, ["base", "amount"], 0)),
    sheenColor: new THREE.Color(typeof spec.sheenColor === "string" ? spec.sheenColor : "#ffffff"),
    sheenRoughness: clamp01(readLayerNumber(spec.sheenRoughness, ["base"], 1)),
    iridescence: clamp01(readLayerNumber(spec.iridescence, ["base", "amount"], 0)),
    iridescenceIOR: clampPbrIor(readLayerNumber(spec.iridescenceIOR, ["base", "value"], 1.3)),
    anisotropy: clamp01(readLayerNumber(spec.anisotropy, ["base", "amount"], 0)),
    anisotropyRotation: readLayerNumber(spec.anisotropy, ["rotation"], 0),
    specularIntensity: clampPbrF0(readLayerNumber(spec.specularF0 ?? spec.f0 ?? spec.specularIntensity, ["base", "value"], 1)),
    specularColor: new THREE.Color(typeof spec.specularColor === "string" ? spec.specularColor : "#ffffff"),
    emissive: new THREE.Color(typeof spec.emissive === "string" ? spec.emissive : "#000000"),
    emissiveIntensity: Math.max(0, readLayerNumber(spec.emissiveIntensity, ["base"], 1)),
    opacity: clamp01(readLayerNumber(spec.opacity, ["base"], 1)),
    transparent: readLayerNumber(spec.transmission, ["base", "amount"], 0) > 0 || readLayerNumber(spec.opacity, ["base"], 1) < 1,
    alphaTest: Math.max(0, readLayerNumber(spec.alpha, ["cutoff", "alphaTest"], 0)),
    wireframe: options.wireframe ?? false,
    side: spec.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
    flatShading: spec.flatShading === true
  });
  if (textures) {
    material.map = textures.albedo;
    material.roughnessMap = textures.roughness;
    material.normalMap = textures.normal;
    material.normalScale.setScalar(Math.max(0.05, readLayerNumber(spec.normal, ["strength", "amplitude"], 0.35)));
    material.aoMap = textures.ao;
    material.aoMap.channel = 0;
    material.aoMapIntensity = readLayerNumber(spec.ambientOcclusion, ["cavityStrength", "strength"], 0.35);
    const denseMesh = denseComponent || spec.denseMesh === true || spec.geometryDensity === "dense" || spec.topologyClass === "dense";
    const bumpScale = Math.max(0, readLayerNumber(spec.bump, ["amplitude", "strength"], 0));
    const effectiveBumpScale = denseMesh ? Math.max(0.05, bumpScale) : bumpScale;
    if (effectiveBumpScale > 0) {
      material.bumpMap = textures.height;
      material.bumpScale = effectiveBumpScale;
    }
    const displacementScale = Math.max(0, readLayerNumber(spec.displacement, ["amplitude", "strength"], 0));
    const effectiveDisplacementScale = denseMesh ? Math.max(5e-3, displacementScale) : displacementScale;
    if (effectiveDisplacementScale > 0) {
      material.displacementMap = textures.height;
      material.displacementScale = effectiveDisplacementScale;
      material.displacementBias = -effectiveDisplacementScale * 0.5;
    }
  }
  material.envMapIntensity = readLayerNumber(spec, ["envMapIntensity"], 0.8);
  material.userData.sculptMaterial = spec;
  material.userData.proceduralMapsIndependent = true;
  material.userData.pbrConstraints = { albedoRange: [30, 240], binaryMetalness: true, f0Range: [0.02, 1], iorRange: [1, 2.5] };
  material.userData.pbrTextureSource = textures?.source ?? "flat-fallback";
  material.userData.referencePbr = spec.referencePbr ?? null;
  material.userData.referenceMaterialId = spec.referenceMaterialId ?? spec.materialReference?.profileId ?? null;
  material.userData.materialEvidence = spec.materialEvidence ?? null;
  material.userData.validationViews = spec.materialReference?.validationViews ?? [];
  material.needsUpdate = true;
  return material;
}
function readVector3(value, fallback) {
  if (Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === "number")) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}
function readNumber(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function makeAttachmentEndpoint(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  const record = attachment;
  const start = readVector3(record.localStart, [0, 0, 0]);
  const end = readVector3(record.localEnd, [0, 1, 0]);
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length <= 1e-4) return null;
  const direction = delta.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const baseRadius = Math.max(5e-3, readNumber(record.baseRadius, 0.06));
  const endRadius = Math.max(3e-3, readNumber(record.endRadius, baseRadius * 0.55));
  return {
    start,
    midpoint: delta.multiplyScalar(0.5),
    quaternion,
    length,
    baseRadius,
    endRadius
  };
}
function createLightBluePourHommeModel(options = {}) {
  const root = new THREE.Group();
  root.name = "Light Blue Pour Homme";
  root.userData.reconstructionEvidence = { "itemFamily": null, "subtype": null, "componentAdapter": null, "route": null, "exactnessTier": null, "referenceCamera": { "solved": false, "fovDegrees": 40, "aspect": 1, "orientation": { "yaw": 0, "pitch": 0, "roll": 0 }, "positionHint": [0, 0, 3], "note": "For likeness work, solve the reference camera (forge/stage1_intake/solve_camera_pose.py) so the review render aligns with the photo and the reference can be projected. Confirm by overlay review." }, "approximationNotes": [] };
  root.userData.materialPipeline = {};
  root.userData.materialReferenceRegistry = null;
  const materialMap = {};
  materialMap["frosted-glass"] = createSculptMaterial(
    "frosted-glass",
    { "id": "frosted-glass", "type": "MeshPhysicalMaterial", "baseColor": "#EEEEE6", "color": "#EEEEE6", "roughness": { "map": "pbr-frosted-glass/frosted-glass_roughness.png", "base": 0.55, "variation": 0.08 }, "transmission": { "base": 0.8 }, "thickness": { "base": 0.6 }, "assignees": ["body"], "textureResolution": 1024, "textureProjection": { "mode": "planar-front", "texelDensityIntent": "material crop mapped at native crop resolution, >=1024 generation target" }, "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.9, "detail": "macro tonal zones from the reference crop" }, { "id": "meso", "frequency": 6, "amplitude": 0.5, "detail": "meso transitions between lit and shaded regions" }, { "id": "micro", "frequency": 40, "amplitude": 0.15, "detail": "micro grain from the source print" }], "ambientOcclusion": { "map": "pbr-frosted-glass/frosted-glass_ao.png" }, "textureless": {"declared": true}, "referencePbr": { "version": "1", "sourceImage": "../../images/light-blue-c1.png", "extractor": "forge/stage1_intake/extract_pbr_evidence.py", "method": "single-image inverse render estimate", "verdict": "usable-with-review", "usable": true, "confidence": 0.7, "crop": "crop-frosted-glass.png", "maps": { "albedo": { "path": "pbr-frosted-glass/frosted-glass_albedo.png", "channel": "albedo" }, "roughness": { "path": "pbr-frosted-glass/frosted-glass_roughness.png", "channel": "roughness" }, "normal": { "path": "pbr-frosted-glass/frosted-glass_normal.png", "channel": "normal" }, "height": { "path": "pbr-frosted-glass/frosted-glass_height.png", "channel": "height" }, "ao": { "path": "pbr-frosted-glass/frosted-glass_ao.png", "channel": "ao" } } }, "colorVariation": "palette-derived variation: dominant frosted-glass tone with lit/shaded shift across the crop", "localOverrides": ["frosted-glass finish local response from reference crop"] },
    options
  );
  materialMap["silver-collar"] = createSculptMaterial(
    "silver-collar",
    { "id": "silver-collar", "type": "MeshStandardMaterial", "baseColor": "#C4C8CE", "color": "#C4C8CE", "metalness": { "base": 0.9 }, "roughness": { "map": "pbr-silver-collar/silver-collar_roughness.png", "base": 0.3, "variation": 0.08 }, "assignees": ["collar"], "textureResolution": 1024, "textureProjection": { "mode": "planar-front", "texelDensityIntent": "material crop mapped at native crop resolution, >=1024 generation target" }, "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.9, "detail": "macro tonal zones from the reference crop" }, { "id": "meso", "frequency": 6, "amplitude": 0.5, "detail": "meso transitions between lit and shaded regions" }, { "id": "micro", "frequency": 40, "amplitude": 0.15, "detail": "micro grain from the source print" }], "ambientOcclusion": { "map": "pbr-silver-collar/silver-collar_ao.png" }, "textureless": {"declared": true}, "referencePbr": { "version": "1", "sourceImage": "../../images/light-blue-c1.png", "extractor": "forge/stage1_intake/extract_pbr_evidence.py", "method": "single-image inverse render estimate", "verdict": "usable-with-review", "usable": true, "confidence": 0.7, "crop": "crop-silver-collar.png", "maps": { "albedo": { "path": "pbr-silver-collar/silver-collar_albedo.png", "channel": "albedo" }, "roughness": { "path": "pbr-silver-collar/silver-collar_roughness.png", "channel": "roughness" }, "normal": { "path": "pbr-silver-collar/silver-collar_normal.png", "channel": "normal" }, "height": { "path": "pbr-silver-collar/silver-collar_height.png", "channel": "height" }, "ao": { "path": "pbr-silver-collar/silver-collar_ao.png", "channel": "ao" } } }, "colorVariation": "palette-derived variation: dominant silver-collar tone with lit/shaded shift across the crop", "localOverrides": ["silver-collar finish local response from reference crop"] },
    options
  );
  materialMap["blue-cap"] = createSculptMaterial(
    "blue-cap",
    { "id": "blue-cap", "type": "MeshPhysicalMaterial", "baseColor": "#7A8FC8", "color": "#7A8FC8", "roughness": { "map": "pbr-blue-cap/blue-cap_roughness.png", "base": 0.1, "variation": 0.08 }, "transmission": { "base": 0.7 }, "thickness": { "base": 0.3 }, "assignees": ["cap"], "textureResolution": 1024, "textureProjection": { "mode": "planar-front", "texelDensityIntent": "material crop mapped at native crop resolution, >=1024 generation target" }, "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.9, "detail": "macro tonal zones from the reference crop" }, { "id": "meso", "frequency": 6, "amplitude": 0.5, "detail": "meso transitions between lit and shaded regions" }, { "id": "micro", "frequency": 40, "amplitude": 0.15, "detail": "micro grain from the source print" }], "ambientOcclusion": { "map": "pbr-blue-cap/blue-cap_ao.png" }, "textureless": {"declared": true}, "referencePbr": { "version": "1", "sourceImage": "../../images/light-blue-c1.png", "extractor": "forge/stage1_intake/extract_pbr_evidence.py", "method": "single-image inverse render estimate", "verdict": "usable-with-review", "usable": true, "confidence": 0.7, "crop": "crop-blue-cap.png", "maps": { "albedo": { "path": "pbr-blue-cap/blue-cap_albedo.png", "channel": "albedo" }, "roughness": { "path": "pbr-blue-cap/blue-cap_roughness.png", "channel": "roughness" }, "normal": { "path": "pbr-blue-cap/blue-cap_normal.png", "channel": "normal" }, "height": { "path": "pbr-blue-cap/blue-cap_height.png", "channel": "height" }, "ao": { "path": "pbr-blue-cap/blue-cap_ao.png", "channel": "ao" } } }, "colorVariation": "palette-derived variation: dominant blue-cap tone with lit/shaded shift across the crop", "localOverrides": ["blue-cap finish local response from reference crop"] },
    options
  );
  materialMap["frost-ink"] = createSculptMaterial(
    "frost-ink",
    { "id": "frost-ink", "type": "MeshStandardMaterial", "baseColor": "#6E7276", "color": "#6E7276", "roughness": { "map": "pbr-frost-ink/frost-ink_roughness.png", "base": 0.5, "variation": 0.08 }, "assignees": ["typography"], "textureResolution": 1024, "textureProjection": { "mode": "planar-front", "texelDensityIntent": "material crop mapped at native crop resolution, >=1024 generation target" }, "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.9, "detail": "macro tonal zones from the reference crop" }, { "id": "meso", "frequency": 6, "amplitude": 0.5, "detail": "meso transitions between lit and shaded regions" }, { "id": "micro", "frequency": 40, "amplitude": 0.15, "detail": "micro grain from the source print" }], "ambientOcclusion": { "map": "pbr-frost-ink/frost-ink_ao.png" }, "textureless": {"declared": true}, "referencePbr": { "version": "1", "sourceImage": "../../images/light-blue-c1.png", "extractor": "forge/stage1_intake/extract_pbr_evidence.py", "method": "single-image inverse render estimate", "verdict": "usable-with-review", "usable": true, "confidence": 0.7, "crop": "crop-frost-ink.png", "maps": { "albedo": { "path": "pbr-frost-ink/frost-ink_albedo.png", "channel": "albedo" }, "roughness": { "path": "pbr-frost-ink/frost-ink_roughness.png", "channel": "roughness" }, "normal": { "path": "pbr-frost-ink/frost-ink_normal.png", "channel": "normal" }, "height": { "path": "pbr-frost-ink/frost-ink_height.png", "channel": "height" }, "ao": { "path": "pbr-frost-ink/frost-ink_ao.png", "channel": "ao" } } }, "colorVariation": "palette-derived variation: dominant frost-ink tone with lit/shaded shift across the crop", "localOverrides": ["frost-ink finish local response from reference crop"] },
    options
  );
  const nodes = { root };
  const meshes = {};
  const sockets = {};
  const colliders = {};
  const destructionGroups = {};
  const endpoint_body_0 = makeAttachmentEndpoint(null);
  const node_body_0 = new THREE.Group();
  node_body_0.name = "Frosted flask body__pivot";
  node_body_0.scale.set(1, 1, 1);
  if (endpoint_body_0) {
    node_body_0.position.copy(endpoint_body_0.start);
    node_body_0.rotation.set(0, 0, 0);
  } else {
    node_body_0.position.set(0, 0, 0);
    node_body_0.rotation.set(0, 0, 0);
  }
  node_body_0.userData.sculptComponent = { "id": "body", "name": "Frosted flask body", "parent": null, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "blown-glass flask with continuous curved shoulder into neck; lathe profile is the honest primitive", "geometryDescriptor": { "latheProfile": { "points": [[0.041, 0], [0.523, 0.02], [0.654, 0.18], [0.704, 0.5], [0.704, 1.05], [0.654, 1.38], [0.493, 1.62], [0.242, 1.78], [0.211, 1.9]], "segments": 48 } }, "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0] }, "materialRefs": ["frosted-glass"], "colorMaterialRecipe": { "dominantAlbedo": "rgba(238,236,230,1)", "secondaryAlbedo": "rgba(225,224,218,1)", "materialClass": "glass", "materialClassConfidence": 0.9, "notes": "belly diameter 0.8 of 1.9 height, matching the reference bottle ratio" }, "localFeatures": [{ "id": "ph-frost-gradient", "kind": "contour", "description": "frost density deepens toward the base (wall thickness cue)", "confidence": 0.85 }, { "id": "ph-shoulder-blend", "kind": "contour", "description": "continuous shoulder-to-neck curvature highlight, no crease", "confidence": 0.95 }, { "id": "ph-base-chamfer", "kind": "bevel", "description": "base edge chamfer catching light at the bottom of the flask", "confidence": 0.8 }], "actionProfile": { "motion": "static-prop", "pivots": [], "colliders": [] }, "notes": "frosted translucent white flask; juice not visible through frost Lathe profile authored final-size (0.8 wide x 1.9 tall); unit dims so the generator scale is neutral.", "attachment": { "parentId": "root", "parentSocket": "base-plate", "contactType": "overlap", "overlap": 0.02, "gapTolerance": 5e-3, "localStart": [0, 0, 0], "localEnd": [0, 1.9, 0] }, "dimensions": { "width": 1, "height": 1, "depth": 1 }, "material": "frosted-glass" };
  node_body_0.userData.actionProfile = { "motion": "static-prop", "pivots": [], "colliders": [] };
  (nodes["root"] ?? root).add(node_body_0);
  nodes["body"] = node_body_0;
  const mesh_body_0Geometry = endpoint_body_0 ? new THREE.CylinderGeometry(endpoint_body_0.endRadius, endpoint_body_0.baseRadius, endpoint_body_0.length, 32, 12) : buildLatheGeometry({ "points": [[0.041, 0], [0.523, 0.02], [0.654, 0.18], [0.704, 0.5], [0.704, 1.05], [0.654, 1.38], [0.493, 1.62], [0.242, 1.78], [0.211, 1.9]], "segments": 48 });
  if (!endpoint_body_0) {
    mesh_body_0Geometry.scale(1, 1, 1);
  }
  const mesh_body_0 = new THREE.Mesh(
    mesh_body_0Geometry,
    materialMap["frosted-glass"] ?? new THREE.MeshStandardMaterial({ color: 8947848 })
  );
  mesh_body_0.name = "Frosted flask body";
  if (endpoint_body_0) {
    mesh_body_0.position.copy(endpoint_body_0.midpoint);
    mesh_body_0.quaternion.copy(endpoint_body_0.quaternion);
  }
  mesh_body_0.castShadow = options.castShadow ?? true;
  mesh_body_0.receiveShadow = options.receiveShadow ?? true;
  mesh_body_0.userData.sculptComponent = { "id": "body", "name": "Frosted flask body", "parent": null, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "blown-glass flask with continuous curved shoulder into neck; lathe profile is the honest primitive", "geometryDescriptor": { "latheProfile": { "points": [[0.041, 0], [0.523, 0.02], [0.654, 0.18], [0.704, 0.5], [0.704, 1.05], [0.654, 1.38], [0.493, 1.62], [0.242, 1.78], [0.211, 1.9]], "segments": 48 } }, "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0] }, "materialRefs": ["frosted-glass"], "colorMaterialRecipe": { "dominantAlbedo": "rgba(238,236,230,1)", "secondaryAlbedo": "rgba(225,224,218,1)", "materialClass": "glass", "materialClassConfidence": 0.9, "notes": "belly diameter 0.8 of 1.9 height, matching the reference bottle ratio" }, "localFeatures": [{ "id": "ph-frost-gradient", "kind": "contour", "description": "frost density deepens toward the base (wall thickness cue)", "confidence": 0.85 }, { "id": "ph-shoulder-blend", "kind": "contour", "description": "continuous shoulder-to-neck curvature highlight, no crease", "confidence": 0.95 }, { "id": "ph-base-chamfer", "kind": "bevel", "description": "base edge chamfer catching light at the bottom of the flask", "confidence": 0.8 }], "actionProfile": { "motion": "static-prop", "pivots": [], "colliders": [] }, "notes": "frosted translucent white flask; juice not visible through frost Lathe profile authored final-size (0.8 wide x 1.9 tall); unit dims so the generator scale is neutral.", "attachment": { "parentId": "root", "parentSocket": "base-plate", "contactType": "overlap", "overlap": 0.02, "gapTolerance": 5e-3, "localStart": [0, 0, 0], "localEnd": [0, 1.9, 0] }, "dimensions": { "width": 1, "height": 1, "depth": 1 }, "material": "frosted-glass" };
  node_body_0.add(mesh_body_0);
  meshes["body"] = mesh_body_0;
  colliders["body"] = {};
  const attachment_collar_1 = { "parentId": "body", "parentSocket": "neck-seat", "contactType": "overlap", "overlap": 0.02, "gapTolerance": 5e-3, "localStart": [0, 1.86, 0], "localEnd": [0, 2.02, 0], "baseRadius": 0.184, "endRadius": 0.1426 };
  const endpoint_collar_1 = makeAttachmentEndpoint(attachment_collar_1);
  const node_collar_1 = new THREE.Group();
  node_collar_1.name = "Silver collar band__pivot";
  node_collar_1.scale.set(1, 1, 1);
  if (endpoint_collar_1) {
    node_collar_1.position.copy(endpoint_collar_1.start);
    node_collar_1.rotation.set(0, 0, 0);
  } else {
    node_collar_1.position.set(0, 1.95, 0);
    node_collar_1.rotation.set(0, 0, 0);
  }
  node_collar_1.userData.sculptComponent = { "id": "collar", "name": "Silver collar band", "parent": "body", "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "constant circular band, lathe/cylinder primitive", "transform": { "position": [0, 1.95, 0], "rotation": [0, 0, 0] }, "materialRefs": ["silver-collar"], "colorMaterialRecipe": { "dominantAlbedo": "rgba(196,200,206,1)", "secondaryAlbedo": "rgba(230,232,236,1)", "materialClass": "metal", "materialClassConfidence": 0.9 }, "localFeatures": [{ "id": "ph-collar-seams", "kind": "seam", "description": "machined seam lines top and bottom of the silver collar", "confidence": 0.9 }, { "id": "ph-neck-threads", "kind": "groove", "description": "thread rings where collar meets the frosted neck", "confidence": 0.85 }], "actionProfile": { "motion": "static-prop", "pivots": [], "colliders": [] }, "notes": "brushed silver ring at the neck", "dimensions": { "width": 0.52, "height": 0.16 }, "attachment": { "parentId": "body", "parentSocket": "neck-seat", "contactType": "overlap", "overlap": 0.02, "gapTolerance": 5e-3, "localStart": [0, 1.86, 0], "localEnd": [0, 2.02, 0], "baseRadius": 0.184, "endRadius": 0.1426 }, "material": "silver-collar" };
  node_collar_1.userData.actionProfile = { "motion": "static-prop", "pivots": [], "colliders": [] };
  (nodes["body"] ?? root).add(node_collar_1);
  nodes["collar"] = node_collar_1;
  const mesh_collar_1Geometry = endpoint_collar_1 ? new THREE.CylinderGeometry(endpoint_collar_1.endRadius, endpoint_collar_1.baseRadius, endpoint_collar_1.length, 32, 12) : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  if (!endpoint_collar_1) {
    mesh_collar_1Geometry.scale(0.52, 0.16, 1);
  }
  const mesh_collar_1 = new THREE.Mesh(
    mesh_collar_1Geometry,
    materialMap["silver-collar"] ?? new THREE.MeshStandardMaterial({ color: 8947848 })
  );
  mesh_collar_1.name = "Silver collar band";
  if (endpoint_collar_1) {
    mesh_collar_1.position.copy(endpoint_collar_1.midpoint);
    mesh_collar_1.quaternion.copy(endpoint_collar_1.quaternion);
  }
  mesh_collar_1.castShadow = options.castShadow ?? true;
  mesh_collar_1.receiveShadow = options.receiveShadow ?? true;
  mesh_collar_1.userData.sculptComponent = { "id": "collar", "name": "Silver collar band", "parent": "body", "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "constant circular band, lathe/cylinder primitive", "transform": { "position": [0, 1.95, 0], "rotation": [0, 0, 0] }, "materialRefs": ["silver-collar"], "colorMaterialRecipe": { "dominantAlbedo": "rgba(196,200,206,1)", "secondaryAlbedo": "rgba(230,232,236,1)", "materialClass": "metal", "materialClassConfidence": 0.9 }, "localFeatures": [{ "id": "ph-collar-seams", "kind": "seam", "description": "machined seam lines top and bottom of the silver collar", "confidence": 0.9 }, { "id": "ph-neck-threads", "kind": "groove", "description": "thread rings where collar meets the frosted neck", "confidence": 0.85 }], "actionProfile": { "motion": "static-prop", "pivots": [], "colliders": [] }, "notes": "brushed silver ring at the neck", "dimensions": { "width": 0.52, "height": 0.16 }, "attachment": { "parentId": "body", "parentSocket": "neck-seat", "contactType": "overlap", "overlap": 0.02, "gapTolerance": 5e-3, "localStart": [0, 1.86, 0], "localEnd": [0, 2.02, 0], "baseRadius": 0.184, "endRadius": 0.1426 }, "material": "silver-collar" };
  node_collar_1.add(mesh_collar_1);
  meshes["collar"] = mesh_collar_1;
  colliders["collar"] = {};
  const attachment_cap_2 = { "parentId": "body", "parentSocket": "cap-seat", "contactType": "overlap", "overlap": 0.03, "gapTolerance": 5e-3, "localStart": [0, 2, 0], "localEnd": [0, 2.38, 0], "baseRadius": 0.23, "endRadius": 0.2116 };
  const endpoint_cap_2 = makeAttachmentEndpoint(attachment_cap_2);
  const node_cap_2 = new THREE.Group();
  node_cap_2.name = "Blue tinted dome cap__pivot";
  node_cap_2.scale.set(1, 1, 1);
  if (endpoint_cap_2) {
    node_cap_2.position.copy(endpoint_cap_2.start);
    node_cap_2.rotation.set(0, 0, 0);
  } else {
    node_cap_2.position.set(0, 2.16, 0);
    node_cap_2.rotation.set(0, 0, 0);
  }
  node_cap_2.userData.sculptComponent = { "id": "cap", "name": "Blue tinted dome cap", "parent": "body", "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "cylindrical cap with domed translucent top", "transform": { "position": [0, 2.16, 0], "rotation": [0, 0, 0] }, "materialRefs": ["blue-cap"], "colorMaterialRecipe": { "dominantAlbedo": "rgba(122,143,200,1)", "secondaryAlbedo": "rgba(160,178,220,1)", "materialClass": "glass", "materialClassConfidence": 0.85 }, "localFeatures": [{ "id": "ph-cap-dome", "kind": "gloss", "description": "dome specular highlight across the blue translucent cap top", "confidence": 0.9 }], "actionProfile": { "motion": "static-prop", "pivots": [], "colliders": [] }, "notes": "blue-tinted translucent cylinder cap, domed top", "dimensions": { "width": 0.46, "height": 0.38 }, "attachment": { "parentId": "body", "parentSocket": "cap-seat", "contactType": "overlap", "overlap": 0.03, "gapTolerance": 5e-3, "localStart": [0, 2, 0], "localEnd": [0, 2.38, 0], "baseRadius": 0.23, "endRadius": 0.2116 }, "material": "blue-cap" };
  node_cap_2.userData.actionProfile = { "motion": "static-prop", "pivots": [], "colliders": [] };
  (nodes["body"] ?? root).add(node_cap_2);
  nodes["cap"] = node_cap_2;
  const mesh_cap_2Geometry = endpoint_cap_2 ? new THREE.CylinderGeometry(endpoint_cap_2.endRadius, endpoint_cap_2.baseRadius, endpoint_cap_2.length, 32, 12) : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  if (!endpoint_cap_2) {
    mesh_cap_2Geometry.scale(0.46, 0.38, 1);
  }
  const mesh_cap_2 = new THREE.Mesh(
    mesh_cap_2Geometry,
    materialMap["blue-cap"] ?? new THREE.MeshStandardMaterial({ color: 8947848 })
  );
  mesh_cap_2.name = "Blue tinted dome cap";
  if (endpoint_cap_2) {
    mesh_cap_2.position.copy(endpoint_cap_2.midpoint);
    mesh_cap_2.quaternion.copy(endpoint_cap_2.quaternion);
  }
  mesh_cap_2.castShadow = options.castShadow ?? true;
  mesh_cap_2.receiveShadow = options.receiveShadow ?? true;
  mesh_cap_2.userData.sculptComponent = { "id": "cap", "name": "Blue tinted dome cap", "parent": "body", "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "cylindrical cap with domed translucent top", "transform": { "position": [0, 2.16, 0], "rotation": [0, 0, 0] }, "materialRefs": ["blue-cap"], "colorMaterialRecipe": { "dominantAlbedo": "rgba(122,143,200,1)", "secondaryAlbedo": "rgba(160,178,220,1)", "materialClass": "glass", "materialClassConfidence": 0.85 }, "localFeatures": [{ "id": "ph-cap-dome", "kind": "gloss", "description": "dome specular highlight across the blue translucent cap top", "confidence": 0.9 }], "actionProfile": { "motion": "static-prop", "pivots": [], "colliders": [] }, "notes": "blue-tinted translucent cylinder cap, domed top", "dimensions": { "width": 0.46, "height": 0.38 }, "attachment": { "parentId": "body", "parentSocket": "cap-seat", "contactType": "overlap", "overlap": 0.03, "gapTolerance": 5e-3, "localStart": [0, 2, 0], "localEnd": [0, 2.38, 0], "baseRadius": 0.23, "endRadius": 0.2116 }, "material": "blue-cap" };
  node_cap_2.add(mesh_cap_2);
  meshes["cap"] = mesh_cap_2;
  colliders["cap"] = {};
  const endpoint_typography_3 = makeAttachmentEndpoint(null);
  const node_typography_3 = new THREE.Group();
  node_typography_3.name = "Front print__pivot";
  node_typography_3.scale.set(1, 1, 1);
  if (endpoint_typography_3) {
    node_typography_3.position.copy(endpoint_typography_3.start);
    node_typography_3.rotation.set(0, 0, 0);
  } else {
    node_typography_3.position.set(0, 1, 0.55);
    node_typography_3.rotation.set(0, 0, 0);
  }
  node_typography_3.userData.sculptComponent = { "id": "typography", "name": "Front print", "parent": "body", "primitive": "plane-card", "topologyClass": "material-only", "topologyRationale": "flat ink printed on frosted glass, texture not geometry", "transform": { "position": [0, 1, 0.55], "rotation": [0, 0, 0] }, "materialRefs": ["frost-ink"], "colorMaterialRecipe": { "dominantAlbedo": "rgba(110,114,118,1)", "secondaryAlbedo": "rgba(90,94,98,1)", "materialClass": "plastic", "materialClassConfidence": 0.7 }, "localFeatures": [{ "id": "ph-print-lines", "kind": "decal", "description": "three-line grey print: brand caps, script light blue, POUR HOMME EAU DE TOILETTE caps", "confidence": 0.95 }], "actionProfile": { "motion": "static-prop", "pivots": [], "colliders": [] }, "notes": "DOLCE & GABBANA / light blue / POUR HOMME EAU DE TOILETTE, grey print", "dimensions": { "width": 1.05, "height": 0.36 }, "attachment": { "parentId": "body", "parentSocket": "front-face", "contactType": "overlap", "overlap": 5e-3, "gapTolerance": 2e-3, "localStart": [0, 0.78, 0], "localEnd": [0, 1.24, 0] }, "material": "frost-ink" };
  node_typography_3.userData.actionProfile = { "motion": "static-prop", "pivots": [], "colliders": [] };
  (nodes["body"] ?? root).add(node_typography_3);
  nodes["typography"] = node_typography_3;
  const mesh_typography_3Geometry = endpoint_typography_3 ? new THREE.CylinderGeometry(endpoint_typography_3.endRadius, endpoint_typography_3.baseRadius, endpoint_typography_3.length, 32, 12) : new THREE.PlaneGeometry(1, 1, 24, 24);
  if (!endpoint_typography_3) {
    mesh_typography_3Geometry.scale(1.05, 0.36, 1);
  }
  const mesh_typography_3 = new THREE.Mesh(
    mesh_typography_3Geometry,
    materialMap["frost-ink"] ?? new THREE.MeshStandardMaterial({ color: 8947848 })
  );
  mesh_typography_3.name = "Front print";
  if (endpoint_typography_3) {
    mesh_typography_3.position.copy(endpoint_typography_3.midpoint);
    mesh_typography_3.quaternion.copy(endpoint_typography_3.quaternion);
  }
  mesh_typography_3.castShadow = options.castShadow ?? true;
  mesh_typography_3.receiveShadow = options.receiveShadow ?? true;
  mesh_typography_3.userData.sculptComponent = { "id": "typography", "name": "Front print", "parent": "body", "primitive": "plane-card", "topologyClass": "material-only", "topologyRationale": "flat ink printed on frosted glass, texture not geometry", "transform": { "position": [0, 1, 0.55], "rotation": [0, 0, 0] }, "materialRefs": ["frost-ink"], "colorMaterialRecipe": { "dominantAlbedo": "rgba(110,114,118,1)", "secondaryAlbedo": "rgba(90,94,98,1)", "materialClass": "plastic", "materialClassConfidence": 0.7 }, "localFeatures": [{ "id": "ph-print-lines", "kind": "decal", "description": "three-line grey print: brand caps, script light blue, POUR HOMME EAU DE TOILETTE caps", "confidence": 0.95 }], "actionProfile": { "motion": "static-prop", "pivots": [], "colliders": [] }, "notes": "DOLCE & GABBANA / light blue / POUR HOMME EAU DE TOILETTE, grey print", "dimensions": { "width": 1.05, "height": 0.36 }, "attachment": { "parentId": "body", "parentSocket": "front-face", "contactType": "overlap", "overlap": 5e-3, "gapTolerance": 2e-3, "localStart": [0, 0.78, 0], "localEnd": [0, 1.24, 0] }, "material": "frost-ink" };
  node_typography_3.add(mesh_typography_3);
  meshes["typography"] = mesh_typography_3;
  colliders["typography"] = {};
  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups };
  root.userData.lookDevTargets = { "identity": "boutique product shot on seamless white, warm key from front-right", "matchWindows": ["cap hue within a step of #A8CBE0", "juice reads pale straw, not gold", "collar reads brushed metal not flat yellow"], "referenceComparison": "side-by-side sheet vs images/light-blue-w.png at the front viewpoint" };
  root.userData.actionReadiness = {
    note: "Use root.userData.sculptRuntime.nodes for transforms, sockets for attachments, colliders for physics proxies, and destructionGroups for breakable sets."
  };
  return root;
}
function createLightBluePourHommeLookDevLights(mode = "neutral") {
  const lights = new THREE.Group();
  lights.name = "Light Blue Pour Homme look-dev lights";
  const hemi = new THREE.HemisphereLight(
    mode === "reference" ? 16773334 : 15922431,
    3554114,
    mode === "grazing" ? 0.28 : mode === "reference" ? 0.72 : 0.85
  );
  lights.add(hemi);
  const key = new THREE.DirectionalLight(
    mode === "reference" ? 16764810 : 16774376,
    mode === "grazing" ? 4.2 : mode === "reference" ? 2.6 : 2.15
  );
  if (mode === "grazing") key.position.set(7.5, 1.1, 4);
  else if (mode === "reference") key.position.set(-4.5, 7.5, 5);
  else key.position.set(-4, 6, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -25e-5;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 7;
  key.shadow.blurSamples = 24;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.updateProjectionMatrix();
  lights.add(key);
  const fill = new THREE.DirectionalLight(11060479, mode === "grazing" ? 0.12 : 0.42);
  fill.position.set(4, 3, 3.5);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(16773572, mode === "grazing" ? 0.28 : 0.85);
  rim.position.set(0.5, 4.5, -6);
  lights.add(rim);
  lights.userData.reviewMode = mode;
  lights.userData.lightingFromPhoto = [{ "role": "key", "type": "directional", "color": "#FFE7C2", "intensity": 2.6, "direction": "from upper front-right" }, { "role": "fill", "type": "hemisphere", "skyColor": "#7FB8D8", "groundColor": "#0C1524", "intensity": 0.5, "direction": "cool ambient from left" }, { "role": "rim", "type": "directional", "color": "#BFE0F2", "intensity": 0.7, "direction": "cool rim from behind-left edges" }, { "role": "environment", "type": "studio-softbox", "color": "#FFFFFF", "intensity": 0.35, "note": "soft vertical softbox reflection on the glass" }, { "role": "exposure", "type": "tone-mapping", "exposure": 1.05, "toneMapping": "ACESFilmic", "note": "ACES filmic with slight warm lift, deep-dive studio intent" }, { "role": "contact-shadow", "type": "ground", "opacity": 0.3, "behavior": "soft PCF contact shadow directly under the base, radius 10" }];
  lights.userData.lookDevTargets = { "identity": "boutique product shot on seamless white, warm key from front-right", "matchWindows": ["cap hue within a step of #A8CBE0", "juice reads pale straw, not gold", "collar reads brushed metal not flat yellow"], "referenceComparison": "side-by-side sheet vs images/light-blue-w.png at the front viewpoint" };
  return lights;
}
function createLightBluePourHommeEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}
function frameLightBluePourHommeCamera(camera, object, options = {}) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const margin = options.margin ?? 1.15;
  const maxDim = Math.max(size.x, size.y, size.z) * margin;
  const fov = camera.fov * Math.PI / 180;
  const distance = maxDim / 2 / Math.tan(fov / 2);
  const az = (options.azimuthDeg ?? 0) * Math.PI / 180;
  const el = (options.elevationDeg ?? 0) * Math.PI / 180;
  const dir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el)
  );
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = Math.max(0.01, distance - maxDim);
  camera.far = distance + maxDim * 2;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}
function createLightBluePourHommePresentationComposer(renderer, scene, camera, options = {}) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (options.dof) {
    composer.addPass(new BokehPass(scene, camera, {
      focus: options.dofFocus ?? 10,
      aperture: options.dofAperture ?? 2e-4,
      maxblur: 0.01
    }));
  }
  if (options.bloom) {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    composer.addPass(new UnrealBloomPass(size, options.bloomStrength ?? 0.4, 0.4, 0.85));
  }
  return composer;
}
function configureLightBluePourHommeRenderer(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}
function createLightBluePourHommeInspectControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.minDistance = 1;
  controls.maxDistance = 8;
  controls.autoRotate = false;
  return controls;
}
export {
  configureLightBluePourHommeRenderer,
  createLightBluePourHommeEnvironment,
  createLightBluePourHommeInspectControls,
  createLightBluePourHommeLookDevLights,
  createLightBluePourHommeModel,
  createLightBluePourHommePresentationComposer,
  frameLightBluePourHommeCamera
};
