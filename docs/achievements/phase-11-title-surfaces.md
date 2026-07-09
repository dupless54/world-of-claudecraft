# 11: Titles everywhere they make sense

STATUS: NOT STARTED

Read `docs/achievements/overview.md` FIRST; sections 2, 3, and 5 apply
verbatim. Titles already render on nameplates, the inspect window, the
character panel progression block, the Renown leaderboard, and the Book's
title picker. This session extends them to the surfaces the maintainer named
(chat, the target frame, the player card) plus the sockets the audit found
worth shipping, without breaking a single layout on desktop or mobile.

Reminder that binds every step: the word "phase", packet references, em
dashes, en dashes, and emojis never appear in any shipped artifact.
English-only i18n via the pending mechanism. Titles travel as DEED IDS on
every wire, never as text; the client alone renders text via `deedTitleText`.

## Goal

By the end of this session: a titled player's chat lines read
name-plus-title ("fernando [the Resplendent] says: hello") in every player
channel; clicking a player shows the title on the target frame; the shareable
player card PNG carries it; the guild roster, friends list, lifetime-XP
leaderboard, and the public profile page each show it where their layout
allows; and every one of those surfaces fits cleanly at desktop, tablet, and
phone-landscape widths.

## Context to load before writing code

- `src/ui/deed_i18n.ts` `deedTitleText` (returns '' for unknown/non-title ids;
  every consumer hides on '').
- Chat: the chat event shape in `src/sim/types.ts` (search `channel:`, the
  chat event union member), every emitter in `src/sim/social/chat.ts` (search
  `from: r.meta.name`), the server guild/officer relay in `server/social.ts`
  (search `from:`), the client compose path `chatLogFrom` in `src/ui/hud.ts`
  (search `chat-player-name`) and `CHAT_TEMPLATE_KEYS`, the English templates
  in `src/ui/i18n.catalog/hud.ts` (search `says: {message}`).
- Target frame: the paint site in hud.ts (search `unitFrameView(`), the
  family core `src/ui/unit_frame.ts`, the painter
  `src/ui/unit_frame_painter.ts`, and the CSS comment that pins "the frame
  never changes height between a caster and a beast" (search that phrase in
  `src/styles/hud.css`).
- Player card: `src/ui/player_card.ts` (PlayerCardData, the name draw and the
  TOP-N% flex reservation), the data build site in hud.ts (search
  `PlayerCardData`), the server OG page `server/player_card.ts` and its
  PUBLIC_CARD_COPY locale system.
- Social window: `src/ui/social_window.ts` roster and friends rows,
  `src/ui/social_view.ts` row models, `src/world_api/social_graph.ts`
  FriendInfo/GuildMemberInfo, the server roster build in `server/social.ts`
  (search `presence(m.id)`), the db activeTitle read precedent
  `charactersForDeedsBoard` in `server/db.ts`.
- XP leaderboard: `src/world_api/progression_xp.ts` LeaderboardEntry, the
  server fill in `server/leaderboard.ts`, the render in
  `src/ui/leaderboard_window.ts` (the deeds-tab title cell and its
  `.lb-deed-title` ellipsis CSS are the pattern).
- Public profile page `server/profile_page.ts` (English by design; the sheet
  already carries `deeds.activeTitle`; `server/character_sheet.ts` already
  imports DEEDS).
- Parity and guards: `tests/snapshots.test.ts` (event and wire pins),
  `tests/localization_fixes.test.ts` (S3), the W0 pin blocks named in
  progress.md rows 2 and 5, `tests/hud_perf_budget.test.ts`.
- `src/ui/CLAUDE.md` (painter writer rules, resolve-elision: diff the title
  ID and re-run deedTitleText only on change) and `src/styles/CLAUDE.md`.

## Design spec

### 1. Chat (the headline surface)

- Sim: add optional `fromTitle?: string` (a deed id) to the chat event type.
  Stamp it from `meta.activeTitle` at every PLAYER-sourced emitter in
  `src/sim/social/chat.ts` (say, yell, whisper, party, general/world; walk
  them all, the audit counted 10 emit sites). Mob/NPC/boss yells never set
  it. Zero rng, zero new state.
- Server: the guild/officer relay in `server/social.ts` composes its own
  frames; stamp the sender's activeTitle from the live sim meta (the session
  that sent the line). If a relay path has no live meta, omit the field
  (untitled beats a stale db read).
- Client: `chatLogFrom` gains the optional title id; when present and
  `deedTitleText` returns non-empty, the sender renders through a NEW pattern
  key (English: `'{name} [{title}]'`) inside the existing
  `.chat-player-name` span, so the right-click handle and context menu still
  read the RAW name (verify: the menu uses the name value, not textContent;
  if it reads textContent, carry the raw name on a data attribute).
  Bracket placement lives in the key so locales own it. The value is
  non-wordy after placeholder strip (no M16 fills needed); confirm with the
  scan, do not assume.
- Chat lines wrap (no ellipsis), so nothing clips; accept the extra line
  height. Chat bubbles over heads keep text-only, no title.
- S3 stays green by construction (ids on the wire); extend the snapshot/event
  pins for the new field.

### 2. Target frame

- Client-only: the paint site already holds the full entity; `target.title`
  is on the wire today.
- Render INLINE on the existing name line, not a second line: append a muted
  gold span (`.uf-title`) inside the nowrap ellipsized `.uf-name`, formatted
  with the SAME `'{name} [{title}]'` pattern key. This preserves the pinned
  frame-height constancy; long combos ellipsize (that is the accepted
  behavior, matching every classic-era frame).
