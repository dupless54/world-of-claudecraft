import { describe, expect, it } from 'vitest';
import type { GroundAoE } from '../src/sim/entity_roster';
import { Sim } from '../src/sim/sim';
import { groundHeight } from '../src/sim/world';

// Ground-targeted casting primitive (docs/design/arpg-spell-mechanics.md), exercised
// through Flamestrike (mage, targetMode 'position', range 30). The deterministic sim
// is the authority: the client only proposes a point, the sim clamps it to the
// ability's range and the spell's ground zone is created there (not on the caster).

function place(sim: Sim, id: number, x: number, z: number): void {
  const e = sim.entities.get(id);
  if (!e) throw new Error(`no entity ${id}`);
  e.pos = { x, y: groundHeight(x, z, sim.cfg.seed), z };
  e.prevPos = { ...e.pos };
}

function makeMage(): { sim: Sim; pid: number } {
  const sim = new Sim({ seed: 7, playerClass: 'mage', noPlayer: true });
  const pid = sim.addPlayer('mage', 'Mag');
  sim.setPlayerLevel(20, pid); // learns Flamestrike (learnLevel 20)
  const me = sim.entities.get(pid);
  if (!me) throw new Error('no mage');
  me.resource = 9999; // plenty of mana for the cast
  return { sim, pid };
}

function flamestrikeZone(sim: Sim): GroundAoE | undefined {
  return (sim as unknown as { groundAoEs: GroundAoE[] }).groundAoEs.find(
    (z) => z.ability === 'Flamestrike',
  );
}

describe('ground-targeted casting (Flamestrike)', () => {
  it('creates the flame zone at the aimed point, not on the caster', () => {
    const { sim, pid } = makeMage();
    place(sim, pid, 0, 0);

    sim.castAbility('flamestrike', pid, { x: 18, z: 0 }); // within range 30

    const zone = flamestrikeZone(sim);
    expect(zone).toBeDefined();
    expect(zone?.pos.x).toBeCloseTo(18, 1);
    expect(zone?.pos.z).toBeCloseTo(0, 1);
  });

  it('clamps the aimed point to the ability range from the caster', () => {
    const { sim, pid } = makeMage();
    place(sim, pid, 0, 0);

    sim.castAbility('flamestrike', pid, { x: 100, z: 0 }); // far beyond range 30

    const zone = flamestrikeZone(sim);
    expect(zone?.pos.x).toBeCloseTo(30, 0); // clamped onto the 30 yd range
    expect(zone?.pos.z).toBeCloseTo(0, 1);
  });

  it('falls back to the caster position when no point is chosen', () => {
    const { sim, pid } = makeMage();
    place(sim, pid, 5, 5);

    sim.castAbility('flamestrike', pid); // no aim (e.g. a keybind cast)

    const zone = flamestrikeZone(sim);
    expect(zone?.pos.x).toBeCloseTo(5, 1);
    expect(zone?.pos.z).toBeCloseTo(5, 1);
  });
});
