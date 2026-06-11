import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  DUNGEON_X_THRESHOLD, WORLD_MAX_X, WORLD_MAX_Z, WORLD_MIN_Z, ZONES,
} from '../sim/data';
import type { BiomeId } from '../sim/types';
import {
  generateDecorations, roadDistance, terrainHeight, zoneBiomeAt, WATER_LEVEL,
} from '../sim/world';
import type { Decoration } from '../sim/world';
import { GFX, sharedUniforms, surfaceMat } from './gfx';
import { barkMaps, barkTexture, foliageCardTexture, foliageTexture, grassTuftTexture } from './textures';

// Vegetation: trees, rocks and the grass ring.
//
// - Trees/rocks are InstancedMeshes bucketed per (zone band x 3 x-columns) so
//   frustum culling drops whole off-screen forests.
// - Per-instance HSL color variation rides on instanceColor; the base tint is
//   biome-aware (marsh trees murkier and mossier, peaks pines a darker
//   blue-green).
// - High tier: foliage (not trunks/rocks) sways in the wind via
//   onBeforeCompile on the shared uTime clock; pines get drooped 8-segment
//   cones plus a crossed alpha-card ring for a fluffier silhouette; oaks get
//   four noise-jittered blobs.
// - Grass is a player-centered ring (O(radius^2), not O(world^2)) rebuilt
//   when the player moves >12u. Tuft placement hashes the absolute grid cell,
//   so the same tufts always reappear in the same spots. A shader fade
//   dissolves tufts at the ring edge.

const GRASS_REBUILD_DIST = 12;
const TREE_WIND_STRENGTH = 0.06;
const GRASS_WIND_STRENGTH = 0.08;
// two x-halves x 200u z-bands: each bucket is up to ~6 draws (+canopy
// shadows), so bucket count is the foliage draw budget — finer 120u thirds
// cost ~60 extra calls at town for culling that barely bit
const BUCKET_DEPTH = 200;

// Desaturated forest palette: the first pass's lime tints clashed with the
// warm grade and read as pre-overhaul plastic. Tufts also pick up the ground
// hue (vale is no longer pure white) so the meadow belongs to the terrain.
const PINE_TINT: Record<BiomeId, number> = { vale: 0x9bb48d, marsh: 0x87966b, peaks: 0x6f8a7a };
const OAK_TINT: Record<BiomeId, number> = { vale: 0xa7b886, marsh: 0x8d9865, peaks: 0x92a37f };
const ROCK_TINT: Record<BiomeId, number> = { vale: 0x8d8d85, marsh: 0x7e8270, peaks: 0x878e99 };
const TRUNK_TINT: Record<BiomeId, number> = { vale: 0xffffff, marsh: 0xd2d8bc, peaks: 0xd9dde4 };
const GRASS_TINT: Record<BiomeId, number> = { vale: 0xdde4c0, marsh: 0xbfc492, peaks: 0xc2cec8 };
// grass refuses cliff faces (mirrors ROCK_SLOPE_START in terrain.ts)
const GRASS_MAX_SLOPE = 0.62;
const GRASS_SLOPE_EPS = 1.2;

export interface FoliageView {
  group: THREE.Group;
  /** per-frame: grass fade + ring rebuild, fog culling of far tree buckets */
  update(px: number, pz: number, camX: number, camZ: number, fogFar: number): void;
}

// deterministic 0..1 hash on integer grid cells / world coords
function hashAt(a: number, b: number, k: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7 + k * 74.7) * 43758.5453123;
  return s - Math.floor(s);
}

// fog-cullable handle for one instanced bucket mesh
interface BucketMesh {
  mesh: THREE.InstancedMesh;
  x: number;
  z: number;
  radius: number;
}

