// Verification tour for the full-world voxel-terrain swap (renderer.ts now
// builds terrain from buildVoxelTerrain instead of the production heightfield
// mesh). Teleports across 20 spread-out locations covering all three zones
// (vale/marsh/peaks), hubs, ridge passes, the world rim, and every dungeon/delve
// entrance (the instanced interiors themselves stay on the untouched
// dungeon.ts renderer; these confirm the new open-world terrain meets their
// doors cleanly), and screenshots each with no cinematic waits beyond a short
// settle. Needs `npm run dev` running.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import { BROWSER_PATH as EDGE } from './browser_path.mjs';
import { enterOfflineGame } from './enter_offline_game.mjs';

const URL = process.env.GAME_URL ?? 'http://localhost:5173';
const OUT = 'docs/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--window-size=1600,900', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
page.on('console', (msg) => {
  const t = msg.text();
  if (t.includes('voxel_terrain')) console.log('BROWSER:', t);
});

// Turn on the performance overlay (FPS visible in every capture) before boot.
// game/settings.ts `showFps` is the master on/off; leaving ui/perf_overlay's
// own layout/metrics store untouched keeps the default metric set (fps,
// frame time, ping) rather than risking an unsupported metric (e.g. `gpu`
// timer queries) stalling boot under headless swiftshader.
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('woc_settings', JSON.stringify({ showFps: true }));
});
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
await enterOfflineGame(page, { charClass: 'warrior', charName: 'Tour', settleMs: 4000 });
// The overlay only paints once the FrameMeter has accumulated a frame or two
// after settings apply; wait for real text instead of guessing a fixed delay.
await page
  .waitForFunction(
    () => (document.getElementById('perf-overlay')?.textContent ?? '').includes('FPS'),
    {
      timeout: 15000,
    },
  )
  .catch(() => console.log('WARN: perf overlay text never appeared'));

// Dismiss the new-player tutorial card (.tut-skip "Skip Tutorial" button) so
// it never clutters a screenshot. No-op if the tutorial isn't showing.
await page.evaluate(() => {
  const btn = document.querySelector('.tut-skip');
  if (btn instanceof HTMLElement) btn.click();
});
await new Promise((r) => setTimeout(r, 200));

// 20 spread locations: vale/marsh/peaks terrain + hubs + ridge passes + the
// world rim, plus every dungeon doorPos and delve marker (src/sim/content/
// dungeons.ts, zone1.ts/zone3.ts delveMarkers) so the tour also confirms the
// new terrain meets every instance entrance cleanly.
const LOCATIONS = [
  { name: '01_vale_spawn', x: 0, z: 0 },
  { name: '02_vale_hub', x: 20, z: 40 },
  { name: '03_vale_west_hill', x: -120, z: 100 },
  { name: '04_vale_lake', x: -60, z: -80 },
  { name: '05_vale_ridge_pass', x: 0, z: 170 },
  { name: '06_marsh_north', x: 0, z: 250 },
  { name: '07_fenbridge_hub', x: 0, z: 300 },
  { name: '08_marsh_east', x: 130, z: 400 },
  { name: '09_marsh_ridge_pass', x: 0, z: 535 },
  { name: '10_peaks_south', x: -100, z: 600 },
  { name: '11_highwatch_hub', x: 0, z: 660 },
  { name: '12_peaks_center', x: 0, z: 750 },
  { name: '13_peaks_north_rim', x: 0, z: 890 },
  { name: '14_world_rim_edge', x: -170, z: 400 },
  { name: '15_hollow_crypt_door', x: 80, z: 90 },
  { name: '16_collapsed_reliquary_delve', x: -5, z: -52 },
  { name: '17_sunken_bastion_door', x: 45, z: 515 },
  { name: '18_drowned_litany_delve', x: -95, z: 505 },
  { name: '19_sanctum_gate_door', x: 0, z: 858 },
  { name: '20_crypt_of_nythraxis_door', x: -152, z: 610 },
];

for (const loc of LOCATIONS) {
  try {
    await page.waitForFunction(() => Boolean(window.__game?.sim?.player), { timeout: 20000 });
    await page.evaluate((p) => {
      const g = window.__game;
      const player = g.sim.player;
      player.pos.x = p.x;
      player.pos.z = p.z;
      player.facing = 0;
      g.input.camYaw = 0.6;
      g.input.camPitch = -0.35;
    }, loc);
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: `${OUT}/voxel_tour_${loc.name}.png` });
    console.log('captured', loc.name);
  } catch (e) {
    console.log('FAILED', loc.name, e.message);
  }
}

await browser.close();
console.log('wrote screenshots to', OUT);
