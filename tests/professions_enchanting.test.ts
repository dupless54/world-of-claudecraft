// Coverage for the Enchanting profession: disenchant (layered on top of the
// existing everyone-can-salvage system, ./professions/salvage.ts, issue
// #1300) and applyEnchant (a permanent stat bonus on a SPECIFIC held copy of
// an item, carried through equip/unequip via PlayerMeta.equipmentInstance).

import { describe, expect, it } from 'vitest';
import { ENCHANTS } from '../src/sim/content/enchants';
import {
  disenchantItem,
  disenchantYield,
  isDisenchantable,
  resolveApplyEnchant,
  resolveDisenchant,
} from '../src/sim/professions/enchanting';
import { Sim } from '../src/sim/sim';

function makeSim(seed = 7) {
  return new Sim({ seed, playerClass: 'warrior', autoEquip: false });
}

describe('disenchant', () => {
  it('an ineligible item (consumable/junk) cannot be disenchanted', () => {
    expect(isDisenchantable(undefined)).toBe(false);
    const sim = makeSim();
    const pid = sim.playerId;
    sim.addItem('tough_jerky', 1, pid);
    const result = resolveDisenchant(sim.ctx, pid, 'tough_jerky');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not_disenchantable');
  });

  it('denies disenchanting an item the player does not hold', () => {
    const sim = makeSim();
    const result = resolveDisenchant(sim.ctx, sim.playerId, 'eastbrook_arming_sword');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not_held');
  });

  it('disenchanting consumes the item and yields the dedicated arcane material, not plain salvage junk', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.addItem('eastbrook_arming_sword', 1, pid);
    const result = resolveDisenchant(sim.ctx, pid, 'eastbrook_arming_sword');
    expect(result.ok).toBe(true);
    // Pinned literal: a common-quality piece disenchants into arcane_dust per
    // DISENCHANT_MATERIAL_BY_QUALITY, so a remap cannot pass silently. This is
    // a DIFFERENT item than plain salvage's bone_fragments yield for the same
    // piece, confirming disenchant is strictly its own (better) yield table.
    expect(result.materialItemId).toBe('arcane_dust');
    expect(result.count).toBeGreaterThan(0);
    expect(sim.countItem('eastbrook_arming_sword', pid)).toBe(0);
    if (result.materialItemId) {
      expect(sim.countItem(result.materialItemId, pid)).toBe(result.count);
    }
  });

  it('yield scales with rarity: a higher-quality item never yields less than a lower one, all else equal', () => {
    const low = disenchantYield(
      { id: 'a', name: 'a', sellValue: 0, quality: 'common', kind: 'weapon' } as never,
      makeSim().ctx.rng,
    );
    const high = disenchantYield(
      { id: 'b', name: 'b', sellValue: 0, quality: 'epic', kind: 'weapon' } as never,
      makeSim().ctx.rng,
    );
    expect(high).toBeGreaterThanOrEqual(low);
  });

  it('the disenchantItem command entry point resolves the caller and stashes nothing extra beyond the result', () => {
    const sim = makeSim();
    sim.addItem('eastbrook_arming_sword', 1, sim.playerId);
    sim.disenchantItem('eastbrook_arming_sword');
    expect(sim.lastDisenchantResult?.ok).toBe(true);
    expect(disenchantItem(sim.ctx, 'nonexistent_item_id').ok).toBe(false);
  });
});

