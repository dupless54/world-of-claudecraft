# 12 QA: Zenzie stands where she should, looking like herself

STATUS: NOT STARTED

Read `docs/achievements/overview.md` first (authoritative), then the 12
implement file and its progress.md row. House rules: no em/en dashes or
emojis; no "phase"/packet wording in anything that ships; English-only i18n,
pending rows expected.

## 0. Orient

Read the 12 session summary and the diff (zone1/2/3, deeds.ts descs,
manifest.ts, catalog/chronicles.md, generated i18n artifacts).

## 1. Re-run acceptance (all of it, from a clean tree)

Every command in the 12 Acceptance section verbatim, real exit codes,
`npm run gate` UNPIPED.

## 2. Rename blast-radius audit (the load-bearing check)

- `git grep -in 'edda hartwell'` across the WHOLE tree: hits only in
  docs/achievements history notes and the five stale locale overlays (which
  session 14 owns; confirm the 14 file names them).
- The template id `chronicler_edda_hartwell` unchanged everywhere it is
  keyed: CHRONICLER_TEMPLATE_IDS, NPC_IDS, the save-mark string.
- Load a pre-12 save fixture: the visited mark and any Saul-counter state
  survive; retro evaluation does not re-fire chronicle grants.
- i18n: resolved English shows Zenzie; the status artifacts and (if moved)
  the sha256 baseline landed in the SAME commit as the rename (check the
  commit graph).
- Catalog doc matches the game: chronicles.md carries Zenzie.

## 3. Browser verification (all three hubs)

Offline world, gameplay camera:

1. Each chronicler renders the mage look (hat, book/staff) with its own
   clearly distinct color; screenshot all three side-by-side day + one at
   night.
2. Positions match the spec coordinates (probe `window.__game` entity
   positions); each stands on ground, off colliders, inside the hub; the
   nearest-NPC spacing improved as specified.
3. Interact with each: the Book opens on Chronicles; Saul nine talks still
   grants hid_saul_footnote on a fresh character.
4. Nameplate shows "Chronicler Zenzie"; ja locale shows the STALE old
   transliteration (expected until 14; record it).
5. No other hub NPC moved (spot-check two per hub against the base sha).

## 4. Determinism audit

Same seed, two fresh offline worlds: entity ids for the three chroniclers
and their hub neighbors identical across runs; parity goldens untouched (or
deliberately regenerated and named, only if the audit's no-pin claim proved
wrong).

## 5. Test decisiveness audit

The visualKeyFor assertion reds if a mapping row is dropped; the rename has
a pin (deed desc or entity English) that reds on regression. Mutation-test
the NPC_KEYS mapping; restore.

## 6. Reviewer dispatch

architecture-reviewer and qa-checklist verdicts read and resolved; dispatch
fresh qa-checklist if 12 amended after dispatch.

## 7. Adversarial what-is-missing pass

- Does any quest text, letter, gossip line, or guide prose still reference
  the old name or assume the old positions?
- Do the moved positions break any scripted walk (bot raids, E2E paths that
  pathed through the old spots)?
- Is the one-line .glb swap note actually in the manifest for the future
  model drop?
- Anything in the diff with a dash, emoji, or packet vocabulary?

## Exit criteria

Acceptance green from clean tree, blast-radius audit clean, browser pass
recorded with screenshots, determinism check clean, progress.md row 12Q
written.

## End of session

Update progress.md row 12Q. Name the next file:
`docs/achievements/phase-13-docs-screenshots.md`.
