# PvP and Sport (pvp_)

Covers the Ashen Coliseum arena (1v1 and 2v2 Elo ladders), duels, the Vale Cup
boarball league at the Sowfield, and 2v2 Fiesta. 27 deeds plus 1 optional
0-Renown flex; Steam quota 12.

## Verified system facts (sources)

- Arena rating: every character starts at `ARENA_BASE_RATING = 1500`, floor
  `ARENA_MIN_RATING = 100`, standard Elo with `ARENA_K_FACTOR = 32`
  (`src/sim/social/arena.ts`). An even-rated win moves +16/-16; at a +400 gap
  the favorite gains only +3 per win; past roughly a +720 gap the gain rounds
  to 0 (32 / (1 + 10^(gap/400)) < 0.5). Elo is zero-sum, matchmaking pairs the
  nearest-rated queued units, and Fiesta and Protect Yumi are explicitly
  unranked (`ranked = !match.fiesta && !match.yumi`), so the ladder only moves
  on human ranked 1v1/2v2 play. Persisted: `arenaRating/arenaWins/arenaLosses`
  (1v1) and `arena2v2Rating/arena2v2Wins/arena2v2Losses` (`src/sim/sim.ts`
  PlayerMeta).
- Duels: `duelEnd` carries winner and loser; nothing duel-related persists, so
  both duel deeds are one-shot event triggers (`src/sim/social/duel.ts`,
  endDuel).
- Vale Cup: brackets 1v1 to 5v5 (`VC_BRACKETS`), 360 s matches, score cap 5,
  golden goal up to 120 s, deserter lockout 300 s. `match.rated` is false
  whenever bots are seated, and `applyStanding` returns early on unrated
  matches, so `vcupWins/vcupLosses/vcupDraws` and the guild columns
  (`vcupGuildWins/vcupGuildLosses`) only ever move on full-human rated
  results. Deserters are benched, take the rated loss (and the guild loss)
  immediately, and never reach the end seated. Goal credit resolves to the
  SCORING team's last kicker within 8 s, else its last toucher; an own goal
  never credits an opponent (`scorerNameFor`). Keepers exist only in brackets
  3v3 and up (`normalizeRole`: bracket <= 2 is all-rounder). All in
  `src/sim/social/vale_cup.ts`. Betting record (`vcupBetWins/Losses/Net`)
  persists but is deliberately almost untouched here (see the one optional
  flex).
- Fiesta: first team to 15 takedowns (`FIESTA_SCORE_LIMIT`), 360 s cap, three
  augment waves at silver/gold/prismatic tiers (`FIESTA_TOTAL_WAVES = 3`,
  `tierForWave`), per-player kill and streak tallies (`f.kills`, `f.streak`),
  kill-word cues carry the killer's pid (firstblood, doublekill at two
  takedowns within 4 s, spree at streak >= 3, shutdown when the victim's
  streak was >= 3), and four ring power-ups (`POWERUPS`: pow_speed_demon,
  pow_colossus, pow_moon_boots, pow_berserker). ALL Fiesta state is
  session-only (nothing persists), so every Fiesta deed below is an event
  trigger or a new deedStats counter. `src/sim/social/fiesta.ts`,
  `src/sim/content/augments.ts`.

## Proposed titles (2)

| Title | Deed |
|---|---|
| Gladiator | pvp_arena_1v1_1900 |
| Boarball Legend | pvp_vcup_wins_25 |

## Proposed borders

- none from this file

## Steam registry (12)

ACH_ARENA_1V1_1750, ACH_ARENA_1V1_1900, ACH_ARENA_2V2_1900,
ACH_DUEL_FIRST_WIN, ACH_VCUP_FIRST_WIN, ACH_VCUP_WINS_25, ACH_VCUP_HAT_TRICK,
ACH_VCUP_GOLDEN_GOAL, ACH_VCUP_CLEAN_SHEET, ACH_FIESTA_FIRST_WIN,
ACH_FIESTA_DOUBLE, ACH_FIESTA_FULL_BUILD

---

## Ashen Coliseum arena

### pvp_arena_first_match
- Name: Sand in Your Boots
- Desc: Fight a ranked match in the Ashen Coliseum, in either bracket.
- Renown: 5
- Trigger: first `arenaEnd` delivered to this character with format `1v1` or
  `2v2` (win, loss, or draw). Fiesta and Yumi formats do not count (they are
  unranked play on the same match plumbing).
