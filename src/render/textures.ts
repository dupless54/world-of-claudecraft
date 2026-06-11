import * as THREE from 'three';

// Procedurally generated canvas textures — no external assets.

function makeCanvas(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let seedState = 12345;
function rnd(): number {
  seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
  return seedState / 0x7fffffff;
}

// Mottled detail texture multiplied over terrain vertex colors.
export function groundDetailTexture(): THREE.CanvasTexture {
  return makeCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#b8b8b8';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 5000; i++) {
      const v = 150 + Math.floor(rnd() * 105);
      ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
      const x = rnd() * s, y = rnd() * s;
      const r = 1 + rnd() * 2.5;
      ctx.fillRect(x, y, r, r);
    }
    // blades
    for (let i = 0; i < 1400; i++) {
      const v = 120 + Math.floor(rnd() * 100);
      ctx.strokeStyle = `rgba(${v},${v},${v},0.30)`;
      const x = rnd() * s, y = rnd() * s;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * 3, y - 2 - rnd() * 4);
      ctx.stroke();
    }
  });
}

export function barkTexture(): THREE.CanvasTexture {
  return makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 4 + Math.floor(rnd() * 6)) {
      const w = 2 + rnd() * 3;
      const shade = rnd() > 0.5 ? 'rgba(40,24,12,0.5)' : 'rgba(120,90,55,0.45)';
      ctx.fillStyle = shade;
      ctx.fillRect(x, 0, w, s);
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = 'rgba(30,18,8,0.5)';
      ctx.fillRect(rnd() * s, rnd() * s, 2, 6 + rnd() * 14);
    }
  });
}

