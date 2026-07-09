# 09 QA: the catalog refresh holds against the real tree

STATUS: NOT STARTED

Read `docs/achievements/overview.md` first (authoritative), then the 09
implement file and its progress.md row. This session verifies the catalog
refresh with fresh eyes: fidelity between the catalog docs and deeds.ts, the
two new grant sites, the no-retro-edit resolution, and the icon brief. House
rules: no em/en dashes or emojis anywhere; no "phase"/packet wording in
anything that ships; English-only i18n, pending rows expected (do NOT set
I18N_RELEASE_TIER=1).

## 0. Orient

Read the 09 session summary in progress.md, `git log` since the row's base
sha, and the diff of `src/sim/content/deeds.ts`, `src/sim/deeds.ts`, and the
catalog docs.

## 1. Re-run acceptance (all of it, from a clean tree)

Re-run every command in the 09 implement file's Acceptance section verbatim
and record real exit codes. `npm run gate` runs UNPIPED (a `| tail` masks the
exit code).

## 2. Catalog fidelity audit (the load-bearing check)

- Scripted recount of deeds.ts (execute the module, count deeds, sum renown,
  count titles/borders/Steam entries, per-prefix counts) and compare against
  the new resolutions section EXACTLY. Any drift is a finding.
- Every new catalog block transcribed 1:1 (name, desc, renown, trigger shape,
  hidden, Steam); zero invented deeds, zero silently dropped blocks. List
  every new id in the QA notes.
- The first 186 entries of DEED_ORDER are byte-identical to the pre-09 tree
  (`git show <pre-09-sha>:src/sim/content/deeds.ts` and diff the extracted
  order). Append-only proven, not assumed.
- No existing deed's trigger, renown, name, or desc changed. Diff-proof it.
- Deferral rechecks re-verified live: zero jewelcrafting/inscription/enchanting
  recipes; no account-level grant lane in server/.

## 3. Grant-site verification (sim, by hand)

- Drive a real salvage through the sim in a test or scratch harness: counter
  bumps once per salvage OUTCOME, not per attempt or per item stack; the deed
  grants at the literal threshold, not one early or late.
- Drive a hub-station craft: counts only station crafts, a non-hub craft does
  not bump it.
- Quest-chain predicates: a save with all chain quests done earns on join with
  `retro: true`; a save with N-1 quests does not.
- Marsh first cast: fishing in Mirefen Marsh grants; fishing in Vale does not
  cross-grant.

## 4. Test decisiveness audit

For each new test: would it fail if the threshold were off by one, if the
counter bump moved to the wrong site, if a renown value drifted? Mutation-test
at least two (flip a threshold, break a counter increment) and confirm reds,
then restore (never git checkout over uncommitted fixes).

## 5. i18n and wiki audit

- New deed names/descs are English in sim content only; no locale overlay was
  touched; deed_i18n coverage manifest includes every new id.
- `npm run wiki:content` is diffless on the committed tree; the new public
  deeds appear on /wiki/deeds; hidden additions (if any) do NOT.
- If any i18n English changed, the sha256 baseline moved in the same commit
  (check the commit graph, not the working tree).

## 6. Reviewer dispatch

architecture-reviewer and test-coverage-auditor were dispatched by 09; read
their verdicts in the row. If either reported anything unresolved, resolve it
now. Dispatch qa-checklist over the full 09 diff this session.

## 7. Adversarial what-is-missing pass

- Is there content in `src/sim/content/` added since 7bd4995d0 that neither
  got a deed nor a written rejection?
- Can two deeds now be earned by one action in a way that reads as double
  credit?
- Does the icon brief list EVERY new id (diff brief ids against the new
  DEED_ORDER tail)?
- Does anything in the diff contain a dash, emoji, or packet vocabulary?

## Exit criteria

All acceptance green from a clean tree, fidelity audit clean, both mutations
redded a test, qa-checklist READY, progress.md row 9Q written.

## End of session

Update progress.md row 9Q (PASS thru sha, findings applied, flags). Name the
next file: `docs/achievements/phase-10-icon-art.md`.