- Reward: none
- Hidden: no
- Steam: no
- Notes: Trigger site is the `scoreTeam` emit in `isArenaCrossTeam`
  (`src/sim/social/arena.ts`), which fires only for seated combatants, so
  queue-and-abandon never grants it. Collusion: two accounts can queue into
  each other and finish one match; that grants each a single 5 Renown routine
  deed, the same as any honest first match, and there is nothing left to farm.
  Not retroactive (event trigger), but any character with
  `arenaWins + arenaLosses > 0` in either bracket should be granted it at
  first evaluation as a persisted-state fallback.

### pvp_arena_first_win
- Name: The Crowd Roars
- Desc: Win a ranked arena match in either bracket.
- Renown: 10
- Trigger: first ranked `arenaEnd` with `won === true` (format `1v1` or
  `2v2`).
- Reward: none
- Hidden: no
- Steam: no
- Notes: The ONLY win-count deed on the ladder, per the anti-win-trading rule:
  first win is the low tier, everything above it is rating-gated. Collusion:
  a fed win grants 10 Renown once and costs the feeder -16 rating; a colluding
  pair alternating wins nets each one deed and zero rating (Elo is zero-sum).
  Persisted fallback for retro grant: `arenaWins > 0 || arena2v2Wins > 0`.

### pvp_arena_1v1_1600
- Name: Coliseum Contender
- Desc: Reach 1600 rating in the 1v1 arena bracket.
- Renown: 10
- Trigger: predicate over persisted state, `arenaRating >= 1600`. Evaluated on
  every rating change and retroactively at first evaluation; the deed stays
  earned if rating later falls.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Rating scale verified: base 1500, K = 32, so +100 is at least 7 net
  wins against even-rated peers (+16 each), fewer against higher-rated ones.
  Colluder attack: win-trading between two accounts is Elo zero-sum and nets
  nothing; boosting off a tanked feeder decays fast (+3 per win at a +400
  gap, rounds to 0 past about +720) and the nearest-rating matchmaker stops
  pairing the tanked account with the booster whenever anyone else is queued.
  Reaching 1600 by collusion costs more matches than reaching it honestly.

### pvp_arena_1v1_1750
- Name: Coliseum Rival
- Desc: Reach 1750 rating in the 1v1 arena bracket.
- Renown: 25
- Trigger: predicate, `arenaRating >= 1750`. Retroactive; one-way unlock.
- Reward: none
- Hidden: no
- Steam: ACH_ARENA_1V1_1750
- Notes: +250 over base requires sustained winning against the live pool;
  same anti-boost math as pvp_arena_1v1_1600, and the gain-decay curve bites
  harder the higher the target band. Any feeder pool is finite: each tanked
  account can only donate points until the gap zeroes the transfer.

### pvp_arena_1v1_1900
- Name: Gladiator
- Desc: Reach 1900 rating in the 1v1 arena bracket.
- Renown: 50
- Trigger: predicate, `arenaRating >= 1900`. Retroactive; one-way unlock.
- Reward: title "Gladiator"
- Hidden: no
- Steam: ACH_ARENA_1V1_1900
- Notes: The prestige band and this file's marquee title. At +400 over base a
  win against the pool average yields about +3, so holding 1900 means beating
  peers near your own rating, which is exactly what a title should certify.
  Colluder attack: a booster at 1900 gains 0 (rounded) from any feeder more
  than about 720 below, and dragging a feeder up to stay inside the useful
  window costs the feeder real wins against the pool, that is, honest play.

### pvp_arena_2v2_1600
- Name: Two Strong
- Desc: Reach 1600 rating in the 2v2 arena bracket.
- Renown: 10
- Trigger: predicate, `arena2v2Rating >= 1600`. Retroactive; one-way unlock.
- Reward: none
- Hidden: no
- Steam: no
- Notes: 2v2 is a fully independent ladder (arena2v2* fields). Team rating is
  the mean of the members (`arenaTeamRating`) and the delta applies equally to
  both, so sandbagging one seat drags the team's matchmaking rating down with
  it; there is no cheap seat to hide a booster in. Same zero-sum and
  gain-decay arguments as the 1v1 bands.

