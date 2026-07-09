# Collection deeds (col_)

Scope: the collector's ledger. Every deed here is a predicate over the v1
per-character `itemsDiscovered` set (item ids the character has ever acquired:
loot, craft, quest reward, vendor purchase) plus already-persisted state
(equipment, `skin`/`skinCatalog`). There is no per-source kill log in v1;
nothing below needs one. The global delve lore journal deed lives in
dungeons-delves.md (dlv_lore_journal), not here.

Ground truth used throughout (verified on this branch): the merged `ITEMS`
table (`src/sim/data.ts`) holds 435 item ids: 25 poor, 118 common (43 of these
omit the quality tag and default to common), 110 uncommon, 93 rare, 87 epic,
2 legendary. `src/sim/content/item_sets.ts` defines 10 sets: 7 epic families
(3 tier 1, 4 tier 2) plus 3 leveling haste kits.

Retro behavior (applies to every itemsDiscovered deed): on first load after
rollout, seed `itemsDiscovered` from the character's current bags, bank, and
equipped items so veterans keep credit for what they still hold. Nothing here
can ever un-earn: the set only grows.

## Registries

Proposed titles (2):
- the Curator (col_discovery_150)
- the Resplendent (col_seven_regalia)

Proposed borders (1):
- curators_gilt (col_discovery_250)

Proposed Steam names (7):
- ACH_DISCOVERY_25
- ACH_DISCOVERY_250
- ACH_FIRST_EPIC
- ACH_FIRST_LEGENDARY
- ACH_SEVEN_REGALIA
- ACH_ALL_SLOTS
- ACH_GLIMMERFIN

## Discovery ladder

### col_discovery_25
- Name: Packrat
- Desc: Discover 25 different items (an item counts the first time it ever enters your possession).
- Renown: 5
- Trigger: itemsDiscovered.size >= 25, evaluated at the acquisition hook that inserts into itemsDiscovered.
- Reward: none
- Hidden: no
- Steam: ACH_DISCOVERY_25
- Notes: 435 distinct item ids exist in the merged ITEMS table (src/sim/data.ts). 25 lands naturally in the first play session or two.

### col_discovery_75
- Name: Magpie
- Desc: Discover 75 different items.
- Renown: 10
- Trigger: itemsDiscovered.size >= 75.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Reached through normal leveling across zones 1 and 2.

### col_discovery_150
- Name: Cabinet of Curiosities
- Desc: Discover 150 different items.
- Renown: 25
- Trigger: itemsDiscovered.size >= 150.
- Reward: title "the Curator"
- Hidden: no
- Steam: no
- Notes: Roughly a third of everything in the world; a committed character hits this near the level cap.

### col_discovery_250
- Name: The Grand Catalogue
- Desc: Discover 250 different items.
- Renown: 50
- Trigger: itemsDiscovered.size >= 250.
- Reward: border curators_gilt
- Hidden: no
- Steam: ACH_DISCOVERY_250
- Notes: Deliberate prestige (rule 7), luck-independent by construction: the 253 sub-rare items plus the 10 deterministic Heroic Quartermaster epics give a deterministic path past 250 with zero rare-quality drops required, and World Market purchases count as acquisition, so any gap is closable with gold. It still demands fishing, delves, dungeons, professions, and vendors all touched. Threshold is a fixed literal, so the Renown stays valid as content grows.

## Quality firsts

### col_first_rare
- Name: Something Blue
- Desc: Acquire your first item of rare quality.
- Renown: 0
- Trigger: acquisition of any item whose effective quality is 'rare' (instance rolled quality when present, else ItemDef.quality), at the itemsDiscovered insertion hook.
- Reward: none
- Hidden: no
- Steam: no
- Notes: 0 Renown by rule 2: drop timing is luck. Still a flex moment; fire the toast loudly. Gathered materials can also roll rare via the proficiency ladder (src/sim/professions/gathering.ts), hence the effective-quality wording.