// Wind sway injection for foliage materials (canopy + grass cards). Phase
// comes from the instance's world origin so neighbouring trees desynchronise.
function addWind(mat: THREE.Material, strength: number): void {
  if (!GFX.windSway) return;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = sharedUniforms.uTime;
    sh.uniforms.uWindStrength = { value: strength };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;
        uniform float uWindStrength;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float windPhase = instanceMatrix[3][0] * 0.15 + instanceMatrix[3][2] * 0.17;
        #else
          float windPhase = 0.0;
        #endif
        float windAmt = (sin(uTime * 1.7 + windPhase) + 0.5 * sin(uTime * 3.1 + windPhase * 1.3))
          * uWindStrength * smoothstep(0.0, 1.0, transformed.y);
        transformed.x += windAmt;
        transformed.z += windAmt * 0.6;`);
  };
}

// 8-segment cone with the rim drooped down (fir-branch sag); needs height
// segments so the profile curves instead of just stretching.
function droopCone(radius: number, height: number, droop: number): THREE.BufferGeometry {
  const geo = new THREE.ConeGeometry(radius, height, 8, 3);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const radial = Math.hypot(pos.getX(i), pos.getZ(i)) / radius;
    pos.setY(i, pos.getY(i) - droop * radial * radial);
  }
  geo.computeVertexNormals();
  return geo;
}

// Sphere with one-time radial vertex noise so oak canopies aren't perfect
// balls. Hash keys off quantised position so seam/pole twins stay welded.
function noisyBlob(radius: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, 8, 6);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const qx = Math.round(x * 16) / 16, qy = Math.round(y * 16) / 16, qz = Math.round(z * 16) / 16;
    const s = 0.85 + 0.3 * hashAt(qx * 13.7, qy * 7.3 + qz * 31.1, 5);
    pos.setXYZ(i, x * s, y * s, z * s);
  }
  // radial displacement keeps the original (radial) normals serviceable
  return geo;
}

// biome tint + per-instance HSL jitter, deterministic from world position
function tintFor(d: Decoration, hex: number, out: THREE.Color, jitter = 1): THREE.Color {
  out.setHex(hex);
  out.offsetHSL(
    (hashAt(d.x, d.z, 1) - 0.5) * 0.09 * jitter,
    (hashAt(d.x, d.z, 2) - 0.5) * 0.18 * jitter,
    (hashAt(d.x, d.z, 3) - 0.5) * 0.12 * jitter,
  );
  return out;
}

// per-canopy-layer brightness baked as vertex colors (multiplies instanceColor)
function bakeShade(geo: THREE.BufferGeometry, v: number): THREE.BufferGeometry {
  const count = geo.attributes.position.count;
  const arr = new Float32Array(count * 3);
  arr.fill(v);
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

// darker under-canopy -> lit crown vertical gradient, multiplied over the
// per-layer shade — without it trees read as uniformly lit green jellies
function bakeVerticalShade(geo: THREE.BufferGeometry, dark = 0.62, light = 1.14): THREE.BufferGeometry {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const span = Math.max(1e-5, bb.max.y - bb.min.y);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const col = geo.attributes.color as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - bb.min.y) / span;
    const k = dark + (light - dark) * t * t * (3 - 2 * t);
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
  return geo;
}

// ---------------------------------------------------------------------------
// Trees & rocks
// ---------------------------------------------------------------------------

function buildTrees(parent: THREE.Group, seed: number, registry: BucketMesh[]): void {
  const usePbr = GFX.standardMaterials;
  const decos = generateDecorations(seed);
  const buckets = new Map<string, Decoration[]>();
  for (const d of decos) {
    const col = d.x < 0 ? 0 : 1;
    const band = Math.floor((d.z - WORLD_MIN_Z) / BUCKET_DEPTH);
    const key = `${band}:${col}`;
    const list = buckets.get(key);
    if (list) list.push(d);
    else buckets.set(key, [d]);
  }

  // materials shared across every bucket (tint lives on instanceColor)
  const trunkMat = usePbr
    ? (() => {
      const bark = barkMaps();
      return surfaceMat({ map: bark.map, normalMap: bark.normalMap, roughness: 0.95 });
    })()
    : new THREE.MeshLambertMaterial({ map: barkTexture() });
  const leafTex = foliageTexture(usePbr); // high-contrast leaf clusters on the lit tiers
  // double the tiling on canopies: the native cone/sphere UVs stretched the
  // 128px detail into long diagonal smears on big canopy faces
  if (usePbr) leafTex.repeat.set(2, 2);
  // vertexColors carry the per-canopy-layer shading (the cone stack / blob
  // cluster is one merged geometry = one draw per bucket)
  const leafMat = usePbr
    ? new THREE.MeshStandardMaterial({ map: leafTex, roughness: 0.9, vertexColors: true })
    : new THREE.MeshLambertMaterial({ map: leafTex, vertexColors: true });
  addWind(leafMat, TREE_WIND_STRENGTH);
  let cardMat: THREE.Material | null = null;
  if (usePbr) {
    cardMat = new THREE.MeshStandardMaterial({
      map: foliageCardTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9,
    });
    addWind(cardMat, TREE_WIND_STRENGTH);
  }
  const rockMat = usePbr
    ? new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1.0 })
    : new THREE.MeshLambertMaterial({ flatShading: true });

  // shared geometries — canopies are pre-merged stacks (one draw per bucket);
  // internal offsets are in local units, so the uniform instance scale keeps
  // the original proportions
  const pineTrunkGeo = new THREE.CylinderGeometry(0.22, 0.42, 2.6, 6);
  const pineCanopyGeo = bakeVerticalShade(mergeGeometries([
    bakeShade(droopCone(2.4, 3.2, 0.42), 1.0),
    bakeShade(droopCone(1.85, 2.7, 0.32).translate(0, 1.7, 0), 1.16),
    bakeShade(droopCone(1.25, 2.2, 0.2).translate(0, 3.2, 0), 1.0),
  ]), 0.68, 1.12);
  let cardGeo: THREE.BufferGeometry | null = null;
  if (usePbr) {
    const p1 = bakeShade(new THREE.PlaneGeometry(4.6, 2.5), 1.0);
    const p2 = p1.clone().rotateY(Math.PI / 2);
    cardGeo = mergeGeometries([p1, p2]);
  }
  const oakTrunkGeo = new THREE.CylinderGeometry(0.28, 0.5, 2.8, 6);
  const oakCanopyGeo = bakeVerticalShade(mergeGeometries([
    bakeShade(noisyBlob(2.2).applyMatrix4(new THREE.Matrix4().makeScale(1, 0.8, 1)), 1.0),
    bakeShade(noisyBlob(1.5).applyMatrix4(new THREE.Matrix4().makeScale(1, 0.7, 1)).translate(1.1, -0.7, 0.4), 1.12),
    bakeShade(noisyBlob(1.45).applyMatrix4(new THREE.Matrix4().makeScale(0.95, 0.7, 0.95)).translate(-1.05, -0.45, -0.35), 0.94),
    bakeShade(noisyBlob(1.2).applyMatrix4(new THREE.Matrix4().makeScale(0.9, 0.75, 0.9)).translate(0.25, 0.9, -0.3), 1.06),
  ]), 0.6, 1.12);
  const rockGeo = new THREE.DodecahedronGeometry(0.9, 0);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const v = new THREE.Vector3();
  const sv = new THREE.Vector3();
  const c = new THREE.Color();

  for (const items of buckets.values()) {
    const pines = items.filter((d) => d.kind === 'tree');
    const oaks = items.filter((d) => d.kind === 'tree2');
    const rocks = items.filter((d) => d.kind === 'rock');

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const d of items) {
      minX = Math.min(minX, d.x);
      maxX = Math.max(maxX, d.x);
      minZ = Math.min(minZ, d.z);
      maxZ = Math.max(maxZ, d.z);
    }
    const bx = (minX + maxX) / 2, bz = (minZ + maxZ) / 2;
    const bRadius = Math.hypot(maxX - minX, maxZ - minZ) / 2 + 18; // canopy margin
    const register = (mesh: THREE.InstancedMesh): void => {
      registry.push({ mesh, x: bx, z: bz, radius: bRadius });
    };

    if (pines.length > 0) {
      const trunk = new THREE.InstancedMesh(pineTrunkGeo, trunkMat, pines.length);
      const canopy = new THREE.InstancedMesh(pineCanopyGeo, leafMat, pines.length);
      const cards = cardGeo && cardMat ? new THREE.InstancedMesh(cardGeo, cardMat, pines.length) : null;
      pines.forEach((t, i) => {
        const y = terrainHeight(t.x, t.z, seed);
        const s = t.scale * 1.5;
        q.setFromAxisAngle(up, t.variant * 2.1);
        sv.set(s, s, s);
        m.compose(v.set(t.x, y + 1.3 * s, t.z), q, sv);
        trunk.setMatrixAt(i, m);
        m.compose(v.set(t.x, y + 3.6 * s, t.z), q, sv);
        canopy.setMatrixAt(i, m);
        cards?.setMatrixAt(i, m.compose(v.set(t.x, y + 4.7 * s, t.z), q, sv));
        tintFor(t, PINE_TINT[t.biome], c);
        canopy.setColorAt(i, c);
        cards?.setColorAt(i, c);
        trunk.setColorAt(i, tintFor(t, TRUNK_TINT[t.biome], c, 0.5));
      });
      canopy.castShadow = true; // trunks skip the shadow pass: the canopy owns it
      for (const im of [trunk, canopy]) {
        im.receiveShadow = true; // forests sit inside each other's shade
        parent.add(im);
        register(im);
      }
      if (cards) {
        cards.receiveShadow = true;
        parent.add(cards); // no shadow cast: the cones already cast one
        register(cards);
      }
    }

    if (oaks.length > 0) {
      const trunk = new THREE.InstancedMesh(oakTrunkGeo, trunkMat, oaks.length);
      const canopy = new THREE.InstancedMesh(oakCanopyGeo, leafMat, oaks.length);
      oaks.forEach((t, i) => {
        const y = terrainHeight(t.x, t.z, seed);
        const s = t.scale * 1.3;
        q.setFromAxisAngle(up, t.variant * 2.1);
        m.compose(v.set(t.x, y + 1.4 * s, t.z), q, sv.set(s, s, s));
        trunk.setMatrixAt(i, m);
        m.compose(v.set(t.x, y + 3.6 * s, t.z), q, sv);
        canopy.setMatrixAt(i, m);
        canopy.setColorAt(i, tintFor(t, OAK_TINT[t.biome], c));
        trunk.setColorAt(i, tintFor(t, TRUNK_TINT[t.biome], c, 0.5));
      });
      canopy.castShadow = true;
      for (const im of [trunk, canopy]) {
        im.receiveShadow = true;
        parent.add(im);
        register(im);
      }
    }

    if (rocks.length > 0) {
      const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, rocks.length);
      rocks.forEach((r, i) => {
        const y = terrainHeight(r.x, r.z, seed);
        q.setFromAxisAngle(up, r.variant * 1.7);
        m.compose(v.set(r.x, y + 0.3 * r.scale, r.z), q, sv.set(r.scale, r.scale * 0.7, r.scale));
        rockMesh.setMatrixAt(i, m);
        rockMesh.setColorAt(i, tintFor(r, ROCK_TINT[r.biome], c));
      });
      // no rock shadows cast: sub-pixel at typical camera range, real draw cost
      rockMesh.receiveShadow = true;
      parent.add(rockMesh);
      register(rockMesh);
    }
  }
}

// ---------------------------------------------------------------------------
// Grass ring
// ---------------------------------------------------------------------------

interface GrassRing {
  update(px: number, pz: number): void;
}

// wind sway + edge fade for the grass tufts; the fade keys off the tuft's
// instance origin so whole tufts dissolve cleanly against alphaTest
function applyGrassShader(
  mat: THREE.Material,
  uniforms: { uPlayerPos: { value: THREE.Vector2 }; uFadeFar: { value: number } },
): void {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = sharedUniforms.uTime;
    sh.uniforms.uPlayerPos = uniforms.uPlayerPos;
    sh.uniforms.uFadeFar = uniforms.uFadeFar;
    const wind = GFX.windSway
      ? `
        float windPhase = tuftBase.x * 0.31 + tuftBase.y * 0.27;
        float windAmt = (sin(uTime * 1.7 + windPhase) + 0.5 * sin(uTime * 3.1 + windPhase * 1.3))
          * ${GRASS_WIND_STRENGTH.toFixed(3)} * smoothstep(0.0, 0.7, transformed.y);
        transformed.x += windAmt;
        transformed.z += windAmt * 0.6;`
      : '';
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;
        varying vec2 vTuftWorld;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec2 tuftBase = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
        #else
          vec2 tuftBase = vec2(0.0);
        #endif
        ${wind}
        vTuftWorld = tuftBase;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vTuftWorld;
        uniform vec2 uPlayerPos;
        uniform float uFadeFar;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        diffuseColor.a *= 1.0 - smoothstep(uFadeFar * 0.7, uFadeFar, distance(vTuftWorld, uPlayerPos));`);
  };
}

