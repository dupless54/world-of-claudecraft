# Social, economy, and exploration deeds (soc_, exp_)

25 deeds, 240 Renown. Every trigger below is grounded in a real system on this
branch; source files are cited in Notes where the reference is non-obvious.

## Registries

- Proposed titles (2): "Magnate" (soc_market_magnate), "the Wayfarer"
  (exp_world_traveler).
- Proposed borders: none from this file.
- Steam (8): ACH_FIRST_PARTY, ACH_FULL_HOUSE, ACH_GUILD_JOINED,
  ACH_FIRST_TRADE, ACH_FIRST_SALE, ACH_MEET_BURSAR, ACH_WYRMS_HOARD,
  ACH_WORLD_TRAVELER.

## New deedStats counters this file introduces

None of the social or economy outcomes below are persisted today (trades,
mail, market sales, party joins, ground pickups are all fire-and-forget), so
these deeds define new `PlayerMeta.deedStats` lifetime counters, bumped at the
existing success sites and starting at zero for everyone:

| Counter | Bump site |
|---|---|
| `partiesJoined` | `src/sim/social/party.ts` partyAccept success (the accepter, and the inviter when the party is newly formed) |
| `fullPartyDungeonClears` | the dungeon clear-credit site (see dungeons-delves.md), when the credited player's party has exactly 5 members (PARTY_MAX, `src/sim/social/party.ts`) |
| `guildsFounded` | server observer on `server/social.ts` guildCreate success (server-assisted, see soc_guild_founded) |
| `tradesCompleted` | `src/sim/social/trade.ts` swap-commit site (the `tradeDone` emit), both parties |
| `marketSaleCopper` | `src/sim/market.ts` marketCollect, the copper actually collected (collection copper is exclusively sale proceeds; expired listings return items, never coin, so this counter is pure sales) |
| `mailAttachmentsSent` | `src/sim/mail/post_office.ts` mailSendResolved success when the letter carries coin or at least one item stack |
| `copperLooted` | `src/sim/loot/loot_roll.ts` coin-credit site (line that already bumps the runtime RewardCounters.lootCopper; that counter is the RL reward channel and is NOT persisted, hence the new deedStats twin) |
| `groundObjectsLooted` | `src/sim/interaction.ts` pickUpObject success |
| `bursarsMet` | flag set (value 1) when the interact path opens the bank at the NPC def id `bursar_fernando` specifically (`src/sim/interaction.ts`, banker arm) |
| `poisVisited` | persisted string set, key `zoneId:label` from `ZoneDef.pois`; stamped by a 1 Hz sim position sweep (within 20 yd of the poi point), deterministic, no rng |

Everything else below is a predicate over already-persisted state
(bank.purchasedSlots, gatheringProficiency, townFocus, server-stamped guild
membership) and therefore grants retroactively on world join.

---

## Party and social

### soc_first_party
- Name: Better Together
- Desc: Join a party with another player.
- Renown: 5
- Trigger: lifetime counter deedStats.partiesJoined >= 1
- Reward: none
- Hidden: no
- Steam: ACH_FIRST_PARTY
- Notes: Rule 6: counts the outcome (you are in a party), not the invite; a
  party requires a consenting invite plus accept (partyAccept,
  src/sim/social/party.ts), so it cannot be forced on anyone, and a one-time
  first is not farmable. Not retroactive (new counter).

### soc_full_house
- Name: Full House
- Desc: Clear a dungeon with a full party of five.
- Renown: 10
- Trigger: lifetime counter deedStats.fullPartyDungeonClears >= 1; bumped at
  the dungeon clear-credit site when party.members.length === 5 (PARTY_MAX)
- Reward: none
- Hidden: no
- Steam: ACH_FULL_HOUSE
- Notes: Cross-reference: the clear-credit site is the one the dgn_ deeds in
  dungeons-delves.md define; this deed adds only the five-member check. Any
  dungeon at any difficulty counts. Rule 6: satisfiable only by finishing the
  run as a full group, a strictly teamwork-positive outcome; carrying an AFK
  body still requires the other four to kill the final boss, which is the same
  effort bar as any dgn_ clear, and repeating it grants nothing (one-time).

### soc_guild_joined
- Name: Under One Banner
- Desc: Become a member of a guild.
- Renown: 5
- Trigger: predicate: server-stamped guild membership is non-empty
  (entity.guild, stamped at world join by the social layer)
