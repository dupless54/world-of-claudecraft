# Esc menu redesign: The Warden's Codex

Design specification for the full revamp of the Esc settings menu, replacing the
hub-and-spoke options window with a modern, persistent-category settings surface.
Produced by a three-proposal design panel judged on hierarchy, navigation, mobile,
accessibility and fairness, feasibility, and dark-fantasy fit; this document is the
unanimous winner ("The Warden's Codex", visual-craft-first) with the judges' grafts
applied. Companion documents: `ui-ux-redesign-spec.md` (the AAA grammar and tokens
this builds on) and `ui-ux-current-state.md`.

Design direction inputs: modern game settings surfaces were studied for structure
lessons only (persistent category navigation, preset-then-detail, uniform row
grammar, conflict surfacing, scoped resets, controller-first operation); nothing is
copied. The expression is native to this game's token system.

## 1. Vision

The window reads as a forged codex bound in dark iron with a gilded spine: a
recessed category rail carved one panel-depth deeper than the bright detail face
where the work happens. Gold is earned (active category, focused control, an
enabled switch, the one primary action); all passive framing is border-brown.
Cinzel appears exactly three times (window title, active category header, section
heads); everything else is the UI face. The hub-and-spoke round-trip disappears:
categories live permanently on the left, content is always in view.

## 2. Layout model

- Root `#options-menu` adopts the landed `.window-frame` grammar, size class XL:
  `width: min(1200px, 92% of #ui)`, `height: min(800px, 88% of #ui)`, centered,
  **non-draggable and non-resizable** (a full-attention context; the world map is
  the precedent, spec 3.6 of the AAA redesign; add `options-menu` to
  `NON_RESIZABLE_WINDOW_IDS` and exclude its titlebar from the drag predicate).
- Zones top to bottom: `.window-titlebar` (40px desktop / 48px touch; title
  "Settings" in `--font-display` `--text-lg` gold; `.window-close` with 40px hit
  area) / body grid / `.window-footer` (48px sticky).
- Body: `display: grid; grid-template-columns: var(--opt-rail-w) 1fr;
  min-height: 0`. New structural token `--opt-rail-w: 208px` (`:root` only).
  Two INDEPENDENT scrollers: the rail and the detail pane each own
  `overflow-y: auto`.
- Rail (left): recessed spine. `background-color: var(--color-panel-l2-base)`
  under `background-image: var(--panel-l1-bg)`; 1px `--panel-edge` divider on the
  inline-end edge; `padding: var(--spacing-sm) 0`. A vertical `role=tablist`
  (`aria-orientation=vertical`) of category tabs under three rail-group headers.
- Detail (right): L1 surface, `padding: var(--spacing-lg)`, `role=tabpanel`
  labelled by the active tab. Inner column measure-capped:
  `.opt-detail-inner { max-width: 40rem }` so rows never sprawl at XL width and
  +35 percent localized labels stay adjacent to their controls; leftover width is
  gutter. Category header in `--font-display` `--text-title` gold + a one-line
  muted subhead, then the search field, then sections.
- Width degrade ladder (viewport-driven, no information loss): full rail (208px)
  -> under 900px effective width, icon-only 56px strip (labels become tooltips)
  -> if still too tight (cramped landscape phones), the rail renders as a top
  `.tab-rail` instead; the rail component is presentation-agnostic (one model,
  three renderings).

## 3. Category tree (the IA of record)

Nine categories under three rail groups. **Every `SETTING_RANGES` and
`BOOL_SETTINGS` key is assigned exactly once**; a new pure module
`options_ia.ts` owns this tree plus a category-to-keys map (drives rendering AND
scoped reset), and an exhaustiveness test fails on any unassigned or
double-assigned key. Explicit exclusion allowlist (never rendered):
`graphicsDefaultApplied` (internal first-run flag), `questTrackerCollapsed`
(toggled from the tracker header). (T) = touch environment only; (online) =
online mode only.

RAIL GROUP "Display"
1. **Graphics**: Quality: `graphicsPreset` (segmented Low/Medium/High/Ultra/
   Advanced, preset-then-detail: detail rows `terrainDetail`, `foliageDensity`,
   `effectsQuality`, `shadowQuality` appear at Advanced; editing a detail row on
   a non-Advanced preset flips the preset to Advanced), `renderScale` (slider),
   `weather` (switch), `browserEffects` (segmented Auto/Full/Reduced/Minimal +
   note). View: `brightness`, `cameraFov` (degrees), `fullscreen`.
