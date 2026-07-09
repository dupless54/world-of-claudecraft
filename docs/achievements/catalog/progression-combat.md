# Progression and Combat deeds (prog_, cmb_)

36 deeds, 600 Renown total, 14 Steam marquee entries. Every trigger references
real, persisted state on this branch; source files are cited in Notes where the
reference is non-obvious.

## Registries (this file's contributions)

Proposed titles (7; the first five are the reserved milestone titles):
- Veteran (prog_veteran)
- Champion (prog_champion)
- Paragon (prog_paragon)
- Mythic (prog_mythic)
- Eternal (prog_eternal)
- Ringwright (prog_ringwright)
- Ninefold (prog_ninefold)

Proposed borders (1):
- prestige_laurels (prog_prestige_10)

Steam names (14):
- ACH_FIRST_STEPS
- ACH_DOUBLE_DIGITS
- ACH_LEVEL_CAP
- ACH_TALENTED
- ACH_FULL_BUILD
- ACH_VETERAN
- ACH_ETERNAL
- ACH_PRESTIGE
- ACH_MASTER_GATHERER
- ACH_RINGWRIGHT
- ACH_NINEFOLD
- ACH_FIRST_BLOOD
- ACH_SLAYER
- ACH_FIRST_FALL

Shared implementation notes:
- Predicates over persisted CharacterState (level, lifetimeXp, prestigeRank,
  talents, gatheringProficiency, craftSkills, restedXp) evaluate retroactively
  on login, so existing characters are granted what they have already earned.
- Lifetime counters are NEW persisted deedStats counters. The increment sites
  are the same places that already feed the session-only RewardCounters
  (src/sim/sim.ts: kills, deaths, damageDealt, damageTaken, xpGained), so the
  wiring is a one-line add per site. Counters start at zero when the deed
  system lands (forward-only); the affected thresholds are low enough that
  active players re-earn them in normal play.

## Level milestones

### prog_first_steps
- Name: First Steps
- Desc: Reach level 2 and take your first step on a long road.
- Renown: 5
- Trigger: predicate: player level >= 2 (levelup SimEvent site; persisted level in CharacterState)
- Reward: none
- Hidden: no
- Steam: ACH_FIRST_STEPS
- Notes: The tutorial deed for the whole progression category. Retro-grants on load.

### prog_finding_your_feet
- Name: Finding Your Feet
- Desc: Reach level 5; the wilds already look a little smaller.
- Renown: 5
- Trigger: predicate: player level >= 5
- Reward: none
- Hidden: no
- Steam: no

### prog_double_digits
- Name: Double Digits
- Desc: Reach level 10 and unlock your talents.
- Renown: 10
- Trigger: predicate: player level >= 10
- Reward: none
- Hidden: no
- Steam: ACH_DOUBLE_DIGITS
- Notes: Level 10 is FIRST_TALENT_LEVEL (src/sim/content/talents.ts), so this deed doubles as the talent-system signpost.

### prog_the_long_middle
- Name: The Long Middle
- Desc: Reach level 15.
- Renown: 10
- Trigger: predicate: player level >= 15
- Reward: none
- Hidden: no
- Steam: no

### prog_level_cap
- Name: The View From the Top
- Desc: Reach level 20, the level cap.
- Renown: 25
- Trigger: predicate: player level >= 20 (MAX_LEVEL, src/sim/types.ts)
- Reward: none
- Hidden: no
- Steam: ACH_LEVEL_CAP
- Notes: Past the cap, XP keeps flowing into lifetimeXp (Max-Level XP Overflow), which the milestone and prestige deeds below read.

### prog_well_rested
- Name: Well Rested
- Desc: Settle in at an inn until you have earned rested experience.
- Renown: 5
- Trigger: predicate: restedXp > 0 (PlayerMeta.restedXp, persisted)
- Reward: none
- Hidden: no
- Steam: no
- Notes: Rested XP accrues only inside inn footprints (src/sim/progression/xp.ts; inn buildings exist in zone content, e.g. src/sim/content/zone1.ts). Teaches the classic log-out-at-the-inn habit. Waiver: one-time tutorial deed teaching the rested mechanic; sanctioned exception to the no-attendance clause of rule 6.

## Talents

### prog_talented
- Name: A Point Well Spent
- Desc: Spend your first talent point.
- Renown: 5
- Trigger: predicate: pointsSpent(talents) >= 1 (src/sim/content/talents.ts pointsSpent over persisted PlayerMeta.talents)
- Reward: none
- Hidden: no
- Steam: ACH_TALENTED

### prog_specialized
- Name: Declaration of Intent
- Desc: Choose a specialization and learn its signature ability.
- Renown: 10
- Trigger: predicate: talents.spec !== null (TalentAllocation.spec, persisted)
- Reward: none
- Hidden: no
- Steam: no
- Notes: Spec selection grants the spec's signature ability and mastery passive (computeTalentModifiers, src/sim/content/talents.ts). Every class has specs (talents_classic.ts, talents_warrior.ts).