function buildGrassRing(parent: THREE.Group, seed: number): GrassRing {
  const radius = GFX.grassRadius;
  const step = GFX.grassStep;
  const cells = Math.ceil((radius * 2) / step) + 2;
  const maxCount = Math.ceil(cells * cells * 0.5);

  // high tier reads as a lush meadow: wider tufts with more blades; low keeps
  // the legacy sprite size
  const lush = GFX.standardMaterials;
  const quad = new THREE.PlaneGeometry(lush ? 1.45 : 1.1, lush ? 0.9 : 0.7);
  quad.translate(0, lush ? 0.42 : 0.35, 0);
  const quad2 = quad.clone().rotateY(Math.PI / 2);
  const geo = mergeGeometries([quad, quad2]);

  const tuftTex = grassTuftTexture(lush ? 30 : 18);
  const uniforms = { uPlayerPos: { value: new THREE.Vector2(1e6, 1e6) }, uFadeFar: { value: radius } };
  const mat = lush
    ? new THREE.MeshStandardMaterial({
      map: tuftTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.9,
    })
    : new THREE.MeshLambertMaterial({
      map: tuftTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide,
    });
  applyGrassShader(mat, uniforms);

  const im = new THREE.InstancedMesh(geo, mat, maxCount);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false; // ring is centered on the player; bounds churn isn't worth it
  im.receiveShadow = true; // tufts must darken inside canopy shade, not glow through it
  im.count = 0;
  parent.add(im);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const v = new THREE.Vector3();
  const sv = new THREE.Vector3();
  const c = new THREE.Color();
  let lastX = Infinity;
  let lastZ = Infinity;

  const rebuild = (px: number, pz: number): void => {
    let n = 0;
    const i0 = Math.floor((px - radius) / step), i1 = Math.ceil((px + radius) / step);
    const j0 = Math.floor((pz - radius) / step), j1 = Math.ceil((pz + radius) / step);
    const r2 = radius * radius;
    for (let i = i0; i <= i1 && n < maxCount; i++) {
      for (let j = j0; j <= j1 && n < maxCount; j++) {
        const r = hashAt(i, j, 0);
        if (r > 0.5) continue; // ~half the cells grow a tuft
        const x = i * step + (hashAt(i, j, 1) - 0.5) * step * 1.4;
        const z = j * step + (hashAt(i, j, 2) - 0.5) * step * 1.4;
        const dx = x - px, dz = z - pz;
        if (dx * dx + dz * dz > r2) continue;
        if (Math.abs(x) > WORLD_MAX_X - 16 || z < WORLD_MIN_Z + 16 || z > WORLD_MAX_Z - 16) continue;
        const h = terrainHeight(x, z, seed);
        if (h < WATER_LEVEL + 1.6) continue;
        // no blades pasted onto cliff faces
        const hx = terrainHeight(x + GRASS_SLOPE_EPS, z, seed) - terrainHeight(x - GRASS_SLOPE_EPS, z, seed);
        const hz = terrainHeight(x, z + GRASS_SLOPE_EPS, seed) - terrainHeight(x, z - GRASS_SLOPE_EPS, seed);
        if (Math.hypot(hx, hz) / (2 * GRASS_SLOPE_EPS) > GRASS_MAX_SLOPE) continue;
        let nearHub = false;
        for (const zn of ZONES) {
          if (Math.hypot(x - zn.hub.x, z - zn.hub.z) < 15) { nearHub = true; break; }
        }
        if (nearHub) continue;
        if (roadDistance(x, z) < 3.2) continue;
        const s = (lush ? 0.55 : 0.45) + r * (lush ? 1.1 : 1);
        q.setFromAxisAngle(up, r * 12.4);
        m.compose(v.set(x, h, z), q, sv.set(s, s, s));
        im.setMatrixAt(n, m);
        c.setHex(GRASS_TINT[zoneBiomeAt(z)]);
        c.offsetHSL(
          (hashAt(i, j, 3) - 0.5) * 0.05,
          (hashAt(i, j, 4) - 0.5) * 0.12,
          (hashAt(i, j, 5) - 0.5) * 0.1,
        );
        im.setColorAt(n, c);
        n++;
      }
    }
    im.count = n;
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  };

  return {
    update(px: number, pz: number): void {
      uniforms.uPlayerPos.value.set(px, pz);
      if (px > DUNGEON_X_THRESHOLD) {
        // dungeon instances live far outside the strip — no meadow indoors
        if (im.count !== 0) im.count = 0;
        lastX = Infinity;
        return;
      }
      if (Math.hypot(px - lastX, pz - lastZ) > GRASS_REBUILD_DIST) {
        lastX = px;
        lastZ = pz;
        rebuild(px, pz);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function buildFoliage(seed: number): FoliageView {
  const group = new THREE.Group();
  group.name = 'foliage';
  const bucketMeshes: BucketMesh[] = [];
  buildTrees(group, seed, bucketMeshes);
  const grass = buildGrassRing(group, seed);
  return {
    group,
    update(px: number, pz: number, camX: number, camZ: number, fogFar: number): void {
      grass.update(px, pz);
      // buckets fully behind the fog wall are pure overdraw
      for (const b of bucketMeshes) {
        b.mesh.visible = Math.hypot(b.x - camX, b.z - camZ) - b.radius < fogFar;
      }
    },
  };
}