2. **Interface**: General: language (dropdown, locale-native labels), theme
   preset (segmented) + custom-color grid + "Reset colors" section action.
   Scale and Text: `uiScale` (commitOnChange), `tooltipScale`. Panels:
   `hudOpacity`, `frostedPanels`. Unit Frames: `playerFrameScale`,
   `targetFrameScale`, `aurasOnPlayerFrame`, `showOwnNameplate`, "Reset frame
   positions" action. Action Bars: `showSecondaryActionBar`. Chat:
   `chatFontScale`, `chatOpacity`, `compactChat`, chat timestamps on/off +
   12h/24h segmented (dimmed when off), "Reset chat window" action. Combat and
   Tooltips: `fctScale`, `showItemLevel`. HUD Extras: `showOverflowXp`,
   `showWalletOnCharacterScreen`, `showWalletOnPlayerCard`, `showDevBadges`,
   `showDailyRewardsChest`.
3. **Accessibility**: Motion and Contrast: `reduceMotion`, `highContrastText`,
   `landingHighContrast`. Content: `filterProfanity`.

RAIL GROUP "Input"
4. **Controls**: Camera: `mouseCamera`, `cameraSpeed`, `invertLookY`,
   `lockCursorOnRotate`. Movement: `clickToMove`, `clickToMoveButton`
   (segmented Left/Right, dimmed while click-to-move is off). Combat:
   `attackMove`, `startAttackOnAbilityUse`, `groundReticle`, `walkByAutoloot`.
   Feedback: `clickFeedback`. Input Mode: `interfaceMode` (segmented
   Auto/Desktop/Touch + note; hidden under the native app shell).
5. **Keybinds** (wide layout): the bind table by `BIND_CATEGORIES` (Movement /
   Targeting / Interface / Action Bar) as flowing columns; each row = action
   label + primary cap + alternate cap; the Attack Move key row shows only while
   `attackMove` is on. "Reset key bindings" section action.
6. **Controller**: Feel: `gamepadEnabled`, `gamepadInvertY`,
   `gamepadStickDeadzone`, `gamepadCameraSpeed` (oneDecimal),
   `gamepadVibration`. Buttons: per-button remap dropdowns + "Reset buttons"
   action. Shows `.empty-state` ("No controller detected") when no pad is
   present but stays reachable.
7. **Touch** (T): Sticks: `joystickScale`, `joystickDeadzone`,
   `leftHandedTouch`, `mobileCameraJoystick`. Look: `touchLookSpeed`,
   `touchInvertLook`. Buttons: `actionButtonScale`, `touchOpacity`.

RAIL GROUP "System"
8. **Audio**: Volume: `sfxVolume`, `musicVolume`, `voiceVolume`. Toggles: music
   on/off (musicToggle, reads MusicDirector), `voiceEnabled` ("NPC Voices"),
   `footstepSfx`.
9. **System**: Performance: `showFps`, the performance-overlay panel (delegated
   to the existing PerfOverlaySettingsPanel; drag-placement stays gated to this
   category being open). Support: Report a Bug (online; pushes the bug-report
   form as a detail sub-view). About: version readout.

Footer-owned global actions (not rail rows): Reset all settings, Log out
(online), Done.

## 4. Row grammar

Net-new `.opt-*` classes, scoped under `.window-frame` (the shell-layer
collision policy), landing inside the guarded AAA grammar banner section of
`components.css`. Tokens only.

- `.opt-row`: `display: grid; grid-template-columns: 1fr auto; align-items:
  center; column-gap: var(--spacing-md); min-height: 44px` (48px touch);
  `padding: var(--spacing-xs) var(--spacing-sm); border-radius:
  var(--radius-sm)`. Rows are borderless; a 1px `--panel-edge` hairline
  separates SECTIONS, not rows (scan rhythm from row height + hover tint).
