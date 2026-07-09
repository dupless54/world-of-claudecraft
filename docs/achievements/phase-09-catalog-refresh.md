# 09: Catalog refresh, the content that landed since the catalog was authored

STATUS: NOT STARTED

Read `docs/achievements/overview.md` FIRST; it is authoritative and its sections 2
(glossary), 3 (canonical identifiers), and 5 (binding rules) apply verbatim here.
Then read `docs/achievements/catalog/README.md` in full, especially the Hard rules
and the Assembly resolutions: they still govern every block you author, and this
session APPENDS a new resolutions section, it never rewrites the old one.

Reminder that binds every step: the word "phase", packet references, em dashes,
en dashes, and emojis never appear in any shipped artifact (code, comments,
commit messages). English-only i18n via the pending mechanism.

## Goal

The v1 catalog was authored on 2026-07-08 against the tree at 7bd4995d0. Since
then the game gained salvage/disenchant, the level-20 crafting hub, the
professions intro quest, and heroic difficulty equalization, and the catalog
audit found real coverage holes that predate the baseline (the Nythraxis crypt
attunement dungeon, the second half of the Drowned Temple quest chain, the
Sethrael rare, the missing Marsh fishing debut). This session re-reviews the
catalog against TODAY's content, authors the missing deeds in the catalog docs
first, transcribes them into `src/sim/content/deeds.ts`, and wires their grant
sites and tests. By the end of this session every major system and instance in
`src/sim/content/` has deliberate deed coverage or a written no-action
resolution, and the maintainer has a ready-to-send icon brief for every new
deed.

## Context to load before writing code

- `docs/achievements/overview.md` sections 3, 4, 5, 6 (canonical names, the
  evaluator architecture, binding rules, the design lessons).
- `docs/achievements/catalog/README.md` (authoring rules; the entry format is
  mandatory) and the category file you are extending, before each block.
- `src/sim/content/deeds.ts` end to end once: the DeedDef shapes in practice,
  `DEEDS_ERA`, `DEED_ORDER` (append-only).
- `src/sim/deeds.ts`: the evaluator, the deedStats counters that already exist,
  `onNpcTalkedForDeeds`, the `fish:<zoneId>` marks (already emitted for EVERY
  zone in ZONE_FISH, so a Marsh fishing deed needs zero new instrumentation),
  the POI visit sweep.
- `src/sim/professions/salvage.ts` (new since the baseline) and the crafting
  hub block in `src/sim/content/professions.ts` (search `CRAFTING_HUB_STATIONS`)
  for where salvage and hub-craft counters would hook.
- `src/sim/content/dungeons.ts` (search `nythraxis_crypt`) and the quest chains
  in `src/sim/content/zone3.ts` (search `q_nythraxis_`) and
  `src/sim/content/temple.ts` (search `q_drowned_choir`, `q_palecoil`,
  `q_silence_the_choir`, `q_drowned_moon`).
- `src/sim/content/temple.ts` (search `Sethrael`): the rare with zero deed
  touchpoints.
- `server/steam/achievement_map.ts`: 68 of 100 slots used; new marquee deeds
  may take ACH_ names, the map is append-only and pinned by tests.
- `tests/deeds_content.test.ts`, `tests/deeds_sites.test.ts`,
  `tests/deeds.test.ts`: the catalog pins and grant-site coverage patterns you
  must extend.
- `src/ui/deed_i18n.ts`: every new deed id joins the release-fill coverage
  manifest automatically (it derives from DEED_ORDER); confirm, do not assume.
- `scripts/wiki/build_content.mjs` (the GUIDE_DEEDS emitter) and
  `tests/guide.test.ts` freshness gate: a catalog change without a committed
  regen fails.

## Design spec

### 1. Catalog docs first, code second

Author every new deed as a catalog block in the matching
`docs/achievements/catalog/*.md` file, uniform entry format, BEFORE touching
deeds.ts. Then append an "Assembly resolutions, polish round (2026-07-09)"
section to `catalog/README.md` recording: the audited new totals, every
addition, every considered-and-rejected candidate with its reason, and the
deferral rechecks below. The catalog stays the reviewable source of truth.

