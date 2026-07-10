import { describe, expect, it } from 'vitest';
import { wireEntity } from '../server/game';
import { Sim } from '../src/sim/sim';
import type { Aura, Entity } from '../src/sim/types';

// wireEntity's aura serialization was rewritten from a chain of conditional
// object spreads to direct property assignment (perf: the spread form
// allocated a throwaway object literal per branch, per aura, every tick,
// regardless of which side was taken). This pins the wire shape those spreads
// used to produce, so a future edit to server/game.ts's wireAura cannot
// silently drop or always-include an optional field.
function baseAura(overrides: Partial<Aura> = {}): Aura {
  return {
    id: 'test_aura',
    name: 'Test Aura',
    kind: 'buff_ap',
    remaining: 5,
    duration: 10,
    value: 0,
    sourceId: 0,
    school: 'physical',
    ...overrides,
  };
}

function wireAuras(e: Entity): Record<string, unknown>[] {
  return (wireEntity(e) as { auras?: Record<string, unknown>[] }).auras ?? [];
}

describe('wireEntity aura serialization', () => {
  it('omits every optional field when the aura carries only defaults', () => {
    const sim = new Sim({ seed: 1, playerClass: 'warrior' });
    const e = sim.player;
    e.auras = [baseAura()];

    const auras = wireAuras(e);
    expect(auras).toHaveLength(1);
    const w = auras[0];
    expect(w).toEqual({
      id: 'test_aura',
      name: 'Test Aura',
      kind: 'buff_ap',
      rem: 5,
      dur: 10,
    });
    expect(w).not.toHaveProperty('value');
    expect(w).not.toHaveProperty('value2');
    expect(w).not.toHaveProperty('value3');
    expect(w).not.toHaveProperty('tickInterval');
    expect(w).not.toHaveProperty('school');
    expect(w).not.toHaveProperty('stacks');
    expect(w).not.toHaveProperty('charges');
    expect(w).not.toHaveProperty('src');
  });

  it('includes every optional field when the aura carries a non-default value', () => {
    const sim = new Sim({ seed: 1, playerClass: 'warrior' });
    const e = sim.player;
    e.auras = [
      baseAura({
        value: -3,
        value2: 10,
        value3: 20,
        tickInterval: 2,
        school: 'holy',
        stacks: 4,
        charges: 2,
        sourceId: 7,
      }),
    ];

    const w = wireAuras(e)[0];
    expect(w).toEqual({
      id: 'test_aura',
      name: 'Test Aura',
      kind: 'buff_ap',
      rem: 5,
      dur: 10,
      value: -3,
      value2: 10,
      value3: 20,
      tickInterval: 2,
      school: 'holy',
      stacks: 4,
      charges: 2,
      src: 7,
    });
  });

  it('omits stacks when exactly 1 but includes charges even when exactly 1', () => {
    const sim = new Sim({ seed: 1, playerClass: 'warrior' });
    const e = sim.player;
    e.auras = [baseAura({ stacks: 1, charges: 1 })];

    const w = wireAuras(e)[0];
    expect(w).not.toHaveProperty('stacks');
    expect(w.charges).toBe(1);
  });
});