### pvp_arena_2v2_1750
- Name: Fearsome Twosome
- Desc: Reach 1750 rating in the 2v2 arena bracket.
- Renown: 25
- Trigger: predicate, `arena2v2Rating >= 1750`. Retroactive; one-way unlock.
- Reward: none
- Hidden: no
- Steam: no
- Notes: See pvp_arena_2v2_1600. Four colluding accounts win-trading across
  two teams still net zero rating in aggregate; only beating other units
  climbs.

### pvp_arena_2v2_1900
- Name: Perfect Partnership
- Desc: Reach 1900 rating in the 2v2 arena bracket.
- Renown: 50
- Trigger: predicate, `arena2v2Rating >= 1900`. Retroactive; one-way unlock.
- Reward: none
- Hidden: no
- Steam: ACH_ARENA_2V2_1900
- Notes: Prestige band, no second title (the file keeps to two). Anti-boost
  math identical to pvp_arena_1v1_1900, applied to team means.

## Duels

### pvp_duel_first_win
- Name: Settle It Outside
- Desc: Win a duel.
- Renown: 5
- Trigger: first decided `duelEnd` where this character is the winner
  (endDuel with `winnerPid` set to this pid; timed-out or cancelled duels
  resolve with a null winner and do not count).
- Reward: none
- Hidden: no
- Steam: ACH_DUEL_FIRST_WIN
- Notes: Duels are consensual and unrecorded (nothing persists in
  `src/sim/social/duel.ts`), so ANY duel deed is grantable by one obliging
  friend. That is why this is the floor tier and why there is deliberately NO
  deed counting duel-win volume anywhere in the catalog: a duel-win counter
  at any threshold is a pure two-account farm. One 5 Renown one-shot is worth
  exactly one friendly favor, the same as earning it honestly.

### pvp_duel_grace
- Name: A Lesson in Humility
- Desc: Lose a duel with your dignity mostly intact.
- Renown: 5
- Trigger: first decided `duelEnd` where this character is the loser.
- Reward: none
- Hidden: no
- Steam: no
- Notes: The losing-gracefully humor deed. Deliberately symmetric with
  pvp_duel_first_win so a colluding pair gains nothing the two of them would
  not get from one honest exchange; both deeds together pay out once per
  account, ever. No death involved (duels end at the mercy threshold), so
  there is no griefing angle.

## The Vale Cup

### pvp_vcup_first_match
- Name: Boots on the Pitch
- Desc: See out a full Vale Cup match at the Sowfield, win or lose.
- Renown: 5
- Trigger: still seated (never benched, never deserted) in a public Sowfield
  match when it reaches the over phase, AND at least one personal ball touch,
  kick, or save recorded during the match. Bot-backfilled unrated matches
  count for this debut only; practice bouts and offline-staged bouts never
  count.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Completion plus a personal outcome: deserters are benched at
  desertion (`vcupDesert` path), immediately take the rated loss, and never
  reach the end seated, so this cannot be earned by joining and walking off;
  and the touch/kick/save requirement means a seated AFK body earns nothing
  (rule 6's no-attendance clause, same personal-outcome standard as
  chr_vale_cup_debut).

### pvp_vcup_first_win
- Name: First Silverware
- Desc: Win a rated Vale Cup match.
- Renown: 10
- Trigger: first rated result where `applyStanding` increments this
  character's `vcupWins`. Persisted fallback for retro grant: `vcupWins > 0`.
- Reward: none
- Hidden: no
- Steam: ACH_VCUP_FIRST_WIN
- Notes: Rated means both teams fully human (`match.rated` is false whenever
  bots are seated), so this can never be farmed against bot keepers.
  Collusion: a thrown 1v1-bracket match grants it once; one-time low tier, so
  the traded win is worth no more than an honest one, and the partner books a
  persisted, leaderboard-visible loss.

### pvp_vcup_wins_10
- Name: Seasoned Boarballer
- Desc: Win 10 rated Vale Cup matches.
- Renown: 10
- Trigger: predicate over persisted state, `vcupWins >= 10`. Retroactive.
- Reward: none
- Hidden: no
- Steam: no
- Notes: Modest career threshold. Colluder attack: two accounts win-trading
  the 1v1 bracket need about 40 thrown matches (each roughly 2 to 3 minutes
  with briefing, celebrations, and aftermath) for both to hit 10 wins, and
  each traded win writes a permanent loss onto the partner's public W/L
  standing (`vcupLosses` feeds the winners board pattern). That is slower
  than honest queue play landing here naturally and it defaces both records;
  the payoff is a one-time 10 Renown. Not profitable.

