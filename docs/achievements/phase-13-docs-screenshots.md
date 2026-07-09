# 13: The deeds system enters the repo's documentation, with evidence

STATUS: NOT STARTED

Read `docs/achievements/overview.md` FIRST; sections 3 and 5 apply verbatim.

Reminder that binds every step: the word "phase", packet references, em
dashes, en dashes, and emojis never appear in any shipped artifact (the
packet files themselves, including the screenshots directory added here, are
internal and exempt). English-only i18n via the pending mechanism.

## Goal

Outside this packet, the repo documents the deeds system NOWHERE (audited:
zero hits across README, every CLAUDE.md, and docs/ except two unrelated
Steam-overlay notes). This session writes the durable documentation layer so
future AI contributors treat deeds as part of the standard content flow (a
new raid/zone/boss ships WITH its deeds), and captures the screenshot
evidence set for the whole feature across screen sizes into the packet.

## Context to load before writing code

- The audited insertion points (verify each against the live file, line
  numbers drift):
  - `README.md`: the Highlights bullet list; the "World and systems" bullet
    cluster (the bank bullet is the size precedent); the "Built like the
    classics" HUD parenthetical; the Project layout table's
    `src/sim/content/` row.
  - Root `CLAUDE.md`: the repo-map row for `src/sim/content/` and the
    Modularity section's "New game content" bullet (the /wiki freshness
    sentence inside it is the exact model of "adding X also obligates Y").
  - `src/sim/CLAUDE.md`: the system-modules table and the "Adding a
    mechanic here" checklist.
  - `src/sim/content/CLAUDE.md`: the key-files list and the per-type
    authoring recipe section.
  - `src/ui/CLAUDE.md`: the "Small modules (pure-core + thin-consumer
    pointers)" section (the bank bullet shape).
  - `server/CLAUDE.md`: the key-files table (near the bank rows) and the
    Persistence model section's JSONB state parenthetical.
  - `src/guide/CLAUDE.md`: the "Keep the wiki in sync" generator-covered
    noun list and the spoiler policy.
  - `docs/CLAUDE.md`: the design/ contents index.
- The screenshot harness precedents: `scripts/mobile_char_window_shot.mjs`
  (the closest single-window template; offline flow, `?gfx=ultra`,
  preflight dismissal), `scripts/pr_screenshots.mjs` (1600x900 desktop
  standard), `scripts/mobile_cluster_layout_check.mjs` (the raw CDP
  `Emulation.setDeviceMetricsOverride` viewport pattern; ALWAYS use raw CDP
  for the mobile frames, page.setViewport has the stale-innerWidth trap),
  `scripts/enter_offline_game.mjs`.
- The instruction-files policy: CLAUDE.md is canonical; if AGENTS.md or
  GEMINI.md exist as thin pointers they need NO edit for content-level
  additions (verify they are pointers, not copies).

## Design spec

### 1. The content-flow rule (the load-bearing doc change)

Root CLAUDE.md, INSIDE the "New game content" bullet, appended after the
/wiki sentence, scoped with "every" per the literal-scope rule:

"Every new piece of conquerable content (a dungeon, delve, raid, world boss,
zone, or rare) also authors its Book of Deeds records in
`src/sim/content/deeds.ts` in the SAME change, following the authoring rules
in `docs/design/deeds.md`; deeds are cosmetic-only (titles, Renown), never
power, and `tests/deeds_content.test.ts` pins the catalog."

Session may tighten the wording; the required elements are: every, the
content-type list, same change, the pointer to the design doc, cosmetic-only,
the gating test.

### 2. The durable design doc

New `docs/design/deeds.md` (this is the SHIPPED design doc; no packet
vocabulary): the system in one page plus the authoring contract. Contents:
what deeds are (glossary: Deed, Renown, Chronicle, Chronicler, Feat, Title,
Border); the architecture in five sentences (content table + evaluator
behind SimContext, id-based events, server as observer via character_deeds,
account roll-up + boards, Steam mirror env-gated); the authoring rules
digested from the catalog README (renown scale 5/10/25/50, zero for luck and
feats, trigger vocabulary, no permanently missable, count outcomes not
attempts, thresholds where natural play lands, hidden deeds small); the
add-a-deed recipe (catalog-block thinking, deeds.ts record, counter/grant
site if needed, tests, wiki regen, icon brief line for the maintainer, Steam
map decision); the deferred set and why (account-level lane absent;
ringwright blocked on recipes). Add its index line to docs/CLAUDE.md.

### 3. The remaining doc touchpoints (one commit, scope `docs`)

- README: one Highlights bullet ("**A Book of Deeds**: an achievement
  journal of cosmetic titles, borders, and Renown, with per-zone Chronicles
  and a lifetime leaderboard" voice, marketing altitude, no exact numbers
  per the game-identity rule); one World-and-systems bullet (bank-bullet
  shape) naming the window, titles, tracker, leaderboard, and /wiki/deeds;
  append the deeds window to the classic-HUD parenthetical; add "deeds" to
  the Project layout content row.
