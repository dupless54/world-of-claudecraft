# 12: The Chroniclers get faces, one gets a new name

STATUS: NOT STARTED

Read `docs/achievements/overview.md` FIRST; sections 2, 3, and 5 apply
verbatim.

Reminder that binds every step: the word "phase", packet references, em
dashes, en dashes, and emojis never appear in any shipped artifact.
English-only i18n via the pending mechanism.

## Goal

The three Chronicler NPCs currently render as the generic villager model,
in muted near-identical tints, standing dead-center in their town NPC
clusters. This session gives them a shared scholarly-mage look with three
clearly distinct colors, spreads each to a quieter spot in their hub, and
renames the Thornpeak chronicler to Zenzie per the maintainer's call. Real
custom .glb models arrive later; the visual work must be a one-line url swap
when they do.

## Maintainer decisions (locked; do not re-litigate)

1. One chronicler is renamed to "Zenzie". Target: the Thornpeak chronicler
   (display name today "Chronicler Edda Hartwell"). Saul is maintainer-named
   in the original design and stays; renaming the Thornpeak one also retires
   a standing display-name near-collision with the delve companion Edda
   Reedhand. New display name: "Chronicler Zenzie" (matches her sibling's
   "Chronicler Osric Fenn" pattern).
2. The TEMPLATE ID `chronicler_edda_hartwell` DOES NOT CHANGE. It is
   persisted in player saves as the `npc:chronicler_edda_hartwell` visited
   mark, listed in CHRONICLER_TEMPLATE_IDS and NPC_IDS, and is the locale
   overlay key stem in five locales; an id rename orphans live data. Leave a
   comment on the def: display name renamed, id retained for save
   compatibility.
3. Chroniclers become visually unique NOW with the tools the repo already
   has (model reuse + tint); no new asset, no new sim field.

## Context to load before writing code

- `src/sim/content/zone1.ts` (search `chronicler_saul`), `zone2.ts` (search
  `chronicler_osric_fenn`), `zone3.ts` (search `chronicler_edda_hartwell`):
  the three defs, their placement comments, and the authored-position notes
  around them (the zone2 inn-collider margin note; the zone3 house-footprint
  note).
- `src/render/characters/manifest.ts`: `NPC_KEYS`, `visualKeyFor` (unmapped
  npc templates fall back to npc_villager), and the mage-like precedents:
  `npc_mage`, `npc_villager_robed`, `delve_mob_acolyte` (mage.glb +
  `show: ['Mage_Hat']` + staff + entity tint 0.6), and the warlock
  open-spellbook attach (search `spellbook_open.glb`, gripRef pattern).
- `src/sim/deeds.ts` (search `CHRONICLER_TEMPLATE_IDS`, `SAUL_TEMPLATE_ID`):
  what is keyed to ids (never names).
- `src/sim/content/deeds.ts` (search `Edda Hartwell`): the two deed descs
  that carry the old name.
- `src/ui/world_entity_i18n.ts` NPC_IDS; the resolved English keys
  `entities.npcs.chronicler_*` regenerate from sim content.
- `docs/achievements/catalog/chronicles.md` (search `Edda Hartwell`): the
  catalog carries the name too; the catalog is a living doc now, update it.
- `tests/deeds_sites.test.ts` (Saul pins), `tests/snapshots.test.ts`,
  `tests/guide.test.ts` (the guide prose pins Saul only; verify no test pins
  Edda Hartwell or chronicler coordinates before you rely on that).
- The i18n reword-staleness trap: renaming an existing English value keeps
  stale translations silently. The five non-Latin overlays fill
  `entities.npcs.chronicler_edda_hartwell.*` today with the OLD name; they
  are fixed in the translation session (14), flag them in the row, do NOT
  edit overlays here.

## Design spec

### 1. The rename

- `zone3.ts`: `name: 'Chronicler Zenzie'` (title and greeting stay; the
  greeting contains no name).
- `src/sim/content/deeds.ts`: the two chapter deed descs reword "Edda
  Hartwell's chronicle" to "Zenzie's chronicle". Deed descs are English-only
  by design (DEED_LOCALES is empty until release fill), so no translation
  stales HERE, but note both descs in the 14 worklist anyway.
- `docs/achievements/catalog/chronicles.md`: update the four name
  occurrences so the catalog matches the game.
- Regenerate i18n in the SAME commit (`npm run i18n:gen`); the English
  catalog value changes, so status artifacts move and, if the resolved table
  hash moves, the sha256 re-baseline lands in the same commit
  (`node scripts/i18n_resolved_hash.mjs --write` + the equivalence test).
- Regenerate wiki content; the guide bakes no chronicler names today, the
  regen proves it stays that way.

### 2. The look

