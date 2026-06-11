import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Entity, MobFamily } from '../sim/types';
import { MOBS } from '../sim/data';
import { addRimGlow, GFX, surfaceMat } from './gfx';
import { clothNormalTexture } from './textures';

// Procedural character rigs. Every build function returns a group plus the
// animatable parts; the renderer drives walk/attack cycles.
//
// Builders assemble parts from throwaway flat-color Lambert meshes; a final
// merge pass (finalizeRig) bakes those colors into vertex colors and collapses
// everything under each animation pivot into one or two meshes sharing a
// handful of global materials (Standard + fresnel rim on the lit tiers,
// Lambert on low). A 20-draw humanoid becomes ~8 draws and every rig in the
// world shares the same few shader programs. Emissive details (eyes, orbs,
// flames) stay separate meshes via surfaceMat.

export interface RigParts {
  leftArm?: THREE.Object3D;
  rightArm?: THREE.Object3D;
  leftLeg?: THREE.Object3D;
  rightLeg?: THREE.Object3D;
  legs?: THREE.Object3D[]; // quadruped/spider legs (alternating phase by index)
  head?: THREE.Object3D;
  tail?: THREE.Object3D;
  flame?: THREE.Object3D; // kobold candle
}

export interface Rig {
  body: THREE.Group;
  parts: RigParts;
  kind: 'humanoid' | 'wolf' | 'boar' | 'spider' | 'murloc' | 'kobold' | 'skeleton' | 'sheep' | 'elemental' | 'dragonkin';
  height: number;
}

interface PlainOpts {
  flat?: boolean;
  /** sword blades / mace heads: metalness 0.6, roughness 0.4 after the merge */
  metal?: boolean;
  side?: THREE.Side;
}

// Throwaway flat-color part; finalizeRig() bakes the color into vertex colors
// and merges it away. userData.metal survives into the merge bucket.
function plain(geo: THREE.BufferGeometry, color: number, opts?: PlainOpts): THREE.Mesh {
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
    color, flatShading: opts?.flat === true, side: opts?.side ?? THREE.FrontSide,
  }));
  if (opts?.metal) m.userData.metal = true;
  m.castShadow = true;
  return m;
}

function box(w: number, h: number, d: number, color: number, opts?: PlainOpts): THREE.Mesh {
  return plain(new THREE.BoxGeometry(w, h, d), color, opts);
}

// ---------------------------------------------------------------------------
// Rig merge pass
// ---------------------------------------------------------------------------

// Shared merged-rig materials: (flat | metal | side | tier) -> one material
// for every rig in the world. Rim glow sells silhouettes on the lit tiers.
const rigMatCache = new Map<string, THREE.Material>();
let clothNormal: THREE.Texture | null = null;

function rigMergedMat(flat: boolean, metal: boolean, side: THREE.Side): THREE.Material {
  const key = `${flat ? 1 : 0}:${metal ? 1 : 0}:${side}:${GFX.standardMaterials ? 1 : 0}`;
  const cached = rigMatCache.get(key);
  if (cached) return cached;
  if (GFX.standardMaterials && !clothNormal) clothNormal = clothNormalTexture();
  const mat = GFX.standardMaterials
    ? new THREE.MeshStandardMaterial({
      vertexColors: true, flatShading: flat, side,
      roughness: metal ? 0.4 : 0.85, metalness: metal ? 0.6 : 0,
      // faint weave normal on cloth/skin so flat boxes pick up light texture
      normalMap: metal ? null : clothNormal,
      normalScale: new THREE.Vector2(0.45, 0.45),
    })
    : new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: flat, side });
  if (GFX.standardMaterials) addRimGlow(mat);
  rigMatCache.set(key, mat);
  return mat;
}

// plain Lambert color-only meshes can merge; emissive/textured ones cannot
function isMergeable(mesh: THREE.Mesh): boolean {
  if (Array.isArray(mesh.material)) return false;
  const mat = mesh.material;
  if (!(mat instanceof THREE.MeshLambertMaterial)) return false;
  if (mat.map || mat.transparent || mat.opacity < 1 || mat.vertexColors) return false;
  if (mat.emissive.r > 0 || mat.emissive.g > 0 || mat.emissive.b > 0) return false;
  return true;
}

// Bakes the part color into vertex colors with a cheap top-light AO: faces
// looking down sit in their own shade, top faces catch the sky. Sells contact
// and form on rigs without a real AO pass (GTAO is ultra-only).
function bakeColor(geo: THREE.BufferGeometry, color: THREE.Color): void {
  const count = geo.attributes.position.count;
  const normal = geo.attributes.normal as THREE.BufferAttribute | undefined;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const ny = normal ? normal.getY(i) : 0;
    const shade = ny >= 0 ? 1 + ny * 0.06 : 1 + ny * 0.2;
    arr[i * 3] = color.r * shade;
    arr[i * 3 + 1] = color.g * shade;
    arr[i * 3 + 2] = color.b * shade;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
}