### col_first_epic
- Name: Born to the Purple
- Desc: Acquire your first item of epic quality.
- Renown: 0
- Trigger: acquisition of any item whose effective quality is 'epic', same hook as col_first_rare.
- Reward: none
- Hidden: no
- Steam: ACH_FIRST_EPIC
- Notes: 0 Renown by rule 2: epics are boss-drop luck for most players. A patient player CAN reach it deterministically through the Heroic Quartermaster's marks stock (src/sim/content/heroic_vendor.ts), which is why this stays a first-acquisition trigger rather than a drop trigger.

### col_first_legendary
- Name: Orange You Lucky
- Desc: Acquire your first item of legendary quality.
- Renown: 0
- Trigger: acquisition of any item whose effective quality is 'legendary', same hook as col_first_rare.
- Reward: none
- Hidden: no
- Steam: ACH_FIRST_LEGENDARY
- Notes: 0 Renown by rule 2: exactly two legendaries exist, Heartwood of the Deathless Crown and Thronebane, Last Oath of Thornpeak (src/sim/content/zone3.ts), each a 3% Nythraxis drop (src/sim/content/dungeons.ts). Pure luck, maximum flex.

## Item sets (discovered-all, so bank and inventory shuffling can never un-earn)

Every set deed below triggers when all listed piece ids are present in
itemsDiscovered. Piece lists are the `set`-tagged members of the merged ITEMS
table (src/sim/content/item_sets.ts plus the per-item `set` tags). Discovery
requires acquisition only, never equipping, so class-restricted pieces still
count for any looter. All ten are 0 Renown by rule 2: every family is
assembled from drops (tier 1 from the Gravewyrm Sanctum, tier 2 helms and
shoulders from the Nythraxis raid and gloves and belts from the Thunzharr
world boss, haste kits from world drops), so completion timing is luck.

### col_set_vale_arcanist
- Name: Vale Arcanist's Regalia
- Desc: Discover every piece of the Vale Arcanist's Regalia.
- Renown: 0
- Trigger: itemsDiscovered contains all of: woven_robe, acolytes_circlet, silk_sash.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Leveling haste kit (3 pieces). woven_robe is also a zone 1 quest reward for mages (src/sim/content/zone1.ts), but the family as a whole is world-drop luck, so 0 Renown.

### col_set_boundstone_vanguard
- Name: Boundstone Vanguard
- Desc: Discover every piece of the Boundstone Vanguard.
- Renown: 0
- Trigger: itemsDiscovered contains all of: boundstone_helm, boundstone_girdle, gravewyrm_gauntlets.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Leveling haste kit (3 pieces), world drops.

### col_set_greyjaw_stalker
- Name: Greyjaw Stalker's Kit
- Desc: Discover every piece of the Greyjaw Stalker's Kit.
- Renown: 0
- Trigger: itemsDiscovered contains all of: shadow_jerkin, greyjaw_hide_boots, trail_leggings.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Leveling haste kit (3 pieces). shadow_jerkin is also a zone 1 quest reward for rogues.

### col_set_deathlord
- Name: Barrowlord Battlegear
- Desc: Discover every piece of the Barrowlord Battlegear.
- Renown: 0
- Trigger: itemsDiscovered contains all of: deathlord_warplate, deathlord_legguards, deathlord_sabatons, deathlords_dread_visage.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Tier 1 plate, Gravewyrm Sanctum drops (e.g. deathlord_warplate at 5% off Korzul, src/sim/content/dungeons.ts).

### col_set_wyrmshadow
- Name: Nightfang Vestments
- Desc: Discover every piece of the Nightfang Vestments.
- Renown: 0
- Trigger: itemsDiscovered contains all of: wyrmshadow_harness, wyrmshadow_treads, wyrmshadow_legguards, wyrmshadow_talongrips.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Tier 1 leather, Gravewyrm Sanctum drops.

### col_set_necromancers
- Name: Mournweave Raiment
- Desc: Discover every piece of the Mournweave Raiment.
- Renown: 0
- Trigger: itemsDiscovered contains all of: necromancers_starshroud, necromancers_soulsteps, necromancers_legwraps, necromancers_soulspire_mantle.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Tier 1 cloth, Gravewyrm Sanctum drops.