export function foliageTexture(detail = false): THREE.CanvasTexture {
  return makeCanvas(128, (ctx, s) => {
    // olive-forest base — the old lime palette read as neon under the grade
    ctx.fillStyle = '#34512f';
    ctx.fillRect(0, 0, s, s);
    if (detail) {
      // shadowed cavities first so leaves overlap them; kept small so the
      // canopy UVs can't smear them into long diagonal streaks
      for (let i = 0; i < 110; i++) {
        const x = rnd() * s, y = rnd() * s, r = 3 + rnd() * 7;
        ctx.fillStyle = `rgba(${10 + rnd() * 12},${28 + rnd() * 16},${14 + rnd() * 10},0.5)`;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.75, rnd() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const leaves = detail ? 1500 : 900;
    for (let i = 0; i < leaves; i++) {
      const g = detail ? 60 + Math.floor(rnd() * 75) : 70 + Math.floor(rnd() * 60);
      ctx.fillStyle = `rgba(${30 + rnd() * 30},${g},${30 + rnd() * 18},${detail ? 0.6 : 0.5})`;
      const x = rnd() * s, y = rnd() * s;
      ctx.beginPath();
      ctx.ellipse(x, y, 1 + rnd() * 3, 3 + rnd() * 5, rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    if (detail) {
      // sun-catching highlight leaves — warm olive, not lime
      for (let i = 0; i < 200; i++) {
        const x = rnd() * s, y = rnd() * s;
        ctx.fillStyle = `rgba(${95 + rnd() * 40},${145 + rnd() * 40},${70 + rnd() * 28},0.45)`;
        ctx.beginPath();
        ctx.ellipse(x, y, 1 + rnd() * 2, 2.5 + rnd() * 4, rnd() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

export function roofTexture(): THREE.CanvasTexture {
  return makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#8a4a2f';
    ctx.fillRect(0, 0, s, s);
    const rowH = 16;
    for (let y = 0; y < s; y += rowH) {
      const offset = (y / rowH) % 2 === 0 ? 0 : 16;
      ctx.fillStyle = 'rgba(40,16,8,0.55)';
      ctx.fillRect(0, y + rowH - 2, s, 2);
      for (let x = -16; x < s; x += 32) {
        ctx.fillStyle = 'rgba(40,16,8,0.4)';
        ctx.fillRect(x + offset, y, 2, rowH);
        const v = rnd();
        if (v > 0.6) {
          ctx.fillStyle = 'rgba(255,200,160,0.07)';
          ctx.fillRect(x + offset + 2, y, 30, rowH - 2);
        }
      }
    }
  });
}

// Plaster with timber framing
export function wallTexture(): THREE.CanvasTexture {
  return makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#d6c4a0';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1200; i++) {
      const v = 190 + Math.floor(rnd() * 40);
      ctx.fillStyle = `rgba(${v},${v - 15},${v - 45},0.3)`;
      ctx.fillRect(rnd() * s, rnd() * s, 2, 2);
    }
    ctx.fillStyle = '#5a4226';
    ctx.fillRect(0, 0, s, 8);
    ctx.fillRect(0, s - 8, s, 8);
    ctx.fillRect(0, 0, 8, s);
    ctx.fillRect(s - 8, 0, 8, s);
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-s, -4, s * 2, 8);
    ctx.restore();
  });
}

export function stoneTexture(): THREE.CanvasTexture {
  return makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#8d8d85';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 28; i++) {
      const x = rnd() * s, y = rnd() * s, w = 14 + rnd() * 26, h = 10 + rnd() * 16;
      const v = 115 + Math.floor(rnd() * 50);
      ctx.fillStyle = `rgb(${v},${v},${v - 6})`;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(40,40,38,0.6)';
      ctx.strokeRect(x, y, w, h);
    }
  });
}

export function waterNormalish(): THREE.CanvasTexture {
  const tex = makeCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#7f7fff';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 300; i++) {
      const x = rnd() * s, y = rnd() * s, r = 6 + rnd() * 22;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${100 + rnd() * 80},${100 + rnd() * 80},255,0.25)`);
      g.addColorStop(1, 'rgba(127,127,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

// Soft round cloud sprite. Vary puff count/spread for distinct cloud shapes.
export function cloudTexture(puffs = 14, spread = 0.5): THREE.CanvasTexture {
  return makeCanvas(256, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    for (let i = 0; i < puffs; i++) {
      const x = s * (0.5 - spread / 2) + rnd() * s * spread;
      const y = s * 0.35 + rnd() * s * 0.3;
      const r = s * 0.10 + rnd() * s * 0.14;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Large-scale smooth value noise: breaks up terrain texture tiling at
// distance (sampled at ~80u period in the splat shader).
export function macroNoiseTexture(): THREE.CanvasTexture {
  const tex = makeCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 160; i++) {
      const x = rnd() * s, y = rnd() * s, r = 18 + rnd() * 46;
      const v = 40 + rnd() * 175;
      drawWrapped(ctx, s, (ox, oy) => {
        const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        g.addColorStop(0, `rgba(${v},${v},${v},0.30)`);
        g.addColorStop(1, `rgba(${v},${v},${v},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  });
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

