// Known deviations ledger for the API pipeline re-architecture (Phase 3 spine).
//
// This is the CHARACTERIZATION counterpart to the surface inventory: where the
// inventory records WHAT routes exist and the goldens record WHAT they emit
// today, this ledger records the places where today's behavior is a DELIBERATE
// deviation, either one a later phase intentionally changes (introducedInPhase
// names the phase that lands the change) or one preserved by design forever
// (introducedInPhase null). It changes no runtime behavior; it is a planning and
// freshness artifact so the later phases land their changes against a written
// baseline instead of an unstated assumption.
//
// Anchoring rule: every entry's `routes` strings are exact paths that MUST exist
// in SURFACE_INVENTORY (the test cross-checks this), and every `goldenFixtures`
// path MUST point at a fixture that exists on disk (the test cross-checks that
// too). Entries never anchor on line numbers.
//
// Stable-code rule: this ledger CHARACTERIZES the codes/strings the server emits
// today. It does not add, rename, or localize any error code or catalog entry
// (Phase 7/22 own that). The `currentBehavior` text describes what exists.

// Named deviation ids (no scattered inline strings; one source of truth, the
// inventory and tests refer to these constants).
export const DEVIATION_ID = {
  perfReport200NotThrottle: 'perf-report-200-not-429-on-throttle',
  perfReportSitePresence405OkFalse: 'perf-report-and-site-presence-405-ok-false',
  registerLoginAntiEnumeration: 'register-login-anti-enumeration',
  authBodyValidationRemap: 'auth-body-validation-remap-login-challenge',
  authNullBodyCoercion: 'auth-null-body-coercion',
  bolaOwned404: 'bola-owned-404',
  planned405BeforeAuth: 'planned-405-before-auth',
  validationStatusRemap: 'validation-status-remap-422-400-413',
  statusNameListTrim: 'status-name-list-trim',
  realmsSearchAuthzGapClose: 'realms-search-authz-gap-close',
  newLimiterCharacterMutations: 'new-limiter-character-mutations',
  characterBodyValidationRemap: 'character-body-validation-remap',
  characterIdParamDecode: 'character-id-param-decode-422',
  companionTokenMethodFan: 'companion-token-method-fan-405',
  accountBodyValidationRemap: 'account-body-validation-remap',
  newLimiterReportsCreate: 'new-limiter-reports-create',
  newLimiterDiscord: 'new-limiter-discord',
  discordCallbackHtmlNotRedirect: 'discord-callback-html-not-redirect',
  swagClaimOrphanUnreachable: 'swag-claim-orphan-unreachable',
} as const;
export type DeviationId = (typeof DEVIATION_ID)[keyof typeof DEVIATION_ID];

export interface KnownDeviation {
  // Kebab-style unique id (a value of DEVIATION_ID).
  readonly id: string;
  // Route paths the deviation touches. Each MUST exist as a `path` in
  // SURFACE_INVENTORY (the test hard-fails on an unknown route).
  readonly routes: readonly string[];
  // What the server does TODAY (the characterized current contract).
  readonly currentBehavior: string;
  // What is intended: the preserved behavior (for a by-design deviation) or the
  // target the named phase lands.
  readonly intendedBehavior: string;
  // The phase (4 to 25) that intentionally changes this behavior, or null for a
  // by-design deviation that is preserved forever.
  readonly introducedInPhase: number | null;
  // Why the deviation exists / why it is preserved or changed.
  readonly reason: string;
  // Optional golden fixtures (paths relative to the repo root) that demonstrate
  // the current behavior. Only fixtures that actually exist are listed; the test
  // asserts each one is present on disk.
  readonly goldenFixtures?: readonly string[];
}