### pvp_vcup_wins_25
- Name: Boarball Legend
- Desc: Win 25 rated Vale Cup matches.
- Renown: 25
- Trigger: predicate, `vcupWins >= 25`. Retroactive; one-way unlock.
- Reward: title "Boarball Legend"
- Hidden: no
- Steam: ACH_VCUP_WINS_25
- Notes: The Cup title sits on a career-notable threshold, not a prestige
  grind, per rule 7. Same collusion math as pvp_vcup_wins_10 scaled up:
  roughly 100 scripted 1v1 throws for a pair to both finish, hours of robotic
  play for a cosmetic both would earn by just playing, while stacking 25
  public losses on each other's persisted record. Rating-style resistance is
  not available here (the Cup has no Elo), so the defense is cost, visibility
  (W/L board), the deserter lockout, and the modest ceiling: no Cup deed
  counts wins past 25.

### pvp_vcup_first_goal
- Name: Off the Mark
- Desc: Score a goal in a rated Vale Cup match.
- Renown: 5
- Trigger: a goal in a rated match whose scorer credit resolves to this
  character (the scoring team's last kicker within 8 s, else its last
  toucher, exactly the `scorerNameFor` resolution in
  `src/sim/social/vale_cup.ts`; the implement hook should resolve the pid at
  the same site rather than matching the emitted name).
- Reward: none
- Hidden: no
- Steam: no
- Notes: Rated-only so bot keepers cannot be farmed. Own goals never credit
  an opponent (credit requires the SCORING team's last touch), so an enemy
  cannot be fed credit by kicking into one's own net. Collusion is the
  generic thrown-match vector, bounded as in pvp_vcup_first_win.

### pvp_vcup_hat_trick
- Name: Hat Trick Hero
- Desc: Score three goals in a single rated Vale Cup match, in the 3v3
  bracket or larger.
- Renown: 25
- Trigger: three goal credits (per pvp_vcup_first_goal resolution) to this
  character within one rated match with `match.bracket >= 3`; needs a small
  per-match scorer tally beside `match.resolved` at the onGoal site. Score
  cap 5 makes three by one player a real distinction.
- Reward: none
- Hidden: no
- Steam: ACH_VCUP_HAT_TRICK
- Notes: Bracket floor is the anti-collusion core: in 1v1/2v2 every dominant
  win is trivially a personal hat trick, and throwing needs only one
  accomplice. At 3v3+ a thrown hat trick needs three to five colluding humans
  on the opposing side of a rated match (and a keeper seat conceding on
  purpose), each booking public losses, for a one-time 25. Honest route:
  strikers in stomps get there naturally.

### pvp_vcup_golden_goal
- Name: Golden Moment
- Desc: Score the golden goal that decides a rated Vale Cup match.
- Renown: 25
- Trigger: a goal credit to this character while the rated match is in the
  golden phase (`match.golden` true; regulation ended level, next goal wins).
- Reward: none
- Hidden: no
- Steam: ACH_VCUP_GOLDEN_GOAL
- Notes: Pure moment deed off real match state; no volume to farm. Staging it
  requires a full-human rated match played to a deliberate draw through 360 s
  of regulation and then a thrown golden goal: the most expensive possible
  way to buy 25 Renown once. The 120 s golden cap means it is genuinely
  missable in any given match, which is fine: it is not luck, it is seizing a
  game state that recurs across a career.

### pvp_vcup_first_save
- Name: Safe Hands
- Desc: Make a save as keeper in a rated Vale Cup match.
- Renown: 5
- Trigger: first `vcupSave` credited to this character (keeper grip or dive
  catch on a shot moving at least `VC_SAVE_SHOT_SPEED = 12` yd/s toward goal)
  in a rated match. Keepers exist only in brackets 3v3 and up.
- Reward: none
- Hidden: no
- Steam: no
- Notes: The speed floor means a colluding striker cannot dribble the ball
  gently into the keeper's arms; they must take a real shot, in a rated
  full-human match. One-time floor tier, so staging it equals playing it.

### pvp_vcup_clean_sheet
- Name: Nothing Gets Past Me
- Desc: Win a rated Vale Cup match as keeper without conceding a goal.
- Renown: 25
- Trigger: at `applyStanding`, this character's team won, their live
  `sportRole === 'keeper'` (still seated), and the opposing score is 0.
  Implicitly bracket 3v3+ (keeper role only exists there).
- Reward: none
- Hidden: no
- Steam: ACH_VCUP_CLEAN_SHEET
- Notes: A perfection-style deed that fails only through goals conceded,
  never RNG. Colluder attack needs an entire opposing human team refusing to
  score for a full match while losing rated standing, for one account's
  one-time 25. The honest route (a strong team performance) is cheaper.

### pvp_vcup_guild_win
- Name: For the Banner
- Desc: Win a rated Vale Cup match entered under your guild's banner.
- Renown: 10
- Trigger: first rated result where `creditGuildResult` increments this
  character's `vcupGuildWins` (entered under the banner AND still in that
  exact guild at resolution). Persisted fallback for retro grant:
  `vcupGuildWins > 0`.