// Vertical sky gradient for the dome
export function skyTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, '#4f86c6');
  g.addColorStop(0.45, '#7eb2e4');
  g.addColorStop(0.62, '#aacdec');
  g.addColorStop(0.75, '#cfe4f2');
  g.addColorStop(1.0, '#dcecf4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function grassTuftTexture(blades = 18): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);
  for (let i = 0; i < blades; i++) {
    const x = 8 + rnd() * 48;
    const sway = (rnd() - 0.5) * 14;
    const h = 26 + rnd() * 30;
    // olive blades, darker at the root — the old neon green detached from the
    // ground and glowed in shadow/night scenes
    const g = 95 + Math.floor(rnd() * 55);
    const grad = ctx.createLinearGradient(x, 64, x + sway, 64 - h);
    grad.addColorStop(0, `rgba(${34 + rnd() * 18},${g - 38},${30 + rnd() * 14},0.9)`);
    grad.addColorStop(1, `rgba(${52 + rnd() * 30},${g},${44 + rnd() * 20},0.9)`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5 + rnd();
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.quadraticCurveTo(x + sway * 0.4, 64 - h * 0.6, x + sway, 64 - h);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// PBR-ish map generators: height fields converted to tangent-space normal
// maps, all procedural canvas. Consumed by the Standard-material pipeline
// (terrain splat, props, water); harmless to the Lambert low path.
// ---------------------------------------------------------------------------

export interface SurfaceMaps {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
}

export interface GroundSplat {
  grass: SurfaceMaps;
  dirt: SurfaceMaps;
  rock: SurfaceMaps;
  sand: SurfaceMaps;
}

function makeRawCanvas(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  draw(ctx, size);
  return c;
}

// Draws fn at the 9 wrap offsets so blobs crossing an edge tile seamlessly.
function drawWrapped(ctx: CanvasRenderingContext2D, size: number, fn: (ox: number, oy: number) => void): void {
  for (const ox of [-size, 0, size]) {
    for (const oy of [-size, 0, size]) fn(ox, oy);
  }
}

// Sobel-ish height->tangent-space normal conversion with wrap sampling.
export function heightToNormal(heightCanvas: HTMLCanvasElement, strength = 2.0): THREE.CanvasTexture {
  const s = heightCanvas.width;
  const src = heightCanvas.getContext('2d')!.getImageData(0, 0, s, s).data;
  const out = document.createElement('canvas');
  out.width = out.height = s;
  const outCtx = out.getContext('2d')!;
  const img = outCtx.createImageData(s, s);
  const h = (x: number, y: number): number => src[(((y + s) % s) * s + ((x + s) % s)) * 4] / 255;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const dx = (h(x - 1, y) - h(x + 1, y)) * strength;
      const dy = (h(x, y - 1) - h(x, y + 1)) * strength;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const i = (y * s + x) * 4;
      img.data[i] = (dx * inv * 0.5 + 0.5) * 255;
      img.data[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
      img.data[i + 2] = (inv * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  outCtx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(out);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

// Tree bark: vertical ridge field -> strong normal relief.
export function barkMaps(): SurfaceMaps {
  const map = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 4 + Math.floor(rnd() * 6)) {
      const w = 2 + rnd() * 3;
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(40,24,12,0.5)' : 'rgba(120,90,55,0.45)';
      ctx.fillRect(x, 0, w, s);
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = 'rgba(30,18,8,0.5)';
      ctx.fillRect(rnd() * s, rnd() * s, 2, 6 + rnd() * 14);
    }
  });
  const height = makeRawCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    // ridges: alternating raised/sunken vertical strips with jitter
    for (let x = 0; x < s; x += 3 + Math.floor(rnd() * 5)) {
      const w = 2 + rnd() * 4;
      const v = rnd() > 0.5 ? 60 + rnd() * 40 : 150 + rnd() * 70;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, 0, w, s);
    }
    // horizontal cracks cut across the ridges
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = 'rgba(20,20,20,0.7)';
      ctx.fillRect(rnd() * s, rnd() * s, 2, 8 + rnd() * 18);
    }
  });
  return { map, normalMap: heightToNormal(height, 2.6) };
}