// Collapse every plain mesh under each animation pivot (body root, arms,
// legs, head, tail) into one merged vertex-colored mesh per material class.
// Pivot transforms, RigParts and animations are untouched.
function finalizeRig(rig: Rig): Rig {
  const roots = new Set<THREE.Object3D>([rig.body]);
  const p = rig.parts;
  for (const node of [p.leftArm, p.rightArm, p.leftLeg, p.rightLeg, p.head, p.tail, p.flame]) {
    if (node) roots.add(node);
  }
  for (const leg of p.legs ?? []) roots.add(leg);

  interface Bucket {
    flat: boolean; metal: boolean; side: THREE.Side; castShadow: boolean;
    geoms: THREE.BufferGeometry[];
  }
  const byRoot = new Map<THREE.Object3D, Map<string, Bucket>>();
  const toRemove: THREE.Mesh[] = [];
  const rel = new THREE.Matrix4();

  rig.body.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !isMergeable(mesh)) return;
    const mat = mesh.material as THREE.MeshLambertMaterial;
    const flat = mat.flatShading === true;
    const metal = mesh.userData.metal === true;
    if (roots.has(mesh) || mesh.children.length > 0) {
      // pivots (quadruped legs, tails) and meshes carrying children stay put;
      // just upgrade them onto the shared vertex-colored material
      bakeColor(mesh.geometry, mat.color);
      mesh.material = rigMergedMat(flat, metal, mat.side);
      return;
    }
    // bake the transform relative to the nearest animation pivot
    rel.identity();
    let node: THREE.Object3D | null = mesh;
    while (node && !roots.has(node)) {
      node.updateMatrix();
      rel.premultiply(node.matrix);
      node = node.parent;
    }
    if (!node) return; // not parented under the rig (defensive)
    const key = `${flat ? 1 : 0}:${metal ? 1 : 0}:${mat.side}:${mesh.castShadow ? 1 : 0}`;
    let buckets = byRoot.get(node);
    if (!buckets) {
      buckets = new Map();
      byRoot.set(node, buckets);
    }
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { flat, metal, side: mat.side, castShadow: mesh.castShadow, geoms: [] };
      buckets.set(key, bucket);
    }
    const geo = mesh.geometry.clone().applyMatrix4(rel);
    bakeColor(geo, mat.color);
    bucket.geoms.push(geo);
    toRemove.push(mesh);
  });

  for (const mesh of toRemove) mesh.removeFromParent();
  for (const [root, buckets] of byRoot) {
    for (const bucket of buckets.values()) {
      const merged = mergeGeometries(bucket.geoms, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, rigMergedMat(bucket.flat, bucket.metal, bucket.side));
      mesh.castShadow = bucket.castShadow;
      root.add(mesh);
    }
  }
  return rig;
}

// Single-draw far LOD: the whole rig in its pristine pose merged into one
// static vertex-colored mesh. Beyond ~55u the articulated rig (and its 7+
// draws) swaps for this; emissive details are dropped (sub-pixel out there).
// Must be built BEFORE any animation runs so the pose is neutral.
export function buildFarRig(rig: Rig): THREE.Mesh | null {
  const geoms: THREE.BufferGeometry[] = [];
  const rel = new THREE.Matrix4();
  rig.body.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.Material;
    // only the shared vertex-colored merge materials participate
    if (Array.isArray(mat) || !(mat as THREE.MeshStandardMaterial).vertexColors) return;
    if (!mesh.geometry.attributes.color) return;
    rel.identity();
    let node: THREE.Object3D | null = mesh;
    while (node && node !== rig.body) {
      node.updateMatrix();
      rel.premultiply(node.matrix);
      node = node.parent;
    }
    if (!node) return;
    geoms.push(mesh.geometry.clone().applyMatrix4(rel));
  });
  if (geoms.length === 0) return null;
  const merged = mergeGeometries(geoms, false);
  if (!merged) return null;
  const mesh = new THREE.Mesh(merged, rigMergedMat(false, false, THREE.FrontSide));
  // never casts itself — the renderer clones it onto a shadow-only layer as a
  // single-draw proxy caster for everything past the articulated shadow gate
  mesh.castShadow = false;
  return mesh;
}

// Multiply each RGB channel of a hex color (f < 1 darkens, f > 1 lightens).
function shade(color: number, f: number): number {
  const r = Math.min(255, Math.round(((color >> 16) & 0xff) * f));
  const g = Math.min(255, Math.round(((color >> 8) & 0xff) * f));
  const b = Math.min(255, Math.round((color & 0xff) * f));
  return (r << 16) | (g << 8) | b;
}

const SKIN = 0xd9a47f;
const SKIN_DARK = 0xb9846a;