- Label block: `.opt-row-label` (`--font-ui` `--text-md` `--color-text-light`),
  optional `.opt-row-desc` (`--text-xs` muted, 2px top margin). Labels truncate
  (`min-width: 0`, ellipsis) with the full localized string in `title`.
- Control block: `.opt-row-control` right-aligned flex, `gap: --spacing-sm`.
- Slider `.opt-slider`: 180px range input reusing the existing `--range-fill`
  gold-track paint; 4px track, 16px thumb (20px touch); tabular readout
  `.opt-slider-val` (48px min-width, right-aligned, `--text-sm`), formatted by
  the existing percent/degrees/oneDecimal formatters. `commitOnChange`
  semantics preserved (uiScale).
- Switch `.opt-switch`: replaces the text ON/OFF button. `role=switch`,
  `aria-checked`; 44x24 track (radius 12), 20px thumb; off = `--color-bg-input`
  track + `--color-border-default` ring; on = `--color-primary` track + dark
  thumb; thumb slides via transform over `--dur-fast`. One control drives
  Toggle (0/1), BoolToggle, and MusicToggle models.
- Segmented `.opt-seg` (choices of 4 or fewer short options): `role=radiogroup`
  of `role=radio` buttons; 28px (`--control-h-compact`) inside the 44px row;
  selected = gold fill + dark text (`.is-selected`); 1px `--panel-edge` internal
  dividers; roving tabindex with selection-follows-focus. More than 4 options
  or long labels -> the existing `.ui-dd` dropdown (listbox, max-height 320px).
- Keybind cap `.opt-key`: `min-width: 88px; height: var(--control-h)`; 1px
  `--color-border-default`; capturing state `.is-capturing` = gold border with
  an fx-medium+ breathe (steady gold border at low fx / reduced motion);
  unbound cap shows the muted "Unbound" label.
- Note `.opt-note`: full-width span, `--text-xs` muted; only for
  browserEffects / interfaceMode / graphics-reload copy.
- Section `.opt-section` + `.opt-section-head`: `--font-display` `--text-sm`
  uppercase `--gold-dim`, 0.4px tracking, 32px min-height, `--panel-edge`
  underline, optional trailing ghost "Reset [scope]" action;
  `margin-top: var(--spacing-lg)` between sections.
- Row states: hover = faint light wash (no transform); `.is-active-row` = the
  explicit focus/controller-cursor row cue: 2px `--focus-ring-color` inset on
  the inline-start edge (`box-shadow: inset 2px 0 0`, zero layout shift) plus
  the hover tint. **`.is-active-row` is authoritative and set by the focus
  model, NOT derived from `:focus-visible`** (programmatic and gamepad focus do
  not reliably light `:focus-visible` across browsers; the token ring remains
  as the additive native cue). disabled = 0.4 opacity + `aria-disabled`.
  pending (uiScale mid-drag) = readout tinted `--gold-dim` until commit.
  reload-required rows carry a `.ui-badge.badge-warning` "Restart" chip.

## 5. Navigation

One pure focus model (`options_focus_model`, part of the view-model work)
produces move/adjust/activate/switchCategory/back intents; keyboard, controller,
and pointer all converge on a single `setActiveCategory(id)` path so behavior
cannot drift. The rail is a vertical roving tablist with
**aria-selected-follows-focus** (arrowing live-swaps the pane, no Enter).

Keyboard:
- Tab order: active rail tab (one roving stop) -> detail search field -> detail
  rows top-to-bottom -> footer actions -> close. FocusManager traps Tab only
  when focus is already inside (Tab stays the game's target-nearest key
  outside) and returns focus to the opener on close. Esc stays with `closeAll`.
- Rail: Up/Down move focus AND auto-activate; Home/End jump. Requires a new
  tested `'vertical'` orientation in `roving_index.ts` that owns
  Up/Down/Home/End only, leaving Left/Right free for in-row value adjustment.
  Auto-activation re-renders the DETAIL pane without rebuilding the rail node,
  so the focused tab element survives the trap.
- Rows: slider = Left/Right step, Home/End = min/max, PageUp/Down = 10x step;
  switch = Space/Enter toggle, Left = off, Right = on; segmented = Left/Right
  roving with selection-follows-focus; keybind cap = Enter/Space begins
  capture, Delete/Backspace unbinds.