// Masonry: running-bond courses of varied heights and block widths (matching
// albedo + height). 256px with per-block value/warmth jitter so big cliff and
// crypt walls don't read as a uniform wallpaper grid.
export function stoneMaps(): SurfaceMaps {
  const S = 256;
  interface Block { x: number; y: number; w: number; h: number; v: number; warm: number }
  const blocks: Block[] = [];
  let y = 0;
  let row = 0;
  while (y < S) {
    // last course stretches to close the tile exactly
    let h = 16 + Math.floor(rnd() * 16);
    if (y + h > S - 12) h = S - y;
    let x = -Math.floor(rnd() * 30) - row * 17;
    while (x < S) {
      const w = 22 + Math.floor(rnd() * 34);
      blocks.push({ x, y, w, h, v: 100 + rnd() * 62, warm: rnd() * 14 - 4 });
      x += w;
    }
    y += h;
    row++;
  }
  const map = makeCanvas(S, (ctx, s) => {
    ctx.fillStyle = '#6f6f67';
    ctx.fillRect(0, 0, s, s);
    for (const b of blocks) {
      for (const ox of [0, s]) { // blocks only overhang in x; rows tile exactly
        const v = b.v;
        ctx.fillStyle = `rgb(${v + b.warm},${v},${v - 8})`;
        ctx.fillRect(b.x + ox, b.y + 1, b.w - 2, b.h - 2);
        // weathered face: speckle + a lighter catch along the top edge
        ctx.fillStyle = 'rgba(255,255,250,0.10)';
        ctx.fillRect(b.x + ox + 1, b.y + 1, b.w - 4, 2);
        ctx.fillStyle = 'rgba(20,20,18,0.18)';
        ctx.fillRect(b.x + ox + 1, b.y + b.h - 4, b.w - 4, 3);
        for (let i = 0; i < b.w * b.h * 0.02; i++) {
          const sv = 60 + rnd() * 140;
          ctx.fillStyle = `rgba(${sv},${sv},${sv - 6},0.18)`;
          ctx.fillRect(b.x + ox + 1 + rnd() * (b.w - 4), b.y + 2 + rnd() * (b.h - 5), 1.5, 1.5);
        }
        ctx.strokeStyle = 'rgba(38,38,36,0.65)';
        ctx.strokeRect(b.x + ox + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      }
    }
  });
  const height = makeRawCanvas(S, (ctx, s) => {
    ctx.fillStyle = '#383838'; // mortar sits low
    ctx.fillRect(0, 0, s, s);
    for (const b of blocks) {
      for (const ox of [0, s]) {
        const v = 130 + (b.v - 100) * 1.5;
        const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
        g.addColorStop(0, `rgb(${Math.min(255, v + 24)},${Math.min(255, v + 24)},${Math.min(255, v + 24)})`);
        g.addColorStop(1, `rgb(${Math.max(0, v - 22)},${Math.max(0, v - 22)},${Math.max(0, v - 22)})`);
        ctx.fillStyle = g;
        ctx.fillRect(b.x + ox + 2, b.y + 2, b.w - 5, b.h - 4);
      }
    }
  });
  return { map, normalMap: heightToNormal(height, 2.4) };
}

// Timber-framed plaster (the wallTexture pattern) with raised beams.
export function wallMaps(): SurfaceMaps {
  const drawFrame = (ctx: CanvasRenderingContext2D, s: number, beam: string): void => {
    ctx.fillStyle = beam;
    ctx.fillRect(0, 0, s, 8);
    ctx.fillRect(0, s - 8, s, 8);
    ctx.fillRect(0, 0, 8, s);
    ctx.fillRect(s - 8, 0, 8, s);
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-s, -4, s * 2, 8);
    ctx.restore();
  };
  const map = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#d6c4a0';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1200; i++) {
      const v = 190 + Math.floor(rnd() * 40);
      ctx.fillStyle = `rgba(${v},${v - 15},${v - 45},0.3)`;
      ctx.fillRect(rnd() * s, rnd() * s, 2, 2);
    }
    // baked under-eave shadow + ground splashback so fog-side walls keep some
    // form instead of reading as flat paper cutouts (canvas y=0 = top of wall)
    const eave = ctx.createLinearGradient(0, 0, 0, 30);
    eave.addColorStop(0, 'rgba(58,44,26,0.42)');
    eave.addColorStop(1, 'rgba(58,44,26,0)');
    ctx.fillStyle = eave;
    ctx.fillRect(0, 0, s, 30);
    const splash = ctx.createLinearGradient(0, s - 18, 0, s);
    splash.addColorStop(0, 'rgba(70,58,38,0)');
    splash.addColorStop(1, 'rgba(70,58,38,0.32)');
    ctx.fillStyle = splash;
    ctx.fillRect(0, s - 18, s, 18);
    drawFrame(ctx, s, '#5a4226');
  });
  const height = makeRawCanvas(128, (ctx, s) => {
    // plaster sits mid with a daubed unevenness; timber beams ride proud
    ctx.fillStyle = '#6e6e6e';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 320; i++) {
      const x = rnd() * s, y = rnd() * s, r = 3 + rnd() * 9;
      const v = 85 + rnd() * 70;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${v},${v},${v},0.5)`);
      g.addColorStop(1, `rgba(${v},${v},${v},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    drawFrame(ctx, s, '#c8c8c8');
  });
  return { map, normalMap: heightToNormal(height, 2.2) };
}

