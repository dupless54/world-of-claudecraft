// Empowerment ceiling composition (issue #1129/#1203): archetype.ts only used to
// track WHICH craft is the active archetype; this pins the reachable-ceiling math
// that makes it matter (archetypeCeilingFor/craftCeiling) plus its composition
// into the two existing tierCapability call sites in crafting.ts.

import { describe, expect, it } from 'vitest';
import { CRAFT_RING, oppositeCraft } from '../src/sim/content/professions';
import { archetypeCeilingFor, craftCeiling } from '../src/sim/professions/archetype';
import { meetsComboRequirement, resolveCraftForRecipe } from '../src/sim/professions/crafting';
import type { ProfessionRecipeRecord } from '../src/sim/professions/types';
import { type CraftSkills, emptyCraftSkills, tierCapability } from '../src/sim/professions/wheel';
import { Sim } from '../src/sim/sim';

const ARMOR = CRAFT_RING[0].id; // 'armorcrafting'
const COOKING = oppositeCraft(ARMOR).id; // opposite of armorcrafting on the ring
const WEAPON = CRAFT_RING[1].id; // adjacent, but NOT opposite -> "every other craft"

function skillsAt(craftId: string, skill: number): CraftSkills {
  const skills = emptyCraftSkills();
  skills[craftId] = skill;
  return skills;
}

describe('archetypeCeilingFor (#1129/#1203 empowerment ceiling)', () => {
  it('is uncapped-to-rare for every craft before any archetype has been chosen', () => {
    expect(archetypeCeilingFor(null, ARMOR)).toBe(2);
    expect(archetypeCeilingFor(null, COOKING)).toBe(2);
    expect(archetypeCeilingFor(null, WEAPON)).toBe(2);
  });

  it('is unlimited for the active archetype craft itself', () => {
    expect(archetypeCeilingFor(ARMOR, ARMOR)).toBe(Infinity);
  });

  it('is capped at rare (tier 2) for the hobby: the opposite craft on CRAFT_RING', () => {
    expect(archetypeCeilingFor(ARMOR, COOKING)).toBe(2);
  });

  it('is capped at common (tier 0) for every other craft once an archetype is set', () => {
    expect(archetypeCeilingFor(ARMOR, WEAPON)).toBe(0);
  });
});

describe('craftCeiling composes tierCapability with the archetype ceiling (min of the two)', () => {
  it('with no archetype set, a high raw skill is still clamped to the rare ceiling', () => {
    const skills = skillsAt(ARMOR, 500); // raw tierCapability would be far above 2
    expect(tierCapability(skills, ARMOR)).toBeGreaterThan(2);
    expect(craftCeiling(skills, null, ARMOR)).toBe(2);
  });

  it('active archetype craft is bounded only by raw skill (archetype side is unlimited)', () => {
    const skills = skillsAt(ARMOR, 130); // tierCapability = floor(130/25) = 5
    expect(craftCeiling(skills, ARMOR, ARMOR)).toBe(5);
  });

  it('hobby craft is clamped to rare even with very high raw skill', () => {
    const skills = skillsAt(COOKING, 500);
    expect(craftCeiling(skills, ARMOR, COOKING)).toBe(2);
  });

  it('hobby craft with raw skill below the rare ceiling is bounded by the raw skill instead', () => {
    const skills = skillsAt(COOKING, 10); // tierCapability = 0
    expect(craftCeiling(skills, ARMOR, COOKING)).toBe(0);
  });

  it('every other craft is clamped to common (0) regardless of raw skill', () => {
    const skills = skillsAt(WEAPON, 500);
    expect(craftCeiling(skills, ARMOR, WEAPON)).toBe(0);
  });
});

