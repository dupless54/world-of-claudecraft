# Feats and hidden deeds (feat_, hid_)

Category rules (from README.md, restated for reviewers):
- Every feat_ deed is 0 Renown, carries `feat: true`, and is EXCLUDED from
  completion percentages. Feats are the zero-point trophy shelf: history
  markers, world-firsts, and rarities. None repeats a Renown deed.
- Anything needing server data (account age, first-on-realm ordering,
  leaderboard rank) is marked "server-assisted" in Notes and stays rare;
  server-assisted feats are online-only by nature.
- Every hid_ deed is fully invisible until earned (name, desc, and existence),
  and is a delight or a spoiler-guard, never a grind with secret criteria.
  Each entry's Hidden line carries the reveal note: what the player sees in
  the Book after earning it.

## Registry: proposed titles
- "the Footnote" (hid_saul_footnote)

## Registry: proposed borders
- none

## Registry: Steam picks (5)
The sixth authored pick (ACH_GOLDEN_GOAL) was removed with hid_golden_goal in
the assembly duplicate sweep; the golden-goal moment lives solely on
pvp_vcup_golden_goal (pvp-sport.md).
- ACH_BOOK_COMPLETE (feat_book_complete, public)
- ACH_FALL_DEATH (hid_fall_death, Steam-hidden)
- ACH_ROLL_HUNDRED (hid_roll_hundred, Steam-hidden)
- ACH_BOUNTIFUL_COFFER (hid_bountiful_coffer, Steam-hidden)
- ACH_CODFATHER (hid_codfather, Steam-hidden)

---

## Feats

### feat_before_the_book
- Name: Before the Book
- Desc: Walked the Vale before the Book of Deeds was first opened.
- Renown: 0
- Trigger: Character created before the deeds-launch timestamp.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Server-assisted (characters created_at predates the launch stamp).
  Deeds done before the Book existed are honored, never re-demanded: a
  permanent marker for the characters that were already here. Granted once at
  the retro-on-join evaluation after launch; never earnable by new
  characters, which is the point of a feat.

### feat_era_cap
- Name: Child of the First Era
- Desc: Reached level 20 while the First Era was current.
- Renown: 0
- Trigger: Predicate over persisted state: level >= MAX_LEVEL (20,
  src/sim/types.ts:2538) evaluated while the current content era equals the
  launch era.
- Reward: none
- Hidden: no
- Steam: no
- Notes: RESOLVED AT ASSEMBLY: a `DEEDS_ERA` string constant lands in
  src/sim/content/deeds.ts (bumped only by the maintainer at era boundaries);
  this deed's trigger reads it. Verified that
  no era or content-version marker exists in src/sim today (the only version
  constants are MAP_DOC_VERSION in map_doc.ts and TALENT_BUILD_VERSION in
  content/talents.ts, neither is a content era). When later eras ship, this
  feat stays visible as a history marker and a sibling feat is minted per era.

### feat_realm_first_cap
- Name: First of the Realm
- Desc: The first character on this realm to reach level 20.
- Renown: 0
- Trigger: Level-up to MAX_LEVEL (20) observed server-side; earned by exactly
  the earliest such character on the realm.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Server-assisted (world-first ordering from the server's level-up
  observer; the sim only reports the level-up). One earner per realm, ever.
  Likely already earned on existing realms at launch: assembly decides whether
  to backfill from character history or open the race on the deeds go-live.

### feat_founders_circle
- Name: The Founders' Circle
- Desc: Among the first twenty-five characters on this realm to reach level 20.
- Renown: 0
- Trigger: Same server-side level-cap observer as feat_realm_first_cap, granted
  to the first 25 in earn order.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Server-assisted, first-N style (marked as required by the category
  rules). Twenty-five keeps it a founding elite on a realm of roughly 80
  players. Same backfill decision as feat_realm_first_cap at assembly.

### feat_realm_first_nythraxis
- Name: Scourgebane the First
- Desc: Part of the first group on this realm to fell Nythraxis, Scourge of
  Thornpeak.
- Renown: 0
- Trigger: Completion of the Nythraxis encounter (encounters/nythraxis.ts,
  the Nythraxis Raid Arena in content/dungeons.ts); the earliest realm kill,
  credited to every member of that raid.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Server-assisted (first-kill ordering). Distinct from any dgn_ or cmb_
  Nythraxis kill deed: this is the realm-first history marker, not the kill.

### feat_realm_first_thunzharr
- Name: The Peak Answered
- Desc: Part of the first muster on this realm to bring down Thunzharr, the
  Waking Peak.
- Renown: 0
- Trigger: World boss kill (thunzharr_waking_peak, worldBoss: true,
  content/zone3.ts); the earliest realm kill, credited to every contributor
  (worldBossContributors, src/sim/world_boss.ts).
- Reward: none
- Hidden: no
- Steam: no
- Notes: Server-assisted (first-kill ordering). Contributor credit uses the
  same hate-table contributor view the boss's personal loot already uses, so
  it cannot be sniped by a walk-up.

