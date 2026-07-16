# Toolchain Modernization: whole-packet integration QA matrix

Verified once at packet completion (Phase 5 QA), on top of the per-phase QA passes.
This packet is toolchain work, so the game-feature rows reduce to behavior-preservation
proofs.

Filled 2026-07-15 by Phase 5 QA on feature/typescript-7 (tip = the two toolchain-pin
commits on top of the release/v0.27.0 merge 1d2943a19). Every row was re-measured on
that tip, not inherited from pre-merge records.

Addendum (2026-07-16, the same QA session): release/v0.27.0 moved twice more during
the close and both deltas were merged in under the packet's merge protocol
(merge, i18n:gen, one commit, release-merge-audit each time): first the chat-log and
dungeon-reset fixes (PRs 1975 and 1972; the 13 new hudChrome.dungeonDifficulty keys
legitimately reintroduced 195 pending rows, per the row 7 clause), then the v0.27.0
version bump plus the dep-bump batch, welcome screen, HUD refactor, daily rewards,
and the i18n backlog fill that returned pending to 0 (PRs 1963, 1926, 1964, 2004,
2007, 2015, and more). The second merge conflicted only on package.json (the
@typescript/native line adjacent to the bumped vitest pins; both kept) and
package-lock.json (regenerated from the release side with npx npm@10, diff exactly
the @typescript/* family, npm ci --dry-run in sync under npm 10 and npm 12). The
version bump also retired the expected pre-bump version-gate red. On the FINAL tip
the load-bearing rows were re-verified: the full gate ran a third time (steps 1 to 6
green, 1,165 test files with 14,554 tests passed, the suite grown by the incoming
features; the same single environmental armory browser red; manual tail green:
check:types and all builds exit 0), both toolchain pins and the golden child green
under TS7 against the new endpoint append-targets, tsc --noEmit clean, i18n double
regen clean, and the final-head CI run recorded in the progress.md Phase 5 QA note.

- Behavior preservation: the resolved i18n output is byte-identical to before the packet
  (npm run i18n:gen twice leaves a clean tree; the committed locale slices carry no
  diff attributable to this packet). No runtime module changed except the TranslationKey
  type source, which is erased at build time.
  VERDICT: PASS. npm run i18n:gen ran twice consecutively on the tip; git status was
  clean after each run (verified in the worktree and independently in a scratch clone).
  The packet commits touch no file under src/, server/, or headless/ (verified by
  name-status diff over the packet ranges), so no locale slice or runtime module
  carries a packet-attributable diff.
- Determinism of generators: every generated artifact (locale slices, pending, loaders,
  the new translation_keys.generated.ts, the gitignored summary) regenerates
  byte-identically under the perturbed-env determinism tests.
  VERDICT: PASS. The perturbed-env suite (the three test files importing
  tests/helpers/i18n_determinism.ts: i18n_admin_catalog, i18n_resolved_equivalence,
  i18n_status_registry) ran green in a clean clone of the tip: 47 passed, 1 skipped,
  0 failed. One deferral noted from the run: the gitignored src/ui/i18n.status.json
  can go stale across branch switches and trip the universe-coverage row until the
  next regen (self-healing under gate and CI, which regenerate first); recorded as a
  packet follow-up, not a generator defect.
- Type safety is stronger, not weaker: the canonical probe pair (a bogus overlay key
  entities.itemSets.bogus_zzz.name and a bogus t() literal, the same pair Phase 2 and
  Phase 2 QA used) both fail npx tsc --noEmit (they did not both fail before Phase 2).
  VERDICT: PASS. Re-proven on the tip under the TS7 native binary: the bogus overlay
  key in de_DE.ts fails with TS2353 (unknown property on
  Partial<Record<TranslationKeyFlat, string>>), exit 1; the bogus t() literal fails
  with TS2345 (not assignable to TranslationKeyFlat), exit 1. Tree restored clean
  after each probe.
- Conflict elimination proof: two scratch branches each adding a key in different
  catalog domains, both regenerated, merge with ZERO conflicts (the Phase 1 acceptance
  experiment, re-run at packet close).
  VERDICT: PASS under the owner's re-scoped criterion (state.md OPEN item 8). Re-run
  in a scratch clone off the tip: probe keys in editor.ts and hud_chrome.ts, both
  regenerated, merged. The phase artifacts (translation_keys.generated.ts, en.ts, and
  all 22 locale slices) merged with ZERO conflicts. The only conflict was
  src/ui/i18n.resolved.generated/pending.ts, the known deferred pairwise class:
  resolved take-either-side, regenerated, converged to carry both probe keys, and a
  second regen was byte-identical with a clean tree (the documented recipe in
  src/ui/CLAUDE.md holds).
- CI: three consecutive PR runs green with wall time at or under 4 minutes; the
  freshness step still fails legibly on a deliberately staled slice; the audit counts
  appear in the job summary; release-gate green on a release/** push.
  VERDICT: PASS. Green PR runs under 240s wall (run createdAt to last job completion):
  29434999251 at 178s (head 85ac093d4), 29435293646 at 224s (head 055245b10), and the
  final QA-head run recorded in the progress.md Phase 5 QA note; the Phase 4 record
  (184/194/188s) corroborates the shape. Freshness red path re-proven locally on the
  tip: staling a hud_chrome.ts value and regenerating makes the exact CI freshness
  command (git diff --exit-code over the two resolved.generated trees plus the union)
  exit 1 naming the drifted slices. Audit counts: the "Post i18n coverage summary"
  step (scripts/i18n_coverage_summary.mjs, appends to GITHUB_STEP_SUMMARY) ran green
  in both jobs of the cited runs. Release-gate on a release/** push: live-verified in
  the Phase 4 QA record (scratch release push) and again on the v0.27.0-cycle pushes
  (runs 29420652196 and 29426343146), green modulo only the expected pre-version-bump
  "Release version gate" red (the documented new-cycle state).
- Toolchain: npm run check:types green with node_modules/.bin/tsc reporting the 7.0.x
  version Phase 5 recorded in progress.md and svelte-check on the TS6 wrapper;
  tests/server/new_endpoint.test.ts green (golden child tsc through the extends chain);
  .githooks/pre-push dry run green; a tsc --checkers 8 run is clean.
  VERDICT: PASS, re-verified from a CLEAN install on the tip (rm -rf node_modules,
  plain npm ci): tsc reports Version 7.0.2 (native, via @typescript/native),
  require('typescript') reports 6.0.3 with ts.sys present (the wrapper's
  @typescript/old), tsc6 reports 6.0.3; check:ts 1.86s min of three (recorded range
  1.8 to 2.0s holds), check:types 4.17s min of three green end to end;
  new_endpoint.test.ts green including the two new toolchain pins (the tsc bin pinned
  to /^Version 7\./ and the typescript alias pinned to a 6.x API with ts.sys, both
  red paths proven by mutation before commit); pre-push dry run green with the
  execution probe demonstrated against both a missing and a present-but-broken
  binary (skips with the legible note, never passes on a stat);
  tsc --noEmit --checkers 8 clean at 1.38s.
- Local gate: npm run gate fully green on a non-release branch AND release-tier
  (I18N_RELEASE_TIER=1) green on the release branch before the final merge.
  (Clause updated 2026-07-15 by Phase 3 QA: the v0.26.0 fill emptied pending, so
  pending-row locale reds are NO LONGER an expected mid-cycle state; a red
  release tier is a real regression unless a new post-fill catalog key
  legitimately reintroduced pending rows, in which case record exactly which.)
  VERDICT: PASS on both branches, each modulo ONLY the known environmental
  armory_mobile_layout browser pixel assertion (which aborts the gate before
  typecheck and builds; the remaining contract was completed manually and green each
  time: check:types, build:env, build:server, and the full five-entry client build,
  all exit 0). Branch tip: steps 1 to 6 green, full suite 1129 files (1127 passed +
  2 skipped), 14,258 tests passed + 22 skipped. Release branch (a9865d826, run in a
  dedicated worktree with I18N_RELEASE_TIER=1 and a release/ branch name): full suite
  green with pending=0 at release tier on both ui and admin scans, so no pending-row
  red and no regression. The CI-only "Release version gate" step does not exist in
  the local gate script, so no second expected red applies locally.
- Verdict preservation: this filled matrix is pasted into the final PR body or the
  issue #1868 summary before any packet teardown.
  VERDICT: PASS. This filled matrix was pasted into the PR #1976 body and the packet
  conclusions (go decision, corrections, executed design, re-evaluation triggers)
  were summarized on issue #1868 before the teardown offer.
- Pinned tests all green and still meaningful: tests/ci_workflow.test.ts,
  tests/sfx_gate_preflight.test.ts, tests/i18n_resolved_equivalence.test.ts,
  tests/i18n_status_registry.test.ts, tests/localization_fixes.test.ts (S3 guard),
  tests/architecture.test.ts.
  VERDICT: PASS. All six ran green together on the tip (87 passed, 4 skipped), and
  again inside the gate's full-suite pass. ci_workflow.test.ts remains meaningful
  under the flip without modification (every pin sits on the check:types indirection
  layer, as the Phase 5 record predicted).
- Copy review: no em dashes, en dashes, or emojis introduced anywhere by this packet.
  VERDICT: PASS. A unicode scan of every ADDED line across the packet commit ranges
  (excluding the release-merge content, which was reviewed on its own PR) found zero
  em dashes, en dashes, or emojis.
- Docs: every doc/skill that referenced the removed artifacts or the old typescript
  version is updated (the Phase 1 and Phase 5 sweeps); CONTRIBUTING.md matches the new
  contributor workflow; re-evaluation triggers are recorded in state.md.
  VERDICT: PASS. A docs QA agent followed CONTRIBUTING.md literally on a fresh clone
  of the tip: every toolchain claim verified by execution (tsc 7.0.2, the 6.x API
  with ts.sys, every named command exists and exits 0, the editor note consistent
  with what the repo ships); the dual-alias collapse triggers are recorded in
  CONTRIBUTING.md (the durable copy) and state.md D1 (the packet-lifetime mirror)
  with identical substance and no drift; the root README badge says TypeScript-7.0;
  the 19 localized README mirrors deliberately keep the old badge per the
  maintainer's release-time mirror sync (docs/CLAUDE.md).
- Dependency hygiene: the dependency set gained nothing beyond the typescript aliases;
  package-lock.json diff reviewed; no install scripts added.
  VERDICT: PASS. The package.json diff is exactly two lines (the @typescript/native
  addition and the typescript re-alias). The lockfile diff was audited entry by
  entry: only the TS family (@typescript/native, @typescript/old, the 20
  platform-binary optionalDependencies, and the node_modules/typescript wrapper
  re-alias) plus integrity metadata; no new install scripts anywhere in the diff;
  svelte-check's nested optional-peer picomatch entry is PRESENT (the npm-10
  semantics survived, guarding the run-29434601544 failure class).
- Deploy: not applicable (no server or client runtime change ships from this packet);
  the production Docker build consumes the same vite/esbuild outputs as before.
  VERDICT: PASS (not applicable holds). The packet commits ship no runtime change;
  all three builds plus the client build are green on the tip; the Phase 5
  implementation's clean-room DEPLOY.md simulation (fresh clone,
  npm ci --ignore-scripts, tsc 7.0.2 functional, npx tsc --noEmit exit 0) stands.