export function buildHumanoid(e: Entity, opts: {
  shirt: number; pants: number; skin?: number; hair?: number;
  weapon?: 'sword' | 'staff' | 'dagger' | 'pick' | 'mace' | 'bow' | 'none';
  shoulders?: boolean; hood?: boolean; robe?: boolean;
  /** class color: faint emissive glint on belt + shoulder pads */
  accent?: number;
}): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const skin = opts.skin ?? SKIN;
  const hair = opts.hair ?? 0x4a3320;
  const accentMat = (color: number): THREE.Material => surfaceMat({
    color, emissive: opts.accent, emissiveIntensity: 0.25, roughness: 0.85, rim: true,
  });

  // rounded torso (capsule squashed to the old box bounds — pivots unchanged)
  const torsoGeo = new THREE.CapsuleGeometry(0.42, 0.5, 3, 10);
  torsoGeo.scale(0.98, 0.69, 0.55);
  const torso = plain(torsoGeo, opts.shirt);
  torso.position.y = 1.46;
  body.add(torso);
  // belt
  const belt = opts.accent !== undefined
    ? new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.12, 0.5), accentMat(0x3b2a16))
    : box(0.86, 0.12, 0.5, 0x3b2a16);
  belt.castShadow = true;
  belt.position.y = 1.02;
  body.add(belt);

  const head = new THREE.Group();
  // flattened sphere skull reads human; hair caps stay boxy on purpose
  const skullGeo = new THREE.SphereGeometry(0.27, 10, 8);
  skullGeo.scale(0.88, 0.82, 0.88);
  const skull = plain(skullGeo, skin);
  head.add(skull);
  if (opts.hood) {
    const hood = box(0.54, 0.5, 0.52, opts.shirt);
    hood.position.y = 0.06;
    hood.position.z = -0.04;
    head.add(hood);
  } else {
    const hairCap = box(0.5, 0.16, 0.5, hair);
    hairCap.position.y = 0.24;
    head.add(hairCap);
    const hairBack = box(0.5, 0.3, 0.12, hair);
    hairBack.position.set(0, 0.08, -0.22);
    head.add(hairBack);
  }
  head.position.y = 2.18;
  parts.head = head;
  body.add(head);

  if (opts.shoulders) {
    for (const sx of [-1, 1]) {
      const pad = opts.accent !== undefined
        ? new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.4), accentMat(0x4d3a20))
        : box(0.32, 0.2, 0.4, 0x4d3a20);
      pad.castShadow = true;
      pad.position.set(sx * 0.56, 1.95, 0);
      body.add(pad);
    }
  }

  for (const sx of [-1, 1]) {
    const arm = new THREE.Group();
    const upper = box(0.22, 0.5, 0.24, opts.shirt);
    upper.position.y = -0.22;
    const lower = box(0.2, 0.42, 0.22, skin);
    lower.position.y = -0.66;
    const hand = box(0.18, 0.14, 0.2, SKIN_DARK);
    hand.position.y = -0.94;
    arm.add(upper, lower, hand);
    arm.position.set(sx * 0.55, 1.88, 0);
    if (sx === -1) parts.leftArm = arm; else parts.rightArm = arm;
    body.add(arm);

    const leg = new THREE.Group();
    const thigh = box(0.28, 0.5, 0.3, opts.robe ? opts.shirt : opts.pants);
    thigh.position.y = -0.24;
    const shin = box(0.26, 0.42, 0.28, opts.robe ? opts.shirt : opts.pants);
    shin.position.y = -0.68;
    const boot = box(0.28, 0.16, 0.36, 0x2c2014);
    boot.position.set(0, -0.92, 0.03);
    leg.add(thigh, shin, boot);
    leg.position.set(sx * 0.2, 1.0, 0);
    if (sx === -1) parts.leftLeg = leg; else parts.rightLeg = leg;
    body.add(leg);
  }

  // weapon in right hand
  const weapon = opts.weapon ?? 'sword';
  if (weapon !== 'none' && parts.rightArm) {
    let w: THREE.Object3D;
    if (weapon === 'staff') {
      const g = new THREE.Group();
      const shaft = box(0.1, 1.7, 0.1, 0x7a5230);
      g.add(shaft);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), surfaceMat({
        color: 0x69ccf0, emissive: 0x1b4f72,
        emissiveIntensity: GFX.standardMaterials ? 1.5 : 0.6, roughness: 0.4,
      }));
      orb.position.y = 0.92;
      g.add(orb);
      g.position.set(0.05, -0.85, 0.05);
      w = g;
    } else if (weapon === 'dagger') {
      const g = new THREE.Group();
      const blade = box(0.06, 0.5, 0.12, 0xc8ccd2, { metal: true });
      blade.position.y = -0.3;
      const hilt = box(0.16, 0.06, 0.1, 0x6b5a2a);
      const grip = box(0.07, 0.16, 0.08, 0x3b2a16);
      grip.position.y = 0.1;
      g.add(blade, hilt, grip);
      g.position.set(0, -0.95, 0.12);
      w = g;
    } else if (weapon === 'pick') {
      const g = new THREE.Group();
      const handle = box(0.07, 0.9, 0.07, 0x7a5230);
      const headBar = box(0.5, 0.09, 0.09, 0x8d8d85, { metal: true });
      headBar.position.y = 0.42;
      g.add(handle, headBar);
      g.position.set(0, -0.75, 0.1);
      w = g;
    } else if (weapon === 'mace') {
      const g = new THREE.Group();
      const handle = box(0.08, 0.8, 0.08, 0x6b4a2b);
      const head = box(0.26, 0.26, 0.26, 0x8d8d85, { metal: true });
      head.position.y = 0.42;
      g.add(handle, head);
      g.position.set(0, -0.8, 0.1);
      w = g;
    } else if (weapon === 'bow') {
      const g = new THREE.Group();
      const upper = box(0.06, 0.55, 0.1, 0x7a5230);
      upper.position.y = 0.26;
      upper.rotation.x = 0.35;
      const lower = box(0.06, 0.55, 0.1, 0x7a5230);
      lower.position.y = -0.26;
      lower.rotation.x = -0.35;
      const stringGeo = box(0.015, 0.95, 0.015, 0xd8d8c8);
      stringGeo.position.z = -0.17;
      g.add(upper, lower, stringGeo);
      g.position.set(0, -0.7, 0.1);
      g.rotation.z = Math.PI / 2.6;
      w = g;
    } else {
      const g = new THREE.Group();
      const blade = box(0.09, 0.85, 0.16, 0xc8ccd2, { metal: true });
      blade.position.y = -0.5;
      const guard = box(0.3, 0.07, 0.12, 0x8a6d2c, { metal: true });
      const grip = box(0.08, 0.2, 0.09, 0x3b2a16);
      grip.position.y = 0.13;
      g.add(blade, guard, grip);
      g.position.set(0, -0.95, 0.14);
      w = g;
    }
    w.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
    parts.rightArm.add(w);
  }

  return { body, parts, kind: 'humanoid', height: 2.6 };
}

