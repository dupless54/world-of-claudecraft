// Enchanting profession: disenchant an eligible weapon/armor piece into arcane
// materials, then spend those materials to apply a permanent stat bonus to a
// SPECIFIC held copy of an item (not the character, not the item id in the
// abstract). An enchanted piece is a fresh, non-stacking instanced copy
// (types.ts ItemInstancePayload.rolled.stats), so it survives equip/unequip
// (src/sim/items.ts) and stays a distinct, tradeable good like any other
// instanced item, separate from a plain copy of the same item id.
//
// Layered on top of, not a replacement for, the existing everyone-can-salvage
// system (./salvage.ts, issue #1300): salvage still yields the same generic
// materials (bone_fragments/linen_scrap/spider_leg) for anyone, unconditionally.
// disenchantItem here is the Enchanting-specific action: strictly better
// yield (dedicated arcane materials, scaling with the item's rarity), and is
// the intended reagent source for applyEnchant below.
//
// Scope (v1): no skill-gate beyond the free-floor rule every other common-tier
// craft action in this repo follows (crafting.ts, wheel.ts) - any player can
// disenchant or apply an enchant; specialization/discount machinery
// (professions/wheel.ts) is not wired in for enchanting yet, matching how
// salvage.ts also does not participate in it. Not yet wired onto a server WS
// command or a dedicated UI window (same not-yet-wired status salvageItem
// documents on PlayerMeta.lastSalvageResult): a future issue extends
// IWorldProfessions + ClientWorld + server/game.ts the way craft_item/
// harvest_node already are, plus adds a target-item picker.
//
// This module is `src/sim`-pure: no DOM/browser/Three.js imports, no
// Math.random/Date.now (uses ctx.rng only), host-agnostic so it runs
// offline, on the server, and in the headless RL env unchanged.

import { ENCHANTS } from '../content/enchants';
import { ITEMS } from '../data';
import type { Rng } from '../rng';
import type { SimContext } from '../sim_context';
import type { EquipSlot, ItemDef } from '../types';