### col_set_crownforged
- Name: Bonewrought Regalia
- Desc: Discover every piece of the Bonewrought Regalia.
- Renown: 0
- Trigger: itemsDiscovered contains all of: crownforged_gauntlets, crownforged_girdle, crownforged_dreadhelm, crownforged_warspaulders.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Tier 2 plate. Helm and shoulders drop in the Nythraxis raid, gloves and belt from the Thunzharr world boss (src/sim/content/item_sets.ts comments, src/sim/content/zone3.ts).

### col_set_nighttalon
- Name: Direfang Pelt
- Desc: Discover every piece of the Direfang Pelt.
- Renown: 0
- Trigger: itemsDiscovered contains all of: nighttalon_grips, nighttalon_waistband, nighttalon_crown, nighttalon_shoulderguards.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Tier 2 leather, Nythraxis raid plus Thunzharr world boss.

### col_set_soulflame
- Name: Wraithfire Regalia
- Desc: Discover every piece of the Wraithfire Regalia.
- Renown: 0
- Trigger: itemsDiscovered contains all of: soulflame_gloves, soulflame_cord, soulflame_cowl, soulflame_mantle.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Tier 2 cloth, Nythraxis raid plus Thunzharr world boss.

### col_set_stormcallers
- Name: Galecall Vestments
- Desc: Discover every piece of the Galecall Vestments.
- Renown: 0
- Trigger: itemsDiscovered contains all of: stormcallers_handguards, stormcallers_waistguard, stormcallers_crown, stormcallers_spaulders.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Tier 2 shaman cloth (requiredClass shaman on the pieces, src/sim/content/zone3.ts); discovery still only needs acquisition.

### col_seven_regalia
- Name: The Sevenfold Wardrobe
- Desc: Discover every piece of all seven epic armor families.
- Renown: 0
- Trigger: meta over col_set_deathlord, col_set_wyrmshadow, col_set_necromancers, col_set_crownforged, col_set_nighttalon, col_set_soulflame, col_set_stormcallers.
- Reward: title "the Resplendent"
- Hidden: no
- Steam: ACH_SEVEN_REGALIA
- Notes: A fixed seven-deed list, never "all sets in the game", so it cannot grow with content. 0 Renown because every component is drop luck; the title is the flex. The three leveling kits are deliberately excluded: cross-class world-drop farming at the cap is tedium, not collection.

## Appearance