export function buildWolf(e: Entity): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const fur = e.color;
  const furDark = 0x55595c;

  const torso = box(0.72, 0.68, 1.55, fur);
  torso.position.y = 0.88;
  body.add(torso);
  const chest = box(0.78, 0.6, 0.5, furDark);
  chest.position.set(0, 0.92, 0.55);
  body.add(chest);
  const head = new THREE.Group();
  const skull = box(0.48, 0.46, 0.5, fur);
  const snout = box(0.26, 0.24, 0.4, furDark);
  snout.position.set(0, -0.08, 0.4);
  const nose = box(0.12, 0.1, 0.06, 0x1a1a1a);
  nose.position.set(0, -0.04, 0.62);
  head.add(skull, snout, nose);
  for (const sx of [-0.15, 0.15]) {
    const ear = plain(new THREE.ConeGeometry(0.1, 0.26, 4), furDark);
    ear.position.set(sx, 0.32, 0);
    head.add(ear);
  }
  head.position.set(0, 1.18, 0.95);
  parts.head = head;
  body.add(head);
  const tail = box(0.14, 0.14, 0.65, furDark);
  tail.position.set(0, 1.05, -1.0);
  tail.rotation.x = 0.55;
  parts.tail = tail;
  body.add(tail);
  parts.legs = [];
  for (const [sx, sz] of [[-0.26, 0.55], [0.26, 0.55], [-0.26, -0.55], [0.26, -0.55]]) {
    const leg = box(0.18, 0.62, 0.18, furDark);
    leg.geometry.translate(0, -0.31, 0);
    leg.position.set(sx, 0.62, sz);
    parts.legs.push(leg);
    body.add(leg);
  }
  return { body, parts, kind: 'wolf', height: 1.6 };
}

export function buildBoar(e: Entity): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const hide = e.color;
  const torso = box(0.92, 0.8, 1.5, hide);
  torso.position.y = 0.74;
  body.add(torso);
  // bristle ridge
  const ridge = box(0.2, 0.18, 1.2, 0x5d3a10);
  ridge.position.y = 1.2;
  body.add(ridge);
  const head = new THREE.Group();
  const skull = box(0.6, 0.55, 0.55, hide);
  const snout = box(0.3, 0.26, 0.2, 0xc99b77);
  snout.position.set(0, -0.1, 0.36);
  head.add(skull, snout);
  for (const sx of [-0.18, 0.18]) {
    const tusk = box(0.07, 0.22, 0.07, 0xf0ead2);
    tusk.position.set(sx, -0.18, 0.34);
    tusk.rotation.x = -0.5;
    head.add(tusk);
    const ear = box(0.14, 0.16, 0.05, 0x7a4413);
    ear.position.set(sx * 1.6, 0.3, 0);
    head.add(ear);
  }
  head.position.set(0, 0.85, 0.92);
  parts.head = head;
  body.add(head);
  parts.legs = [];
  for (const [sx, sz] of [[-0.32, 0.5], [0.32, 0.5], [-0.32, -0.5], [0.32, -0.5]]) {
    const leg = box(0.2, 0.5, 0.2, 0x6e3d12);
    leg.geometry.translate(0, -0.25, 0);
    leg.position.set(sx, 0.5, sz);
    parts.legs.push(leg);
    body.add(leg);
  }
  return { body, parts, kind: 'boar', height: 1.45 };
}

export function buildSpider(e: Entity): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const chitin = e.color;
  const abdomen = plain(new THREE.SphereGeometry(0.62, 8, 6), chitin, { flat: true });
  abdomen.scale.set(1, 0.85, 1.25);
  abdomen.position.set(0, 0.92, -0.5);
  body.add(abdomen);
  const thorax = plain(new THREE.SphereGeometry(0.4, 8, 6), 0x2e1437, { flat: true });
  thorax.position.set(0, 0.82, 0.32);
  body.add(thorax);
  // eyes
  for (const sx of [-0.12, 0.12]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), surfaceMat({
      color: 0xff3333, emissive: 0x661111,
      emissiveIntensity: GFX.standardMaterials ? 1.4 : 1,
    }));
    eye.position.set(sx, 0.92, 0.66);
    body.add(eye);
  }
  // fangs
  for (const sx of [-0.1, 0.1]) {
    const fang = plain(new THREE.ConeGeometry(0.05, 0.18, 4), 0xd5d8dc);
    fang.position.set(sx, 0.66, 0.62);
    fang.rotation.x = Math.PI;
    body.add(fang);
  }
  parts.legs = [];
  for (let i = 0; i < 4; i++) {
    for (const sx of [-1, 1]) {
      const leg = new THREE.Group();
      const upper = box(0.07, 0.07, 0.62, 0x1d0a26);
      upper.position.z = 0.31;
      upper.rotation.y = 0;
      const lower = box(0.06, 0.5, 0.06, 0x1d0a26);
      lower.position.set(0, -0.2, 0.6);
      leg.add(upper, lower);
      leg.position.set(sx * 0.3, 0.85, 0.3 - i * 0.26);
      leg.rotation.y = sx * (0.6 + i * 0.25);
      parts.legs.push(leg);
      body.add(leg);
    }
  }
  return { body, parts, kind: 'spider', height: 1.4 };
}

