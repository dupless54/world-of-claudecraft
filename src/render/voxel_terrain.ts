import * as THREE from 'three';
import { WORLD_MAX_X, WORLD_MAX_Z, WORLD_MIN_X, WORLD_MIN_Z } from '../sim/data';
import { voxelDensity } from '../sim/voxel';
import { meshVoxelChunk } from '../sim/voxel_mesh';
import { terrainHeight } from '../sim/world';

// Full-world terrain built entirely from the voxel density field/mesher
// (sim/voxel.ts, sim/voxel_mesh.ts), replacing the production chunked
// heightfield mesh (terrain.ts) so the voxel engine's output can be checked
// against the real world in-game, not just via unit tests.
//
// Two things keep this tractable at whole-map scale:
//  - Per-column height culling: most of a naive world-spanning y-chunk grid
//    is either deep underground (uniformly solid) or high in the sky
//    (uniformly air) and would waste a full corner-density sample grid for
//    nothing. Before meshing a chunk we sample terrainHeight at its (x,z)
//    footprint's corners+center (5 cheap calls) and skip any chunk whose y
//    range doesn't fall near that local height band.
//  - A finer per-chunk voxel resolution than the first verification pass,
//    to close the steep-slope gaps that showed up on the mountain walls at
//    coarse resolution.
const CHUNK_SIZE = 20; // world units per chunk cube
const CHUNK_RESOLUTION = 10; // voxels per axis per chunk (2 world units/voxel)
const HEIGHT_MARGIN = 24; // yd of slack around the sampled local height band
const WORLD_MARGIN = 10; // small pad so edge geometry isn't clipped

export interface VoxelTerrainView {
  group: THREE.Group;
  chunkCount: number;
  triangleCount: number;
}

// Cheap local height band for one (x,z) chunk footprint: samples the 4
// corners + center of terrainHeight, not a full density grid.
function localHeightBand(seed: number, cx: number, cz: number): { min: number; max: number } {
  const x0 = cx * CHUNK_SIZE;
  const x1 = x0 + CHUNK_SIZE;
  const z0 = cz * CHUNK_SIZE;
  const z1 = z0 + CHUNK_SIZE;
  const samples = [
    terrainHeight(x0, z0, seed),
    terrainHeight(x1, z0, seed),
    terrainHeight(x0, z1, seed),
    terrainHeight(x1, z1, seed),
    terrainHeight((x0 + x1) / 2, (z0 + z1) / 2, seed),
  ];
  return { min: Math.min(...samples), max: Math.max(...samples) };
}

// Slope-based vertex color: grassy green on near-flat/upward-facing
// surfaces, rocky grey-brown as the normal tilts toward horizontal. A cheap
// stand-in for real splat texturing, just so slopes/cliffs read as rock
// instead of flat-shaded green.
const GRASS = new THREE.Color(0x4f8a3d);
const ROCK = new THREE.Color(0x6b6258);
function slopeColor(ny: number): THREE.Color {
  const t = 1 - Math.max(0, Math.min(1, (ny - 0.5) / 0.5));
  return GRASS.clone().lerp(ROCK, t);
}

export function buildVoxelTerrain(seed: number): VoxelTerrainView {
  const group = new THREE.Group();
  group.name = 'voxel-terrain-verification';
  const density = (x: number, y: number, z: number) => voxelDensity(x, y, z, seed);
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
  });

  const cx0 = Math.floor((WORLD_MIN_X - WORLD_MARGIN) / CHUNK_SIZE);
  const cx1 = Math.ceil((WORLD_MAX_X + WORLD_MARGIN) / CHUNK_SIZE);
  const cz0 = Math.floor((WORLD_MIN_Z - WORLD_MARGIN) / CHUNK_SIZE);
  const cz1 = Math.ceil((WORLD_MAX_Z + WORLD_MARGIN) / CHUNK_SIZE);

  let chunkCount = 0;
  let triangleCount = 0;

  for (let cx = cx0; cx < cx1; cx++) {
    for (let cz = cz0; cz < cz1; cz++) {
      const band = localHeightBand(seed, cx, cz);
      const cy0 = Math.floor((band.min - HEIGHT_MARGIN) / CHUNK_SIZE);
      const cy1 = Math.ceil((band.max + HEIGHT_MARGIN) / CHUNK_SIZE);

      for (let cy = cy0; cy < cy1; cy++) {
        const mesh = meshVoxelChunk(density, {
          x0: cx * CHUNK_SIZE,
          y0: cy * CHUNK_SIZE,
          z0: cz * CHUNK_SIZE,
          size: CHUNK_SIZE,
          resolution: CHUNK_RESOLUTION,
        });
        if (mesh.positions.length === 0) continue;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3));
        geo.setIndex(new THREE.BufferAttribute(mesh.indices, 1));

        const colors = new Float32Array(mesh.positions.length);
        for (let i = 0; i < mesh.normals.length / 3; i++) {
          const c = slopeColor(mesh.normals[i * 3 + 1]);
          colors[i * 3] = c.r;
          colors[i * 3 + 1] = c.g;
          colors[i * 3 + 2] = c.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const chunkMesh = new THREE.Mesh(geo, material);
        chunkMesh.name = `voxel-terrain-${cx}-${cy}-${cz}`;
        chunkMesh.matrixAutoUpdate = false;
        chunkMesh.updateMatrix();
        group.add(chunkMesh);
        chunkCount++;
        triangleCount += mesh.indices.length / 3;
      }
    }
  }

  console.log(`[voxel_terrain] build: ${chunkCount} chunks, ${triangleCount} triangles`);
  return { group, chunkCount, triangleCount };
}