### feat_realm_chronicler
- Name: The Realm's Chronicler
- Desc: The first on this realm to finish every chapter of every Chronicle.
- Renown: 0
- Trigger: Meta over the nine chr_ chapter-meta deed ids (chronicles.md);
  earliest realm completion in earn order.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Server-assisted (earn-order across accounts). The chapter list is
  read from the chr_ file at assembly; if chronicles gain chapters later this
  feat stays as the era-one marker (feats are excluded from completion, so a
  grown requirement never strands anyone).

### feat_book_complete
- Name: The Whole Book
- Desc: Earn every deed in the Book of Deeds.
- Renown: 0
- Trigger: Meta over every non-feat, non-hidden deed id in the live catalog
  (dynamic list, recomputed per content release).
- Reward: none
- Hidden: no
- Steam: ACH_BOOK_COMPLETE
- Notes: The dynamic completionist meta: requirements grow with content, so it
  is 0 Renown by rule 2 and a feat by rule 5. Excludes feats (many are
  one-earner) and hidden deeds (a completionist meta must not force spoiler
  hunting). Sim-derivable: the evaluator already holds the earned set and the
  catalog. The Steam description stays valid forever as worded.

### feat_top_of_the_book
- Name: Top of the Book
- Desc: Held first place on the lifetime Renown leaderboard.
- Renown: 0
- Trigger: Rank 1 on the account-Renown lifetime board at any board snapshot.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Server-assisted (the board is a server read model over
  character_deeds; the sim never sees ranks). Evaluated when the TTL-cached
  board recomputes. Rare prestige, but stays earnable forever, so it is a
  standing history marker rather than a missable.

### feat_brightwood_relic
- Name: Brightwood Remembered
- Desc: Keep a relic of the old Brightwood: the Bramblehide Jerkin or the
  Monarch's Crown.
- Renown: 0
- Trigger: Collection: own (inventory, bank, or equipped) bramblehide_jerkin
  or monarch_crown_helm.
- Reward: none
- Hidden: no
- Steam: no
- Notes: The two RETIRED_ZONE1_ITEM_IDS (src/sim/removed_zone1_content.ts).
  Verified they survive the retired-content sanitizer (only
  REMOVED_ZONE1_OBJECTIVE_ITEM_IDS are scrubbed from saves) and both defs
  remain in content/items.ts, so veterans still hold them. Retired-content
  history marker per rule 5; tradable copies keep it technically earnable.

---

## Hidden deeds

