# Dungeons and Delves (dgn_, dlv_, plus cmb_ for the world boss)

42 deeds. Renown subtotal: 690. Steam: 21 (the 20-name quota plus
ACH_DELVE_JOURNAL, moved here from collection.md in the assembly duplicate
sweep).

## Registries

Proposed titles (4):
- "Wyrmfeller" (dgn_korzul_flawless)
- "the Deathless" (dgn_nythraxis_deathless)
- "Peakbreaker" (cmb_thunzharr_unbroken)
- "Bellstiller" (dlv_nhalia_bells)

Proposed borders (1):
- `deepward` (dgn_deepward, the clear-everything-heroic capstone)

Steam ACH_ names (21):
ACH_HOLLOW_CRYPT, ACH_SUNKEN_BASTION, ACH_DROWNED_TEMPLE, ACH_GRAVEWYRM_SANCTUM,
ACH_NYTHRAXIS, ACH_NYTHRAXIS_HEROIC, ACH_THORNPEAK_ROUNDS, ACH_DEEPWARD,
ACH_MARK_CIRCUIT, ACH_KORZUL_FLAWLESS, ACH_SANCTUM_SPEED, ACH_NYTHRAXIS_WARDENS,
ACH_NYTHRAXIS_DEATHLESS, ACH_THUNZHARR, ACH_THUNZHARR_UNBROKEN, ACH_RELIQUARY,
ACH_LITANY, ACH_SOLO_HEROIC, ACH_TUMBLER_PREMIUM, ACH_NHALIA_BELLS,
ACH_DELVE_JOURNAL

## Grounding notes for the implement session

- Dungeon and boss names verified against `src/sim/content/dungeons.ts`,
  `src/sim/content/temple.ts`, `src/sim/content/dungeon_difficulty.ts`
  (heroic tuning + `finalBossId`), `src/sim/encounters/nythraxis.ts`,
  `src/sim/world_boss.ts`, and `src/sim/content/zone3.ts` (Thunzharr).
- Delve state verified against `src/sim/delves/runs.ts` (`delveClears` keyed
  `<delveId>:<tierId>`, `delveMarks`, `DELVE_LORE_ORDER`),
  `src/sim/content/delves/companions.ts` (`companionUpgrades`, max rank 3),
  `src/sim/lockpick.ts` (antes), and `src/sim/delves/drowned_litany_rite.ts`
  (zero-mistake premium result).
- The delve lore journal is ONE shared five-entry order across both delves
  (`DELVE_LORE_ORDER` in `src/sim/delves/runs.ts`), not a per-delve log, so
  lore completion is a single deed here.
- No persisted dungeon-clear counter exists today; the repeat-clear deeds
  below specify new lifetime `deedStats` counters (rule 4 vocabulary).
  Delve repeat-clear deeds read the existing persisted `delveClears`.
- "Encounter window" in the skill tasks means: from the named boss first
  entering combat until it dies, within one uninterrupted attempt (an evade
  or wipe reset re-arms the window). "Party member" means every player
  inside that instance during the window.
- Speed thresholds are placeholders to calibrate during the implement
  session; the shape (kill the final boss within N minutes of the party
  claiming the instance) is the fixed part.

---

## Dungeon completion

### dgn_hollow_crypt
- Name: Cryptbreaker
- Desc: Defeat Morthen the Gravecaller in the Hollow Crypt.
- Renown: 5
- Trigger: completion: kill credit on `morthen` in a `hollow_crypt` instance, any difficulty (the downed-members-included recipients snapshot handleDeath uses).
- Reward: none
- Hidden: no
- Steam: ACH_HOLLOW_CRYPT
- Notes: The first dungeon most characters see (~L10). Boss def in src/sim/content/dungeons.ts.

### dgn_sunken_bastion
- Name: Fogbinder Unbound
- Desc: Defeat Vael the Fogbinder in the Sunken Bastion.
- Renown: 5
- Trigger: completion: kill credit on `vael_the_mistcaller` in a `sunken_bastion` instance, any difficulty.
- Reward: none
- Hidden: no
- Steam: ACH_SUNKEN_BASTION
- Notes: Template id is `vael_the_mistcaller`; the display name is Vael the Fogbinder (src/sim/content/dungeons.ts).

