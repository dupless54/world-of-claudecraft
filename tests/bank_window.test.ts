// Source-level guards for the bank painter (the bags_window.test.ts shape). The pure
// slot/action decisions are unit-tested in bank_view.test.ts; here we pin the
// no-magic-values contract (no raw hex; the unranked-quality fallback is a token), the
// load-bearing behaviors (reuse the pure core, preserve the grid scroll offset), the
// modal-prompt a11y contract, and the hud.ts wiring that opens/closes/refreshes the
// window plus the docking body class.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const painter = readFileSync(new URL('../src/ui/bank_window.ts', import.meta.url), 'utf8');
const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const components = readFileSync(new URL('../src/styles/components.css', import.meta.url), 'utf8');
const hud = readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const playHtml = readFileSync(new URL('../play.html', import.meta.url), 'utf8');

describe('bank_window: no magic values', () => {
  it('carries no literal hex color in TS (quality color comes from QUALITY_COLOR + a token)', () => {
    const hex = painter.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hex, `hex colors must move to tokens: ${hex.join(', ')}`).toEqual([]);
  });

  it('uses the --color-quality-default token for the unranked-quality fallback', () => {
    expect(painter).toContain('var(--color-quality-default)');
  });

  it('defines --color-quality-default in the design-token sheet', () => {
    expect(tokens).toContain('--color-quality-default:');
  });

  it('uses no em or en dashes (ASCII separators only)', () => {
    expect(painter.includes('—'), 'em dash found').toBe(false);
    expect(painter.includes('–'), 'en dash found').toBe(false);
  });

  it('gives both keyboard-focusable bank controls a tokenized :focus-visible ring', () => {
    expect(components).toMatch(
      /\.bank-item:focus-visible,\s*\.bank-buy-btn:focus-visible \{\s*outline: 2px solid var\(--color-border-focus\);/,
    );
  });
});