export function buildMurloc(e: Entity): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const skin = e.color;
  const belly = 0xd9e4aa;

  const torso = box(0.6, 0.62, 0.45, skin);
  torso.position.y = 0.78;
  torso.rotation.x = 0.25; // hunched
  body.add(torso);
  const bellyPlate = box(0.42, 0.5, 0.1, belly);
  bellyPlate.position.set(0, 0.72, 0.22);
  bellyPlate.rotation.x = 0.25;
  body.add(bellyPlate);

  const head = new THREE.Group();
  const skull = plain(new THREE.SphereGeometry(0.36, 8, 6), skin, { flat: true });
  skull.scale.set(1.15, 0.9, 1);
  head.add(skull);
  for (const sx of [-0.16, 0.16]) {
    const eye = plain(new THREE.SphereGeometry(0.09, 6, 4), 0xfff2b0);
    eye.position.set(sx, 0.12, 0.26);
    head.add(eye);
    const pupil = plain(new THREE.SphereGeometry(0.04, 4, 4), 0x111111);
    pupil.position.set(sx, 0.12, 0.34);
    head.add(pupil);
  }
  const mouth = box(0.3, 0.06, 0.2, 0x7a3b2e);
  mouth.position.set(0, -0.12, 0.26);
  head.add(mouth);
  // head fin
  const fin = plain(new THREE.ConeGeometry(0.22, 0.4, 4), 0xe67e22, { side: THREE.DoubleSide });
  fin.scale.z = 0.3;
  fin.position.set(0, 0.34, -0.05);
  head.add(fin);
  head.position.set(0, 1.28, 0.12);
  parts.head = head;
  body.add(head);

  for (const sx of [-1, 1]) {
    const arm = box(0.14, 0.5, 0.16, skin);
    arm.geometry.translate(0, -0.22, 0);
    arm.position.set(sx * 0.4, 1.0, 0.1);
    arm.rotation.x = -0.5;
    if (sx === -1) parts.leftArm = arm; else parts.rightArm = arm;
    body.add(arm);
    const leg = box(0.18, 0.5, 0.2, skin);
    leg.geometry.translate(0, -0.25, 0);
    leg.position.set(sx * 0.18, 0.5, 0);
    if (sx === -1) parts.leftLeg = leg; else parts.rightLeg = leg;
    body.add(leg);
  }
  return { body, parts, kind: 'murloc', height: 1.7 };
}

export function buildKobold(e: Entity): Rig {
  const rig = buildHumanoid(e, {
    shirt: 0x6b4f33, pants: 0x4a3623, skin: e.color, hair: 0x3a2a18, weapon: 'pick',
  });
  rig.body.scale.setScalar(0.8);
  // rat snout
  const snout = box(0.2, 0.18, 0.3, e.color);
  snout.position.set(0, -0.06, 0.34);
  rig.parts.head!.add(snout);
  // ears
  for (const sx of [-0.2, 0.2]) {
    const ear = box(0.14, 0.2, 0.05, e.color);
    ear.position.set(sx, 0.3, 0);
    rig.parts.head!.add(ear);
  }
  // the iconic head candle
  const candle = box(0.12, 0.22, 0.12, 0xf5eee0);
  candle.position.set(0, 0.4, 0);
  rig.parts.head!.add(candle);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 5), surfaceMat({
    color: 0xffc04d, emissive: 0xff8800,
    emissiveIntensity: GFX.standardMaterials ? 2.0 : 1.2,
  }));
  flame.position.set(0, 0.6, 0);
  rig.parts.head!.add(flame);
  rig.parts.flame = flame;
  return { ...rig, kind: 'kobold', height: 2.1 };
}

export function buildSkeleton(e: Entity): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const bone = 0xe8e6da;
  const boneDark = 0xb9b5a3;

  // ribcage
  const rib = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const r = box(0.6 - i * 0.05, 0.07, 0.4 - i * 0.04, bone);
    r.position.y = 1.7 - i * 0.16;
    rib.add(r);
  }
  const spine = box(0.09, 0.85, 0.09, boneDark);
  spine.position.y = 1.42;
  rib.add(spine);
  const pelvis = box(0.42, 0.18, 0.3, bone);
  pelvis.position.y = 1.0;
  rib.add(pelvis);
  body.add(rib);

  const head = new THREE.Group();
  const skull = box(0.42, 0.4, 0.42, bone);
  head.add(skull);
  for (const sx of [-0.1, 0.1]) {
    const eye = box(0.1, 0.12, 0.05, 0x111111);
    eye.position.set(sx, 0.04, 0.2);
    head.add(eye);
  }
  const jaw = box(0.3, 0.1, 0.3, boneDark);
  jaw.position.set(0, -0.24, 0.02);
  head.add(jaw);
  head.position.y = 2.12;
  parts.head = head;
  body.add(head);

  for (const sx of [-1, 1]) {
    const arm = box(0.09, 0.85, 0.09, bone);
    arm.geometry.translate(0, -0.38, 0);
    arm.position.set(sx * 0.42, 1.85, 0);
    if (sx === -1) parts.leftArm = arm; else parts.rightArm = arm;
    body.add(arm);
    const leg = box(0.1, 0.92, 0.1, bone);
    leg.geometry.translate(0, -0.44, 0);
    leg.position.set(sx * 0.16, 0.95, 0);
    if (sx === -1) parts.leftLeg = leg; else parts.rightLeg = leg;
    body.add(leg);
  }
  // rusty sword
  const blade = box(0.07, 0.7, 0.12, 0x7d6b4e);
  blade.position.set(0, -0.85, 0.12);
  parts.rightArm!.add(blade);
  return { body, parts, kind: 'skeleton', height: 2.5 };
}