### dgn_drowned_temple
- Name: Drowning the Moon
- Desc: Defeat Ysolei, Avatar of the Drowned Moon, in the Drowned Temple.
- Renown: 10
- Trigger: completion: kill credit on `ysolei` in a `drowned_temple` instance, any difficulty.
- Reward: none
- Hidden: no
- Steam: ACH_DROWNED_TEMPLE
- Notes: The moongate wing (~L15-18), src/sim/content/temple.ts.

### dgn_gravewyrm_sanctum
- Name: The Wyrm Below
- Desc: Defeat Korzul the Gravewyrm in Gravewyrm Sanctum.
- Renown: 10
- Trigger: completion: kill credit on `korzul_the_gravewyrm` in a `gravewyrm_sanctum` instance, any difficulty.
- Reward: none
- Hidden: no
- Steam: ACH_GRAVEWYRM_SANCTUM
- Notes: The L20 five-player finale.

### dgn_hollow_crypt_heroic
- Name: Heroic: The Hollow Crypt
- Desc: Defeat Morthen the Gravecaller in the Hollow Crypt on Heroic difficulty.
- Renown: 10
- Trigger: completion: kill credit on `morthen` in a `hollow_crypt` instance with `difficulty === 'heroic'`.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Heroic tuning per HEROIC_DUNGEON_TUNING (src/sim/content/dungeon_difficulty.ts).

### dgn_sunken_bastion_heroic
- Name: Heroic: The Sunken Bastion
- Desc: Defeat Vael the Fogbinder in the Sunken Bastion on Heroic difficulty.
- Renown: 10
- Trigger: completion: kill credit on `vael_the_mistcaller` in a `sunken_bastion` instance with `difficulty === 'heroic'`.
- Reward: none
- Hidden: no
- Steam: no

### dgn_drowned_temple_heroic
- Name: Heroic: The Drowned Temple
- Desc: Defeat Ysolei, Avatar of the Drowned Moon, in the Drowned Temple on Heroic difficulty.
- Renown: 10
- Trigger: completion: kill credit on `ysolei` in a `drowned_temple` instance with `difficulty === 'heroic'`.
- Reward: none
- Hidden: no
- Steam: no

### dgn_gravewyrm_sanctum_heroic
- Name: Heroic: Gravewyrm Sanctum
- Desc: Defeat Korzul the Gravewyrm in Gravewyrm Sanctum on Heroic difficulty.
- Renown: 10
- Trigger: completion: kill credit on `korzul_the_gravewyrm` in a `gravewyrm_sanctum` instance with `difficulty === 'heroic'`.
- Reward: none
- Hidden: no
- Steam: no

### dgn_nythraxis
- Name: Scourge No More
- Desc: Defeat Nythraxis, Scourge of Thornpeak, beyond the sealed royal door.
- Renown: 25
- Trigger: completion: kill credit on `nythraxis_scourge_of_thornpeak` in the `nythraxis_boss_arena` raid, any difficulty (the room roster the raid lockout stamps, nythraxisRoomMetas in src/sim/encounters/nythraxis.ts).
- Reward: none
- Hidden: no
- Steam: ACH_NYTHRAXIS
- Notes: The 10-player raid. Desc names only the door and the boss; the attunement chain and mid-fight events stay unspoiled.

### dgn_nythraxis_heroic
- Name: Heroic: Scourge No More
- Desc: Defeat Nythraxis, Scourge of Thornpeak, on Heroic difficulty.
- Renown: 25
- Trigger: completion: kill credit on `nythraxis_scourge_of_thornpeak` with the arena instance `difficulty === 'heroic'`.
- Reward: none
- Hidden: no
- Steam: ACH_NYTHRAXIS_HEROIC
- Notes: The raid lockout is shared across difficulties (one kill per day), so this may take a separate day from the normal kill; not missable, just paced.

## Dungeon metas and counters