### col_true_colors
- Name: True Colors
- Desc: Take the field wearing any appearance other than your class default.
- Renown: 0
- Trigger: predicate over the character save: skinCatalog == 'mech', or skin > 0 with skinCatalog == 'class'.
- Reward: none
- Hidden: no
- Steam: no
- Notes: 0 Renown: every current acquisition channel is outside deterministic play (class alternate skins come from the event skin token's rank ROLL, 70/25/5 in src/sim/content/skins.ts; mech chromas are account-cosmetic grants). Earn-once, so later unequipping the chroma cannot un-earn it. See the out-of-scope section for why there is no skin LADDER.

## Breadth and completion

### col_all_slots
- Name: Dressed to the Elevens
- Desc: Have an item equipped in all eleven equipment slots at the same time.
- Renown: 25
- Trigger: predicate over persisted equipment: all eleven equip slots non-empty on the same tick, evaluated on equip. Slot list PINNED as of v1: mainhand, helmet, neck, shoulder, chest, waist, legs, gloves, feet, ring1, ring2 (the EQUIP_SLOTS literal in src/sim/types.ts); a future twelfth slot does NOT grow this deed.
- Reward: none
- Hidden: no
- Steam: ACH_ALL_SLOTS
- Notes: Notable rather than routine because the Heroic Quartermaster is the game's ONLY source of neck and ring jewelry (src/sim/content/heroic_vendor.ts): filling neck plus both rings costs at least 40 heroic marks against a daily-gated income of at most 4. Fully deterministic, hence real Renown.

### col_quartermaster_buyout
- Name: Preferred Customer
- Desc: Discover all ten pieces of the Heroic Quartermaster's stock.
- Renown: 25
- Trigger: itemsDiscovered contains all of: seal_of_the_nine_oaths, nielas_coldlight_band, sutils_gambit, oath_of_the_round_table, zyzzs_deathless_signet, architects_cornerstone, yumis_keepsake_locket, zense_meridian, swiftfang_talisman, medallion_of_endless_profit.
- Reward: none
- Hidden: no
- Steam: no
- Notes: 136 marks total at 12 per ring and 16 per neck (src/sim/content/heroic_vendor.ts), roughly five weeks of capped heroic clears. Long but fully deterministic marks purchases, so Renown is allowed; kept at 25, not 50, because it is patience rather than skill.

## Anglers and junk

### col_glimmerfin
- Name: Glimmer of Hope
- Desc: Catch a Glimmerfin Koi.
- Renown: 0
- Trigger: acquisition of glimmerfin_koi (FISHING_RARE_ID, src/sim/content/items.ts).
- Reward: none
- Hidden: no
- Steam: ACH_GLIMMERFIN
- Notes: The rare catch, weighted 3 to 4 out of 100 per cast in every zone's fishing table. Luck, so 0 Renown, but it already gets a celebratory shout in the combat log; the deed makes it permanent.

### col_full_creel
- Name: Full Creel
- Desc: Discover all six common catches from the waters of the Vale, the Marsh, and the Heights.
- Renown: 10
- Trigger: itemsDiscovered contains all of: raw_mirror_trout, raw_river_perch, raw_marsh_pike, raw_bog_eel, raw_frostgill_trout, raw_stonescale_carp (FISHING_TABLES, src/sim/content/items.ts).
- Reward: none
- Hidden: no
- Steam: no
- Notes: Every listed fish is a high-weight table entry (30 to 45 out of 100), so a handful of casts per zone guarantees it: effectively deterministic travel plus patience, hence Renown. The Glimmerfin Koi is deliberately excluded so this deed stays luck-free.

### col_junk_drawer
- Name: The Junk Drawer
- Desc: Discover 10 different poor-quality items.
- Renown: 5
- Trigger: count of itemsDiscovered ids whose ItemDef.quality == 'poor' reaches 10.
- Reward: none
- Hidden: no
- Steam: no
- Notes: 25 poor items exist in the merged table; gray trash falls constantly in normal play, so 10 distinct lands where natural play lands (rule 7). Includes fishing junk like the soggy_boot and tangled_weed for flavor.

## Explicitly out of scope on this branch (checked, not forgotten)

- Fiesta augments (src/sim/content/augments.ts, 24 defs): match-scoped by
  design, a pick lasts "for the rest of the bout" and nothing persists to the
  save. Any augment deed belongs to pvp-sport.md as match behavior, not here.
- Skin collection LADDER: ungroundable in v1. Class alternate skins come only
  from the event skin token, an explicit dev placeholder whose rank is a
  70/25/5 luck roll (src/sim/content/skins.ts). The mech catalog unlock quest
  (q_aldrics_fallen_star, src/sim/content/zone2.ts) is retired: true, so rule
  5 forbids requiring it. Mech chromas are granted straight into account-level
  accountCosmetics.mechChromaIds by Discord swag claims (server/game.ts,
  grantMechChromaToAccount) WITHOUT passing through inventory, so the plate
  item ids never reliably enter itemsDiscovered. One 0-Renown wear-any-skin
  deed (col_true_colors) is all that is honest today.
- Fully-enchanted equipment: enchanting exists only as a craft id in
  src/sim/content/professions.ts; there is no per-item enchantment state
  anywhere in src/sim/types.ts and no enchanting recipes, so nothing to check.
- Gathered-material collection: node harvests currently grant placeholder junk
  ids (bone_fragments, linen_scrap, spider_leg per NODE_HARVEST_TABLE,
  src/sim/professions/gathering.ts, "dedicated ore/wood/herb items are future
  content work"), so a materials deed would be indistinguishable from mob junk.
- Crafted-item breadth over craftSkills/recipes: left to the file that owns
  professions deeds; the professions epic is still moving under it.