// Hunched marsh troll: stooped spine, arms past the knees, tusked jaw, mossy
// back. Head pivot stays at the humanoid idle height (2.18) with the skull
// hung low and forward inside the group so the hunch reads while the biped
// idle/walk animation still works.
export function buildTroll(e: Entity): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const skin = e.color;
  const skinDark = shade(skin, 0.7);
  const moss = shade(skin, 0.55);

  // torso pitched forward
  const torso = box(0.85, 0.95, 0.5, skin);
  torso.position.set(0, 1.5, 0.06);
  torso.rotation.x = 0.32;
  body.add(torso);
  // mossy back hump
  const hump = box(0.62, 0.3, 0.46, moss);
  hump.position.set(0, 1.9, -0.16);
  hump.rotation.x = 0.32;
  body.add(hump);
  // ragged loincloth
  const cloth = box(0.7, 0.42, 0.52, 0x5d4a30);
  cloth.position.y = 0.9;
  body.add(cloth);

  const head = new THREE.Group();
  const skull = box(0.44, 0.4, 0.46, skin);
  skull.position.set(0, -0.42, 0.3);
  head.add(skull);
  const jaw = box(0.38, 0.14, 0.2, skinDark);
  jaw.position.set(0, -0.6, 0.42);
  head.add(jaw);
  const nose = box(0.12, 0.18, 0.14, skinDark);
  nose.position.set(0, -0.44, 0.56);
  head.add(nose);
  for (const sx of [-0.14, 0.14]) {
    const tusk = box(0.07, 0.22, 0.07, 0xf0ead2);
    tusk.position.set(sx, -0.5, 0.5);
    tusk.rotation.x = -0.25;
    head.add(tusk);
    const ear = box(0.06, 0.26, 0.18, skinDark);
    ear.position.set(sx * 2.0, -0.34, 0.12);
    head.add(ear);
  }
  head.position.y = 2.18;
  parts.head = head;
  body.add(head);

  for (const sx of [-1, 1]) {
    // long arms, knuckles past the knees
    const arm = new THREE.Group();
    const upper = box(0.24, 0.62, 0.26, skin);
    upper.position.y = -0.28;
    const lower = box(0.2, 0.6, 0.22, moss);
    lower.position.y = -0.88;
    const hand = box(0.24, 0.2, 0.26, skinDark);
    hand.position.y = -1.24;
    arm.add(upper, lower, hand);
    arm.position.set(sx * 0.58, 1.82, 0.1);
    if (sx === -1) parts.leftArm = arm; else parts.rightArm = arm;
    body.add(arm);

    // short bandy legs
    const leg = new THREE.Group();
    const thigh = box(0.3, 0.46, 0.32, skin);
    thigh.position.y = -0.2;
    const shin = box(0.26, 0.4, 0.28, skinDark);
    shin.position.y = -0.62;
    const foot = box(0.3, 0.14, 0.42, skinDark);
    foot.position.set(0, -0.86, 0.08);
    leg.add(thigh, shin, foot);
    leg.position.set(sx * 0.24, 0.94, 0);
    if (sx === -1) parts.leftLeg = leg; else parts.rightLeg = leg;
    body.add(leg);
  }

  return { body, parts, kind: 'humanoid', height: 2.4 };
}

// Massive ogre: barrel torso, swinging belly, tiny head sunk between the
// shoulders, knotted club in the right fist. Standard biped parts.
export function buildOgre(e: Entity): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const skin = e.color;
  const skinDark = shade(skin, 0.72);

  const torso = box(1.2, 1.15, 0.72, skin);
  torso.position.y = 1.58;
  body.add(torso);
  const belly = box(0.92, 0.68, 0.3, shade(skin, 1.18));
  belly.position.set(0, 1.3, 0.34);
  body.add(belly);
  const belt = box(1.24, 0.18, 0.76, 0x4d3a20);
  belt.position.y = 0.98;
  body.add(belt);

  const head = new THREE.Group();
  const skull = box(0.36, 0.34, 0.38, skin);
  skull.position.y = 0.14;
  head.add(skull);
  const jaw = box(0.34, 0.12, 0.18, skinDark);
  jaw.position.set(0, -0.02, 0.14);
  head.add(jaw);
  for (const sx of [-0.1, 0.1]) {
    const tusk = box(0.06, 0.16, 0.06, 0xf0ead2);
    tusk.position.set(sx, 0.06, 0.2);
    head.add(tusk);
  }
  head.position.y = 2.18;
  parts.head = head;
  body.add(head);

  for (const sx of [-1, 1]) {
    const arm = new THREE.Group();
    const upper = box(0.36, 0.6, 0.38, skin);
    upper.position.y = -0.26;
    const lower = box(0.32, 0.52, 0.34, skinDark);
    lower.position.y = -0.78;
    const fist = box(0.3, 0.24, 0.32, skinDark);
    fist.position.y = -1.06;
    arm.add(upper, lower, fist);
    arm.position.set(sx * 0.82, 2.0, 0);
    if (sx === -1) parts.leftArm = arm; else parts.rightArm = arm;
    body.add(arm);

    const leg = new THREE.Group();
    const thigh = box(0.4, 0.52, 0.42, skin);
    thigh.position.y = -0.24;
    const shin = box(0.36, 0.42, 0.38, skinDark);
    shin.position.y = -0.7;
    const foot = box(0.4, 0.16, 0.5, 0x3b2a16);
    foot.position.set(0, -0.94, 0.05);
    leg.add(thigh, shin, foot);
    leg.position.set(sx * 0.3, 1.02, 0);
    if (sx === -1) parts.leftLeg = leg; else parts.rightLeg = leg;
    body.add(leg);
  }

  // knotted club, head-down like the other hand weapons
  const club = new THREE.Group();
  const handle = box(0.12, 1.0, 0.12, 0x6b4a2b);
  const clubHead = box(0.34, 0.5, 0.34, 0x55432c);
  clubHead.position.y = -0.62;
  club.add(handle, clubHead);
  club.position.set(0, -0.95, 0.2);
  parts.rightArm!.add(club);

  return { body, parts, kind: 'humanoid', height: 2.8 };
}

// Elemental: a glowing core orbited by five floating rock chunks. No limbs,
// so the renderer skips walk animation — that is fine for a drifting rock.
export function buildElemental(e: Entity): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 10, 8),
    surfaceMat({ color: e.color, emissive: e.color, emissiveIntensity: GFX.standardMaterials ? 1.5 : 0.9 }),
  );
  core.position.y = 1.25;
  body.add(core);
  const rock = shade(e.color, 0.45);
  const chunks: [number, number, number, number][] = [
    [0.72, 1.05, 0.18, 0.3], [-0.6, 1.5, -0.3, 0.26], [0.2, 1.85, -0.5, 0.22],
    [-0.45, 0.85, 0.5, 0.34], [0.5, 1.6, 0.55, 0.2],
  ];
  for (const [x, y, z, r] of chunks) {
    const chunk = plain(new THREE.DodecahedronGeometry(r, 0), rock, { flat: true });
    chunk.position.set(x, y, z);
    chunk.rotation.set(x * 3, y * 3, z * 3); // varied tumble per chunk
    body.add(chunk);
  }
  return { body, parts, kind: 'elemental', height: 2.2 };
}