### dgn_thornpeak_rounds
- Name: Making the Rounds
- Desc: Clear the Hollow Crypt, the Sunken Bastion, the Drowned Temple, and Gravewyrm Sanctum.
- Renown: 10
- Trigger: meta: dgn_hollow_crypt, dgn_sunken_bastion, dgn_drowned_temple, dgn_gravewyrm_sanctum.
- Reward: none
- Hidden: no
- Steam: ACH_THORNPEAK_ROUNDS
- Notes: Pinned to the four launch five-player dungeons; a fifth dungeon gets its own meta, this one never grows.

### dgn_deepward
- Name: Deepward
- Desc: Conquer every dungeon, the raid, and both delves on Heroic difficulty.
- Renown: 50
- Trigger: meta: dgn_hollow_crypt_heroic, dgn_sunken_bastion_heroic, dgn_drowned_temple_heroic, dgn_gravewyrm_sanctum_heroic, dgn_nythraxis_heroic, dlv_reliquary_heroic, dlv_litany_heroic.
- Reward: border deepward
- Hidden: no
- Steam: ACH_DEEPWARD
- Notes: The clear-all capstone; the list is pinned to launch content so the requirement never grows (rule 2).

### dgn_mark_circuit
- Name: The Full Circuit
- Desc: Earn Heroic Marks from all four Heroic dungeons in a single day.
- Renown: 25
- Trigger: predicate over persisted state: after awardHeroicMarks stamps `heroicDaily.marked`, the set contains all of `hollow_crypt`, `sunken_bastion`, `drowned_temple`, `gravewyrm_sanctum` for one `heroicDaily.date`.
- Reward: none
- Hidden: no
- Steam: ACH_MARK_CIRCUIT
- Notes: Grounded on the daily mark gate in src/sim/instances/dungeons.ts (one mark payout per dungeon per host UTC day). The Nythraxis arena also pays marks but is deliberately not required.

### dgn_boss_clears_50
- Name: Fifty Doors Down
- Desc: Defeat 50 dungeon end bosses.
- Renown: 10
- Trigger: lifetime counter threshold: new deedStats counter `dungeonFinalBossKills` reaches 50. The counter increments on kill credit for exactly these five boss template ids, PINNED as of v1: morthen, vael_the_mistcaller, ysolei, korzul_the_gravewyrm, nythraxis_scourge_of_thornpeak. A listed boss's death increments the counter on ANY difficulty: normal, heroic, and the raid arena.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Natural landing spot for daily heroic runners (four heroics a day reaches it in under two weeks). The literal id list is the single source of truth (difficulty-agnostic by construction); a future dungeon's boss gets a new deed, this list never grows.

## Dungeon skill tasks

### dgn_morthen_flawless
- Name: No Bones About It
- Desc: Defeat Morthen the Gravecaller on Heroic difficulty without any party member dying.
- Renown: 10
- Trigger: perfection: zero player deaths inside the `hollow_crypt` heroic instance during the Morthen encounter window.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Fails only through play (positioning, healing triage); Shadow Pulse is periodic and survivable at full health.

### dgn_morthen_trio
- Name: Three Against the Grave
- Desc: Defeat Morthen the Gravecaller with three or fewer players.
- Renown: 10
- Trigger: restriction: at most 3 unique players appear in Morthen's participant set (threat/damager credit) for the encounter, any difficulty.
- Reward: none
- Hidden: no
- Steam: no
- Notes: The dungeon suggests 5; short-handing it is a deliberate roster choice, never RNG.

### dgn_olen_arc
- Name: Sidestep the Reaper
- Desc: Defeat Knight-Commander Olen without his Reaping Arc striking anyone but his current target.
- Renown: 10
- Trigger: mechanical: during the Knight-Commander Olen encounter window, no Reaping Arc cleave damage lands on any player other than his swing target.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Cleave splashes onto players within 8 yd of the PRIMARY TARGET (mob_swing.ts), so this is a pure spread-out positioning task.

### dgn_vael_thralls
- Name: No Thrall of Mine
- Desc: Defeat Vael the Fogbinder with every Drowned Thrall he calls already slain.
- Renown: 10
- Trigger: mechanical: at Vael's death, every `drowned_thrall` he summoned this attempt (summonAdds at 60% and 30% hp) is dead.
- Reward: none
- Hidden: no
- Steam: no
- Notes: A kill-order task; failing it means the party burned the boss through the adds.