- Reward: none
- Hidden: no
- Steam: no
- Notes: The guild-side deed the mode's leaderboard is built on. Deserting
  also costs the guild a loss, so this cannot reward bailing. Only one
  guild-banner deed and it is a first: guild win VOLUME is the guild
  leaderboard's job (competitive, relative), not a deed target that a big
  guild could grind by throwing matches at a feeder guild.

### pvp_vcup_bet_flex
- Name: House Odds
- Desc: Come out a full gold ahead, lifetime, across your settled Vale Cup
  wagers.
- Renown: 0
- Trigger: predicate over persisted state, `vcupBetNet >= 10000` (copper).
  One-way unlock: net can fall back below without revoking it.
- Reward: none
- Hidden: yes (reveal on earn; the deed list should not advertise gambling)
- Steam: no
- Notes: OPTIONAL FOR ASSEMBLY REVIEW, cut freely. This is the single
  sanctioned bet flex: 0 Renown (never feeds the account score), hidden, and
  keyed to net profit rather than volume so it cannot be inched toward by
  simply wagering more; parimutuel pools mean colluders betting against each
  other just move copper between themselves minus everyone else's share.
  There are deliberately NO other deeds on `vcupBetWins/Losses/Net`: the
  catalog must not incentivize gambling volume.

## 2v2 Fiesta

### pvp_fiesta_first_bout
- Name: Party Crasher
- Desc: Fight a full 2v2 Fiesta bout, win or lose.
- Renown: 5
- Trigger: first `arenaEnd` with format `fiesta` delivered to this character
  (seated combatants only, so queue-and-quit never counts).
- Reward: none
- Hidden: no
- Steam: no
- Notes: Fiesta is unranked party play; nothing about it persists, so this
  and every deed below is an event trigger or a new deedStats counter.
  ASSEMBLY NOTE: the offline world can stage bouts against the practice bot
  harness (`src/sim/social/fiesta_bots.ts`, offline only); those play the
  real match logic and would count. Flagging rather than restricting: if
  assembly wants online-only Fiesta deeds, gate at the deed layer, not here.

### pvp_fiesta_first_win
- Name: Life of the Fiesta
- Desc: Win a 2v2 Fiesta bout.
- Renown: 10
- Trigger: first `arenaEnd` with format `fiesta` and `won === true`.
- Reward: none
- Hidden: no
- Steam: ACH_FIESTA_FIRST_WIN
- Notes: Unranked, one-time, low tier: a thrown bout buys what one honest
  bout buys. No Fiesta deed counts career wins (nothing persists to count
  against, and a win counter in an unranked bot-adjacent mode would be the
  textbook farm), so the mode's deeds are all moments and single-bout skill.

### pvp_fiesta_double
- Name: Double Trouble
- Desc: Score two Fiesta takedowns within four seconds.
- Renown: 10
- Trigger: the doublekill condition at the kill-credit site in
  `src/sim/social/fiesta.ts` (`now - lastKill.get(killerPid) <= 4`); use the
  sim-side condition, not the word cue, since the else-if chain can mask the
  `doublekill` flavor behind shutdown.
- Reward: none
- Hidden: no
- Steam: ACH_FIESTA_DOUBLE
- Notes: Feeding vector: a colluding enemy pair stands still and dies twice.
  Costs them the bout, pays one account 10 Renown once; honest brawling at
  the 15-takedown pace produces this constantly. Match-scoped skill moment,
  no volume dimension.

### pvp_fiesta_shutdown
- Name: Party Pooper
- Desc: Take down a Fiesta foe who is on a streak of three or more.
- Renown: 10
- Trigger: kill credit where the victim's streak was >= 3 at death (the
  `victimStreak >= 3` shutdown branch in fiesta.ts).
