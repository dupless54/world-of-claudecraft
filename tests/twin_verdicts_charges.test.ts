import { describe, expect, it } from 'vitest';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { Entity } from '../src/sim/types';

// G7 (fix/talents2-balance-pass): pin the Twin Verdicts (judgement
// bonusCharges) mechanics on the PR #2041 abilityCharges model. The maintainer
// flagged the option as broken: these tests document exactly what the engine
// does so the content decision (keep, fix, or replace with a cooldown
// reduction) rests on pinned facts.
//   1. Each Verdict requires and consumes its own Seal: two banked charges
//      only become two hits when the paladin re-seals in between.
//   2. A no-Seal Verdict is refused at the cast gate (casting_lifecycle.ts)
//      BEFORE billing: no mana spent, no charge consumed. There is no
//      feel-bad trap; the engine is sound and any change is a balance call.

type Ev = { type?: string; ability?: string | null; amount?: number; text?: string };

function setup(): { sim: Sim; p: Entity; mob: Entity; events: Ev[] } {
  const sim = new Sim({ seed: 7, playerClass: 'paladin', autoEquip: true });
  sim.setPlayerLevel(14);
  expect(sim.applyTalents({ spec: null, rows: { 14: 'pal_r14_swift_verdicts' } })).toBe(true);
  const p = sim.player;
  // Far below the paladin's level so the seeded spell hit table cannot resist
  // the Verdicts these assertions count.
  const mob = createMob(20_000, MOBS.forest_wolf, 5, {
    x: p.pos.x + 3,
    y: p.pos.y,
    z: p.pos.z,
  });
  mob.hostile = true;
  mob.aiState = 'idle';
  mob.maxHp = 100_000;
  mob.hp = mob.maxHp;
  (sim as unknown as { addEntity(entity: Entity): void }).addEntity(mob);
  sim.targetEntity(mob.id);
  p.facing = Math.atan2(mob.pos.x - p.pos.x, mob.pos.z - p.pos.z);
  p.resource = p.maxResource;
  const events: Ev[] = [];
  const anySim = sim as unknown as { emit(e: Ev): void };
  const orig = anySim.emit.bind(sim);
  anySim.emit = (e: Ev) => {
    events.push(e);
    orig(e);
  };
  return { sim, p, mob, events };
}

function verdictHits(events: Ev[]): Ev[] {
  return events.filter(
    (e) => e.type === 'damage' && e.ability === 'Verdict' && (e.amount ?? 0) > 0,
  );
}

function readyPlayer(sim: Sim, p: Entity): void {
  // Verdict rides a projectile: give it room to land before the next action.
  for (let i = 0; i < 5; i++) sim.tick();
  p.gcdRemaining = 0;
  p.resource = p.maxResource;
}

describe('G7: Twin Verdicts on the abilityCharges model', () => {
  it('two charges land two Verdicts when the paladin re-seals in between', () => {
    const { sim, p, events } = setup();
    sim.castAbility('seal_of_righteousness');
    readyPlayer(sim, p);
    sim.castAbility('judgement');
    readyPlayer(sim, p);
    expect(verdictHits(events)).toHaveLength(1);
    sim.castAbility('seal_of_righteousness');
    readyPlayer(sim, p);
    sim.castAbility('judgement'); // the banked second charge, inside the 10s cooldown
    readyPlayer(sim, p);
    expect(verdictHits(events)).toHaveLength(2);
    // The pool is spent: a third Verdict inside the window is refused.
    sim.castAbility('seal_of_righteousness');
    readyPlayer(sim, p);
    sim.castAbility('judgement');
    readyPlayer(sim, p);
    expect(verdictHits(events)).toHaveLength(2);
  });

  it('a no-Seal Verdict is refused before billing: no mana, no charge', () => {
    const { sim, p, events } = setup();
    sim.castAbility('seal_of_righteousness');
    readyPlayer(sim, p);
    sim.castAbility('judgement'); // consumes the only seal
    readyPlayer(sim, p);
    const manaBefore = p.resource;
    const chargesBefore = p.abilityCharges?.judgement?.charges;
    sim.castAbility('judgement'); // second charge armed, but no seal: refused
    sim.tick();
    expect(verdictHits(events)).toHaveLength(1);
    expect(events.some((e) => e.type === 'error' && /no active seal/i.test(e.text ?? ''))).toBe(
      true,
    );
    expect(p.resource).toBe(manaBefore);
    expect(p.abilityCharges?.judgement?.charges).toBe(chargesBefore);
  });
});