### dgn_ysolei_moonspawn
- Name: Every Last Moonspawn
- Desc: Defeat Ysolei with every Moonspawn she calls already slain.
- Renown: 10
- Trigger: mechanical: at Ysolei's death, every `moonspawn` she summoned this attempt (summonAdds at 60% and 30% hp) is dead.
- Reward: none
- Hidden: no
- Steam: no

### dgn_ysolei_flawless
- Name: Dry Eyes
- Desc: Defeat Ysolei, Avatar of the Drowned Moon, on Heroic difficulty without any party member dying.
- Renown: 25
- Trigger: perfection: zero player deaths inside the `drowned_temple` heroic instance during the Ysolei encounter window.
- Reward: none
- Hidden: no
- Steam: no
- Notes: The hardest-tuned heroic five-man (4.2x damage multiplier), hence notable over standard.

### dgn_velkhar_bonewalkers
- Name: Stay Buried
- Desc: Defeat Grand Necromancer Velkhar with every Raised Bonewalker destroyed before he falls.
- Renown: 10
- Trigger: mechanical: at Velkhar's death, every `raised_bonewalker` he summoned this attempt (summonAdds, 3 per wave at 66% and 33% hp) is dead.
- Reward: none
- Hidden: no
- Steam: no

### dgn_korzul_flawless
- Name: Wyrmfeller
- Desc: Defeat Korzul the Gravewyrm on Heroic difficulty without any party member dying.
- Renown: 25
- Trigger: perfection: zero player deaths inside the `gravewyrm_sanctum` heroic instance during the Korzul encounter window.
- Reward: title "Wyrmfeller"
- Hidden: no
- Steam: ACH_KORZUL_FLAWLESS
- Notes: Marquee five-man skill deed; Necrotic Shockwave plus the 30% enrage make the last third the test.

### dgn_sanctum_speed
- Name: Sanctum Sprint
- Desc: Defeat Korzul the Gravewyrm within 15 minutes of your party claiming Gravewyrm Sanctum.
- Renown: 25
- Trigger: speed: `korzul_the_gravewyrm` kill credit within 15 minutes (18000 ticks) of claimInstance for that `gravewyrm_sanctum` instance, any difficulty.
- Reward: none
- Hidden: no
- Steam: ACH_SANCTUM_SPEED
- Notes: Pace is entirely pull discipline over 21 spawns and 3 bosses; no RNG gate. The 15-minute figure is a placeholder to calibrate at implement time; stamp the claim tick in deedStats.

### dgn_nythraxis_gravebreaker
- Name: Kneel to No King
- Desc: Defeat Nythraxis with Gravebreaker never striking anyone but his current target.
- Renown: 10
- Trigger: mechanical: during the encounter window, no Gravebreaker damage lands on a player other than the boss's aggro target at the moment of the cast, any difficulty.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Gravebreaker is a frontal arc (11 yd, 60-degree half-arc, every 12s); non-targets in the arc take 1.5x. Pure stay-out-of-the-front positioning (src/sim/encounters/nythraxis.ts).

### dgn_nythraxis_wardens
- Name: Keepers of the Wardstones
- Desc: Defeat Nythraxis with every Deathless Rage broken before it lands.
- Renown: 25
- Trigger: mechanical: during the encounter window, every started Deathless Rage cast ends via the wardstone interrupt (nythraxisWardstoneInterruptReady), never by resolving, any difficulty.
- Reward: none
- Hidden: no
- Steam: ACH_NYTHRAXIS_WARDENS
- Notes: The fight itself teaches the wardstones mid-encounter, so the Desc stays behavior-level and spoils no more than the cast bar every raider sees.

### dgn_nythraxis_deathless
- Name: None More Deathless
- Desc: Defeat Nythraxis, Scourge of Thornpeak, on Heroic difficulty without a single raider dying.
- Renown: 50
- Trigger: perfection: zero player deaths inside the heroic `nythraxis_boss_arena` instance from pull to kill.
- Reward: title "the Deathless"
- Hidden: no
- Steam: ACH_NYTHRAXIS_DEATHLESS
- Notes: The prestige raid deed. Heroic Soul Rend and Deathless Rage punish only failed compliance (stacking, wardstone channels), so a clean raid is skill, never RNG.