- Add ONE new VisualDef (working name `npc_chronicler`) modeled on
  delve_mob_acolyte: mage.glb, `show: ['Mage_Hat']`, the open-spellbook
  attach in the left hand (the warlock gripRef precedent), entity tint
  strength around 0.55 so the per-NPC color carries the identity. Map all
  three template ids to it in NPC_KEYS. When the maintainer's .glb files
  arrive, each chronicler gets its own def with a new url: leave a one-line
  comment saying exactly that.
- Bump the three NpcDef colors from the current muted values to saturated,
  clearly distinct hues that stay off the bursar gold (0xc9a227) and the
  auctioneer amethyst (0x8e5ad6). Starting suggestions, session verifies
  in-browser and may adjust: Saul warm amber 0xd08a2e, Osric fen teal
  0x3fa66b, Zenzie cool indigo 0x5a6fd6.
- Verify the tinted mage silhouette reads distinctly against each hub's
  villager crowd at gameplay camera distance, day and night lighting.

### 3. The spread

Move each chronicler to a quieter spot INSIDE their hub radius (the town
placement loop grounds hub NPCs; findSafePos nudges off colliders
deterministically, so respect the authored collider notes):

- Saul: `{ x: 15, z: -16 }`, facing ~2.4 (looking back northwest across the
  square). Nearest neighbor goes from 5.8 to ~13 units.
- Osric: `{ x: -14, z: 306 }`, facing ~-1.4 (looking east toward the gate).
  Stays WEST of the x=9 inn-collider margin; nearest neighbor from 3.2 to
  ~10.
- Zenzie: `{ x: 2, z: 643 }`, facing ~3.1 (south, overlooking the road up
  from Fenbridge). Clear of the house footprint at {8,650}; nearest authored
  NPC from 9.2 to ~15.

Update each def's placement comment to describe the NEW spot (the comments
are load-bearing docs for the next author). Verify no test or golden pins
chronicler coordinates BEFORE moving (the audit found none; re-check), and
verify in-browser that each still stands on ground, reachable, interactable,
and that interacting still opens the Book's Chronicles section.

## Out of scope

- New sim appearance fields (scale, skin) on NpcDef.
- Renaming Saul or Osric; changing template ids; changing greetings.
- The .glb import pipeline (later, when files arrive).
- Locale overlay edits (session 14 owns them).

## Steps

1. Verify the audit's no-pin claims (grep tests for `Edda Hartwell`,
   chronicler coordinates, and the three template ids).
2. Rename: zone3 def + two deed descs + catalog doc + i18n regen (+ hash
   re-baseline if it moves) in ONE commit, scope `deeds`.
3. Look: manifest VisualDef + NPC_KEYS rows + three color bumps, scope
   `render` (content colors ride along).
4. Spread: three position/facing edits + comment updates, scope `deeds` or
   `content`.
5. Browser pass: visit all three hubs offline; screenshot each chronicler
   at gameplay distance (day) for the 13 session; interact with each and
   confirm the Chronicles section opens; talk to Saul nine times and confirm
   hid_saul_footnote still lands (the counter is id-keyed and must survive
   untouched).
6. Wiki regen check (diffless or committed); targeted vitest; biome on
   touched files; `npm run gate` UNPIPED.
7. Update progress.md row 12; commit with explicit paths.

## Acceptance (all must pass)

- `npx vitest run tests/deeds_sites.test.ts tests/deeds.test.ts tests/deeds_content.test.ts tests/snapshots.test.ts tests/guide.test.ts`
- `npx vitest run tests/architecture.test.ts tests/localization_fixes.test.ts`
- `npx vitest run tests/i18n_resolved_equivalence.test.ts` (green with the
  same-commit baseline)
- `npm run gate` UNPIPED, exit 0.
- `git grep -n 'Edda Hartwell' -- src server tests` returns ZERO hits
  (catalog/docs may keep historical mentions only inside
  docs/achievements/progress.md notes).
- The renderer resolves all three template ids to the new visual (unit or
  scratch assertion on visualKeyFor).

## Reviewer dispatch (fresh agents, never the implementer)

- architecture-reviewer (sim content diff: placement moves cannot reorder
  entity ctor ids in a way that breaks determinism; verify the placement
  loop order concern it raises, the audit says order is placement-loop
  driven).
- qa-checklist over the whole diff.

## Adversarial pass (answer each in the session summary)

1. Does a save from BEFORE the rename still show its visited mark and Saul
   counter correctly (load a pre-12 fixture)?
2. Do the five stale non-Latin chronicler fills render the OLD name until
   session 14? (Expected yes; confirm it is flagged in the row and the 14
   spec.)
3. Did any entity ctor id shift for OTHER npcs because of the moves?
4. Is each new position actually walkable and off every collider (probe
   in-browser, not by arithmetic)?
5. Does the wiki emit any chronicler name now (it must not)?

## End of session

Update progress.md row 12. Name the next file:
`docs/achievements/phase-12-qa.md`.