describe('meetsComboRequirement composes the archetype ceiling (#1132 combo gate)', () => {
  const combo: ProfessionRecipeRecord['comboRequirement'] = {
    craftA: ARMOR,
    craftB: COOKING,
    minTier: 1,
  };
  const recipe = { comboRequirement: combo } as unknown as ProfessionRecipeRecord;

  it('defaults activeArchetype to null (uncapped-to-rare), unchanged for existing raw-skills callers', () => {
    const skills = { ...emptyCraftSkills(), [ARMOR]: 25, [COOKING]: 25 };
    // Both crafts individually reach tier 1 with no archetype context passed at all.
    expect(meetsComboRequirement(skills, recipe)).toBe(true);
  });

  it('a craft outside the archetype pair is capped to common and fails a minTier-1 combo', () => {
    // ARMOR is the active archetype (unlimited); COOKING is neither the archetype nor its
    // hobby (opposite of COOKING, not ARMOR itself), so it is capped at common (tier 0).
    const notHobby = CRAFT_RING.find((c) => c.id !== ARMOR && c.id !== COOKING)!.id;
    const skills = { ...emptyCraftSkills(), [ARMOR]: 25, [notHobby]: 25 };
    const otherCombo = { craftA: ARMOR, craftB: notHobby, minTier: 1 };
    const otherRecipe = { comboRequirement: otherCombo } as unknown as ProfessionRecipeRecord;
    expect(meetsComboRequirement(skills, otherRecipe, ARMOR)).toBe(false);
  });

  it('the hobby craft can still meet a minTier-1 (below the rare ceiling) combo requirement', () => {
    const skills = { ...emptyCraftSkills(), [ARMOR]: 25, [COOKING]: 25 };
    expect(meetsComboRequirement(skills, recipe, ARMOR)).toBe(true);
  });
});

describe('resolveCraftForRecipe reads the archetype-gated ceiling for skill-gain scaling', () => {
  function makeSim(seed = 42) {
    return new Sim({ seed, playerClass: 'warrior', autoEquip: false });
  }

  // Regression case: a player has high RAW skill (100 -> uncapped tierCapability 4) in a craft
  // that is neither their active archetype nor its hobby, so the archetype ceiling caps it at
  // common (tier 0). Crafting a tier-2 recipe (skillReq 50) against the UNCAPPED capability
  // would land 2+ tiers below capability (zero progress, tierProgressMultiplier); against the
  // archetype-CEILINGED capability (0) it lands below the recipe's tier instead, which
  // tierProgressMultiplier grants FULL progress for. Asserting the actual post-craft skill
  // value pins that the ceiling (not the raw tierCapability) is what crafting.ts now reads:
  // if the composition regressed back to raw tierCapability, this would assert 100 (unchanged)
  // instead of 101.
  it('caps a non-archetype, non-hobby craft to common, changing the skill-gain multiplier', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.acceptArchetypeQuest(WEAPON); // active archetype = WEAPON; ARMOR is neither archetype nor hobby
    const meta = (
      sim as unknown as { players: Map<number, { craftSkills: CraftSkills }> }
    ).players.get(pid)!;
    meta.craftSkills[ARMOR] = 100; // raw tierCapability(ARMOR) = 4, but archetype-ceiling caps it at 0

    const recipe: ProfessionRecipeRecord = {
      id: 'test_recipe_tier2_armor',
      professionId: ARMOR,
      resultItemId: 'bone_fragments',
      resultCount: 1,
      reagents: [],
      skillReq: 50, // recipeTier = 2
      trivialAt: 100,
      itemLevelBudget: 10,
    };
    const ctx = (sim as unknown as { ctx: Parameters<typeof resolveCraftForRecipe>[0] }).ctx;
    const result = resolveCraftForRecipe(ctx, pid, recipe);

    expect(result.ok).toBe(true);
    expect(meta.craftSkills[ARMOR]).toBe(101); // full (1) progress, not the raw-capability zero
  });

  it('grants full skill progress in the active archetype craft even at very high raw skill', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.acceptArchetypeQuest(ARMOR);
    const meta = (
      sim as unknown as { players: Map<number, { craftSkills: CraftSkills }> }
    ).players.get(pid)!;
    meta.craftSkills[ARMOR] = 100; // tierCapability = 4; archetype ceiling is unlimited here

    const recipe: ProfessionRecipeRecord = {
      id: 'test_recipe_tier4_armor',
      professionId: ARMOR,
      resultItemId: 'bone_fragments',
      resultCount: 1,
      reagents: [],
      skillReq: 100, // recipeTier = 4, exactly at capability -> full progress
      trivialAt: 200,
      itemLevelBudget: 10,
    };
    const ctx = (sim as unknown as { ctx: Parameters<typeof resolveCraftForRecipe>[0] }).ctx;
    const result = resolveCraftForRecipe(ctx, pid, recipe);

    expect(result.ok).toBe(true);
    expect(meta.craftSkills[ARMOR]).toBe(101);
  });
});