## World boss: Thunzharr

### cmb_thunzharr
- Name: The Mountain Fell
- Desc: Bring down Thunzharr, the Waking Peak, at Stormcrag.
- Renown: 25
- Trigger: completion: appear on the loot roster (worldBossLootContributors) when `thunzharr_waking_peak` dies.
- Reward: none
- Hidden: no
- Steam: ACH_THUNZHARR
- Notes: The world boss of Thornpeak Heights (src/sim/world_boss.ts, src/sim/content/zone3.ts). Roster credit survives dying mid-fight, so nobody is cheated of their first kill.

### cmb_thunzharr_unbroken
- Name: Peakbreaker
- Desc: Bring down Thunzharr, the Waking Peak, without dying from your first blow to his last breath.
- Renown: 25
- Trigger: perfection: on a `thunzharr_waking_peak` kill where you hold loot-roster credit, you recorded no death between your first threat/damager entry against this spawn and its death.
- Reward: title "Peakbreaker"
- Hidden: no
- Steam: ACH_THUNZHARR_UNBROKEN
- Notes: Personal, not raid-wide, so an open-world crowd cannot fail it for you. Surviving Thunderclap, Seismic Stomp, Stormcall, and the enrage is positioning and cooldown play, never RNG.

### cmb_thunzharr_ten
- Name: A Habit of Mountains
- Desc: Bring down Thunzharr, the Waking Peak, ten times.
- Renown: 10
- Trigger: lifetime counter threshold: new deedStats counter `thunzharrKills` (incremented on loot-roster credit per kill) reaches 10.
- Reward: none
- Hidden: no
- Steam: no
- Notes: The loot lockout is daily but roster credit is per kill; ten kills is a natural couple of weeks of showing up when the yell goes out.

## Delve completion

### dlv_reliquary
- Name: Reliquary Runner
- Desc: Clear the Collapsed Reliquary.
- Renown: 5
- Trigger: completion: any `delveClears` key for `collapsed_reliquary` (`:normal` or `:heroic`) reaches 1.
- Reward: none
- Hidden: no
- Steam: ACH_RELIQUARY
- Notes: The L7+ intro delve under Brother Halven's ruin (src/sim/content/delves/collapsed_reliquary.ts).

### dlv_reliquary_heroic
- Name: Heroic: The Collapsed Reliquary
- Desc: Clear the Collapsed Reliquary on the Heroic tier.
- Renown: 10
- Trigger: completion: `delveClears['collapsed_reliquary:heroic']` reaches 1.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Heroic tier is level-gated to 9+ and rolls one affix.

### dlv_litany
- Name: Hush the Litany
- Desc: Clear the Drowned Litany.
- Renown: 5
- Trigger: completion: any `delveClears` key for `drowned_litany` (`:normal` or `:heroic`) reaches 1.
- Reward: none
- Hidden: no
- Steam: ACH_LITANY
- Notes: The Mirefen Marsh delve (src/sim/content/delves/drowned_litany.ts). Its overworld entrance marker is defined in ZONE3_PROPS.delveMarkers at (-95, 505), a coordinate that sits inside the marsh: an upstream content quirk this feature flags but does not fix (chronicles.md documents the same fact).

### dlv_litany_heroic
- Name: Heroic: The Drowned Litany
- Desc: Clear the Drowned Litany on the Heroic tier.
- Renown: 10
- Trigger: completion: `delveClears['drowned_litany:heroic']` reaches 1.
- Reward: none
- Hidden: no
- Steam: no

## Delve depth