// Shingle rows: stepped height per row, staggered seams.
export function roofMaps(): SurfaceMaps {
  const map = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#8a4a2f';
    ctx.fillRect(0, 0, s, s);
    const rowH = 16;
    for (let y = 0; y < s; y += rowH) {
      const offset = (y / rowH) % 2 === 0 ? 0 : 16;
      ctx.fillStyle = 'rgba(40,16,8,0.55)';
      ctx.fillRect(0, y + rowH - 2, s, 2);
      for (let x = -16; x < s; x += 32) {
        ctx.fillStyle = 'rgba(40,16,8,0.4)';
        ctx.fillRect(x + offset, y, 2, rowH);
        if (rnd() > 0.6) {
          ctx.fillStyle = 'rgba(255,200,160,0.07)';
          ctx.fillRect(x + offset + 2, y, 30, rowH - 2);
        }
      }
    }
  });
  const height = makeRawCanvas(128, (ctx, s) => {
    const rowH = 16;
    for (let y = 0; y < s; y += rowH) {
      const offset = (y / rowH) % 2 === 0 ? 0 : 16;
      // each row slopes from raised top to sunken bottom edge
      const g = ctx.createLinearGradient(0, y, 0, y + rowH);
      g.addColorStop(0, '#b4b4b4');
      g.addColorStop(0.85, '#787878');
      g.addColorStop(1, '#2a2a2a');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, s, rowH);
      for (let x = -16; x < s; x += 32) {
        ctx.fillStyle = '#383838';
        ctx.fillRect(x + offset, y, 2, rowH);
        const v = 150 + rnd() * 50;
        ctx.fillStyle = `rgba(${v},${v},${v},0.25)`;
        ctx.fillRect(x + offset + 2, y, 30, rowH - 2);
      }
    }
  });
  return { map, normalMap: heightToNormal(height, 2.4) };
}

