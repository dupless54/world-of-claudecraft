import { describe, expect, it } from 'vitest';
import { EVENT_SKIN_TIERS, MECH_CHROMAS } from '../src/sim/content/skins';
import {
  defaultChoiceSelection,
  mechChromaName,
  randomSkinEventLandingAngle,
  skinChoiceAvailable,
  skinEventChoices,
  skinEventPreviewKey,
  skinRankName,
  skinTierKey,
} from '../src/ui/char_skin_window';

// Minimal stub satisfying just the fields the pure (DOM-free) helpers under
// test read; the DOM-touching paint*() functions are exercised indirectly by
// tests/skin_event.test.ts (sim side) and the pre-existing hud.ts behavior.
function makeHost(overrides: Partial<{ mode: 'class' | 'mech'; playerClass: string }> = {}) {
  return {
    sim: { cfg: { playerClass: overrides.playerClass ?? 'mage' } },
    skinEventMode: overrides.mode ?? 'class',
    skinEventTiers: EVENT_SKIN_TIERS,
  } as unknown as Parameters<typeof skinEventChoices>[0];
}

describe('char_skin_window (extracted from hud.ts)', () => {
  it('names each skin rank via its itemUi.quality.* key', () => {
    expect(skinRankName('uncommon')).toBeTruthy();
    expect(skinRankName('rare')).toBeTruthy();
    expect(skinRankName('epic')).toBeTruthy();
    expect(skinRankName('uncommon')).not.toBe(skinRankName('epic'));
  });

  it('names a known mech chroma and falls back to the raw id for an unknown one', () => {
    expect(mechChromaName('amber_crimson')).toBeTruthy();
    expect(mechChromaName('amber_crimson')).not.toBe('amber_crimson');
    expect(mechChromaName('not_a_real_chroma')).toBe('not_a_real_chroma');
  });

  it('builds a stable rank:skin choice key', () => {
    expect(skinTierKey({ rank: 'rare', skin: 2 })).toBe('rare:2');
  });

  it('lands the roll wheel inside the arc reserved for the rolled rank', () => {
    for (let i = 0; i < 50; i++) {
      expect(randomSkinEventLandingAngle('uncommon')).toBeGreaterThanOrEqual(-15 - 75);
      expect(randomSkinEventLandingAngle('uncommon')).toBeLessThanOrEqual(-15 + 75);
      expect(randomSkinEventLandingAngle('epic')).toBeGreaterThanOrEqual(-247.5 - 14);
      expect(randomSkinEventLandingAngle('epic')).toBeLessThanOrEqual(-247.5 + 14);
    }
  });

  it('lists the class-mode choices from skinEventTiers, keyed rank:skin', () => {
    const host = makeHost({ mode: 'class' });
    const choices = skinEventChoices(host);
    expect(choices).toEqual(
      EVENT_SKIN_TIERS.map((tier) => ({
        rank: tier.rank,
        index: tier.skin,
        key: `${tier.rank}:${tier.skin}`,
      })),
    );
  });

  it('lists every mech chroma in mech mode, keyed mech:<index>', () => {
    const host = makeHost({ mode: 'mech' });
    const choices = skinEventChoices(host);
    expect(choices).toHaveLength(MECH_CHROMAS.length);
    expect(choices[0]).toEqual({
      rank: MECH_CHROMAS[0].rank,
      index: 0,
      key: 'mech:0',
      id: MECH_CHROMAS[0].id,
    });
  });

  it('resolves the preview key from the overlay mode', () => {
    expect(skinEventPreviewKey(makeHost({ mode: 'class', playerClass: 'rogue' }))).toBe(
      'player_rogue',
    );
    expect(skinEventPreviewKey(makeHost({ mode: 'mech' }))).toBe('player_mech');
  });

  it('a mech choice is always available regardless of index', () => {
    expect(skinChoiceAvailable(makeHost({ mode: 'mech' }), 999)).toBe(true);
  });

  it('defaults the selection to the highest-order choice the rolled rank unlocks', () => {
    // class mode: rare unlocks uncommon (skin 1) and rare (skin 2), not epic (skin 3).
    const host = makeHost({ mode: 'class' });
    expect(defaultChoiceSelection(host, 'rare')).toEqual({ index: 2, key: 'rare:2' });
    // uncommon only unlocks the uncommon tier.
    expect(defaultChoiceSelection(host, 'uncommon')).toEqual({ index: 1, key: 'uncommon:1' });
    // epic unlocks everything, including the top tier.
    expect(defaultChoiceSelection(host, 'epic')).toEqual({ index: 3, key: 'epic:3' });
  });

  it('returns null when the rolled rank unlocks nothing available', () => {
    const host = {
      sim: { cfg: { playerClass: 'mage' } },
      skinEventMode: 'class' as const,
      skinEventTiers: [],
    } as unknown as Parameters<typeof defaultChoiceSelection>[0];
    expect(defaultChoiceSelection(host, 'uncommon')).toBeNull();
  });
});