describe('applyEnchant', () => {
  it('denies an unknown item id or unknown enchant id', () => {
    const sim = makeSim();
    expect(resolveApplyEnchant(sim.ctx, sim.playerId, 'nope', 'enchant_weapon_might').reason).toBe(
      'unknown_item',
    );
    expect(
      resolveApplyEnchant(sim.ctx, sim.playerId, 'eastbrook_arming_sword', 'nope').reason,
    ).toBe('unknown_enchant');
  });

  it('denies an enchant applied to the wrong item slot', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.addItem('eastbrook_arming_sword', 1, pid); // mainhand
    const result = resolveApplyEnchant(
      sim.ctx,
      pid,
      'eastbrook_arming_sword',
      'enchant_helmet_fortitude', // itemSlot: 'helmet'
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('wrong_slot');
  });

  it('denies applying without holding the item, or without every reagent', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    expect(
      resolveApplyEnchant(sim.ctx, pid, 'eastbrook_arming_sword', 'enchant_weapon_might').reason,
    ).toBe('not_held');

    sim.addItem('eastbrook_arming_sword', 1, pid);
    expect(
      resolveApplyEnchant(sim.ctx, pid, 'eastbrook_arming_sword', 'enchant_weapon_might').reason,
    ).toBe('insufficient_materials');
  });

  it('applying consumes the plain copy and every reagent, and grants a freshly-instanced enchanted copy', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.addItem('eastbrook_arming_sword', 1, pid);
    sim.addItem('arcane_dust', 5, pid);
    const result = resolveApplyEnchant(
      sim.ctx,
      pid,
      'eastbrook_arming_sword',
      'enchant_weapon_might',
    );
    expect(result.ok).toBe(true);
    expect(sim.countItem('arcane_dust', pid)).toBe(0);
    // Still exactly 1 copy of the sword held (the plain one consumed, the
    // enchanted one granted) - total count unchanged, but it must now be a
    // distinct instanced slot, verified via countFungibleItem below.
    expect(sim.countItem('eastbrook_arming_sword', pid)).toBe(1);
    expect(sim.ctx.countFungibleItem('eastbrook_arming_sword', pid)).toBe(0);
  });

  it('equipping the enchanted copy boosts the matching stat; unequipping preserves it in bags', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    const baseStr = sim.player.stats.str;
    sim.addItem('eastbrook_arming_sword', 1, pid);
    sim.addItem('arcane_dust', 5, pid);
    const applied = resolveApplyEnchant(
      sim.ctx,
      pid,
      'eastbrook_arming_sword',
      'enchant_weapon_might',
    );
    expect(applied.ok).toBe(true);

    sim.equipItem('eastbrook_arming_sword');
    expect(sim.player.stats.str).toBe(baseStr + (ENCHANTS.enchant_weapon_might.statBonus.str ?? 0));

    expect(sim.unequipItem('mainhand')).toBe(true);
    // The enchant bonus is gone once unequipped...
    expect(sim.player.stats.str).toBe(baseStr);
    // ...but the item (and its enchant) is still in bags, not lost.
    expect(sim.countItem('eastbrook_arming_sword', pid)).toBe(1);

    // Re-equipping the same (still-enchanted) copy restores the bonus, proving
    // the enchant round-trips through bags rather than being a one-shot buff.
    sim.equipItem('eastbrook_arming_sword');
    expect(sim.player.stats.str).toBe(baseStr + (ENCHANTS.enchant_weapon_might.statBonus.str ?? 0));
  });

  it('swapping in a plain (unenchanted) replacement drops the enchant bonus, and the enchanted piece returns to bags intact', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    const baseStr = sim.player.stats.str;
    sim.addItem('eastbrook_arming_sword', 1, pid);
    sim.addItem('arcane_dust', 5, pid);
    resolveApplyEnchant(sim.ctx, pid, 'eastbrook_arming_sword', 'enchant_weapon_might');
    sim.equipItem('eastbrook_arming_sword');
    expect(sim.player.stats.str).toBe(baseStr + (ENCHANTS.enchant_weapon_might.statBonus.str ?? 0));

    // A second, plain copy of the same item id: equipping it should swap out
    // the enchanted one (back to bags, enchant intact) and grant no bonus.
    sim.addItem('eastbrook_arming_sword', 1, pid);
    expect(sim.ctx.countFungibleItem('eastbrook_arming_sword', pid)).toBe(1);
    sim.equipItem('eastbrook_arming_sword');
    expect(sim.player.stats.str).toBe(baseStr);
    // Both copies are still held: the plain one now equipped (countItem only
    // scans bags, so it does not show up there), the enchanted one back in
    // bags, and still non-fungible (proving it kept its instance, not
    // silently flattened into a plain stack on the way back).
    expect(sim.countItem('eastbrook_arming_sword', pid)).toBe(1);
    expect(sim.ctx.countFungibleItem('eastbrook_arming_sword', pid)).toBe(0);
  });

  it('the applyEnchant command entry point resolves the caller and stashes the result', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.addItem('eastbrook_arming_sword', 1, pid);
    sim.addItem('arcane_dust', 5, pid);
    sim.applyEnchant('eastbrook_arming_sword', 'enchant_weapon_might');
    expect(sim.lastEnchantResult?.ok).toBe(true);
  });
});