### prog_deep_roots
- Name: Deep Roots
- Desc: Spend a talent point in a final-row talent.
- Renown: 10
- Trigger: predicate: any rank spent in a talent node with pointsGate 8 (the bottom row of every class and spec tree)
- Reward: none
- Hidden: no
- Steam: no
- Notes: The capstone row (row 3, pointsGate 8, e.g. Improved Maiming Strike in src/sim/content/talents_warrior.ts) needs 9 points, so this lands around level 18.

### prog_full_build
- Name: The Full Eleven
- Desc: Spend all eleven talent points on a single build.
- Renown: 25
- Trigger: predicate: pointsSpent(talents) >= 11, PINNED as of v1 (the level-20 cap's full allotment per src/sim/content/talents.ts); a future cap raise does NOT grow this deed, a new deed covers the new allotment.
- Reward: none
- Hidden: no
- Steam: ACH_FULL_BUILD
- Notes: Only possible at the cap. Saved loadouts (SavedLoadout, MAX_LOADOUTS 10) do not need their own deed; a full applied build is the milestone.

## Lifetime experience milestones

These five deeds absorb the legacy cosmetic milestone system (the MILESTONES
table and unlockedMilestones set, src/sim/types.ts and src/sim/sim.ts; the
milestoneUnlocked SimEvent retires with it). Thresholds match the legacy table
exactly, and the five titles are reserved for exactly these deeds. Retro:
grant purely from lifetimeXp on load (it is monotonic), ignoring the legacy
unlockedMilestones contents.

### prog_veteran
- Name: Veteran
- Desc: Earn 250,000 lifetime experience.
- Renown: 10
- Trigger: predicate: lifetimeXp >= 250000 (PlayerMeta.lifetimeXp, monotonic, persisted)
- Reward: title "Veteran"
- Hidden: no
- Steam: ACH_VETERAN
- Notes: Absorbs legacy milestone id 'veteran' (kind 'title'). Reaching the cap takes 167,200 lifetime XP, so this is the first post-cap waypoint.

### prog_champion
- Name: Champion
- Desc: Earn 500,000 lifetime experience.
- Renown: 25
- Trigger: predicate: lifetimeXp >= 500000
- Reward: title "Champion"
- Hidden: no
- Steam: no
- Notes: Absorbs legacy milestone id 'champion' (kind 'title').

### prog_paragon
- Name: Paragon
- Desc: Earn 1,000,000 lifetime experience.
- Renown: 25
- Trigger: predicate: lifetimeXp >= 1000000
- Reward: title "Paragon"
- Hidden: no
- Steam: no
- Notes: Absorbs legacy milestone id 'paragon'. The legacy table awarded it as kind 'border'; the deed awards the reserved title instead, and whether the old border visual rides along is a maintainer call at implement time.

### prog_mythic
- Name: Mythic
- Desc: Earn 2,500,000 lifetime experience.
- Renown: 50
- Trigger: predicate: lifetimeXp >= 2500000
- Reward: title "Mythic"
- Hidden: no
- Steam: no
- Notes: Absorbs legacy milestone id 'mythic'. Same legacy kind 'border' caveat as prog_paragon.

### prog_eternal
- Name: Eternal
- Desc: Earn 5,000,000 lifetime experience.
- Renown: 50
- Trigger: predicate: lifetimeXp >= 5000000
- Reward: title "Eternal"
- Hidden: no
- Steam: ACH_ETERNAL
- Notes: Absorbs legacy milestone id 'eternal' (kind 'title'). Deliberate long-tail prestige; roughly thirty times the XP of the leveling journey.

## Prestige

Prestige is opt-in and strictly cosmetic (src/sim/progression/xp.ts prestige;
FR-6.1/6.3): at the cap, each rank costs one full level-cap bar of post-cap
lifetime XP (PRESTIGE_XP_PER_RANK, 23,200) and the server caps rank at
maxPrestigeRank(lifetimeXp), so the rank cannot be command-spammed.

### prog_prestige
- Name: Begin Again
- Desc: Reach the level cap, fill the bar once more, and claim prestige rank 1.
- Renown: 10
- Trigger: predicate: prestigeRank >= 1 (PlayerMeta.prestigeRank, persisted)
- Reward: none
- Hidden: no
- Steam: ACH_PRESTIGE

### prog_prestige_5
- Name: Old Habits
- Desc: Reach prestige rank 5.
- Renown: 25
- Trigger: predicate: prestigeRank >= 5
- Reward: none
- Hidden: no
- Steam: no

### prog_prestige_10
- Name: Perpetual Motion
- Desc: Reach prestige rank 10.
- Renown: 50
- Trigger: predicate: prestigeRank >= 10
- Reward: border prestige_laurels
- Hidden: no
- Steam: no
- Notes: Rank 10 needs 399,200 lifetime XP, between the Veteran and Champion milestones, but only for players who keep pressing the button; a proper prestige-lane capstone border.

## Gathering professions

Proficiency is one point per harvest, per profession (src/sim/professions/
gathering.ts), and 100 is MATERIAL_RARITY_MAX_PROFICIENCY, the point where the
material rarity odds stop improving; a natural deed ceiling. The nominal skill
cap is 300 (maxSkill, src/sim/content/professions.ts), left deliberately
un-deeded until higher-proficiency content reads it.

### prog_first_harvest
- Name: Fruits of the Field
- Desc: Harvest your first gathering node.
- Renown: 5
- Trigger: predicate: any of gatheringProficiency.mining/logging/herbalism >= 1 (persisted; each harvest grants exactly one point)
- Reward: none
- Hidden: no
- Steam: no
- Notes: Ore, wood, and herb nodes are placed in zone content (src/sim/content/gather_nodes.ts). Retro-grants on load.

### prog_mining_100
- Name: Ore in the Blood
- Desc: Reach 100 Mining proficiency.
- Renown: 10
- Trigger: predicate: gatheringProficiency.mining >= 100
- Reward: none
- Hidden: no
- Steam: no

### prog_logging_100
- Name: Heartwood Hewer
- Desc: Reach 100 Logging proficiency.
- Renown: 10
- Trigger: predicate: gatheringProficiency.logging >= 100
- Reward: none
- Hidden: no
- Steam: no

### prog_herbalism_100
- Name: Master of the Meadow
- Desc: Reach 100 Herbalism proficiency.
- Renown: 10
- Trigger: predicate: gatheringProficiency.herbalism >= 100
- Reward: none
- Hidden: no
- Steam: no

### prog_master_gatherer
- Name: Master Gatherer
- Desc: Reach 100 proficiency in Mining, Logging, and Herbalism.
- Renown: 25
- Trigger: predicate: all three gatheringProficiency values >= 100
- Reward: none
- Hidden: no
- Steam: ACH_MASTER_GATHERER
- Notes: 300 harvests total at 120s node respawns; a deliberate mid-to-late project, not a wall.

## The craft ring

Craft skill is flat, additive, and independent per craft across the ten-craft
ring (src/sim/professions/wheel.ts, src/sim/content/professions.ts CRAFT_RING);
successful crafts grant 1 skill (src/sim/professions/crafting.ts), 25 skill is
one mastery tier (TIER_SKILL_STEP), and 75 is the specialization perk
threshold (PERK_THRESHOLDS).

### prog_first_craft
- Name: Made By Hand
- Desc: Complete your first successful craft.
- Renown: 5
- Trigger: completion: first CraftResult with ok true (deedStats.craftsCompleted >= 1, incremented in resolveCraft, src/sim/professions/crafting.ts)
- Reward: none
- Hidden: no
- Steam: no
- Notes: Retro: also grant on load when any craftSkills value > 0, since skill only comes from successful crafts.

### prog_craft_specialist
- Name: Trade Secrets
- Desc: Reach 75 skill in any one craft and unlock its specialization perks.
- Renown: 10
- Trigger: predicate: max over CRAFT_RING of craftSkills[craftId] >= 75 (specializedSkillThreshold)
- Reward: none
- Hidden: no
- Steam: no
- Notes: 75 skill unlocks the material discount and recharge perks (src/sim/professions/wheel.ts, tools.ts).

### prog_around_the_ring
- Name: Around the Ring
- Desc: Reach 25 skill in five different crafts.
- Renown: 10
- Trigger: predicate: craftSkills[craftId] >= 25 (TIER_SKILL_STEP) for at least 5 crafts on CRAFT_RING
- Reward: none
- Hidden: no
- Steam: no
- Notes: Earnable today: seven crafts currently have recipes in src/sim/content/recipes.ts.

### prog_ringwright
- Name: Ringwright
- Desc: Reach 25 skill in every craft on the ten-craft ring.
- Renown: 25
- Trigger: predicate: craftSkills[craftId] >= 25 for all 10 crafts on CRAFT_RING
- Reward: title "Ringwright"
- Hidden: no
- Steam: ACH_RINGWRIGHT
- Notes: The requirement is static (CRAFT_RING is fixed at ten), but jewelcrafting, inscription, and enchanting have no recipes in content/recipes.ts yet, so this deed is unearnable until those land. Not missable, just future-gated; the implement session should confirm with the maintainer whether to hold the Steam entry back until recipe coverage is complete (ACH names are stable forever).

## Class breadth

Both deeds need ACCOUNT-LEVEL evaluation: a character's class is fixed at
creation, so no per-character predicate can count classes. The server already
holds all of an account's characters (characters table); evaluation is a scan
of that account's persisted character levels by class, re-run on any level-up
of an account's character. Offline (single-character sim) these deeds simply
never complete, matching other server-only surfaces.

### prog_three_paths
- Name: Three Paths Walked
- Desc: Reach level 10 on three different classes.
- Renown: 10
- Trigger: meta/account: >= 3 distinct classes among the account's characters with level >= 10
- Reward: none
- Hidden: no
- Steam: no
- Notes: Level 10 is the talents unlock, a real commitment point rather than a throwaway alt parked at the starting camp.

### prog_ninefold
- Name: The Ninefold Way
- Desc: Reach level 10 on all nine classes.
- Renown: 50
- Trigger: meta/account: all 9 classes (CLASSES, src/sim/content/classes.ts) have an account character with level >= 10
- Reward: title "Ninefold"
- Hidden: no
- Steam: ACH_NINEFOLD
- Notes: Warrior, Mage, Rogue, Paladin, Hunter, Priest, Shaman, Warlock, Druid. Requires nine character slots; confirm the account character cap allows it at implement time.

## Combat

Lifetime counters here are new persisted deedStats counters incremented at the
existing RewardCounters sites (kill credit and damage application in
src/sim/combat/damage.ts and the sim damage path). PvP, dungeon, and world-boss
combat deeds live in their own catalog files.

### cmb_first_blood
- Name: First Blood
- Desc: Defeat your first enemy.
- Renown: 5
- Trigger: lifetime counter: deedStats.kills >= 1
- Reward: none
- Hidden: no
- Steam: ACH_FIRST_BLOOD

### cmb_slayer
- Name: Slayer
- Desc: Defeat 1,000 enemies.
- Renown: 10
- Trigger: lifetime counter: deedStats.kills >= 1000
- Reward: none
- Hidden: no
- Steam: ACH_SLAYER
- Notes: A solo run to the cap is roughly 1,200 to 1,800 kills (167,200 XP at classic mob XP values), so this lands inside natural leveling.

### cmb_legion_of_one
- Name: Legion of One
- Desc: Defeat 10,000 enemies.
- Renown: 25
- Trigger: lifetime counter: deedStats.kills >= 10000
- Reward: none
- Hidden: no
- Steam: no
- Notes: Deliberate post-cap volume; pairs with the lifetime XP milestones.

### cmb_heavy_hitter
- Name: Heavy Hitter
- Desc: Deal 500,000 total damage.
- Renown: 10
- Trigger: lifetime counter: deedStats.damageDealt >= 500000, excluding damage dealt to dummy templates (the same exclusion cmb_giantslayer carries)
- Reward: none
- Hidden: no
- Steam: no
- Notes: Sized from zone mob HP curves (hpBase ~40 to 70 plus ~17 to 26 per level): a full leveling journey deals roughly this much, more with dungeons. The training dummy (999999 hp, deals nothing back) would otherwise be a zero-risk farm for this counter, hence the exclusion.

### cmb_critical_eye
- Name: Critical Eye
- Desc: Land 500 critical strikes.
- Renown: 10
- Trigger: lifetime counter: deedStats.crits >= 500, incremented where the damage SimEvent is emitted with crit true and kind 'hit' from a player source (src/sim/types.ts SimEvent 'damage'), excluding hits on dummy templates (the same exclusion cmb_giantslayer carries)
- Reward: none
- Hidden: no
- Steam: no
- Notes: Crit data already flows through the damage event, so this is a counter at an existing emit site, not new combat plumbing. The dummy exclusion keeps the counter a record of real combat rather than a zero-risk dummy farm.

### cmb_giantslayer
- Name: Giantslayer
- Desc: Land the killing blow on an enemy at least five levels above you.
- Renown: 10
- Trigger: completion: killing blow on a mob with level >= player level + 5, excluding dummy and worldBoss templates (killer resolution in src/sim/combat/damage.ts handleDeath)
- Reward: none
- Hidden: no
- Steam: no
- Notes: Skill and nerve, not RNG: the deed cannot fail, it is simply earned when the underdog kill happens. World-boss kills are covered in dungeons-delves.md.

### cmb_first_fall
- Name: Dust Yourself Off
- Desc: Die for the first time; it happens to the best of us.
- Renown: 5
- Trigger: lifetime counter: deedStats.deaths >= 1 (playerDeath SimEvent site)
- Reward: none
- Hidden: no
- Steam: ACH_FIRST_FALL
- Notes: The gentle death-mechanics tutorial: release your spirit at a graveyard, ghost-run back to your corpse for a penalty-free resurrection at half your pools, or take the Spirit Healer's instant offer and wear The Keeper's Toll for a while (src/sim/spirit.ts, src/sim/resurrection.ts). Counting deaths only ever adds Renown, so the account score never decreases.