- Ctrl+Tab / Ctrl+Shift+Tab cycle categories from anywhere in the body.

Controller (new; no menu navigation exists in the game today):
- A dedicated menu-input mode in `gamepad.ts`, gated by a new explicit
  **`FocusManager.hasActiveTrap()`** predicate (not window-id prose): while a
  trap is active, the pad emits pure menu intents and CONSUMES the handled
  edges, so world input (camera, movement, the pad's Esc mapping) never
  double-fires. The (button -> intent) mapping is a pure, unit-tested module
  (`menu_gamepad_nav`), provable without a pad.
- Verbs: LB/RB = previous/next category from anywhere (the headline
  affordance); D-pad Up/Down = row focus; D-pad Left/Right or left-stick X =
  adjust focused value (mirrors keyboard); A = activate; B = back (pops a
  pushed sub-view, else closes); **Y = reset the focused row to its default;
  X = clear the focused keybind slot; RT/LT = page-scroll long panes**.
- The controller cursor is `.is-active-row` (see section 4), always visible.
- A **persistent footer button-legend strip** renders while a gamepad is
  connected (console-settings convention): live glyphs for LB/RB, D-pad, A, B,
  Y, X, RT/LT with their menu meanings, localized via t() keys.

Pointer: click a rail tab to switch (also sets roving focus); click controls
directly; hover states are color/border only, never transform.

## 6. Rebind UX

Keybinds (keyboard):
- Capture: activating a cap enters `.is-capturing` ("Press a key...") and an
  assertive live region announces "Rebinding {action}. Press a key, or Escape
  to cancel." The next keydown binds via the existing
  `keybinds().bind(action, index, code)`. **Three independent exits** (the
  no-trap safety property): physical Escape, an on-screen Cancel affordance on
  the capturing row (touch has no Escape), and focus-loss/blur. Esc itself is
  reserved (`isReservedCode`) and never bindable.
- Eviction surfacing (bind() steals a code from any prior action; one code
  lives on at most one action): the steal is never invisible. Live region and
  a transient `.ui-badge.badge-warning` chip on the displaced row announce
  **"Bound {key} to {action}; removed from {evicted}"**; the displaced row
  repaints in the same render. A persistent `.error-banner` at the top of the
  pane lists any action left fully unbound ("{action} has no key").
- Unbind: Delete/Backspace on a focused cap, or the cap's clear affordance.
- "Reset key bindings" restores the classic default layout, refreshes the
  action-bar keycaps (`deps.refreshKeybindLabels`), and announces the reset.

Controller (Buttons section): per-button remap via the existing `.ui-dd`
dropdowns (options: Unbound + Game Menu + every edge action + Jump; movement
axes stay on the stick). **Structural safety property: a controller user
rebinds via dropdown selection and can never enter a trapping press-a-key
capture state.** Two buttons MAY map to one action: any button row sharing a
non-Unbound action with another gets a warning chip naming the duplicate.
Pad connect/disconnect re-renders the open pane in place so glyphs match the
detected brand (existing refreshControllerLabels path). Both flows return
focus to the originating cap/dropdown after a rebind.

## 7. Validation, conflicts, and search

- Conflict aggregation: a new pure `keybind_conflicts.ts` computes the
  conflict/unbound state; it surfaces (a) inline on the affected row, (b) as
  the top-of-pane error banner, and (c) as an **aggregate warning dot on the
  rail category item itself**, so a conflict is visible from the rail (even
  icon-collapsed) without opening the category.
- Divergence hints: a muted "N settings changed from defaults" line under each
  category header (drives the scoped-reset decision); the count also renders in
  the future portrait master list.
- Search: a `.search-field` at the top of the detail pane, first in the body
  Tab order. Scope toggle chip: "This section" (default; live-filters the
  current category, hiding non-matching rows and empty sections) and "All
  settings" (a synthetic results view of matching rows grouped by home
  category, each row fully interactive with a muted category breadcrumb).
  **The search index is STRUCTURAL**: built from the same descriptor list the
  panes render (localized label + category + section), with a tiny explicit
  synonym overlay only where genuinely needed ("fps" -> showFps); a test
  asserts every rendered row appears in the index, so the index cannot drift.
  Clearing (clear button or Escape while focused) restores the category view.
  No global search keybind (avoids chat "/").