// Dragonkin wyrm: long neck and horned head, flat bone-plane wings, four
// legs (quadruped anim), ridged tail. Korzul wears it at scale 1.8, the
// sanctum drakonid at 0.8 — both via the template scale hint.
export function buildDragonkin(e: Entity): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const scales = e.color;
  const plate = shade(scales, 0.6);
  const belly = shade(scales, 1.35);

  // long low torso
  const torso = box(0.95, 0.8, 2.0, scales);
  torso.position.y = 1.1;
  body.add(torso);
  const bellyPlate = box(0.7, 0.25, 1.7, belly);
  bellyPlate.position.set(0, 0.72, 0.1);
  body.add(bellyPlate);
  // dorsal ridge
  for (let i = 0; i < 4; i++) {
    const ridge = plain(new THREE.ConeGeometry(0.13, 0.3, 4), plate, { flat: true });
    ridge.position.set(0, 1.56, 0.7 - i * 0.45);
    body.add(ridge);
  }

  // neck rising from the chest
  const neck = box(0.42, 0.42, 1.0, scales);
  neck.position.set(0, 1.62, 1.18);
  neck.rotation.x = -0.7;
  body.add(neck);

  // horned head at the end of the neck; head pivot drives the bite anim
  const head = new THREE.Group();
  const skull = box(0.46, 0.4, 0.6, scales);
  skull.position.z = 0.1;
  head.add(skull);
  const snout = box(0.3, 0.26, 0.45, plate);
  snout.position.set(0, -0.06, 0.55);
  head.add(snout);
  const jaw = box(0.26, 0.1, 0.4, shade(scales, 0.5));
  jaw.position.set(0, -0.22, 0.5);
  head.add(jaw);
  for (const sx of [-0.16, 0.16]) {
    const horn = plain(new THREE.ConeGeometry(0.08, 0.42, 5), 0xd8cfb8);
    horn.position.set(sx, 0.24, -0.18);
    horn.rotation.x = -0.8;
    head.add(horn);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), surfaceMat({
      color: 0xffc24d, emissive: 0xff8a00,
      emissiveIntensity: GFX.standardMaterials ? 2.0 : 1.4,
    }));
    eye.position.set(sx, 0.06, 0.42);
    head.add(eye);
  }
  head.position.set(0, 2.05, 1.62);
  parts.head = head;
  body.add(head);

  // flat bone-plane wings, raised and swept back
  for (const sx of [-1, 1]) {
    const wing = new THREE.Group();
    const membrane = plain(new THREE.PlaneGeometry(1.45, 0.95), plate, { side: THREE.DoubleSide });
    membrane.rotation.x = -Math.PI / 2;
    membrane.position.set(sx * 0.78, 0, -0.1);
    wing.add(membrane);
    const spar = box(1.5, 0.05, 0.08, shade(scales, 0.45));
    spar.position.set(sx * 0.75, 0.03, 0.32);
    wing.add(spar);
    wing.position.set(sx * 0.45, 1.55, 0.1);
    wing.rotation.z = sx * 0.35;
    wing.rotation.y = sx * 0.4;
    body.add(wing);
  }

  // four legs for the quadruped walk cycle
  parts.legs = [];
  for (const [sx, sz] of [[-0.42, 0.7], [0.42, 0.7], [-0.42, -0.7], [0.42, -0.7]]) {
    const leg = box(0.24, 0.78, 0.26, plate);
    leg.geometry.translate(0, -0.39, 0);
    leg.position.set(sx, 0.78, sz);
    parts.legs.push(leg);
    body.add(leg);
  }

  // ridged tail; the outer pivot pre-rotates against the renderer's 0.55 base
  // sway so the tail trails low instead of sticking up like a wolf's
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 1.15, -1.0);
  tailPivot.rotation.x = -0.45;
  const tail = new THREE.Group();
  const seg1 = box(0.4, 0.34, 0.8, scales);
  seg1.position.z = -0.35;
  const seg2 = box(0.28, 0.24, 0.7, scales);
  seg2.position.z = -0.95;
  const tailSpike = plain(new THREE.ConeGeometry(0.1, 0.38, 4), plate, { flat: true });
  tailSpike.position.set(0, 0.02, -1.4);
  tailSpike.rotation.x = -Math.PI / 2;
  tail.add(seg1, seg2, tailSpike);
  tailPivot.add(tail);
  parts.tail = tail;
  body.add(tailPivot);

  return { body, parts, kind: 'dragonkin', height: 2.4 };
}

// Druid bear form: a stout brown quadruped on the wolf rig pattern.
export function buildBear(): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const fur = 0x6e4a2a;
  const furDark = 0x4f3115;
  const torso = box(1.0, 0.95, 1.8, fur);
  torso.position.y = 1.0;
  body.add(torso);
  const head = new THREE.Group();
  const skull = box(0.6, 0.55, 0.6, fur);
  const snout = box(0.3, 0.26, 0.32, furDark);
  snout.position.set(0, -0.1, 0.42);
  head.add(skull, snout);
  for (const sx of [-0.2, 0.2]) {
    const ear = box(0.16, 0.16, 0.08, furDark);
    ear.position.set(sx, 0.36, 0);
    head.add(ear);
  }
  head.position.set(0, 1.35, 1.05);
  parts.head = head;
  body.add(head);
  parts.legs = [];
  for (const [sx, sz] of [[-0.36, 0.62], [0.36, 0.62], [-0.36, -0.62], [0.36, -0.62]]) {
    const leg = box(0.26, 0.7, 0.26, furDark);
    leg.geometry.translate(0, -0.35, 0);
    leg.position.set(sx, 0.7, sz);
    parts.legs.push(leg);
    body.add(leg);
  }
  return finalizeRig({ body, parts, kind: 'wolf', height: 1.9 });
}

