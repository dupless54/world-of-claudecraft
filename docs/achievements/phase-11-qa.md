# 11 QA: titles fit everywhere, on every screen

STATUS: NOT STARTED

Read `docs/achievements/overview.md` first (authoritative), then the 11
implement file and its progress.md row. House rules: no em/en dashes or
emojis; no "phase"/packet wording in anything that ships; English-only i18n,
pending rows expected.

## 0. Orient

Read the 11 session summary and the full diff (sim types + chat emitters,
server social/leaderboard/profile, hud chat compose, unit frame family,
player card, social window, world_api types, tests, css).

## 1. Re-run acceptance (all of it, from a clean tree)

Every command in the 11 Acceptance section verbatim, real exit codes,
`npm run gate` UNPIPED.

## 2. Browser verification (online, two clients; the load-bearing check)

`npm run server` freshly rebuilt on this branch + `npm run dev`;
`ALLOW_DEV_COMMANDS=1` (dev only). Client A equips a title through the real
Book UI; client B observes. Walk and record pass/fail:

1. A says hello: BOTH clients render "name [title] says: hello"; the title
   text is localized client-side (switch B to ja: the pattern re-renders, the
   name stays raw).
2. Whisper, party, general, guild, officer lines each carry it; a mob/boss
   yell never does.
3. Right-click A's chat name on B: the context menu and whisper target use
   the RAW name.
4. B clicks A: target frame shows the inline title, ellipsized if long; a
   caster mob target keeps the exact same frame height (screenshot both,
   compare heights).
5. A clears the title: B's next chat line and a re-target show plain name
   within one snapshot round trip; no empty brackets anywhere.
6. Player card: titled card shows the line; untitled card pixel-identical to
   a pre-11 capture (generate one from the base sha if needed).
7. Guild roster + friends list on B show A's title, ellipsized, buttons
   untouched at 348px.
8. XP leaderboard and Renown leaderboard both show titles; anonymous fetch of
   both board endpoints (legacy AND registry arms) returns identical shapes.
9. Public profile /c/<name> shows the title; a forged stale id in db state
   renders nothing (psql spot, the row 5Q bonus-proof recipe).
10. The layout matrix: 1600x900, 1280x720, 1024x768, 844x390 (raw CDP), the
    15-char title on a long name: no overflow, no pushed buttons, chat wraps.

## 3. Parity and S3 audit

- Snapshot/event pins cover `fromTitle`; W0 pin counts updated deliberately
  and named in the row (never silently).
- Both leaderboard arms byte-equal for the new field (the dual-edit proof
  pattern from row 5).
- S3 guard green; grep the server diff for any English title text on a wire
  path: the only reward.text consumers are profile_page and player_card OG
  (English-by-design pages).
- ClientWorld and Sim both satisfy any IWorld type change; offline world
  renders its own title surfaces (chat say line offline, card, target frame
  vs a bot).

## 4. Perf audit

- `tests/hud_perf_budget.test.ts` baseline UNCHANGED; grep the painter diff
  for raw writes.
- The target-frame title resolve is elided (change the title id in a scratch
  loop: deedTitleText call count stays 1 per change, not per frame).

## 5. Test decisiveness audit

Every surface has titled + untitled + stale-id assertions; mutation-test two
(drop the mob-yell negative guard, break the clear-propagation) and confirm
reds; restore.

## 6. Reviewer dispatch

Read the four reviewer verdicts from 11 and resolve anything open; dispatch a
fresh qa-checklist if 11 amended code after its own dispatch.

## 7. Adversarial what-is-missing pass

- Any surface showing a title that a player did NOT choose to display?
- Any tier/governor read added (fairness: titles are static cosmetic info)?
- A 40-char de_DE title after release fill: which surface breaks first, and
  is ellipsis actually in place there?
- Anything in the diff with a dash, emoji, or packet vocabulary?

## Exit criteria

Acceptance green from clean tree, the 10-step walkthrough recorded all-pass,
parity/S3/perf audits clean, mutations redded, progress.md row 11Q written.

## End of session

Update progress.md row 11Q. Name the next file:
`docs/achievements/phase-12-chroniclers.md`.