describe('bank_window: load-bearing behaviors preserved', () => {
  it('reuses the pure core (buildBankView + bankSlotAction), not a re-derived bag filter', () => {
    expect(painter).toContain('buildBankView(');
    expect(painter).toContain('bankSlotAction(');
    // the bank window is not a bags clone: it must not re-run the bag filter
    expect(painter).not.toContain('applyBagFilter(');
  });

  it('captures and reapplies the .bank-grid scroll offset across a rebuild', () => {
    expect(painter).toContain(".bank-grid')?.scrollTop");
    expect(painter).toContain('grid.scrollTop = prevScrollTop');
  });

  it('closes itself after a grace window once bankInfo goes null (walked away)', () => {
    // Pin the literal (a silent change to 100ms would insta-close on any mirror
    // hiccup) and the whole null-gate arm INCLUDING the close() action: replacing
    // the action with a re-render must red this, not just renaming the constant.
    expect(painter).toContain('BANK_INFO_GRACE_MS = 3_000');
    expect(painter).toMatch(
      /if \(!info\) \{\s*if \(performance\.now\(\) - this\.openedAt > BANK_INFO_GRACE_MS\) this\.close\(\);/,
    );
  });

  it('open() is idempotent while already open (a re-interact must not re-capture focus)', () => {
    expect(painter).toMatch(/open\(\): void \{\s*if \(this\.opened\) return;/);
  });

  it('a rebuild under an open prompt tears the prompt down and re-lands focus', () => {
    // render() rebuilds innerHTML: an open prompt would go stale (old language, a
    // captured slot index the fresh data may have shifted) and the focused node is
    // destroyed. The rebuild must dismiss prompts, clear the inert they set, and
    // re-focus the fresh close button when focus was inside the window/prompt.
    const renderBody = painter.slice(
      painter.indexOf('render(): void {'),
      painter.indexOf('refreshIfChanged(): void {'),
    );
    expect(renderBody).toContain('dismissBankPrompts()');
    expect(renderBody).toContain('inert = false');
    expect(renderBody).toContain('hadFocus');
  });

  it('marks the window as a dialog root for the accessible name', () => {
    expect(painter).toContain('markDialogRoot(');
  });
});

describe('bank_window: modal prompt a11y contract', () => {
  it('the prompt is a labelled modal dialog', () => {
    expect(painter).toContain("setAttribute('role', 'dialog')");
    expect(painter).toContain("setAttribute('aria-modal', 'true')");
  });

  it('traps Tab inside the prompt via the one canonical focusable set', () => {
    expect(painter).toContain("import { FOCUSABLE_SELECTOR } from './focus_manager'");
    expect(painter).toContain('FOCUSABLE_SELECTOR');
  });

  it('sets and clears the parent-window inert on every teardown path', () => {
    expect(painter).toContain('.inert = true');
    // Each arm is pinned in its own body slice so deleting either one reds this:
    // dismiss() (the shared prompt teardown) clears the inert it set...
    const dismissBody = painter.slice(painter.indexOf('const dismiss = ('));
    expect(dismissBody).toContain('inert = false');
    // ...and the force-close backstop in close() BOTH tears open prompts down and
    // clears inert (Esc/keybind can close the window out from under a prompt).
    const closeBody = painter.slice(
      painter.indexOf('close(): void {'),
      painter.indexOf('render(): void {'),
    );
    expect(closeBody).toContain('dismissBankPrompts()');
    expect(closeBody).toContain('.inert = false');
  });

  it('Escape dismisses the prompt and returns focus without reaching the global escape', () => {
    expect(painter).toMatch(/'Escape'[\s\S]{0,160}dismissAndReturn\(\)/);
    // stopPropagation keeps the keypress from bubbling to the input layer's window
    // keydown, whose escape action would ALSO run closeAll and close the whole bank
    // window in the same keypress (prompt buttons are not tag-exempt like inputs).
    expect(painter).toMatch(/ke\.preventDefault\(\);\s*ke\.stopPropagation\(\);/);
  });

  it('confirm lands focus on the always-present close button; cancel returns to the opener', () => {
    // Three landings: buy confirm, quantity submit, and the render() re-land. The
    // rebuild detaches the opener node, so falling to <body> is the WCAG 2.4.3 bug.
    const landings =
      painter.match(/querySelector\('\[data-close\]'\) as HTMLElement \| null\)\?\.focus\(\)/g) ??
      [];
    expect(landings.length).toBeGreaterThanOrEqual(3);
    expect(painter).toMatch(
      /const dismissAndReturn = \(\): void => \{\s*dismiss\(\);\s*opener\?\.focus\(\);/,
    );
  });

  it('re-validates the live slot at quantity-prompt submit (stale-index guard)', () => {
    // The prompt captures slotIndex at open; the bank can repaint under it. Sending
    // the captured index blind would withdraw whatever now sits there, so submit
    // re-resolves the live slot, refuses on an itemId mismatch, and clamps the
    // count to the live stack.
    expect(painter).toMatch(/if \(!live \|\| !slot \|\| live\.itemId !== slot\.itemId\)/);
    expect(painter).toMatch(/Math\.min\(maxCount, live\.count,/);
  });

  it('mounts the prompt into #prompt-stack (outside the window)', () => {
    expect(painter).toContain("getElementById('prompt-stack')");
  });

  it('buy-slots confirm calls bankBuySlots and withdraw-partial calls bankWithdraw with a count', () => {
    expect(painter).toContain('bankBuySlots()');
    expect(painter).toMatch(/bankWithdraw\(slotIndex, count\)/);
  });
});

describe('bank_window: hud.ts wiring', () => {
  it('opens the bank on the bank SimEvent', () => {
    expect(hud).toContain("case 'bank':");
    expect(hud).toContain('this.openBank();');
  });

  it('routes the managed-window close through the painter (focus return)', () => {
    expect(hud).toContain("case 'bank-window':");
    expect(hud).toContain('this.closeBank();');
  });

  it('toggles the bank-open docking body class on open and close', () => {
    expect(hud).toContain("classList.add('bank-open')");
    expect(hud).toContain("classList.remove('bank-open')");
  });

  it('re-renders the open bank on a language switch and refreshes it on the slow band', () => {
    expect(hud).toContain('if (this.bankWindow.isOpen) this.bankWindow.render();');
    expect(hud).toContain(
      'if (slowHud && this.bankWindow.isOpen) this.bankWindow.refreshIfChanged();',
    );
  });

  it('wires the painter deps: the onClosed teardown and the NON-trapping focus pair', () => {
    // Gutting onClosed leaves body.bank-open stuck and the bags companion docked
    // forever; windowFocus would install the Tab trap the non-modal cluster forbids.
    expect(hud).toContain('onClosed: () => this.onBankClosed(),');
    expect(hud).toContain('captureFocus: () => this.focusManager.activeFocusable(),');
    expect(hud).not.toMatch(/this\.windowFocus\('#bank-window'\)/);
  });
});

describe('bank_window: static window element is wired in both game entries', () => {
  it('index.html declares #bank-window', () => {
    expect(indexHtml).toContain('id="bank-window"');
  });

  it('play.html declares #bank-window', () => {
    expect(playHtml).toContain('id="bank-window"');
  });
});
