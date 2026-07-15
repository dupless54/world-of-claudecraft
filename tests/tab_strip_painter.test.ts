import { describe, expect, it } from 'vitest';
import { wireTabStrip } from '../src/ui/tab_strip_painter';

// Hand-rolled fake DOM (repo convention: no jsdom for src/ui/ wiring tests). Models
// only the contract wireTabStrip uses: querySelectorAll by class, dataset.tab, and a
// per-type listener list a test fires directly instead of a real event loop.
class FakeTab {
  dataset: { tab?: string };
  listeners: Record<string, ((e: unknown) => void)[]> = {};
  constructor(tab: string) {
    this.dataset = { tab };
  }
  addEventListener(type: string, cb: (e: unknown) => void): void {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(cb);
  }
  fire(type: string, event: unknown = { preventDefault: () => {} }): void {
    for (const cb of this.listeners[type] ?? []) cb(event);
  }
}

class FakeContainer {
  constructor(private readonly tabs: FakeTab[]) {}
  querySelectorAll<T>(_sel: string): T[] {
    return this.tabs as unknown as T[];
  }
}

describe('wireTabStrip', () => {
  it('dispatches a click without focus-follow', () => {
    const [friends, guild] = [new FakeTab('friends'), new FakeTab('guild')];
    const calls: [string, boolean][] = [];
    wireTabStrip(
      new FakeContainer([friends, guild]) as unknown as HTMLElement,
      'soc-tab',
      (id, focusFollow) => calls.push([id, focusFollow]),
    );
    friends.fire('click');
    expect(calls).toEqual([['friends', false]]);
  });

  it('moves selection to the next tab on ArrowRight, with focus-follow', () => {
    const [friends, guild] = [new FakeTab('friends'), new FakeTab('guild')];
    const calls: [string, boolean][] = [];
    wireTabStrip(
      new FakeContainer([friends, guild]) as unknown as HTMLElement,
      'soc-tab',
      (id, focusFollow) => calls.push([id, focusFollow]),
    );
    let prevented = false;
    friends.fire('keydown', { key: 'ArrowRight', preventDefault: () => (prevented = true) });
    expect(calls).toEqual([['guild', true]]);
    expect(prevented).toBe(true);
  });

  it('wraps Home/End and activates the focused tab on Enter/Space, all focus-follow', () => {
    const [friends, guild, block] = [
      new FakeTab('friends'),
      new FakeTab('guild'),
      new FakeTab('block'),
    ];
    const calls: [string, boolean][] = [];
    wireTabStrip(
      new FakeContainer([friends, guild, block]) as unknown as HTMLElement,
      'soc-tab',
      (id, focusFollow) => calls.push([id, focusFollow]),
    );
    guild.fire('keydown', { key: 'End', preventDefault: () => {} });
    block.fire('keydown', { key: 'Enter', preventDefault: () => {} });
    guild.fire('keydown', { key: ' ', preventDefault: () => {} });
    expect(calls).toEqual([
      ['block', true],
      ['block', true],
      ['guild', true],
    ]);
  });

  it('ignores a non-navigation key', () => {
    const friends = new FakeTab('friends');
    const calls: [string, boolean][] = [];
    wireTabStrip(new FakeContainer([friends]) as unknown as HTMLElement, 'soc-tab', (id, f) =>
      calls.push([id, f]),
    );
    friends.fire('keydown', { key: 'a', preventDefault: () => {} });
    expect(calls).toEqual([]);
  });
});