- Reward: none
- Hidden: no
- Steam: ACH_GUILD_JOINED
- Notes: Server-assisted: guild membership lives in the social database
  (server/social.ts guildAccept, server/social_db.ts); the server stamps the
  guild name onto the player entity (server/game.ts, the wire `gd` field) and
  the sim evaluator reads that as a plain predicate, so the sim still decides
  the unlock. Effectively retroactive: every current guild member satisfies
  the predicate at next join. Offline sim: never satisfiable (no guilds
  offline), which is fine per the offline-sandbox model. Rule 6: joining needs
  an officer's invite plus your accept, an outcome with mutual consent;
  leaving and rejoining grants nothing (one-time).

### soc_guild_founded
- Name: Founder's Quill
- Desc: Found a guild of your own.
- Renown: 10
- Trigger: lifetime counter deedStats.guildsFounded >= 1
- Reward: none
- Hidden: no
- Steam: no
- Notes: Server-assisted (keep these few: this and soc_guild_joined are the
  only two): guildCreate resolves entirely in server/social.ts, so a server
  observer bumps the counter on create success and the sim evaluator grants
  from the counter, the character_deeds-observer pattern inverted at the input
  side. NOT retroactive: founder status is not recoverable from current state
  (a transferred leader is not the founder), so only post-launch founds count.
  Rule 6: founding is a solo, deliberate act; create-disband churn earns
  nothing past the first (one-time), and the name-reservation cost plus
  officer plumbing make it useless as spam.

## Trade and economy

### soc_first_trade
- Name: A Fair Exchange
- Desc: Complete a trade with another player.
- Renown: 5
- Trigger: lifetime counter deedStats.tradesCompleted >= 1
- Reward: none
- Hidden: no
- Steam: ACH_FIRST_TRADE
- Notes: Bumped for both parties at the swap-commit site in
  src/sim/social/trade.ts (where tradeDone is emitted), i.e. only when both
  players accepted and the goods actually moved. Rule 6: a completed trade is
  an outcome requiring both parties' accept; an empty-hands trade with a
  friend technically counts, but it is one-time so there is nothing to farm
  and nobody can be griefed into it (accept is required).

### soc_first_sale
- Name: Open for Business
- Desc: Collect the coin from your first World Market sale.
- Renown: 5
- Trigger: lifetime counter deedStats.marketSaleCopper >= 1
- Reward: none
- Hidden: no
- Steam: ACH_FIRST_SALE
- Notes: Counted at marketCollect (src/sim/market.ts), not at the buyer's
  purchase, because the seller can be offline when the sale happens (proceeds
  wait in their collection); collecting is always the seller acting on their
  own meta. House stock never counts: the Merchant's own listings pay no one.
  Rule 6: a sale requires a real buyer choosing to pay; the Merchant's 5% cut
  (MARKET_CUT) makes self-dealing through an alt a pure copper loss, and the
  deed is one-time regardless.

### soc_steady_custom
- Name: Steady Custom
- Desc: Collect a lifetime total of 10 gold from your World Market sales.
- Renown: 10
- Trigger: lifetime counter deedStats.marketSaleCopper >= 100000
- Reward: none
- Hidden: no
- Steam: no
- Notes: 1 gold = 10000 copper (src/sim/format_money.ts). Natural-play check:
  house-book prices for leveling gear run 15 to 29 silver, and player-crafted
  or delve-tier goods trade in gold, so 10g is a mid-journey seller, not a
  grind. Rule 6: wash-trading the counter burns 5% of every loop to the
  Merchant's cut, so it cannot be farmed profitably (the PvP win-trade rule
  applied to coin).

### soc_market_magnate
- Name: Market Magnate
- Desc: Collect a lifetime total of 100 gold from your World Market sales.
- Renown: 25
- Trigger: lifetime counter deedStats.marketSaleCopper >= 1000000
- Reward: title "Magnate"
- Hidden: no
- Steam: no
- Notes: The trader capstone; 100g sits well under the 500g single-listing
  ceiling (MARKET_MAX_PRICE) so an established crafter or delver reaches it
  through normal selling. Same anti-wash argument as soc_steady_custom: a
  wash to 100g destroys 5g of real coin for zero Renown past the one-time
  grant. Title on the marquee rung per rule 3.