### 2. The additions (authoring shortlist, session judgment on final renown)

Candidates the audit found, in priority order. Hard rules from
`catalog/README.md` apply to each (renown scale, no luck, count outcomes,
thresholds where natural play lands):

1. Salvage: a first-salvage deed (5) plus a lifetime-count deed (10, threshold
   where natural play lands, look at how many salvages a normal journey
   produces). New `deedStats` counter bumped from the salvage resolution site.
   Category soc_ (economy) per the existing soc_market_* precedent.
2. Crafting hub: one deed for crafting at a hub station (10). Counts a real
   craft OUTCOME at a station, never a visit-only or login-adjacent trigger.
   The hub is level-20 gated content, mid-journey per rule 7.
3. Nythraxis crypt: a dgn_ completion deed for the attunement dungeon (10) and
   a quest-chain completion deed over the five q_nythraxis_* quests (25,
   predicate over questsDone, retro-friendly for veterans per overview
   decision 3).
4. Drowned Temple back half: a quest-chain deed over q_drowned_choir,
   q_palecoil, q_silence_the_choir, q_drowned_moon (25, predicate). Note the
   deed desc must not leak instanced boss mechanics (wiki emits names only,
   but descs show in game; follow the existing chain-deed voice).
5. Marsh fishing debut: chr_marsh_first_cast mirroring chr_vale_first_cast and
   chr_peaks_glimmer_cast (5). The `fish:mirefen_marsh` mark already exists.
   Do NOT add it to the existing chapter metas (see resolution rule below).
6. Sethrael the Palecoil: cover via the q_palecoil quest inside the temple
   chain deed above (preferred), or a standalone kill deed if the session
   judges the rare worth its own block. Do NOT edit the existing
   chr_marsh_rares list (see resolution rule below).
7. Professions intro: one deed for completing q_prof_intro plus the first
   profession pick if a clean predicate exists (5). If the predicate is
   ambiguous, drop it and record the rejection.

Resolution rule that binds 5 and 6, write it into the new README section:
existing deed TRIGGERS are never retro-edited in this round. Widening a
trigger list changes mid-progress fractions and re-scopes an earned deed's
meaning; additions land as NEW deeds only. (Earned records are append-only
either way; this keeps displayed progress honest.)

Considered and rejected, record each with its reason in the resolutions
section: class set-bonus collections (drop-luck gated, rule 2 zero-renown
makes them noise), per-class deeds (catalog deliberately class-agnostic),
warlock pet collection (class-specific), lore letters (no counter exists and
low signal), daily-reward streaks (rule 6, no login-shaped deeds), heroic
equalization (a difficulty retune, existing dgn_ deeds already cover the
instances, no catalog action).

### 3. Deferral rechecks (verify, then record; do not implement)

- prog_ringwright stays deferred: jewelcrafting, inscription, and enchanting
  still have ZERO recipes in this tree (recipes.ts has 15 total, none theirs;
  the enchanting PR upstream is not merged here). Re-verify with a grep before
  recording.
- The nine account-level ids (prog_three_paths, prog_ninefold, the seven
  feat_* realm/server firsts) stay deferred: no account-level grant lane
  exists (server/deeds_records.ts is still observer-only). Re-verify.
- Their icon art already exists (the 11 orphan files in the maintainer's icon
  set); note in the resolutions that deferral costs no art.

### 4. Transcription and wiring

- Transcribe every new block into `src/sim/content/deeds.ts` following the
  existing category ordering; append ids to their category cluster, never
  reorder DEED_ORDER (append-only, persisted earned ids depend on it).
- New deedStats counters: initialize alongside the existing ones, persist in
  SavedDeedStats, bump via append-only SimContext callbacks at the real
  resolution sites (the onMobKilledForQuests shape). Salvage and hub-craft are
  the two new sites; quest and fishing triggers ride existing state.