export const KNOWN_DEVIATIONS: readonly KnownDeviation[] = [
  // --- By-design deviations (preserved forever, introducedInPhase null) --------
  {
    id: DEVIATION_ID.perfReport200NotThrottle,
    routes: ['/api/perf-report'],
    currentBehavior:
      'POST /api/perf-report answers 200 { ok: true } even when the perf-report ' +
      'limiter is throttling; the throttle result is swallowed and the beacon ' +
      'never observes a 429.',
    intendedBehavior:
      'Preserved: a throttled perf beacon is silently accepted with a 200, never ' +
      'a 429 or an error the client could surface or retry on.',
    introducedInPhase: null,
    reason:
      'The client perf beacon must never see a 429 (a throttled beacon should be ' +
      'dropped quietly with a 200, not retried or logged as an error).',
  },
  {
    id: DEVIATION_ID.perfReportSitePresence405OkFalse,
    routes: ['/api/perf-report', '/api/site-presence'],
    currentBehavior:
      'A non-POST request to either heartbeat endpoint answers 405 with the ' +
      'legacy { ok: false } body shape, not the { error } problem shape the rest ' +
      'of the surface uses.',
    intendedBehavior:
      'Preserved: these two beacon endpoints keep their method ownership and the ' +
      'bare ok-false 405 shape (the 4th content-type contract case).',
    introducedInPhase: null,
    reason:
      'This is the 4th content-type contract case (LEGACY_OKFALSE_405): the ' +
      'perf-report and site-presence heartbeats keep their legacy ok-shape and ' +
      'POST-only method ownership.',
    goldenFixtures: ['tests/server/fixtures/main/site_presence_get_405.json'],
  },
  {
    id: DEVIATION_ID.registerLoginAntiEnumeration,
    routes: ['/api/register', '/api/login'],
    currentBehavior:
      'POST /api/register answers 409 on a taken username and POST /api/login ' +
      'answers 401 on bad credentials, deliberately not revealing whether a given ' +
      'account exists.',
    intendedBehavior:
      'Preserved: the 409 (register conflict) and 401 (login failure) stay ' +
      'anti-enumeration safe (unknown-vs-bad credentials stay indistinguishable).',
    introducedInPhase: null,
    reason:
      'Registration conflict (409) and login failure (401) stay intentionally ' +
      'indistinguishable so an attacker cannot enumerate which usernames or ' +
      'emails exist.',
    goldenFixtures: ['tests/server/fixtures/main/login_post_empty_401.json'],
  },
  {
    id: DEVIATION_ID.bolaOwned404,
    routes: [
      '/api/characters/:id/sheet',
      '/api/characters/:id/standing',
      '/api/characters/:id',
      '/api/characters/:id/rename',
      '/api/characters/:id/takeover',
    ],
    currentBehavior:
      'An owner-scoped :id read or mutation for a character the caller does not ' +
      'own answers 404 (not 403), so a caller cannot tell "exists but not yours" ' +
      'apart from "does not exist".',
    intendedBehavior:
      'Preserved through Phase 12: the owner-scope guard keeps answering 404 ' +
      '(anti-enumeration); it is NOT changed to 403.',
    introducedInPhase: null,
    reason:
      'Owner-scoped object reads deny a non-owned id with 404 not 403 to avoid ' +
      'leaking the existence of another player character (BOLA anti-enumeration); ' +
      'Phase 12 keeps it.',
  },
  {
    id: DEVIATION_ID.discordCallbackHtmlNotRedirect,
    routes: ['/api/auth/discord/callback'],
    currentBehavior:
      'GET /api/auth/discord/callback answers text/html (a self-posting bounce ' +
      'page that does window.opener.postMessage then location.replace), not a ' +
      '302 redirect, on both the success and error paths.',
    intendedBehavior:
      'Preserved: the OAuth popup flow needs an HTML bounce to postMessage the ' +
      'opener window and close the popup, so it is intentionally not a bare 302 ' +
      '(the REDIRECT content class stays unused).',
    introducedInPhase: null,
    reason:
      'The Discord OAuth popup completes by postMessaging the opener and closing ' +
      'the popup; a 302 cannot do that, so the HTML-not-302 shape is by design.',
    goldenFixtures: ['tests/server/fixtures/main/discord_callback_error_bounce.json'],
  },

  // --- Phase-scheduled deviations (introducedInPhase names the change) ---------
  // NOTE: authRateLimitDashToComma (introducedInPhase 11) was RETIRED in Phase 13.
  // Phase 11 served register/login through the new pipeline with a COMMA where the
  // legacy ladder used an em dash (the no-em-dash code invariant forbids a U+2014
  // literal in new code), a matcher-safe divergence the client prose-matcher never
  // saw (it keys on the "too many attempts" / "too many failed attempts" prefix,
  // before the punctuation). Phase 13 swapped the four legacy handleApi rate-limit
  // 429 strings in server/main.ts to the same comma, so the legacy and migrated
  // bodies are now byte-identical and the divergence no longer exists.
  {
    id: DEVIATION_ID.authBodyValidationRemap,
    routes: ['/api/login', '/api/native-attestation/challenge'],
    currentBehavior:
      'On the legacy handleApi ladder, POST /api/login and POST ' +
      '/api/native-attestation/challenge parse the body with readBody, whose reject on ' +
      "malformed JSON or an over-cap body falls to handleApi's outer catch and answers " +
      '500 { error: "internal error" } (application/json); an unexpected handler throw ' +
      'answers the same generic 500.',
    intendedBehavior:
      'Phase 11 serves these routes through the new pipeline, which parses the body with ' +
      'the Phase 8 withBody middleware and surfaces errors through the Phase 7 RFC 9457 ' +
      'boundary (withErrors): malformed JSON now answers 400 (json.malformed), an over-cap ' +
      'body answers 413 (body.too_large), and an unexpected throw answers 500 ' +
      '(internal.error), all as application/problem+json. The 400/413 status remap mirrors ' +
      'what validationStatusRemap already documents for /api/register (so register is not ' +
      'repeated here); Phase 11 realizes it for login and challenge too. The problem+json ' +
      'body shape (vs the legacy { error } shape) is the systemic Phase 7/8 error-model ' +
      'boundary shared by every migrated route, leak-free (the 500 detail is a static ' +
      'generic sentence; the original error goes only to the logger); Phase 22 wires the ' +
      'client code-matcher for these bodies.',
    introducedInPhase: 11,
    reason:
      'The migrated routes parse the body via withBody (400 malformed / 413 over-cap) ' +
      'instead of the legacy readBody-reject to outer-catch generic 500, a strictly more ' +
      'correct and uniform status mapping. These framework-error paths are NOT exercised ' +
      'by the db-free parity corpus (which replays valid bodies only), so the divergence ' +
      "is documented here rather than caught by the harness. register's equivalent is " +
      'tracked by validationStatusRemap (whose Phase 7 attribution is the pre-existing ' +
      'error-model framing; the per-route realization lands as each route migrates).',
  },
  {
    id: DEVIATION_ID.authNullBodyCoercion,
    routes: ['/api/register', '/api/login', '/api/native-attestation/challenge'],
    currentBehavior:
      'A literal JSON `null` request body (well-formed JSON, so readBody resolves it to ' +
      '`null` rather than {}) is dereferenced by the legacy handleApi arms: register reads ' +
      'null.username, login reads null.username / null.password, and the challenge arm reads ' +
      'null.action, each throwing a TypeError that falls to handleApi outer catch and answers ' +
      '500 { error: "internal error" }.',
    intendedBehavior:
      'Phase 11 serves these routes through the new pipeline, where withBody parses the `null` ' +
      'without throwing (null is valid JSON, so this is NOT the malformed-JSON path) and the ' +
      'handlers plus the turnstile gate coerce it away with `ctx.body ?? {}` = {}. So register ' +
      'answers 400 (username shape), login answers 401 (invalid credentials), and the challenge ' +
      'answers 200 (default action "auth"), all non-token responses. Not covered by ' +
      'authBodyValidationRemap (malformed-JSON / over-cap only) and not exercised by the ' +
      'valid-object-body parity corpus. The divergence becomes the real behavior at the Phase ' +
      '25 flag flip / ladder deletion.',
    introducedInPhase: 11,
    reason:
      'Byte-for-byte parity would require re-crashing on a `null` body (a legacy 500 from an ' +
      'unguarded null dereference); the migrated `ctx.body ?? {}` coercion is strictly safer ' +
      'and yields a normal 400 / 401 / 200 for a degenerate input no real client sends. ' +
      'Documented rather than changed, since both outcomes are non-token responses and the ' +
      'coercion is an improvement.',
  },
  {
    id: DEVIATION_ID.planned405BeforeAuth,
    routes: ['/api/register', '/api/me/characters'],
    currentBehavior:
      'A known path requested with the wrong method does not get a uniform 405 ' +
      'before auth today: it either falls through to the 404 unknown-endpoint arm ' +
      'or hits the auth gate first (so a wrong method on an authed route can ' +
      'answer 401 before any 405).',
    intendedBehavior:
      'Phase 4 table router returns 405 (method not allowed) for a known path ' +
      'plus an unsupported method, decided before the auth gate runs.',
    introducedInPhase: 4,
    reason:
      'The Phase 4 router centralizes method dispatch so a known path with an ' +
      'unsupported method returns 405 before auth, instead of today 404 or 401.',
    goldenFixtures: [
      'tests/server/fixtures/main/register_get_wrong_method_404.json',
      'tests/server/fixtures/main/me_characters_post_wrong_method_404.json',
    ],
  },
  {
    id: DEVIATION_ID.validationStatusRemap,
    routes: ['/api/register', '/api/reports', '/api/bug-reports'],
    currentBehavior:
      'A well-formed but invalid body answers 400, malformed JSON answers 500, ' +
      'and an over-cap body answers 413, inconsistently across the validating ' +
      'routes.',
    intendedBehavior:
      'Phase 7 remaps to 422 (well-formed but semantically invalid), 400 ' +
      '(malformed JSON), and 413 (over the byte cap), uniformly.',
    introducedInPhase: 7,
    reason:
      'Phase 7 unifies request-validation status codes (422 for semantically ' +
      'invalid, 400 for malformed JSON, 413 for over the byte cap); today these ' +
      'are 400, 500, and 413.',
    goldenFixtures: ['tests/server/fixtures/main/register_post_empty_400.json'],
  },
  {
    id: DEVIATION_ID.statusNameListTrim,
    routes: ['/api/status'],
    currentBehavior:
      'GET /api/status returns a names[] array of online player names alongside ' + 'the counts.',
    intendedBehavior:
      'Phase 10 trims the names[] list out of the public status payload (counts only).',
    introducedInPhase: 10,
    reason:
      'The public status endpoint currently exposes a names[] list of online ' +
      'players; Phase 10 trims it to counts only.',
    goldenFixtures: ['tests/server/fixtures/main/status_get.json'],
  },
  {
    id: DEVIATION_ID.realmsSearchAuthzGapClose,
    routes: ['/api/realms', '/api/search'],
    currentBehavior:
      'GET /api/realms treats a present-but-invalid bearer token the same as no ' +
      'token (silently anonymous, empty counts), never validating it; GET ' +
      '/api/search requires a token and answers 401 to any request without one.',
    intendedBehavior:
      'Phase 10 applies the anonymous-friendly bearer resolver to both: a request ' +
      'with NO token still serves (realms with empty counts, search with results), ' +
      'but a request that PRESENTS a token has it validated (an invalid token is ' +
      'rejected 401 auth.token_invalid) and moderation-gated (a banned/suspended ' +
      'account is rejected 403, which the legacy bearerAccount did not check). ' +
      'Search additionally becomes anonymous-friendly (a missing token no longer ' +
      '401s) and, being now an anonymous DB-hitting read, is rate-limited in-handler ' +
      'with the same publicReadRateLimited per-IP budget the public sheet uses.',
    introducedInPhase: 10,
    reason:
      'Both routes had an authz gap: realms never validated a present token, and ' +
      "search's token requirement was inconsistent with the rest of the public-read " +
      'surface. Phase 10 closes the gap by validating a present token while keeping ' +
      'the no-token path serving.',
    goldenFixtures: [
      'tests/server/fixtures/main/realms_get_noauth.json',
      'tests/server/fixtures/main/search_get_noauth_401.json',
    ],
  },
  {
    id: DEVIATION_ID.newLimiterCharacterMutations,
    routes: [
      '/api/characters',
      '/api/characters/:id/rename',
      '/api/characters/:id',
      '/api/characters/:id/takeover',
    ],
    currentBehavior:
      'Character create, rename, delete, and takeover have no dedicated per-action ' +
      'limiter today (they are gated only by the full session).',
    intendedBehavior:
      'Phase 12 adds new per-action limiters on character create, rename, delete, ' +
      'and takeover.',
    introducedInPhase: 12,
    reason:
      'NEW per-action limiters on character mutations (create, rename, delete, ' +
      'takeover) land in Phase 12; today these mutations have no dedicated limiter.',
  },
  {
    id: DEVIATION_ID.characterBodyValidationRemap,
    routes: ['/api/characters', '/api/characters/:id/rename', '/api/characters/:id'],
    currentBehavior:
      'On the legacy handleApi ladder, POST /api/characters, POST /api/characters/:id/rename, ' +
      'and DELETE /api/characters/:id read the body with readBody, whose reject on malformed ' +
      'JSON or an over-cap body falls to handleApi outer catch and answers 500 { error: ' +
      '"internal error" }; a literal JSON null body (valid JSON, so readBody resolves it to ' +
      'null) is dereferenced (null.name / null.class), throwing a TypeError that falls to the ' +
      'same generic 500.',
    intendedBehavior:
      'Phase 12 serves these routes through the new pipeline, which parses the body with the ' +
      'Phase 8 withBody middleware and surfaces framework errors through the Phase 7 RFC 9457 ' +
      'boundary (withErrors): malformed JSON answers 400 (json.malformed), an over-cap body ' +
      'answers 413 (body.too_large), both as application/problem+json; and a literal JSON null ' +
      'body is coerced away with `ctx.body ?? {}` = {}, so create answers 400 (name invalid), ' +
      'rename answers 400 (name invalid), and delete answers 400 (confirmation required). This ' +
      'mirrors the Phase 11 authBodyValidationRemap + authNullBodyCoercion for the auth POST ' +
      'routes; the client code-matcher for these problem+json bodies is Phase 22. Not exercised ' +
      'by the valid-body parity corpus, so documented here rather than caught by the harness.',
    introducedInPhase: 12,
    reason:
      'The migrated character write routes parse the body via withBody (400 malformed / 413 ' +
      'over-cap) and coerce a null body, instead of the legacy readBody-reject / null-deref to a ' +
      'generic 500, a strictly more correct and uniform mapping shared by every withBody POST ' +
      'route (the systemic Phase 7/8 error-model boundary). These framework-error paths are not ' +
      'in the db-free parity corpus (which replays valid bodies only), so the divergence is ' +
      'documented, not harness-caught. A RELATED ordering divergence on POST /api/characters/:id/' +
      'rename: the migrated route runs requireOwnedCharacter (ownership -> 404) as middleware ' +
      'BEFORE the handler validates the name, whereas the legacy arm validates the name (-> 400) ' +
      'before getCharacter. So a request with an INVALID name AND a non-owned/absent :id answers ' +
      '404 on the new path vs 400 on the legacy path. Security-neutral-to-positive (ownership-' +
      'first leaks nothing about name validity to a non-owner, the deny-by-default BOLA posture); ' +
      'no golden fixture exercises the non-owned + invalid-name shape, so it is documented here ' +
      'rather than harness-caught.',
  },
  {
    id: DEVIATION_ID.characterIdParamDecode,
    routes: [
      '/api/characters/:id/sheet',
      '/api/characters/:id/standing',
      '/api/characters/:id/rename',
      '/api/characters/:id/takeover',
      '/api/characters/:id',
    ],
    currentBehavior:
      'On the legacy handleApi ladder the owner :id arms gate on \\d+ route regexes ' +
      '(ownerSheetMatch / standingMatch / renameMatch / takeoverMatch / delMatch), so a ' +
      'non-numeric :id (e.g. "abc", "1.5") matches no character arm and falls through to ' +
      'the 404 unknown-endpoint arm without the bearer ever being read; a numeric-but-non-' +
      'positive :id ("0") matches \\d+, reaches the account-scoped getCharacter(accountId, ' +
      '0) which misses, and answers the legacy 404 body ("character not found" for sheet / ' +
      'standing / rename, "not found" for takeover / delete).',
    intendedBehavior:
      'Phase 12 serves these routes through the new pipeline, where requireOwned decodes ' +
      ':id with num({ int: true, min: 1 }) BEFORE any DB call, so a non-numeric OR non-' +
      'positive :id is rejected 422 (validation.failed, application/problem+json) for an ' +
      'authenticated caller; because the auth guard (activeGuard / readGuard) runs before ' +
      'the decode, an UNauthenticated bad-:id request short-circuits 401 ({ error: "not ' +
      'authenticated" }) first. This is NaN-safe and strictly more correct (ids are 1-based ' +
      'bigserial, so 0 / negative / non-numeric are never valid). The 422 / 401 (new) vs 404 ' +
      '(legacy) shape is not exercised by the numeric-id parity corpus, so it is documented ' +
      'here rather than caught by the harness; the client code-matcher for the 422 problem+' +
      'json body is Phase 22, and the divergence becomes the real behavior at the Phase 25 ' +
      'flag flip / ladder deletion.',
    introducedInPhase: 12,
    reason:
      'The migrated :id routes reject a malformed or non-positive id at the num() decoder ' +
      '(422), and an unauthenticated caller 401s at the auth guard first, instead of the ' +
      'legacy 404 fall-through / account-scoped miss. A strictly more correct, NaN-safe ' +
      'mapping for a degenerate input no real client sends (ids come from the server-issued ' +
      'numeric character list); unit-tested in require_owned.test.ts (the badIds cases), not ' +
      'in the numeric-only parity corpus, so documented here rather than harness-caught. ' +
      'Sibling to characterBodyValidationRemap (same phase and routes, same harness-invisible ' +
      'rationale).',
  },
  {
    id: DEVIATION_ID.companionTokenMethodFan,
    routes: ['/api/account/companion-token'],
    currentBehavior:
      'The legacy handleApi companion-token arm is a single method-agnostic ' +
      '`url === "/api/account/companion-token"` block with NO top-level method guard: ' +
      'it resolves bearerActiveAccount FIRST, then fans POST (create), GET (list), and ' +
      'DELETE (revoke) inside. An UNsupported method (e.g. PUT) that presents a valid ' +
      'full-session bearer passes the auth gate and then falls through all three inner ' +
      'branches to the 404 unknown-endpoint arm; the same method WITHOUT a bearer answers ' +
      '401 at the auth gate first.',
    intendedBehavior:
      'Phase 13 registers the companion-token path as THREE method-specific RouteDefs ' +
      '(POST create, GET list, DELETE revoke). The Phase 4 table router answers a known ' +
      'path plus an unsupported method with 405 (method not allowed) and an Allow header, ' +
      'decided BEFORE the auth guard runs. The registry RESOLVES an unsupported method to ' +
      'methodNotAllowed (405 + Allow) for this path, but the Phase 9 dispatcher DELEGATES a ' +
      'non-matched resolve to the legacy handleApi ladder, so TODAY a wrong-method companion ' +
      'request still gets the legacy 404 (authenticated) / 401 (unauthenticated); the 405 + ' +
      'Allow becomes the served behavior only at the Phase 25 ladder deletion (when the ' +
      'dispatcher serves methodNotAllowed itself). Same framing as planned405BeforeAuth.',
    introducedInPhase: 13,
    reason:
      'The companion-token block fans methods after auth with no top-level method guard; ' +
      'the migrated three-RouteDef form inherits the systemic planned-405-before-auth ' +
      'behavior (a known path plus an unsupported method is 405 + Allow, decided before ' +
      'auth). Sibling to planned405BeforeAuth for a specific method-fan arm. Not exercised ' +
      'by the parity corpus (no wrong-method companion-token fixture), so documented here ' +
      'rather than harness-caught; the divergence becomes the real behavior at the Phase 25 ' +
      'flag flip / ladder deletion.',
  },
  {
    id: DEVIATION_ID.accountBodyValidationRemap,
    routes: [
      '/api/account/password',
      '/api/account/deactivate',
      '/api/account/companion-token',
      '/api/account/email/change',
      '/api/account/marketing',
      '/api/account/2fa/setup',
      '/api/account/2fa/enable',
      '/api/account/2fa/disable',
    ],
    currentBehavior:
      'The account-portal handlers self-read their request body with readBody INSIDE the ' +
      'migrated handler (the shared handleAccount* domain function for password / deactivate ' +
      '/ email-change / marketing / 2fa, or the companion create/revoke route handler ' +
      'directly). On the legacy handleApi ladder, a malformed ' +
      'JSON body or an over-cap body makes readBody reject, and the reject falls to ' +
      'handleApi\'s outer catch, which answers 500 { error: "internal error" } ' +
      '(application/json); a literal JSON null body (valid JSON) is dereferenced ' +
      '(null.username / null.optIn / ...), throwing a TypeError that falls to the same ' +
      'generic 500.',
    intendedBehavior:
      'Phase 13 serves these routes through the new pipeline. The migrated handlers call ' +
      'the SAME domain functions UNCHANGED (they self-read the body, so NO withBody ' +
      'middleware is composed and there is NO 400/413 status remap: a malformed or over-cap ' +
      'body still answers 500, and a null body still throws to 500). The ONLY divergence is ' +
      'the 500 BODY SHAPE: the throw propagates to the Phase 8 withErrors boundary and ' +
      'serializes as 500 application/problem+json (internal.error) instead of the legacy ' +
      '500 { error: "internal error" }. Leak-free (the 500 detail is a static sentence; the ' +
      'original error goes only to the logger). The client code-matcher for the problem+json ' +
      'body is Phase 22; the divergence becomes the real behavior at the Phase 25 flag flip.',
    introducedInPhase: 13,
    reason:
      'The migrated account write handlers surface an unexpected throw (malformed / over-cap ' +
      '/ null body) through the shared Phase 7/8 error-model boundary as 500 problem+json ' +
      'instead of the legacy outer-catch 500 { error }. Same 500 STATUS, different body ' +
      'shape; there is no status remap because these handlers self-read without withBody. ' +
      'These framework-error paths are NOT exercised by the db-free parity corpus (which ' +
      'replays valid bodies only), so the divergence is documented here rather than ' +
      'harness-caught. Sibling to authBodyValidationRemap / characterBodyValidationRemap ' +
      '(same systemic boundary; those add a 400/413 remap because they use withBody, this ' +
      'one does not).',
  },
  {
    id: DEVIATION_ID.newLimiterReportsCreate,
    routes: ['/api/reports'],
    currentBehavior:
      'POST /api/reports has no dedicated reports.create limiter today (it is ' +
      'gated only by the full session).',
    intendedBehavior: 'Phase 15 adds a reports.create limiter.',
    introducedInPhase: 15,
    reason:
      'A NEW reports.create limiter lands in Phase 15; today report creation has ' +
      'no dedicated limiter.',
  },
  {
    id: DEVIATION_ID.newLimiterDiscord,
    routes: [
      '/api/auth/discord/start',
      '/api/auth/discord/callback',
      '/api/auth/discord/login/new',
      '/api/auth/discord/login/link',
      '/api/discord',
    ],
    currentBehavior:
      'The discord.* routes share one legacy discordRateLimited limiter and the ' +
      'callback is unlimited.',
    intendedBehavior:
      'Phase 16 adds or changes the discord.* limiters, and the wider rate-limiter ' +
      'rework in Phase 19 reworks their backing, so the discord limiter set changes.',
    introducedInPhase: 16,
    reason:
      'NEW or changed discord.* limiters land in Phase 16, with the rate-limiter ' +
      'rework in Phase 19; today the discord routes share one legacy ' +
      'discordRateLimited limiter and the callback is unlimited.',
  },
  {
    id: DEVIATION_ID.swagClaimOrphanUnreachable,
    routes: ['/api/discord/swag/claim'],
    currentBehavior:
      'handleSwagClaim is exported but no dispatcher arm routes to it, so POST ' +
      '/api/discord/swag/claim is unreachable today (it falls through to the 404 ' +
      'unknown-endpoint arm).',
    intendedBehavior:
      'Phase 16 discord wiring connects the swag-claim handler to a real dispatch ' + 'arm.',
    introducedInPhase: 16,
    reason:
      'The swag-claim handler exists but has no dispatch arm (an orphan); Phase 16 ' +
      'discord wiring routes to it. Until then POST /api/discord/swag/claim 404s.',
  },
];

// The phase window a scheduled deviation may name (Phase 4 to Phase 25 of the
// 25-phase re-architecture). A by-design deviation uses null instead.
export const DEVIATION_PHASE_MIN = 4;
export const DEVIATION_PHASE_MAX = 25;