### soc_by_ravens_wing
- Name: By Raven's Wing
- Desc: Send a Ravenpost letter carrying coin or a parcel.
- Renown: 5
- Trigger: lifetime counter deedStats.mailAttachmentsSent >= 1
- Reward: none
- Hidden: no
- Steam: no
- Notes: Bumped at the mailSendResolved success path
  (src/sim/mail/post_office.ts) only when the letter carries copper or at
  least one attached item stack (up to MAIL_MAX_ATTACHMENTS = 3); a bare note
  does not count, so the deed is a real goods-transfer outcome. Rule 6: the
  sender pays 30c postage and gives the goods away, the recipient's box can
  refuse (recipientBoxFull), and it is one-time, so it is neither farmable nor
  a spam vector.

### soc_room_for_more
- Name: Room for More
- Desc: Buy your first bank expansion.
- Renown: 5
- Trigger: predicate: bank.purchasedSlots >= 6 (BANK_EXPANSION_SLOTS)
- Reward: none
- Hidden: no
- Steam: no
- Notes: purchasedSlots is persisted per character (CharacterState.bank,
  src/sim/bank.ts bankBuySlots), so this grants retroactively to everyone who
  already expanded. Copper spent on expansions is destroyed (a gold sink), so
  there is nothing to shuffle back out.

### soc_gilded_strongbox
- Name: The Gilded Strongbox
- Desc: Purchase every bank expansion the bursars will sell you.
- Renown: 25
- Trigger: predicate: bank.purchasedSlots >= 72
- Reward: none
- Hidden: no
- Steam: no
- Notes: 72 = the full 12-entry BANK_EXPANSION_PRICES table (src/sim/bank.ts),
  about 241g of copper destroyed in total; the threshold is PINNED at the
  literal 72, so a future table extension is a new deed, never a raised bar on
  this one (rule 2: the score never decreases and requirements never grow).
  Bonus slots (server entitlements) deliberately do not count: they are
  granted, not earned in play. Named for the bank itself (Bursar Fernando's
  house, src/sim/content/zone1.ts).

### soc_meet_bursar
- Name: In Fernando We Trust
- Desc: Pay your respects to Bursar Fernando, keeper of the Gilded Strongbox
  in Eastbrook.
- Renown: 5
- Trigger: interaction: deedStats.bursarsMet flag, set when the interact path
  opens the bank at the NPC def id bursar_fernando
- Reward: none
- Hidden: no
- Steam: ACH_MEET_BURSAR
- Notes: Sanctioned easter egg (the Bursar Fernando precedent). The trigger
  site is the banker arm of the interact command (src/sim/interaction.ts,
  where the target NPC id is in ctx.bankerIds and emits the `bank` event),
  keyed to bursar_fernando specifically; his colleagues Petra Vell (Fenbridge)
  and Aldous Crane (Highwatch) send their regards but count for nothing. Not
  retroactive (interactions are not persisted today); he stands in the
  Eastbrook square, so the pilgrimage costs a new character two minutes.

## Wealth

### soc_pocket_money
- Name: Pocket Money
- Desc: Loot a lifetime total of 1 gold in coin.
- Renown: 5
- Trigger: lifetime counter deedStats.copperLooted >= 10000
- Reward: none
- Hidden: no
- Steam: no
- Notes: Counter concept already exists as the runtime, non-persisted
  RewardCounters.lootCopper (bumped in src/sim/loot/loot_roll.ts); this
  ladder persists a deedStats twin bumped at the same site. Looted coin only:
  quest rewards, vendoring, trades, and market proceeds do not count, so the
  ladder cannot be moved by shuffling money between pockets. Per the locked
  product decision there are NO net-worth deeds anywhere in the catalog
  (bank-shuffling would trivially game them); lifetime looted is monotone and
  outcome-based.

### soc_heavy_purse
- Name: Heavy Purse
- Desc: Loot a lifetime total of 10 gold in coin.
- Renown: 10
- Trigger: lifetime counter deedStats.copperLooted >= 100000
- Reward: none
- Hidden: no
- Steam: no
- Notes: Mid-journey by natural play across the level 1 to 20 arc.

### soc_wyrms_hoard
- Name: A Wyrm's Hoard
- Desc: Loot a lifetime total of 100 gold in coin.
- Renown: 25
- Trigger: lifetime counter deedStats.copperLooted >= 1000000
- Reward: none
- Hidden: no
- Steam: ACH_WYRMS_HOARD
- Notes: The wealth capstone, scaled against the game's real sinks (the full
  bank costs about 241g, the market lists to 500g), so a max-level character
  who runs dungeons and delves gets here without farming for the deed's own
  sake. Named for the Gravewyrm Sanctum (src/sim/content/zone3.ts pois).

## Town focus