- Elide the resolve: cache the last title id per slot; re-run deedTitleText
  only when it changes (the lastIcon pattern). The target body repaint is
  throttled on low tier; the title rides the same writes. NO new raw writes
  (hud_perf_budget baseline unchanged).
- Extend `UnitFrameDescriptor`/view/painter as INSTANCE-parameterized family
  members; party frames do NOT pass a title (out of scope), so the field is
  optional and absent means no span update.

### 3. Player card (the shareable PNG) and its OG page

- `PlayerCardData.titleText?: string`, filled at the hud build site from
  `sim.activeTitle` via deedTitleText. Draw as a small gold line
  directly under the name, `fillTextClamped` to the same 540px name box
  (never compete with the TOP-N% flex reservation on the subtitle line).
  Untitled cards are byte-identical to today (pin that).
- Server OG page (`/p/<slug>`): append the English title to the page/OG
  subtitle via `DEEDS[id].reward.text` guarded by the same earned-title shape
  the card stored; if the card copy locale system makes this awkward, ship
  the canvas line only and record the OG page as considered-and-deferred.

### 4. Guild roster and friends list

- Server: extend the roster/friends payload with the member's activeTitle
  deed id (db read via the `state->>'activeTitle'` precedent, joined into the
  existing SELECTs; no N+1). Type it on FriendInfo/GuildMemberInfo;
  ClientWorld mirrors the frame wholesale, so this is likely type-plus-fill.
- Render: a muted ellipsized title span after the name in both rows
  (`.soc-title`, the `.lb-deed-title` treatment). The social window is 348px;
  the span must never push the rank chip or action buttons; if the row is too
  tight at 348px, title shows only in the row tooltip and the session records
  the call. Offline Sim worlds have no roster; the facet arm stays null-safe.

### 5. Lifetime-XP leaderboard rows

- Server fill adds the activeTitle id to LeaderboardEntry (the deeds-board
  SELECT precedent); render exactly like the Renown tab's title cell,
  ellipsized. Legacy arm and RouteDef arm stay byte-identical (dual-edit,
  parity pins re-run; the audit trail from rows 4 and 5 shows where).

### 6. Public profile page (/c/<name>)

- Render the title under the name from the sheet's `deeds.activeTitle` via
  `DEEDS[id].reward.text` (server-side English page by existing design;
  strip nothing, the id was validated at set time; a stale id renders '').

Considered and deferred, record in the session summary: party/raid frames
(the party payload is deliberately change-minimal and rows are dense), mail
sender lines (stamp-at-send semantics need a letter-shape change), chat
bubbles (name-free by design).

## Layout verification (binds this session, desktop AND mobile)

For chat, target frame, social window, and leaderboard: verify at 1600x900,
1280x720, 1024x768, and 844x390 (raw CDP metrics override) with the LONGEST
live title ("Boarball Legend" / "the Resplendent", 15 chars) on a
max-length player name. No horizontal overflow, no pushed-out buttons, no
wrapped frame rows; ellipsis is the accepted degradation everywhere except
chat (which wraps). Screenshot each surface at desktop + phone for the 13
session.

## Out of scope

- Party/raid frames, mail, chat bubbles (recorded as deferred).
- Any new title content or reward changes.
- Nameplate/inspect/character-panel surfaces (already live).

## Steps

1. Sim chat event field + emitters + tests (event pin, untitled omission,
   mob-yell negative).
2. Client chat compose + pattern key + context-menu raw-name proof + tests.
3. Server guild/officer stamp + tests.
4. Target frame descriptor/view/painter + resolve elision + tests.
5. Player card line + pin (untitled unchanged) + OG page call.
6. Roster/friends/XP-board fills + renders + parity pins.
7. Profile page line + test.
8. The layout verification matrix above.
9. Biome on touched files; targeted vitest; `npm run gate` UNPIPED.
10. Update progress.md row 11; commit with explicit paths (scopes: `deeds`,
    `ui`, `net`, `server` per commit).

## Acceptance (all must pass)

- `npx vitest run tests/deeds.test.ts tests/deed_i18n.test.ts tests/snapshots.test.ts`
- `npx vitest run tests/architecture.test.ts tests/localization_fixes.test.ts`
- `npx vitest run tests/hud_perf_budget.test.ts` (baseline UNCHANGED)
- The unit-frame, social-view, leaderboard, and player-card suites (locate
  the real filenames; extend, never fork).
- Parity corpus green; if a golden changes it is DELIBERATE, regenerated, and
  named in the commit body.
- `npm run gate` UNPIPED, exit 0.

## Reviewer dispatch (fresh agents, never the implementer)

- cross-platform-sync (the chat event field and social/board fills exist in
  BOTH worlds' paths; wire pins updated).
- architecture-reviewer (sim purity: title stamping draws no rng, reads only
  meta).
- test-coverage-auditor (every surface has a titled AND an untitled
  assertion; the longest-title layout case exists).
- qa-checklist over the whole diff.

## Adversarial pass (answer each in the session summary)

1. Can a title ever render as raw English from the server (S3)? Prove by
   grep: no deedTitleText or reward.text on any server-to-client string path
   except the two English-by-design pages.
2. What renders for a stale/cleared title id on EACH surface? ('' and the
   decoration collapses; no brackets around nothing.)
3. Does the context menu still whisper the right player when their display
   name carries a title?
4. Did any per-frame surface gain an unelided resolve or raw write?
5. Does an untitled player's card/chat/frame render byte-identical to
   pre-11?
6. Which surfaces did you defer and is each recorded with its reason?

## End of session

Update progress.md row 11. Name the next file:
`docs/achievements/phase-11-qa.md`.