- Reward: none
- Hidden: no
- Steam: no
- Notes: Rewards ending a rampage, the definition of being a better teammate
  in this mode. Staging requires a colluder to first legitimately kill three
  times (or be fed three), then die on cue; the setup already hands the
  colluding side most of a lost bout. One-time 10.

### pvp_fiesta_full_build
- Name: Dressed for the Occasion
- Desc: Win a Fiesta bout with an augment locked in from all three waves.
- Renown: 10
- Trigger: `arenaEnd` format `fiesta`, `won === true`, and this character's
  `fiestaAugments.length === 3` at bout end (one pick per wave, silver, gold,
  prismatic; picks survive death and clear when the bout ends).
- Reward: none
- Hidden: no
- Steam: ACH_FIESTA_FULL_BUILD
- Notes: The match-scoped augment-variety deed: three picks is the structural
  maximum per bout (`FIESTA_TOTAL_WAVES = 3`), so the requirement cannot
  creep as the augment catalog grows. Requires the bout to survive to the
  third wave (about 108 s of active play) AND the win, so it is engagement
  plus outcome, not attendance. Colluders throwing the bout still have to
  play it long enough to open wave three.

### pvp_fiesta_powerups
- Name: One of Everything
- Desc: Grab each of the four ring power-ups at least once: Speed Demon,
  Colossus, Moon Boots, and Berserker.
- Renown: 10
- Trigger: lifetime coverage via a new deedStats bitmask over the pinned
  launch set {pow_speed_demon, pow_colossus, pow_moon_boots, pow_berserker},
  marked at the pickup site that emits `fiestaPowerup` for this character.
- Reward: none
- Hidden: no
- Steam: no
- Notes: The list is PINNED to the four launch power-ups so a future fifth
  never grows the requirement (rule 2's dynamic-meta clause). Spawns draw
  uniformly from four kinds every 16 s attempt window with up to three live
  at once, so coverage converges within a handful of bouts: variety, not a
  rare-drop lottery. Contested pickups (5 s telegraph, 2 yd grab) mean a
  colluder can concede grabs, saving you at most a few bouts of normal play.
  Which kinds spawn in a given bout is an RNG draw, but the uniform draw and
  multi-bout convergence put this on the catalog's effectively-deterministic
  standard (the col_full_creel bar): retry cost is minutes, not lottery odds.

### pvp_fiesta_five_kills
- Name: Carrying the Party
- Desc: Score five takedowns in a single Fiesta bout.
- Renown: 10
- Trigger: this character's per-bout kill tally reaches 5 (`f.kills` map at
  the kill-credit site); first team to 15 takedowns wins, so 5 is a third of
  the winning total personally delivered.
- Reward: none
- Hidden: no
- Steam: no
- Notes: The single-bout score-threshold deed, counted on personal outcomes
  (kill credit), never attendance. Feeding five deaths hands the feeding team
  a third of the enemy's win condition; one-time 10 Renown. Streak sprees are
  covered implicitly (five takedowns without dying passes streak 3), so no
  separate spree deed: doublekill, shutdown, and this cover the word-event
  space without overlap.

---

## Subtotals and skipped systems

- Deeds: 27 core + 1 optional 0-Renown flex (pvp_vcup_bet_flex) = 28 blocks.
- Renown: 405 total (arena 185, duels 10, Vale Cup 145, Fiesta 65; the flex
  adds 0).
- Titles: 2 (Gladiator, Boarball Legend).
- Steam: 12 of 12 quota.
- Skipped, and why:
  - Duel volume: nothing duel-related persists and duels are consensual, so
    any counter is a two-account farm; only the two one-shots above.
  - Protect Yumi (yumi3/yumi5): unranked, zero persisted state, and no
    per-player outcome counters to hang a fair deed on; revisit if a standing
    ever persists.
  - Fiesta career wins/kills: all Fiesta state is session-only; lifetime
    volume counters in an unranked mode with an offline bot harness would be
    farmable, so the mode gets moments and single-bout skill only.
  - Betting volume and winnings: deliberately excluded (one optional hidden
    0-Renown net-profit flex only); the catalog must not incentivize
    gambling.
  - Arena win volume above first win: rating bands resist win-trading
    (zero-sum Elo, gain decay, nearest-rating matchmaking); win counts do
    not.