// Four tiling albedo+normal pairs for the terrain splat. Albedo is authored
// near mid-gray with a mild hue — terrain vertex color carries the biome tint.
export function groundSplatMaps(): GroundSplat {
  const grassMap = makeCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#7e8a64';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const x = rnd() * s, y = rnd() * s, r = 4 + rnd() * 9;
      const v = 90 + rnd() * 105;
      drawWrapped(ctx, s, (ox, oy) => {
        ctx.fillStyle = `rgba(${v - 18},${v},${v - 40},0.30)`;
        ctx.beginPath();
        ctx.ellipse(x + ox, y + oy, r, r * 0.7, rnd() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    // blades
    for (let i = 0; i < 3200; i++) {
      const x = rnd() * s, y = rnd() * s;
      const v = 75 + rnd() * 125;
      ctx.strokeStyle = `rgba(${v - 25},${v},${v - 45},0.55)`;
      ctx.lineWidth = 1 + rnd() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * 4, y - 3 - rnd() * 6);
      ctx.stroke();
    }
  });
  const grassHeight = makeRawCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#787878';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 700; i++) {
      const x = rnd() * s, y = rnd() * s, r = 4 + rnd() * 10;
      const v = 80 + rnd() * 110;
      drawWrapped(ctx, s, (ox, oy) => {
        const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        g.addColorStop(0, `rgba(${v},${v},${v},0.5)`);
        g.addColorStop(1, `rgba(${v},${v},${v},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  });

  const dirtMap = makeCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#8a7a60';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 800; i++) {
      const x = rnd() * s, y = rnd() * s, r = 1.5 + rnd() * 4;
      const v = 95 + rnd() * 85;
      drawWrapped(ctx, s, (ox, oy) => {
        ctx.fillStyle = `rgba(${v},${v - 12},${v - 32},0.5)`;
        ctx.beginPath();
        ctx.ellipse(x + ox, y + oy, r, r * 0.8, rnd() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    for (let i = 0; i < 40; i++) {
      // dry cracks
      let x = rnd() * s, y = rnd() * s;
      ctx.strokeStyle = 'rgba(50,40,28,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += (rnd() - 0.5) * 26;
        y += (rnd() - 0.5) * 26;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
  const dirtHeight = makeRawCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#6e6e6e';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 600; i++) {
      const x = rnd() * s, y = rnd() * s, r = 1.5 + rnd() * 4.5;
      const v = 110 + rnd() * 120;
      drawWrapped(ctx, s, (ox, oy) => {
        const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        g.addColorStop(0, `rgba(${v},${v},${v},0.85)`);
        g.addColorStop(1, `rgba(${v},${v},${v},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  });

  const rockMap = makeCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#83837c';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      // fractured plates
      const x = rnd() * s, y = rnd() * s, r = 10 + rnd() * 24;
      const v = 105 + rnd() * 55;
      drawWrapped(ctx, s, (ox, oy) => {
        ctx.fillStyle = `rgba(${v},${v},${v - 5},0.55)`;
        ctx.beginPath();
        const n = 5 + Math.floor(rnd() * 3);
        for (let k = 0; k <= n; k++) {
          const a = (k / n) * Math.PI * 2;
          const rr = r * (0.7 + rnd() * 0.5);
          const px = x + ox + Math.cos(a) * rr, py = y + oy + Math.sin(a) * rr;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.fill();
        ctx.strokeStyle = 'rgba(42,42,40,0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  });
  const rockHeight = makeRawCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#505050';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      const x = rnd() * s, y = rnd() * s, r = 10 + rnd() * 24;
      const v = 120 + rnd() * 110;
      drawWrapped(ctx, s, (ox, oy) => {
        ctx.fillStyle = `rgba(${v},${v},${v},0.8)`;
        ctx.beginPath();
        const n = 5 + Math.floor(rnd() * 3);
        for (let k = 0; k <= n; k++) {
          const a = (k / n) * Math.PI * 2;
          const rr = r * (0.7 + rnd() * 0.5);
          const px = x + ox + Math.cos(a) * rr, py = y + oy + Math.sin(a) * rr;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.fill();
      });
    }
  });

  const sandMap = makeCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#b3a883';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      // wind ripples: wavy horizontal bands
      const ph = Math.sin(y * 0.22) * 0.5 + Math.sin(y * 0.07 + 2) * 0.5;
      const v = Math.round(165 + ph * 22);
      ctx.fillStyle = `rgba(${v},${v - 12},${v - 42},0.35)`;
      ctx.fillRect(0, y, s, 1);
    }
    for (let i = 0; i < 500; i++) {
      const v = 140 + rnd() * 70;
      ctx.fillStyle = `rgba(${v},${v - 12},${v - 40},0.4)`;
      ctx.fillRect(rnd() * s, rnd() * s, 1.5, 1.5);
    }
  });
  const sandHeight = makeRawCanvas(256, (ctx, s) => {
    for (let y = 0; y < s; y++) {
      const ph = Math.sin(y * 0.22) * 0.5 + Math.sin(y * 0.07 + 2) * 0.5;
      const v = Math.round(128 + ph * 56);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, s, 1);
    }
  });

  return {
    grass: { map: grassMap, normalMap: heightToNormal(grassHeight, 1.6) },
    dirt: { map: dirtMap, normalMap: heightToNormal(dirtHeight, 2.0) },
    rock: { map: rockMap, normalMap: heightToNormal(rockHeight, 2.6) },
    sand: { map: sandMap, normalMap: heightToNormal(sandHeight, 1.4) },
  };
}

