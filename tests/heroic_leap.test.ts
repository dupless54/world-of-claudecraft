// Heroic Leap (owner 2026-07-09): the leap ARCS to the landing over ~0.6s instead
// of teleporting, and its AoE slams down on touchdown (not at cast). Drives the sim
// deterministically: arm the flight, watch it rise, then land + blast.

import { describe, expect, it } from 'vitest';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { Entity } from '../src/sim/types';
import { MAX_LEVEL } from '../src/sim/types';

type AnySim = Sim & Record<string, any>;

describe('Heroic Leap: arcs over time, slams on landing', () => {
  it('arms a flight, rises mid-air, then lands near the aim and blasts on touchdown', () => {
    const sim = new Sim({ seed: 7, playerClass: 'warrior', autoEquip: true }) as AnySim;
    sim.setPlayerLevel(MAX_LEVEL);
    const p: Entity = sim.player;
    const from = { ...p.pos };
    const aim = { x: p.pos.x + 10, y: p.pos.y, z: p.pos.z };
    const mob = createMob(sim.nextId++, MOBS.forest_wolf, 1, {
      x: aim.x,
      y: aim.y,
      z: aim.z + 1,
    });
    mob.maxHp = 1e6;
    mob.hp = 1e6;
    mob.hostile = true;
    sim.addEntity(mob);
    const hp0 = mob.hp;

    p.gcdRemaining = 0;
    sim.castAbility('heroic_leap', p.id, aim);
    // Cast ARMS the flight; the caster has not moved yet and no damage has landed.
    expect(p.leap).not.toBeNull();
    expect(p.pos.x).toBeCloseTo(from.x, 5);
    expect(mob.hp).toBe(hp0);

    // Mid-flight: airborne (above the start height), still no landing blast.
    sim.tick();
    expect(p.pos.y).toBeGreaterThan(from.y);
    expect(p.onGround).toBe(false);
    expect(mob.hp).toBe(hp0);

    // Fly to touchdown (~0.6s); the flight owns movement until it lands.
    for (let i = 0; i < 25 && p.leap; i++) sim.tick();
    expect(p.leap).toBeNull(); // landed
    expect(p.onGround).toBe(true);
    expect(Math.hypot(p.pos.x - aim.x, p.pos.z - aim.z)).toBeLessThan(3); // near the aim
    expect(mob.hp).toBeLessThan(hp0); // AoE slammed down on landing
  });

  it('does not teleport: it is NOT at the destination on the first tick', () => {
    const sim = new Sim({ seed: 3, playerClass: 'warrior', autoEquip: true }) as AnySim;
    sim.setPlayerLevel(MAX_LEVEL);
    const p: Entity = sim.player;
    const aim = { x: p.pos.x + 12, y: p.pos.y, z: p.pos.z };
    p.gcdRemaining = 0;
    sim.castAbility('heroic_leap', p.id, aim);
    sim.tick();
    // One tick in (0.05s of a ~0.6s arc), it is still well short of the aim.
    expect(Math.abs(p.pos.x - aim.x)).toBeGreaterThan(6);
    expect(p.leap).not.toBeNull();
  });
});