- Transient states: language dropdown busy/failed states with aria-live status
  (existing flow preserved); reload-required rows badge "Restart" and the
  Graphics pane keeps its persistent reload note + "Reload now" button; no
  setting change is silently deferred without a visible marker.

## 8. Visual treatment

- Depth: window = L1 forged panel with the landed frame chrome (ornaments at fx
  medium+); rail = recessed spine (L2 base under the L1 gradient) behind a
  single `--panel-edge` rule; detail = the bright L1 face.
- Type: `--font-display` gold exactly three places (title `--text-lg`, category
  header `--text-title`, section heads `--text-sm` uppercase `--gold-dim`).
  Everything else `--font-ui`.
- Gold budget (enumerated): active rail tab (3px gold inline-start border +
  gold label), `.is-active-row` inset, focused-control token ring, switch-on
  track, selected segment, slider fill, the one `.btn.is-primary` Done. Nothing
  large is gold. At fx high+, the active tab gains a faint additive gold edge
  glow (color-mix over the always-present border; sheds cleanly).
- Motion (reduced-motion and fairness safe): category switch = detail-pane
  opacity cross-fade over `calc(var(--dur-fast) * var(--motion-scale))`; switch
  thumb and segment selection slide via transform `--dur-fast`; slider fills
  and readouts are INSTANT (the value is information, never eased); capture
  breathe fx medium+ only with steady-border fallback; no transform scale on
  any hover/focus; under reduced motion every fade collapses near-instant and
  no information is motion-only.
- Forced-colors checklist (non-color state cues that must survive): rail
  active = `aria-selected` + the 3px border (border survives); segment selected
  = `aria-checked` + border; switch = `aria-checked` (the control keeps its
  border geometry); focus = system Highlight ring; conflict dot pairs with the
  banner text.

## 9. Mobile behavior

- Landscape phone (first-class now): full-screen modal presentation (existing
  hud.mobile.css pattern); rail at 160px (icon + label) with the degrade ladder
  of section 2; titlebar 48px; all controls at 44px touch size (switch track,
  segment buttons, key caps, 20px slider thumb); inputs inherit the 16px
  base.css floor (search field, bug-report textarea). Footer stacks full-width
  primary-on-top when crowded.
- Portrait (structure-ready; the rotate gate stands today): the view-model
  exposes `renderRailModel()` and `renderCategory(id)` independently, so the
  future bottom-sheet host consumes the SAME two functions: the rail model IS
  the master list (48px rows: icon + label + changed-count + conflict dot),
  each category a pushed detail panel with a back chevron; bug report and
  keybind capture already behave as pushed sub-views one level deeper. Search
  moves to the sheet header. Zero IA change, chrome swap only.

## 10. Footer actions and close semantics

- Footer left: "Reset all settings" (`.btn.is-danger`, confirm-gated via the
  shared confirm dialog; `Settings.reset()` then re-apply every key through
  `onSettingChange`, then re-render). Scoped "Reset [category]" lives in each
  category header (iterates that category's key set from the options_ia map
  back to defaults); finer section resets (key bindings, controller buttons,
  colors, chat window, frame positions) are kept.
- Footer right: "Report a Bug" (`.btn-ghost`, online) pushes the bug-report
  sub-view; "Log out" (`.btn.is-danger`, online); "Done" (`.btn.is-primary`)
  closes. The controller legend strip renders above/beside these while a pad
  is connected.
- Close/back: Esc keeps the single `closeAll` contract; with a sub-view pushed
  (bug report, capture in flight) Back / controller B pops to the category;
  only at category level does Esc/B/Done close. On close: music resumes,
  perf-overlay placement drops, tooltip hides, FocusManager returns focus to
  the opener. When nothing is open, Esc opens this menu (unchanged).

## 11. Implementation map

New pure modules (lean-module discipline: exactly these four, all in
UI_PURE_CORES with tests):
1. `src/ui/options_ia.ts`: the category tree, per-category control lists
   (replacing the per-panel builders), category-to-keys map, exclusion
   allowlist, structural search index + synonym overlay. The pinned dispatch
   coercions (`sliderDispatchValue`, `toggleNextValue`, `boolToggleNextValue`)
   stay byte-identical.
