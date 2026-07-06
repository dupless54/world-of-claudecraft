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
    expect(painter).toContain('BANK_INFO_GRACE_MS');
    expect(painter).toMatch(/performance\.now\(\) - this\.openedAt > BANK_INFO_GRACE_MS/);
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
    expect(painter).toContain('.inert = false');
  });

  it('Escape dismisses the prompt and returns focus', () => {
    expect(painter).toMatch(/'Escape'[\s\S]{0,120}dismissAndReturn\(\)/);
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
});

describe('bank_window: static window element is wired in both game entries', () => {
  it('index.html declares #bank-window', () => {
    expect(indexHtml).toContain('id="bank-window"');
  });

  it('play.html declares #bank-window', () => {
    expect(playHtml).toContain('id="bank-window"');
  });
});