### soc_civic_duty
- Name: Civic Duty
- Desc: Allocate your first town focus point.
- Renown: 5
- Trigger: predicate: persisted townFocus allocation has at least one point
  (sum of CharacterState.townFocus values >= 1)
- Reward: none
- Hidden: no
- Steam: no
- Notes: Verified persisted: townFocus is saved per character (sim.ts
  CharacterState.townFocus) and committed through
  professions/focus.ts setTownFocus, which requires standing in town and caps
  the budget at FOCUS_POINT_BUDGET = 10. Retroactive for anyone already
  focused. One deed only for this system: deeper focus play (tier bonuses,
  focused harvests) belongs to the professions deeds, not here.

## Exploration

### exp_long_road_north
- Name: The Long Road North
- Desc: Visit all three hub settlements: Eastbrook, Fenbridge, and Highwatch.
- Renown: 5
- Trigger: predicate over deedStats.poisVisited: contains
  eastbrook_vale:Eastbrook, mirefen_marsh:Fenbridge, and
  thornpeak_heights:Highwatch
- Reward: none
- Hidden: no
- Steam: no
- Notes: The early breadcrumb rung of the wayfarer ladder; the three hubs are
  ZoneDef.pois entries and sit on the main causeway (ZONE2_ROADS/ZONE3_ROADS),
  so this is a pure travel outcome any level can finish. Uses the same
  poisVisited stamp as the wayfarer deeds. Not retroactive (visits are not
  persisted today; the walk is cheap).

### exp_vale_wayfarer
- Name: Wayfarer of the Vale
- Desc: Visit all eleven named places of Eastbrook Vale.
- Renown: 10
- Trigger: predicate over deedStats.poisVisited: all 11 eastbrook_vale POI
  labels, PINNED as of v1: Eastbrook, Wolf Run, Boar Meadow, Mirror Lake,
  Sableweb, Copper Dig, Bandit Camp, Fallen Chapel, Reliquary Hill,
  Brightwood Glade, The Sowfield
- Reward: none
- Hidden: no
- Steam: no
- Notes: Source: ZONE1_ZONE.pois (src/sim/content/zone1.ts). The list is
  pinned in the deed def, not read live from ZONES, so adding a POI later
  never grows an earned deed's requirement (rule 2); a future POI belongs to a
  new deed. Cross-reference: required by chr_vale_chapter_i (chronicles.md),
  which absorbed the former chr_vale_landmarks twin in the assembly duplicate
  sweep; this file owns the single POI-visit mechanism (the poisVisited set,
  within 20 yd, 1 Hz sweep). Camps are intentionally covered through the
  named POIs rather than raw CAMPS entries: camps are unnamed mob spawn
  records (CampDef has no label), while every camp cluster of note sits under
  a named POI.

### exp_marsh_wayfarer
- Name: Wayfarer of the Marsh
- Desc: Visit all eight named places of Mirefen Marsh.
- Renown: 10
- Trigger: predicate over deedStats.poisVisited: all 8 mirefen_marsh POI
  labels, PINNED as of v1: Fenbridge, Prowler Reeds, Deepfen Shallows, Widow
  Thicket, Drowned Chapel, Troll Mounds, Gravecaller Encampment, The Sunken
  Bastion
- Reward: none
- Hidden: no
- Steam: no
- Notes: Source: ZONE2_ZONE.pois (src/sim/content/zone2.ts). Same pinned-list
  rule as exp_vale_wayfarer. Cross-reference: required by chr_marsh_chapter_i
  (chronicles.md), which absorbed the former chr_marsh_landmarks twin in the
  assembly duplicate sweep.

### exp_peaks_wayfarer
- Name: Wayfarer of the Heights
- Desc: Visit all ten named places of Thornpeak Heights.
- Renown: 10
- Trigger: predicate over deedStats.poisVisited: all 10 thornpeak_heights POI
  labels, PINNED as of v1: Highwatch, Stalker Ridge, Deeprock Burrows, Ogre
  Foothills, Drogmar's War-Camp, Stormcrag, The Glimmermere, Wyrmcult Tents,
  Revenant Fields, Gravewyrm Sanctum
- Reward: none
- Hidden: no
- Steam: no
- Notes: Source: ZONE3_ZONE.pois (src/sim/content/zone3.ts). Same pinned-list
  rule. Cross-reference: required by chr_peaks_chapter_i (chronicles.md),
  which absorbed the former chr_peaks_landmarks twin in the assembly
  duplicate sweep.
  Zone 3 mob levels run to 20, but visiting is a travel outcome: a careful
  low-level runner can earn it, which is classic exploration at its best.

