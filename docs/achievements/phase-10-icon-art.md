# 10: Real icon art for every deed

STATUS: NOT STARTED

Read `docs/achievements/overview.md` FIRST; sections 3 and 5 apply verbatim.

Reminder that binds every step: the word "phase", packet references, em dashes,
en dashes, and emojis never appear in any shipped artifact. English-only i18n
via the pending mechanism.

## Goal

The maintainer delivered hand-reviewed 512x512 transparent-background PNG
icons, one per deed, named exactly `<deed_id>.png`. This session ingests them
into the repo at shipping quality (128px WebP under `public/ui/deeds/`), plugs
them into the shared icon system so every deed surface (window cards, recent
strip) shows real art with the procedural crest as a safe fallback, and keeps
the perf, a11y, and purity contracts intact. By the end of this session a
player opening the Book of Deeds sees bespoke painted art on every v1 deed,
crisp at HiDPI, desaturated when unearned, with zero regression in window
behavior.

## Source assets (read this carefully; the source lives OUTSIDE this worktree)

- Canonical set: `/Users/fernando/Documents/world-of-claudecraft/achievement-icons-v2/png/`
  (197 files; the `part-1..4` folders are the same set split into delivery
  batches, ignore them). All 512x512 8-bit RGBA PNG, ~286 KB each, 54 MB total.
- 186 filenames match DEED_ORDER ids exactly. 11 are orphans (the 10 deferred
  ids plus the 1 cut id): do NOT ship orphan art; it stays with the maintainer
  until those deeds exist.
- Deeds added by session 09 have NO art yet (the icon brief is with the
  maintainer); they keep the procedural category crest via the fallback.
- The 512px PNGs are sources and are NEVER committed (the skills-icon
  precedent: WebP is the committed source of truth).

## Context to load before writing code

- `src/ui/icons.ts`: `iconDataUrl` (the static-image early-return branches for
  items via `itemImageUrl`/`ITEM_IMAGE_IDS` and abilities via
  `abilityImageUrl` are the EXACT precedent), `resolveRecipe` crest arm,
  `CREST_RECIPES` (`deed_cat_*` bases and the 21 bespoke `deed_<id>` entries),
  the url cache.
- `src/ui/deeds_view.ts`: `deedCrestId` and `DEED_BESPOKE_CRESTS`; the two
  crestId bake sites (entry models, recent-strip models). This file is a PURE
  core in UI_PURE_CORES: it may import a static id set, never DOM.
- `src/ui/deeds_window.ts`: the two `<img>` sites (card and recent strip),
  `DEED_CREST_SIZE = 96`, alt-text conventions (card `alt=""` because the name
  is adjacent; strip alt = deed name).
- `scripts/convert_skill_icons_webp.mjs`: the sharp WebP conversion precedent
  (quality 82, alphaQuality 100, smartSubsample, effort 6). It does NOT
  resize; yours must.
- `public/CLAUDE.md`: the two shipping paths; `public/ui/` is the raw
  unhashed path (correct for these; NO media-manifest change), the size and
  optimization rules, the CREDITS.md requirement.
- `tests/skill_icons.test.ts`: the committed-icon-set gate pattern to copy.
- `src/styles/components.css` `.deed-crest` block: 40px card box, 24px mini,
  the `.desat` grayscale filter (verify it reads correctly over painted art,
  not just procedural crests).
- `src/ui/CLAUDE.md`: per-frame contract notes; the deeds WINDOW is a cold
  painter (exempt from hot-path writer rules), the TRACKER is hot and gets NO
  icons this round.

## Design spec

### 1. Ingest script (committed)

`scripts/convert_deed_icons_webp.mjs`: takes a source dir argument, reads
`<deed_id>.png` files, validates each id against DEED_ORDER (imports the
content module the way build_content.mjs does), skips-with-log any file whose
id is not a live deed (the orphan guard), resizes 512 to 128x128 LANCZOS
(sharp `.resize(128, 128)`), encodes WebP with the skills settings, writes
`public/ui/deeds/<deed_id>.webp`. Idempotent; converting twice is a no-op
diff. Log a summary line: converted N, skipped orphans M, missing art for K
live deeds (the session 09 additions land here, expected, not an error).

### 2. The static branch in the icon system

- New module or generated set `DEED_IMAGE_IDS` (a `Set<string>` of deed ids
  with committed art). Keep it honest with a test that scans
  `public/ui/deeds/` and asserts exact set equality both directions (the
  skills gate pattern). Place it so BOTH icons.ts and the pure view core can
  import it (no DOM, no fs at runtime; a checked-in literal list the test
  verifies is the simplest honest shape).
