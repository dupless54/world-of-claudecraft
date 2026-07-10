import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function mockEmptyAssetLoads(): void {
  vi.doMock('../src/render/assets/loader', () => ({
    loadGltf: vi.fn(() => new Promise(() => {})),
    loadHdr: vi.fn(() => new Promise(() => {})),
    loadTexture: vi.fn(() => new Promise(() => {})),
    releaseGltf: vi.fn(),
  }));
  const texture = (): THREE.DataTexture => {
    const data = new Uint8Array([255, 255, 255, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  };
  vi.doMock('../src/render/textures', () => ({
    groundDetailTexture: vi.fn(texture),
    groundSplatMaps: vi.fn(() => ({
      grass: texture(),
      dirt: texture(),
      rock: texture(),
      sand: texture(),
      mud: texture(),
      snow: texture(),
    })),
    macroNoiseTexture: vi.fn(texture),
    skyTexture: vi.fn(texture),
    waterNormalish: vi.fn(texture),
    waterNormalMaps: vi.fn(() => [texture(), texture()]),
  }));
}

// No requestIdleCallback in the plain-Node test env, so idle_queue's default
// scheduler falls back to setTimeout(0); fake timers drain it deterministically.
describe('progressive terrain build', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds only the near ring synchronously, then streams the rest in', async () => {
    vi.resetModules();
    mockEmptyAssetLoads();
    const { buildTerrain } = await import('../src/render/terrain');

    const terrain = buildTerrain(20061);
    const nearCount = terrain.group.children.length;
    expect(nearCount).toBeGreaterThan(0);

    await vi.runAllTimersAsync();
    await terrain.streamingDone;

    const fullCount = terrain.group.children.length;
    expect(fullCount).toBeGreaterThan(nearCount);
  });

  it('cancelStreaming stops far chunks from ever being added', async () => {
    vi.resetModules();
    mockEmptyAssetLoads();
    const { buildTerrain } = await import('../src/render/terrain');

    const terrain = buildTerrain(20061);
    const nearCount = terrain.group.children.length;
    terrain.cancelStreaming();

    await vi.runAllTimersAsync();
    await terrain.streamingDone;

    expect(terrain.group.children.length).toBe(nearCount);
  });

  it('streamed-in chunks are visible to update()/rebuildRegion() via the same live chunk list', async () => {
    vi.resetModules();
    mockEmptyAssetLoads();
    const { buildTerrain } = await import('../src/render/terrain');

    const terrain = buildTerrain(20061);
    await vi.runAllTimersAsync();
    await terrain.streamingDone;

    // update() must not throw once far chunks (added after the initial return)
    // are folded into fog culling.
    expect(() => terrain.update(0, 0, 1000)).not.toThrow();
  });
});