2. `src/ui/keybind_conflicts.ts`: conflict/unbound/duplicate computation for
   both keyboard and controller tables + the rail aggregate state.
3. `roving_index.ts` extension: the `'vertical'` orientation (Up/Down/Home/End
   only), tested.
4. `src/game/menu_gamepad_nav.ts`: the pure (pad button -> menu intent)
   mapping; `gamepad.ts` wires it behind `FocusManager.hasActiveTrap()` and
   consumes handled edges.

Reworked: `src/ui/options_view.ts` (IA swap onto options_ia, focus model,
rail/category render models), `src/ui/options_window.ts` (repaint on the
window-frame builder + `.opt-*` grammar; keep every dispatch and subsystem
apply path byte-identical), `src/ui/focus_manager.ts` (add `hasActiveTrap()`),
`window_drag_handle.ts` or its call site (exclude `#options-menu` titlebar),
`window_resize.ts` (`NON_RESIZABLE_WINDOW_IDS` + `options-menu`).

CSS: `.opt-*` grammar + `--opt-rail-w` token inside the existing guarded
sections of `components.css` / `hud.mobile.css` / `tokens.css`. No new files,
no new imports, no flat colliding names.

i18n: new `hudChrome.options.*` keys (English only; M16 five-fills where
wordy): rail group labels, category names + subheads, section heads, search
placeholder + scope chips, legend labels, eviction/announce strings, reset
labels, About/version.

Tests (decisive, per behavior): options_ia exhaustiveness (every settings key
assigned once or allowlisted; RED on a new unassigned key), search-index
completeness (every rendered row indexed), keybind_conflicts (steal, unbound
banner, controller duplicates), vertical roving (owns Up/Down only),
menu_gamepad_nav mapping (every verb incl. Y/X/RT/LT; consumed edges),
focus-trap + return (existing suites extended), forced-colors non-color cues
(scan), dispatch byte-parity (existing options dispatch tests keep passing
unchanged), theme contrast across all four presets for any new structural
token, per-entry parity, css corpus/validity.

Phasing (after the in-flight vendor fix wave closes, since hud.ts and grammar
CSS overlap): P1 options_ia + exhaustiveness test (pure, zero visual risk);
P2 window-frame adoption + rail/detail chrome + row grammar (desktop);
P3 navigation (keyboard + focus model + vertical roving), then controller mode;
P4 rebind UX + conflicts + search; P5 mobile landscape pass + polish + the
full QA matrix (all four themes, fx tiers, forced-colors, reduced motion,
ui_scale extremes, long-string locale).

## 12. Acceptance criteria

- [ ] Every settings key assigned exactly once or explicitly allowlisted
      (exhaustiveness test red otherwise).
- [ ] Full keyboard operation: every row reachable and adjustable without a
      pointer; trap + focus return green in the existing suites.
- [ ] Full controller operation behind hasActiveTrap(): all verbs, consumed
      edges, legend strip while connected, `.is-active-row` cursor always
      visible (not dependent on :focus-visible).
- [ ] Rebind capture has three exits and can never trap; evictions announced
      and visible; unbound actions banner-listed; controller duplicates
      chipped; rail conflict dot visible when collapsed.
- [ ] Search finds every rendered row (structural index test) in both scopes.
- [ ] Preset-then-detail graphics flips to Advanced on detail edit; fairness
      invariant untouched (cosmetic-only tiers, static preset reads).
- [ ] AA contrast in all four themes; forced-colors non-color cues verified;
      reduced-motion collapses all new motion; no transform scale anywhere.
- [ ] 44px touch controls, 16px input floor, landscape phone pass; portrait
      unaffected (rotate gate); renderRailModel/renderCategory contract in
      place for the future sheet host.
- [ ] Dispatch byte-parity: every existing onSettingChange path and coercion
      unchanged; uiScale commitOnChange preserved.
- [ ] Esc/closeAll semantics, logout, bug report, music resume, perf-overlay
      gating all preserved.
- [ ] npm run gate green (known Windows-local new_endpoint failure excluded);
      before/after screenshots (desktop + landscape mobile) committed under
      docs/screenshots.
