# 10 QA: the icon art ships clean

STATUS: NOT STARTED

Read `docs/achievements/overview.md` first (authoritative), then the 10
implement file and its progress.md row. House rules: no em/en dashes or
emojis; no "phase"/packet wording in anything that ships; English-only i18n,
pending rows expected.

## 0. Orient

Read the 10 session summary, the diff (script, icons.ts, deeds_view.ts,
tests, public/ui/deeds), and `git log` since the row's base sha.

## 1. Re-run acceptance (all of it, from a clean tree)

Every command in the 10 Acceptance section verbatim, real exit codes,
`npm run gate` UNPIPED.

## 2. Asset audit (the load-bearing check)

- Set equality three ways: `git ls-files public/ui/deeds` vs DEED_IMAGE_IDS vs
  the DEED_ORDER ids that have art. Zero orphans (grep the 11 orphan ids
  against the tree: prog_three_paths, prog_ninefold, prog_ringwright,
  feat_before_the_book, feat_realm_first_cap, feat_founders_circle,
  feat_realm_first_nythraxis, feat_realm_first_thunzharr,
  feat_realm_chronicler, feat_top_of_the_book, pvp_vcup_bet_flex).
- Spot-verify 5 files with sips: exactly 128x128, WebP, alpha preserved.
- Total weight and max single file recorded and within the caps.
- Zero 512px sources committed (`git ls-files '*achievement*' '*.png' | grep -i deed`
  style sweeps; be creative).
- CREDITS.md row present.
- Idempotence: re-run the ingest script against the v2 source; `git status`
  stays clean.

## 3. Browser verification (the art must actually be good, not just green)

Desktop 1600x900 and phone landscape 844x390 (raw CDP metrics override, not
page.setViewport): open the Book, walk every category rail button, confirm
real art renders on art-backed cards and category crests on artless ones
(session 09 additions are the natural artless set); unearned desat reads
clearly; recent strip minis are crisp; search filtering keeps images stable;
long-press peek on mobile unaffected. Screenshot a desktop and a mobile frame
into tmp/ for the 13 session to reuse.

## 4. Fallback and purity audit

- Delete one WebP in the working tree (do not commit): the gate test reds.
  Restore it.
- Remove one id from DEED_IMAGE_IDS in the working tree: the gate test reds
  the other direction. Restore.
- Confirm deeds_view.ts imports only the id set (no DOM, no icons.ts), and
  the architecture scans pass.
- Confirm zero consumer of `iconCanvas('crest', 'deed_...')` exists.

## 5. Test decisiveness audit

Would the suite fail if: the static branch returned a procedural URL for an
art-backed id; the URL pattern drifted (`/ui/deed/` vs `/ui/deeds/`); the
crestId logic sent artless deeds to UNKNOWN_RECIPE? Mutation-test the URL
pattern and one fallback arm; restore after.

## 6. Reviewer dispatch

qa-checklist and test-coverage-auditor verdicts from 10 read and resolved;
dispatch a fresh qa-checklist over the final diff if 10 amended anything.

## 7. Adversarial what-is-missing pass

- Any deed surface still showing a procedural crest that SHOULD show art
  (grep every `iconDataUrl('crest'` consumer)?
- Does the ingest script fail loudly on a corrupt PNG, or ship garbage?
- Anything in the diff with a dash, emoji, or packet vocabulary?
- Does the window open time feel unchanged (cold path; no jank on first
  paint with 40 imgs)?

## Exit criteria

Acceptance green from clean tree, asset audit clean, both fallback mutations
redded, browser pass done on both viewports, progress.md row 10Q written.

## End of session

Update progress.md row 10Q. Name the next file:
`docs/achievements/phase-11-title-surfaces.md`.