### hid_saul_footnote
- Name: A Footnote in History
- Desc: Pestered Saul the Chronicler nine times without pause.
- Renown: 5
- Trigger: Interaction: nine consecutive interact-command talks with Saul the
  Chronicler (sim interact entry, src/sim/interaction.ts, dispatching by the
  target NPC's templateId) with no other NPC talked to in between.
- Reward: title "the Footnote"
- Hidden: yes (reveal: "Saul sighs, licks his pencil, and adds your name to
  the margin of Chapter One.")
- Steam: no
- Notes: Saul is the sanctioned Chronicler easter egg (catalog README rule 9)
  and lands with the Chronicle NPC in the chr_ work; his template id is
  `chronicler_saul` (pinned at assembly; defined in chronicles.md). The
  Chronicler NpcDefs are transcribed in the same sim-core slice as the deed
  table, so this deed is earnable at launch. Nine talks for the nine
  Chronicle chapters. The consecutive-talk counter is SESSION-SCOPED (not
  persisted): it resets on talking to any other NPC and on logout.

### hid_gilded_tour
- Name: The Gilded Tour
- Desc: Did business with all three branches of the Gilded Strongbox.
- Renown: 5
- Trigger: Interaction: a banker interaction (the interact command's banker
  arm, src/sim/interaction.ts:407, or any successful bankDeposit,
  bankWithdraw, or bankBuySlots, all gated by nearBanker in src/sim/bank.ts)
  recorded once per banker templateId, for all of bursar_fernando (Eastbrook),
  bursar_petra_vell (Fenbridge), and bursar_aldous_crane (Highwatch).
- Reward: none
- Hidden: yes (reveal: "Audited: Eastbrook, Fenbridge, Highwatch. The
  Strongbox thanks you for your custom.")
- Steam: no
- Notes: All three bursars verified in content/zone1.ts:647, zone2.ts:682,
  zone3.ts:1140; every one carries the title "The Gilded Strongbox" and
  banker: true. Bursar Fernando is the sanctioned easter-egg precedent.

### hid_fall_death
- Name: Gravity Always Wins
- Desc: Died of a long conversation with the ground.
- Renown: 5
- Trigger: Player death from fall damage: the fall-damage dealDamage call in
  src/sim/player_motion.ts (drop beyond FALL_SAFE_DISTANCE = 12 yards, source
  null, ability label 'Falling') reduces the player to dead.
- Reward: none
- Hidden: yes (reveal: "The ground broke your fall. Also you.")
- Steam: ACH_FALL_DEATH
- Notes: Steam-hidden. Damage is 7 percent of max hp per yard past the safe
  distance, so a lethal fall is absolutely reachable off Thornpeak cliffs.
  The death site can key on the 'Falling' label it already receives.

### hid_keepers_toll_twice
- Name: The Keeper Collects Twice
- Desc: Died while The Keeper's Toll still weighed on you.
- Renown: 5
- Trigger: Player death (combat/damage.ts handleDeath) while the
  RESURRECTION_SICKNESS_ID aura (display name "The Keeper's Toll",
  src/sim/resurrection.ts) is active on the player.
- Reward: none
- Hidden: yes (reveal: "The Spirit Healer marks a second line in the ledger
  next to your name.")
- Steam: no
- Notes: The aura is applied only by a Spirit Healer resurrection
  (src/sim/spirit.ts resurrectAtSpiritHealer) and persists across logout
  (CharacterState.resSickness), so the check is a plain aura lookup at the
  death site. Self-deprecating delight, zero grind.

### hid_roll_hundred
- Name: Natural Hundred
- Desc: Rolled a perfect 100 on a plain /roll.
- Renown: 0
- Trigger: The /roll handler in src/sim/social/chat.ts: default bounds
  (lo 1, hi 100) and ctx.rng.int returns exactly 100.
- Reward: none
- Hidden: yes (reveal: "The dice remember this. So will your party.")
- Steam: ACH_ROLL_HUNDRED
- Notes: Steam-hidden. Renown 0 because it is pure luck (rule 2). The roll is
  already deterministic sim rng and server-authoritative, so offline and
  online behave identically. Custom ranges (/roll 1000) intentionally do not
  count: only the classic loot-roll bounds.

### hid_yumi_cheer
- Name: Yumi's Biggest Fan
- Desc: Cheered for Yumi where she could hear you, mid-bout.
- Renown: 5
- Trigger: The predefined-emote command site in src/sim/social/chat.ts
  resolving canonical emote key 'cheer' (the EMOTES table) while a living
  entity with templateId 'yumi_cat' (YUMI_TEMPLATE_ID, content/yumi.ts) is
  within SAY_RANGE of the actor.
- Reward: none
- Hidden: yes (reveal: "Yumi does not react. Yumi is a cat. It still counted.")
- Steam: no
- Notes: The cat entity only exists during a Protect Yumi bout, so proximity
  to a live yumi_cat already implies an active match; no extra match check
  needed. Works for fighters and any walk-up within earshot of the maze.

### hid_bountiful_coffer
- Name: The Purple Coffer
- Desc: Cracked a Bountiful Coffer before it could jam.
- Renown: 0
- Trigger: lockpickEnd with outcome 'success' (src/sim/types.ts:2312) on a
  delve run whose run.bountiful flag is true (DelveRun, src/sim/types.ts:2949).
- Reward: none
- Hidden: yes (reveal: "One try, three pages, three seconds a move. The
  Coffer never stood a chance.")
- Steam: ACH_BOUNTIFUL_COFFER
- Notes: Steam-hidden. Renown 0: Bountiful is an ultra-rare run roll (Heroic
  5 percent, Normal 2 percent) so encountering one is luck, per rule 2. The
  solve itself is pure skill by construction: a Bountiful Coffer only yields
  to the Hard-tier, Premium-ante Tumbler's Path solve (one try, 3 pages, 3s
  step budget, src/sim/lockpick.ts ANTE_TO_* tables), which fails only through
  player error (locks are always generated solvable).

### hid_companion_save
- Name: Not on Her Watch
- Desc: Your delve companion hauled a fallen partymate back to their feet.
- Renown: 5
- Trigger: The rank 3 companion ally-revive block in
  src/sim/delves/companion.ts (~line 68): run.companionReviveUsed is set and
  the 'ally_revive' bark fires, credited to the companion's owner pid.
- Reward: none
- Hidden: yes (reveal: "Once per run, no charge. She would like you to be
  more careful anyway.")
- Steam: no
- Notes: Requires the rank 3 companion boon (content/delves/companions.ts:
  Acolyte Tessa or Edda Reedhand, COMPANION_UPGRADE_COSTS) and a dead ally in
  heal range, so it counts a real rescue outcome, not attempts. A delight,
  not a checklist: earned the first time the boon actually saves someone.
  Waiver: the setup needs a fallen ally but the deed rewards the rescue;
  there is no incentive to cause deaths (a wipe costs far more than the deed
  is worth).

### hid_codfather
- Name: Joined the Family
- Desc: Dragged The Codfather out of the Deepfen Shallows.
- Renown: 10
- Trigger: Completion of quest q_the_codfather (content/zone2.ts:763, turn-in
  to Provisioner Hale; persisted in questsDone, so it retro-grants for
  veterans at the on-join evaluation).
- Reward: none
- Hidden: yes (reveal: "By the damp saints. Look at those whiskers.")
- Steam: ACH_CODFATHER
- Notes: Steam-hidden spoiler-guard: the deed existing visibly would spoil the
  quest's punchline (the_codfather is a fishing catch, simple_fishing_pole
  use type 'fishing', content/items.ts). If a chr_ Mirefen chapter also lists
  this quest at assembly, that is fine: this entry guards the reveal, the
  chapter counts the checklist, and the no-repeat rule binds feats only.
