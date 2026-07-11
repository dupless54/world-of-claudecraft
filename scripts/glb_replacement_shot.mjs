// Screenshot tour for the 11 procedural -> Tripo-generated GLB replacements
// (PR: feat(render) replace procedural models with Tripo-generated GLBs).
// Covers, in the offline client: ambient critters (rabbit/squirrel/songbird
// pool), the leaping fish, the three gather-node marker types (ore/wood/herb),
// and the mailbox pillar, each at their real world coordinates from
// src/sim/content/gather_nodes.ts and mailboxes.ts.
// Each shot boots its own fresh browser + offline session (slower, but
// resilient to the host's memory pressure crashing a shared long-lived tab
// mid-tour). Skips a shot if its output file already exists, so a partial
// prior run can resume. Needs `npm run dev` (:5173). Writes PNGs to
// docs/screenshots/glb-model-replacement/.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

import { BROWSER_PATH as EDGE } from './browser_path.mjs';

const URL = process.env.GAME_URL ?? 'http://localhost:5173';
const OUT = 'docs/screenshots/glb-model-replacement';
fs.mkdirSync(OUT, { recursive: true });

async function shotOnce(file, viewport, place) {
  if (fs.existsSync(file)) {
    console.log('skip (exists):', file);
    return true;
  }
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: [
      `--window-size=${viewport.width},${viewport.height}`,
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-dev-shm-usage',
    ],
    defaultViewport: viewport,
  });
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => document.querySelector('#btn-offline').click());
    await new Promise((r) => setTimeout(r, 200));
    await page.type('#char-name', 'Ranger');
    await page.evaluate(() =>
      document.querySelector('#offline-select .mini-class[data-class="warrior"]').click(),
    );
    await page.evaluate(() => document.querySelector('#btn-start-offline').click());
    await new Promise((r) => setTimeout(r, 800));
    // Mobile-only "Play in Landscape Fullscreen" interstitial blocks boot.
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cont = btns.find((b) => /continue to game/i.test(b.textContent || ''));
      if (cont) cont.click();
    });
    await page.waitForFunction(() => window.__game && window.__game.sim, { timeout: 25000 });
    await new Promise((r) => setTimeout(r, 1500));
    await place(page);
    await page.screenshot({ path: file });
    console.log('wrote', file);
    return true;
  } catch (err) {
    console.log('FAILED', file, String(err && err.message ? err.message : err));
    return false;
  } finally {
    await browser.close().catch(() => {});
  }
}

async function standAt(
  page,
  x,
  z,
  { faceX, faceZ, camPitch = -0.05, camDist, settleMs = 1200 } = {},
) {
  await page.evaluate(
    (x, z, faceX, faceZ, camPitch, camDist) => {
      const g = window.__game;
      const p = g.sim.player;
      p.pos.x = x;
      p.pos.z = z;
      p.hp = p.maxHp = 999999;
      if (faceX !== undefined) {
        p.facing = Math.atan2(faceX - x, faceZ - z);
        g.input.camYaw = p.facing;
      }
      g.input.camPitch = camPitch;
      if (camDist !== undefined) g.renderer.camDist = camDist;
    },
    x,
    z,
    faceX,
    faceZ,
    camPitch,
    camDist,
  );
  await new Promise((r) => setTimeout(r, settleMs));
}

const DESKTOP = { width: 1600, height: 900 };
const MOBILE = { width: 844, height: 390, isMobile: true, hasTouch: true };

const desktopShots = [
  {
    file: 'critters-meadow-wide-desktop.png',
    place: (p) => standAt(p, 150, 210, { camPitch: 0.45, camDist: 16, settleMs: 3000 }),
  },
  {
    file: 'critters-meadow-close-desktop.png',
    place: async (p) => {
      await standAt(p, 150, 210, { camPitch: 0.45, camDist: 16, settleMs: 3000 });
      await p.keyboard.down('w');
      await new Promise((r) => setTimeout(r, 1200));
      await p.keyboard.up('w');
      await new Promise((r) => setTimeout(r, 300));
    },
  },
  {
    file: 'fish-shoreline-desktop.png',
    place: (p) => standAt(p, -104, 300, { faceX: -128, faceZ: 0, camPitch: 0.18, settleMs: 2500 }),
  },
  {
    file: 'gather-node-ore-desktop.png',
    place: (p) => standAt(p, 65, 5, { faceX: 72, faceZ: 8, camPitch: -0.1 }),
  },
  {
    file: 'gather-node-wood-desktop.png',
    place: (p) => standAt(p, -55, 5, { faceX: -62, faceZ: 8, camPitch: -0.1 }),
  },
  {
    file: 'gather-node-herb-desktop.png',
    place: (p) => standAt(p, -83, 87, { faceX: -86, faceZ: 90, camPitch: -0.1 }),
  },
  {
    file: 'mailbox-eastbrook-desktop.png',
    place: (p) => standAt(p, 7, -4, { faceX: 7, faceZ: -8, camPitch: 0.05, camDist: 8 }),
  },
];

const mobileShots = [
  {
    file: 'critters-meadow-mobile.png',
    place: (p) => standAt(p, 150, 210, { camPitch: 0.45, camDist: 16, settleMs: 3000 }),
  },
  {
    file: 'fish-shoreline-mobile.png',
    place: (p) => standAt(p, -104, 300, { faceX: -128, faceZ: 0, camPitch: 0.18, settleMs: 2500 }),
  },
  {
    file: 'mailbox-eastbrook-mobile.png',
    place: (p) => standAt(p, 7, -4, { faceX: 7, faceZ: -8, camPitch: 0.05, camDist: 8 }),
  },
];

const results = [];
for (const s of desktopShots) {
  const file = path.join(OUT, s.file);
  const ok = await shotOnce(file, DESKTOP, s.place);
  results.push({ file, ok });
}
for (const s of mobileShots) {
  const file = path.join(OUT, s.file);
  const ok = await shotOnce(file, MOBILE, s.place);
  results.push({ file, ok });
}

const okCount = results.filter((r) => r.ok).length;
console.log(`\n${okCount}/${results.length} shots captured`);
for (const r of results) console.log(' -', r.ok ? 'OK  ' : 'FAIL', r.file);
if (okCount < results.length) process.exitCode = 1;