### exp_world_traveler
- Name: World Traveler
- Desc: Earn the wayfarer deed of all three zones.
- Renown: 25
- Trigger: meta: exp_vale_wayfarer, exp_marsh_wayfarer, exp_peaks_wayfarer
- Reward: title "the Wayfarer"
- Hidden: no
- Steam: ACH_WORLD_TRAVELER
- Notes: A FIXED meta over three pinned deed ids, not a dynamic "all zones
  ever" meta, so it keeps its Renown under rule 2; when a fourth zone ships,
  its wayfarer deed joins a new, larger meta instead of growing this one. The
  category's flagship title.

### exp_something_shiny
- Name: Something Shiny
- Desc: Pick up a sparkling object from the ground.
- Renown: 5
- Trigger: lifetime counter deedStats.groundObjectsLooted >= 1
- Reward: none
- Hidden: no
- Steam: no
- Notes: GROUND_OBJECTS (src/sim/data.ts, merged from the zone content files;
  e.g. the Stolen Supply Crates at the Bandit Camp) are the sparkle
  interactables handled by pickUpObject (src/sim/interaction.ts); the counter
  bumps on pickup success only (capacity-refused attempts do not count).

### exp_first_ore
- Name: Strike the Earth
- Desc: Harvest your first ore node.
- Renown: 5
- Trigger: predicate: gatheringProficiency.mining >= 1
- Reward: none
- Hidden: no
- Steam: no
- Notes: Every successful node harvest grants exactly one proficiency point in
  the node's profession (resolveHarvest, src/sim/professions/gathering.ts),
  and gatheringProficiency is persisted (CharacterState), so proficiency >= 1
  is precisely "has harvested at least once" and grants retroactively. Ore
  nodes spawn from level-1 range in Eastbrook Vale
  (src/sim/content/gather_nodes.ts).

### exp_first_timber
- Name: Timber!
- Desc: Harvest your first wood node.
- Renown: 5
- Trigger: predicate: gatheringProficiency.logging >= 1
- Reward: none
- Hidden: no
- Steam: no
- Notes: Same mechanism and retro behavior as exp_first_ore; wood nodes map to
  the logging profession (NODE_HARVEST_TABLE,
  src/sim/professions/gathering.ts; GATHERING_PROFESSION_IDS in
  src/sim/content/professions.ts).

### exp_first_herb
- Name: Green Thumb
- Desc: Harvest your first herb node.
- Renown: 5
- Trigger: predicate: gatheringProficiency.herbalism >= 1
- Reward: none
- Hidden: no
- Steam: no
- Notes: Same mechanism and retro behavior as exp_first_ore; the three
  first-gather deeds cover the full GatherNodeType set (ore, wood, herb), one
  per gathering profession, so the set never silently lags a new profession
  (a fourth profession ships with its own deed).

---

## Skipped items and why

- Guild calendar: the only verifiable trigger is the server-side SocialService
  outcome (calendarResult 'created', server/social.ts), and event CREATION is
  officer-gated, so most players could never earn a creation deed; event
  ATTENDANCE has no tracked outcome at all and would be a pure
  attendance/login deed, which rule 6 forbids. Skipped entirely rather than
  shipped as a rank-gated or attendance-shaped deed.
- Net-worth / current-gold deeds: excluded by design (bank and mail shuffling
  trivially games a balance snapshot); the wealth ladder counts lifetime
  looted coin instead, which is monotone and outcome-based.
- Chat/emote/friend-list firsts: attempts, not outcomes (rule 6), and trivially
  spammable; nothing of value is measured. Duels and arena belong to
  pvp-sport.md.
- Raw CAMPS coverage (src/sim/data.ts CAMPS): camp entries are unnamed spawn
  records with no player-facing identity; exploration runs on the named
  ZoneDef.pois instead, which cover the camp clusters players actually
  recognize (Wolf Run, Bandit Camp, Troll Mounds, and so on).
- Temple content (TEMPLE_CAMPS/TEMPLE_NPCS, src/sim/content/temple.ts): not a
  ZoneDef with pois; its deeds belong to the category that owns its
  encounters, not to zone exploration.
- Meet-all-three-bursars: considered and dropped to keep the easter egg sharp;
  soc_meet_bursar honors the sanctioned NPC, and a three-bank tour adds travel
  busywork without a new outcome.