### dlv_lore_journal
- Name: Marginalia
- Desc: Unlock all five entries of the delve journal.
- Renown: 10
- Trigger: predicate over persisted state: `delveLoreUnlocked.size` reaches 5 (the launch DELVE_LORE_ORDER: eastbrook_ledger, first_collapse, gravecaller_mark, bell_below, tessa_note).
- Reward: none
- Hidden: no
- Steam: ACH_DELVE_JOURNAL
- Notes: The journal is one shared five-entry order unlocked one per clear across BOTH delves (src/sim/delves/runs.ts), so this is THE one global journal-completion deed, not per-delve (the assembly duplicate sweep removed collection.md's twin and moved its Steam entry here). Pinned to the launch five; a longer journal gets a new deed.

### dlv_companion_max
- Name: A Friend in the Deep
- Desc: Raise a delve companion to her highest rank.
- Renown: 10
- Trigger: predicate over persisted state: any `companionUpgrades` value reaches 3.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Ranks cost Delve Marks (3 then 5, src/sim/content/delves/companions.ts); rank 3 adds the once-per-run revive. Roughly a week of casual delving.

### dlv_companions_both
- Name: Both Lanterns Lit
- Desc: Raise both delve companions, Acolyte Tessa and Edda Reedhand, to their highest rank.
- Renown: 25
- Trigger: predicate over persisted state: `companionUpgrades['companion_tessa'] >= 3` and `companionUpgrades['companion_edda'] >= 3`.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Pinned to the two launch companions; a third companion gets its own deed.

### dlv_clears_50
- Name: Fifty Fathoms
- Desc: Complete 50 delve runs.
- Renown: 10
- Trigger: lifetime counter threshold: the sum of all `delveClears` values reaches 50.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Uses the existing persisted per-key clear counts; both delves and both tiers count. Sits where the Marks economy already sends daily delvers.

## Delve skill tasks

### dlv_solo_heroic
- Name: Two's a Crowd
- Desc: Clear a Heroic-tier delve with no other player, just you and your companion.
- Renown: 25
- Trigger: restriction: a Heroic-tier delve run completes with exactly one player in the run's party for its whole duration.
- Reward: none
- Hidden: no
- Steam: ACH_SOLO_HEROIC
- Notes: Delves cap at 2 players and the companion always joins; soloing Heroic is tuned-but-fair (companion.ts notes L9 Heroic is sustainable from rank 2).

### dlv_tumbler_premium
- Name: The Tumbler's Path, Mastered
- Desc: Open a warded reliquary chest at the highest ante, flawless on your only try.
- Renown: 25
- Trigger: perfection: a lockpick session at ante 1 succeeds (three flawless pages, single try; ANTE_TO_PAGES/ANTE_TO_TRIES in src/sim/lockpick.ts).
- Reward: none
- Hidden: no
- Steam: ACH_TUMBLER_PREMIUM
- Notes: The minigame is server-authoritative and fails only on a wrong pick or a blown move timer, never a dice roll.

### dlv_rite_flawless
- Name: Word-Perfect
- Desc: Complete the Drowned Reliquary Rite without a single mistake.
- Renown: 25
- Trigger: perfection: a Drowned Litany rite finale completes with `mistakes === 0` (the premium-tier result in src/sim/delves/drowned_litany_rite.ts).
- Reward: none
- Hidden: no
- Steam: no
- Notes: A seeded shrine-sequence memory puzzle; wrong presses are the only failure mode.

### dlv_varric_ringers
- Name: The Bells Fall Silent
- Desc: Defeat Deacon Varric with every Funeral Ringer he raises already slain.
- Renown: 10
- Trigger: mechanical: at Deacon Varric's death, every `reliquary_funeral_ringer` he summoned this attempt (summonAdds at 60% and 30% hp) is dead.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Ringer packFrenzy punishes sloppy kill order, which is exactly the skill being tested.

### dlv_nhalia_bells
- Name: Bellstiller
- Desc: Defeat Sister Nhalia, the Drowned Canticle, without any party member struck by a Tolling Bell.
- Renown: 25
- Trigger: mechanical: during the Sister Nhalia encounter window, no Tolling Bell contact damage lands on any player.
- Reward: title "Bellstiller"
- Hidden: no
- Steam: ACH_NHALIA_BELLS
- Notes: Bells fly at 8 yd/s with a 2 yd contact radius (src/sim/delves/drowned_litany_boss.ts); the volley direction varies but every bell is visible and dodgeable, so misses are pure footwork. Template caution: this boss is `sister_nhalia_drowned_canticle` (drowned_litany.ts), DISTINCT from the overworld marsh rare `sister_nhalia` (zone2.ts) that chr_marsh_rares pins; implementers bind by template id, never display name.