- `icons.ts`: in `iconDataUrl`, before the procedural fallthrough for kind
  `'crest'`, ids shaped `deed_<id>` where `<id>` is in DEED_IMAGE_IDS return
  `/ui/deeds/<id>.webp` (mirror `itemImageUrl`). Every other crest id is
  untouched: class crests, talent crests, the `deed_cat_*` bases, and bespoke
  procedural recipes still resolve as today, so a missing image can never
  break a consumer.
- `deeds_view.ts` `deedCrestId`: return `deed_<id>` when the deed has real art
  OR a bespoke recipe (the existing set), else the category crest. The 21
  bespoke procedural recipes stay in the code as the fallback tier and for
  forward-compat; the image branch simply outranks them.
- `iconCanvas` (the synchronous canvas path) is used only for class crests;
  deed images do not need a canvas path. Verify with a grep, and leave a
  comment on the branch saying why the URL-only path is sufficient.

### 3. Surfaces and quality

- Card (40px box) and recent strip (24px box) pick the art up automatically
  through `iconDataUrl`; `DEED_CREST_SIZE` stays 96 as the size hint for the
  procedural fallback (the img box sizes are CSS-owned; a 128 WebP in a 40px
  box is the HiDPI story).
- Verify `.desat` visually over painted art (unearned cards must read clearly
  dimmed); adjust the filter ONLY if unreadable, and if adjusted, screenshot
  before/after for the next session's packet evidence.
- The unlock banner and the HUD tracker stay text-only this round (the banner
  is the shared single-slot #banner element; an icon there is a cross-cutting
  HUD change, out of scope; record it as a considered-and-deferred note).
- CREDITS.md: add the attribution row for the icon set (ask the format from
  the existing rows; the art is maintainer-commissioned, record it as such).

### 4. Weight and loading

- Expected shipped weight: 186 x 128px WebP, roughly 0.5 to 1 MB total. Record
  the real number in the session summary. If any single file exceeds ~15 KB,
  re-encode that one at quality 75 before accepting.
- Loading is lazy by nature (the window is cold; img src resolves on open).
  No prewarm, no manifest change, no preload hints this round.

## Out of scope

- Tracker icons, banner icons, leaderboard row icons.
- Any change to procedural recipes beyond fallback ordering.
- Orphan art (deferred deeds) and art for the 09 additions.
- Media-manifest/hashed-path integration.

## Steps

1. Write and run the ingest script against the v2 source dir; commit script +
   WebP output + DEED_IMAGE_IDS + CREDITS.md row.
2. Wire the static branch and the crestId change; update the two view tests
   that pin crest resolution.
3. New test: public/ui/deeds set equality gate; a card for an art-backed deed
   resolves to the WebP URL; a card for an artless deed still resolves to a
   procedural data URL; an orphan id never appears.
4. Browser pass: open the Book on desktop and phone-landscape viewports; spot
   10 cards across categories (earned + unearned), the recent strip, a search
   result set; confirm crispness at dsf2 and the desat treatment.
5. Biome on touched files. Targeted vitest, then `npm run gate` UNPIPED.
6. Update progress.md row 10; commit with explicit paths, scope `ui` (assets
   commit may be its own `feat(ui): ...` commit; keep the WebP blob commit
   separate from logic if it helps review).

## Acceptance (all must pass)

- `npx vitest run tests/deeds_view.test.ts tests/deeds_window.test.ts tests/deed_i18n.test.ts`
- `npx vitest run tests/architecture.test.ts` (deeds_view purity holds with
  the id-set import)
- The new icon-set gate test, green on the committed tree.
- `npx vitest run tests/hud_perf_budget.test.ts` (no baseline edits)
- `npm run gate` UNPIPED, exit 0.
- `git ls-files public/ui/deeds | wc -l` equals the DEED_IMAGE_IDS size and
  the session summary's converted count.
- Zero 512px PNGs and zero orphan ids anywhere in the committed tree.

## Reviewer dispatch (fresh agents, never the implementer)

- qa-checklist over the diff (asset conventions, purity, a11y alt text).
- test-coverage-auditor (the set-equality gate is decisive both directions;
  fallback arms each have a negative).

## Adversarial pass (answer each in the session summary)

1. What happens for a deed id with neither art nor bespoke recipe? (Must be
   the category crest, never UNKNOWN_RECIPE, never a broken img.)
2. What happens if a WebP file is deleted but its id stays in DEED_IMAGE_IDS?
   (The gate test must red.)
3. Does the pure core still pass the DOM-global and forbidden-import scans?
4. Did the urlCache keep procedural and image URLs from colliding on the same
   crest id?
5. Is the total shipped weight recorded, and is the heaviest single file
   under the cap?

## End of session

Update progress.md row 10. Name the next file:
`docs/achievements/phase-10-qa.md`.