// Woven cloth for tents/awnings: warp/weft weave with patch seams and stains.
export function canvasMaps(): SurfaceMaps {
  const map = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#c9b48a';
    ctx.fillRect(0, 0, s, s);
    // weave: alternating warp/weft strips
    for (let yy = 0; yy < s; yy += 3) {
      const v = 185 + Math.floor(rnd() * 26);
      ctx.fillStyle = `rgba(${v},${v - 18},${v - 52},0.30)`;
      ctx.fillRect(0, yy, s, 1.5);
    }
    for (let xx = 0; xx < s; xx += 3) {
      const v = 165 + Math.floor(rnd() * 26);
      ctx.fillStyle = `rgba(${v},${v - 16},${v - 48},0.22)`;
      ctx.fillRect(xx, 0, 1.5, s);
    }
    // weather stains
    for (let i = 0; i < 26; i++) {
      const x = rnd() * s, y = rnd() * s, r = 6 + rnd() * 16;
      drawWrapped(ctx, s, (ox, oy) => {
        const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        g.addColorStop(0, 'rgba(120,100,64,0.16)');
        g.addColorStop(1, 'rgba(120,100,64,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    // stitched seams
    ctx.strokeStyle = 'rgba(96,78,48,0.55)';
    ctx.lineWidth = 1.5;
    for (const yy of [34, 92]) {
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(s, yy);
      ctx.stroke();
    }
  });
  const height = makeRawCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    for (let yy = 0; yy < s; yy += 3) {
      const v = 105 + rnd() * 60;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, yy, s, 1.5);
    }
    for (const yy of [34, 92]) {
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(0, yy - 1, s, 2);
    }
  });
  return { map, normalMap: heightToNormal(height, 1.3) };
}

// Soft radial gradient disc — additive light-pool decals under dungeon
// torches (the point-light budget can't keep every pool lit at once).
export function radialGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.34)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Subtle cloth-weave normal noise for merged rig materials — breaks the
// dead-flat plastic read on character boxes without any albedo change.
export function clothNormalTexture(): THREE.CanvasTexture {
  const height = makeRawCanvas(64, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const v = 90 + rnd() * 76;
      ctx.fillStyle = `rgba(${v},${v},${v},0.5)`;
      ctx.fillRect(rnd() * s, rnd() * s, 1.5, 1.5);
    }
    for (let yy = 0; yy < s; yy += 2) {
      const v = 112 + rnd() * 32;
      ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
      ctx.fillRect(0, yy, s, 1);
    }
  });
  return heightToNormal(height, 0.9);
}

// Two differently-scaled blobby normal maps for the water shader (scrolled
// against each other). Real normal-encoded, replaces waterNormalish.
export function waterNormalMaps(): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const blobby = (count: number, rMin: number, rMax: number): HTMLCanvasElement =>
    makeRawCanvas(256, (ctx, s) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < count; i++) {
        const x = rnd() * s, y = rnd() * s, r = rMin + rnd() * (rMax - rMin);
        const v = 70 + rnd() * 140;
        drawWrapped(ctx, s, (ox, oy) => {
          const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
          g.addColorStop(0, `rgba(${v},${v},${v},0.55)`);
          g.addColorStop(1, `rgba(${v},${v},${v},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    });
  // 3.0/3.4: strong enough to break the mirror, soft enough that the lake
  // doesn't read as TV-static speckle (the shimmer term amplifies these)
  return [heightToNormal(blobby(220, 10, 34), 3.0), heightToNormal(blobby(420, 5, 16), 3.4)];
}

// Alpha leaf-cluster card for tree silhouettes (crossed quads, alphaTest).
export function foliageCardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);
  const cx = 64, cy = 64;
  for (let i = 0; i < 240; i++) {
    // leaves cluster densely at the centre, thin toward the rim
    const a = rnd() * Math.PI * 2;
    const d = Math.pow(rnd(), 0.6) * 56;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    const fade = 1 - d / 64;
    const g = 80 + rnd() * 80;
    ctx.fillStyle = `rgba(${30 + rnd() * 35},${g},${28 + rnd() * 25},${(0.5 + rnd() * 0.5) * fade})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 2 + rnd() * 4, 4 + rnd() * 7, a + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Sparkle star for ground quest objects
export function sparkleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,250,180,0.95)');
  g.addColorStop(0.25, 'rgba(255,230,120,0.45)');
  g.addColorStop(1, 'rgba(255,220,100,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(255,255,220,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 6); ctx.lineTo(32, 58);
  ctx.moveTo(6, 32); ctx.lineTo(58, 32);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