const QUALITY_ORDER: readonly NonNullable<ItemDef['quality']>[] = [
  'poor',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

// Which arcane material a disenchant yields, keyed by the disenchanted
// item's rarity. Strictly better than plain salvage.ts's generic yield: a
// dedicated Enchanting material rather than a shared junk item, and scales
// up through the same three tiers applyEnchant's reagents draw from.
const DISENCHANT_MATERIAL_BY_QUALITY: Readonly<Record<string, string>> = {
  common: 'arcane_dust',
  uncommon: 'arcane_dust',
  rare: 'arcane_essence',
  epic: 'arcane_shard',
  legendary: 'arcane_shard',
};

/** Eligible for disenchant: same eligibility as plain salvage (an equippable
 *  weapon or armor piece, at least `common` quality). */
export function isDisenchantable(def: ItemDef | undefined): boolean {
  return (
    !!def &&
    (def.kind === 'weapon' || def.kind === 'armor') &&
    !!def.quality &&
    def.quality !== 'poor'
  );
}

/** The arcane material yield for one disenchant of `def`: scales with rarity
 *  and tier the same way salvage.ts's salvageYield does, plus one rng-rolled
 *  bonus unit, but the material itself is the dedicated, more valuable
 *  Enchanting tier (see DISENCHANT_MATERIAL_BY_QUALITY), not a generic junk
 *  item. Pure aside from the rng draw. */
export function disenchantYield(def: ItemDef, rng: Rng): number {
  const qualityIdx = Math.max(0, QUALITY_ORDER.indexOf(def.quality ?? 'common'));
  const tierBonus = Math.floor((def.requiredLevel ?? 0) / 10);
  const bonus = rng.next() < 0.5 ? 0 : 1;
  return qualityIdx + tierBonus + 1 + bonus;
}

export interface DisenchantResult {
  ok: boolean;
  itemId: string;
  materialItemId?: string;
  count?: number;
  reason?: 'unknown_item' | 'not_disenchantable' | 'not_held';
}

/** Resolve one disenchant attempt: denies (no side effect) if the item id is
 *  unknown, ineligible, or the player does not hold a fungible (unenchanted)
 *  copy. Consumes exactly one plain copy on success (never an already-
 *  enchanted instanced copy, via removeFungibleItem) and grants the rolled
 *  arcane material yield. */
export function resolveDisenchant(ctx: SimContext, pid: number, itemId: string): DisenchantResult {
  const def = ITEMS[itemId];
  if (!def) return { ok: false, itemId, reason: 'unknown_item' };
  if (!isDisenchantable(def)) return { ok: false, itemId, reason: 'not_disenchantable' };
  if (ctx.countFungibleItem(itemId, pid) < 1) return { ok: false, itemId, reason: 'not_held' };
  ctx.removeFungibleItem(itemId, 1, pid);
  const materialItemId = DISENCHANT_MATERIAL_BY_QUALITY[def.quality ?? 'common'] ?? 'arcane_dust';
  const count = disenchantYield(def, ctx.rng);
  ctx.addItem(materialItemId, count, pid);
  return { ok: true, itemId, materialItemId, count };
}

/** Command entry point, mirroring professions/salvage.ts's salvageItem shape
 *  exactly: resolves the caller's own player entity via ctx.resolve, then
 *  delegates to resolveDisenchant. Runs on the deterministic tick the
 *  command arrives on, never off-tick. */
export function disenchantItem(ctx: SimContext, itemId: string, pid?: number): DisenchantResult {
  const r = ctx.resolve(pid);
  if (!r) return { ok: false, itemId, reason: 'unknown_item' };
  return resolveDisenchant(ctx, r.meta.entityId, itemId);
}

export interface ApplyEnchantResult {
  ok: boolean;
  itemId: string;
  enchantId: string;
  reason?:
    | 'unknown_item'
    | 'unknown_enchant'
    | 'wrong_slot'
    | 'not_held'
    | 'insufficient_materials';
}

/** Resolve one apply-enchant attempt against a HELD (bagged, not currently
 *  equipped) plain copy of `itemId`. Denies (no side effect) if the item or
 *  enchant id is unknown, the enchant does not target this item's slot, the
 *  player holds no fungible copy, or any reagent is short (all-or-nothing,
 *  same reagent-availability discipline crafting.ts's craftItem uses).
 *  On success: consumes exactly one plain copy (removeFungibleItem, so an
 *  already-enchanted copy of the same item is never silently overwritten)
 *  and every reagent, then grants a freshly-instanced copy carrying the
 *  enchant's stat bonus (ctx.addItemInstance) — equipping THAT copy is what
 *  carries the bonus into recalcPlayerStats (see items.ts equipItem). */
export function resolveApplyEnchant(
  ctx: SimContext,
  pid: number,
  itemId: string,
  enchantId: string,
): ApplyEnchantResult {
  const itemDef = ITEMS[itemId];
  if (!itemDef) return { ok: false, itemId, enchantId, reason: 'unknown_item' };
  const enchant = ENCHANTS[enchantId];
  if (!enchant) return { ok: false, itemId, enchantId, reason: 'unknown_enchant' };
  if (itemDef.slot !== enchant.itemSlot) {
    return { ok: false, itemId, enchantId, reason: 'wrong_slot' };
  }
  if (ctx.countFungibleItem(itemId, pid) < 1) {
    return { ok: false, itemId, enchantId, reason: 'not_held' };
  }
  for (const reagent of enchant.reagents) {
    if (ctx.countItem(reagent.itemId, pid) < reagent.count) {
      return { ok: false, itemId, enchantId, reason: 'insufficient_materials' };
    }
  }
  ctx.removeFungibleItem(itemId, 1, pid);
  for (const reagent of enchant.reagents) ctx.removeItem(reagent.itemId, reagent.count, pid);
  ctx.addItemInstance(itemId, { rolled: { stats: { ...enchant.statBonus } } }, pid);
  return { ok: true, itemId, enchantId };
}

/** Command entry point, same shape as disenchantItem/salvageItem above. */
export function applyEnchant(
  ctx: SimContext,
  itemId: string,
  enchantId: string,
  pid?: number,
): ApplyEnchantResult {
  const r = ctx.resolve(pid);
  if (!r) return { ok: false, itemId, enchantId, reason: 'unknown_item' };
  return resolveApplyEnchant(ctx, r.meta.entityId, itemId, enchantId);
}

/** Enchants whose itemSlot matches an equipped/held item's own def.slot,
 *  for a future UI's "what can I enchant this with" listing. Pure lookup,
 *  no ctx needed. */
export function enchantsForSlot(slot: EquipSlot | 'ring'): (typeof ENCHANTS)[string][] {
  return Object.values(ENCHANTS).filter((e) => e.itemSlot === slot);
}