- Root CLAUDE.md repo-map row: append "deeds" to the content list.
- src/sim/CLAUDE.md: `deeds.ts` row in the system-modules table (one line:
  evaluator, tick-tail placement, zero rng, dirty-player sweep) plus one
  sentence in the mechanic checklist pointing at the root rule.
- src/sim/content/CLAUDE.md: `deeds.ts` key-files row + the authoring
  recipe cross-reference.
- src/ui/CLAUDE.md: the small-modules bullet for deeds_view/deeds_window
  (+ tracker painter, leaderboard view, deed_i18n), bank-bullet shape.
- server/CLAUDE.md: key-files row (deeds_db, deeds_records, deeds_board,
  steam/) + deeds fields in the persistence JSONB parenthetical.
- src/guide/CLAUDE.md: add "deed" to the generator-covered noun list; one
  spoiler-policy line (hidden deeds never emitted).

### 4. The screenshot evidence set (into the packet)

New committed script `scripts/deeds_screenshots.mjs` (offline flow; no
ALLOW_DEV_COMMANDS; model on mobile_char_window_shot + enter_offline_game;
raw CDP for every non-desktop viewport). Output to
`docs/achievements/screenshots/` with numbered stable names. Matrix, each
viewport x each surface where it applies:

- Viewports: desktop 1600x900 dsf1; small-laptop 1280x720; tablet 1024x768
  dsf2; phone landscape 844x390 dsf3 (the in-game mobile orientation);
  narrow phone 740x360 dsf3.
- Surfaces: Book of Deeds window (category view with real icon art, earned +
  unearned + desat visible); the Titles pane; a deed unlock moment (banner +
  gold chat line; earn hid_saul_footnote by nine Saul talks, the proven
  offline recipe); the HUD watch tracker with entries; the Renown
  leaderboard tab (offline shows the tab frame; a row-populated online shot
  is optional bonus); chat line with a title (equip via the Book first);
  target frame with title (target a titled second... offline has no second
  player: target SELF via the own-nameplate surface or record the target
  frame from the 11 QA online evidence; the session picks the honest
  option); the player card with title; all three chroniclers (one frame
  each, gameplay distance).
- Every file name says surface + viewport (`03-book-window-844x390.png`).
  Write a `docs/achievements/screenshots/README.md` index table (file,
  surface, viewport, date, tree sha) so the evidence is legible later.

### 5. Wiki sweep

Confirm /wiki/deeds reflects everything this round added (new deeds from 09
public and correctly rowed; no Zenzie name anywhere since the guide bakes no
chronicler names; regen diffless on the committed tree). If session 09 added
any NEW guide.* prose key, its M16 status was handled there; verify, do not
redo.

## Out of scope

- Any code behavior change. This session is docs + evidence only (the
  screenshot script is new tooling, not gameplay code).
- Translations (next session).
- PR text (the maintainer decides when to open one).

## Steps

1. Write docs/design/deeds.md + docs/CLAUDE.md index line.
2. Root CLAUDE.md + README edits.
3. The five area CLAUDE.md edits.
4. The screenshot script + full capture run + the index README.
5. Wiki sweep.
6. Biome on touched files (the script); targeted vitest (guide freshness +
   architecture, docs cannot break them but prove it); `npm run gate`
   UNPIPED.
7. Update progress.md row 13; commit with explicit paths (docs commit and
   screenshots commit may be separate; screenshots are large-ish binaries,
   keep them one commit).

## Acceptance (all must pass)

- `npx vitest run tests/guide.test.ts tests/architecture.test.ts`
- `npm run gate` UNPIPED, exit 0.
- Every file in the screenshot matrix exists, named per convention, indexed
  in the README, and visually spot-checked (open five at random; no blank
  frames, no intro overlay, no missing icons).
- `git grep -ni 'deed' README.md CLAUDE.md src/sim/CLAUDE.md src/ui/CLAUDE.md server/CLAUDE.md src/guide/CLAUDE.md docs/CLAUDE.md`
  shows every planned touchpoint landed.
- Zero packet vocabulary in any SHIPPED doc (docs/design/deeds.md,
  README, CLAUDE.md files); `grep -n 'phase' docs/design/deeds.md` is empty.

## Reviewer dispatch (fresh agents, never the implementer)

- qa-checklist over the diff (doc accuracy: every claim in the new docs must
  match the code; it should spot-verify five claims).
- A fresh general reviewer reads docs/design/deeds.md against
  src/sim/deeds.ts and src/sim/content/deeds.ts for factual drift.

## Adversarial pass (answer each in the session summary)

1. Would a fresh AI session adding a new dungeon actually be routed to
   author deeds by these docs alone (walk the path: root CLAUDE.md content
   bullet, sim content recipe, design doc)?
2. Do any two docs now state the deeds rules with DIFFERENT numbers or
   vocabularies?
3. Are the screenshots reproducible (does the script run twice produce the
   same set)?
4. Is anything in docs/design/deeds.md already stale against the tree?
5. Did README stay at marketing altitude (no formulas, no exact totals)?

## End of session

Update progress.md row 13. Name the next file:
`docs/achievements/phase-13-qa.md`.