- Steam: give ACH_ names to marquee-quality additions only (legible,
  spoiler-safe); extend `server/steam/achievement_map.ts` and its pins. Stay
  comfortably under 100.
- Renown budget: additions should land roughly 60 to 110 total new Renown;
  record the exact new totals (deed count, renown, titles, borders, Steam) in
  the resolutions section. No new titles or borders this round unless a block
  genuinely earns one; if you add any, update the registry lists.
- Regenerate the wiki content (`npm run wiki:content`) and the i18n artifacts
  (`npm run i18n:gen`); if any catalog English key changed, the sha256
  re-baseline lands in the SAME commit.

### 5. The maintainer icon brief

Write `docs/achievements/catalog/new-deeds-icon-brief.md`: one line per NEW
deed in exactly the maintainer's brief format
(`- [v1] \`deed_id\`, Display Name: visual motif description.`), grouped by
category. These deeds ship with the procedural category crest as fallback
until art arrives (the icon session builds that fallback in). The session
summary must call this file out explicitly so the maintainer can commission
art.

## Out of scope

- Icon files and the static-image pipeline (next session).
- Title display surfaces, chronicler changes, docs, translations (later
  sessions).
- Any edit to existing deed triggers, renown values, or DEED_ORDER positions.
- The account-level grant lane.

## Steps

1. Re-verify the deferral rechecks and the content audit findings against the
   tree (do not trust this file's line numbers; grep).
2. Author catalog blocks + the resolutions section + the icon brief.
3. Transcribe to deeds.ts; wire the two new counters and their grant sites.
4. Tests: extend deeds_content pins (new totals, per-category counts, every
   new id present, renown values literal-pinned), deeds_sites coverage for the
   two new grant sites with taint and boundary negatives, evaluator cases for
   each new trigger shape, retro-on-join for the quest-chain predicates.
5. Regenerate wiki content and i18n; commit regenerated artifacts with the
   change.
6. Biome on touched files. Targeted vitest, then `npm run gate` UNPIPED.
7. Update `docs/achievements/progress.md` (row 9) and commit with explicit
   paths, scope `deeds`.

## Acceptance (all must pass)

- `npx vitest run tests/deeds_content.test.ts tests/deeds.test.ts tests/deeds_sites.test.ts tests/deed_i18n.test.ts`
- `npx vitest run tests/architecture.test.ts tests/localization_fixes.test.ts`
- `npx vitest run tests/guide.test.ts` (freshness green on the committed tree)
- `npx vitest run tests/server/steam/achievement_map.test.ts` (or the file that
  pins the map; locate it, do not guess)
- `npm run gate` UNPIPED, exit 0.
- `docs/achievements/catalog/new-deeds-icon-brief.md` exists and lists every
  new id.
- The resolutions section records new totals that match a scripted recount of
  deeds.ts exactly.

## Reviewer dispatch (fresh agents, never the implementer)

- architecture-reviewer over the sim diff (draw-order neutrality: the new
  counters and evaluator arms draw zero rng; tick-tail placement unchanged).
- test-coverage-auditor over the new tests (decisive pins, literal renown
  values, negative arms for both new counters).

## Adversarial pass (answer each in the session summary)

1. Can any new deed be earned by an attempt rather than an outcome?
2. Can any new trigger fire from RNG alone (a lucky drop, a bot-backfilled
   bout)?
3. Does any new desc leak an instanced mechanic or hidden-deed information to
   the wiki? (Descs are not emitted, but names are; check the names.)
4. Did DEED_ORDER stay append-only, byte-for-byte, for the first 186 ids?
5. Does a veteran character retro-earn the quest-chain deeds on first login
   after this change, and does the retro batch stay one summary line?
6. What did you consider adding and reject, and is every rejection written
   down?

## End of session

Update `docs/achievements/progress.md` row 9 with the dense one-line summary
(commit sha, additions, totals, reviewer verdicts, flags). Name the next file:
`docs/achievements/phase-09-qa.md`.