// Polymorph form
export function buildSheep(): Rig {
  const body = new THREE.Group();
  const parts: RigParts = {};
  const wool = plain(new THREE.SphereGeometry(0.5, 8, 6), 0xf2f0e6, { flat: true });
  wool.scale.set(1, 0.85, 1.3);
  wool.position.y = 0.72;
  body.add(wool);
  const head = new THREE.Group();
  const skull = box(0.3, 0.3, 0.34, 0x2c2c2c);
  head.add(skull);
  for (const sx of [-0.12, 0.12]) {
    const ear = box(0.12, 0.07, 0.05, 0x2c2c2c);
    ear.position.set(sx * 1.5, 0.08, 0);
    head.add(ear);
  }
  head.position.set(0, 0.92, 0.62);
  parts.head = head;
  body.add(head);
  parts.legs = [];
  for (const [sx, sz] of [[-0.2, 0.35], [0.2, 0.35], [-0.2, -0.35], [0.2, -0.35]]) {
    const leg = box(0.1, 0.4, 0.1, 0x2c2c2c);
    leg.geometry.translate(0, -0.2, 0);
    leg.position.set(sx, 0.42, sz);
    parts.legs.push(leg);
    body.add(leg);
  }
  return finalizeRig({ body, parts, kind: 'sheep', height: 1.2 });
}

// Generic armed humanoid — the family default for 'humanoid' mobs and the
// fallback for any template the renderer does not recognise.
function buildGenericHumanoid(e: Entity, hood = false): Rig {
  return buildHumanoid(e, { shirt: e.color, pants: 0x33302b, weapon: 'sword', hood });
}

// One rig builder per mob family; individual templates only override below
// where their look differs from the family default.
const FAMILY_BUILDERS: Record<MobFamily, (e: Entity) => Rig> = {
  beast: buildWolf,
  humanoid: (e) => buildGenericHumanoid(e),
  murloc: buildMurloc,
  spider: buildSpider,
  kobold: buildKobold,
  undead: buildSkeleton,
  troll: buildTroll,
  ogre: buildOgre,
  elemental: buildElemental,
  dragonkin: buildDragonkin,
};

const MOB_OVERRIDES: Record<string, (e: Entity) => Rig> = {
  wild_boar: buildBoar,
  old_greyjaw: (e) => {
    // hulking grizzled wolf: extra bulk on top of the template scale hint,
    // plus a dark battle-worn ruff across the shoulders
    const rig = buildWolf(e);
    rig.body.scale.multiplyScalar(1.08);
    const ruff = box(0.92, 0.34, 0.6, 0x2f3436);
    ruff.position.set(0, 1.18, 0.45);
    rig.body.add(ruff);
    return rig;
  },
  gorrak: (e) => {
    const rig = buildHumanoid(e, { shirt: e.color, pants: 0x2c1a33, weapon: 'sword', shoulders: true });
    // boss spikes
    for (const sx of [-1, 1]) {
      const spike = plain(new THREE.ConeGeometry(0.16, 0.45, 5), 0x2c2c34);
      spike.position.set(sx * 0.56, 2.15, 0);
      rig.body.add(spike);
    }
    return rig;
  },
  vale_bandit: (e) => buildGenericHumanoid(e, true),
};

export function buildRigFor(e: Entity): Rig {
  if (e.kind === 'mob') {
    const override = MOB_OVERRIDES[e.templateId];
    if (override) return finalizeRig(override(e));
    const family = MOBS[e.templateId]?.family;
    const builder = family ? FAMILY_BUILDERS[family] : undefined;
    return finalizeRig((builder ?? buildGenericHumanoid)(e));
  }
  if (e.kind === 'player') {
    const cls = e.templateId;
    const robed = cls === 'mage' || cls === 'priest' || cls === 'warlock';
    const weapon: 'sword' | 'staff' | 'dagger' | 'mace' | 'bow' =
      cls === 'rogue' ? 'dagger'
        : cls === 'hunter' ? 'bow'
          : cls === 'paladin' || cls === 'shaman' ? 'mace'
            : robed || cls === 'druid' ? 'staff'
              : 'sword';
    return finalizeRig(buildHumanoid(e, {
      shirt: e.color,
      pants: robed ? e.color : 0x33302b,
      weapon,
      shoulders: cls === 'warrior' || cls === 'paladin' || cls === 'shaman',
      robe: robed,
      hair: 0x6b4423,
      accent: e.color,
    }));
  }
  // npcs
  const npcWeapons: Record<string, 'sword' | 'staff' | 'none' | 'pick' | 'mace' | 'bow'> = {
    marshal_redbrook: 'sword', brother_aldric: 'staff', foreman_odell: 'pick',
    // Fenbridge (zone 2)
    warden_fenwick: 'sword', scout_maren: 'bow', brother_aldric_fen: 'staff', smith_haldren: 'mace',
    // Highwatch (zone 3)
    captain_thessaly: 'sword', scout_maren_highwatch: 'bow', armorer_hode: 'mace',
    loremaster_caddis: 'staff', brother_aldric_highwatch: 'staff',
  };
  return finalizeRig(buildHumanoid(e, {
    shirt: e.color,
    pants: 0x4a4138,
    weapon: npcWeapons[e.templateId] ?? 'none',
    // Brother Aldric recurs in every zone hub under new ids; keep him robed
    robe: e.templateId.startsWith('brother_aldric'),
    hair: 0x7a6a50,
  }));
}
