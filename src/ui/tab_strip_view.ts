// Pure, DOM-free tab-strip model + markup builder: the WAI-ARIA tabs markup
// (role=tablist/tab, aria-selected, roving tabindex) that social_window.ts,
// market_window.ts, talents_window.ts, daily_rewards_window.ts, and
// mailbox_window.ts each hand-rolled independently. This is the first
// migration onto a shared building block; the keyboard-navigation half of
// the duplication already lives in the shared roving_index.ts core, which a
// caller composes with wireTabStrip (tab_strip_painter.ts) separately.
//
// Callers pass already-localized labels: this core stays i18n-free like every
// other UI_PURE_CORES entry, so it never calls t() itself.

import { esc } from './esc';

export interface TabStripTab<Id extends string = string> {
  id: Id;
  label: string;
}

export interface TabStripDescriptor<Id extends string = string> {
  /** aria-label on the role=tablist wrapper. */
  ariaLabel: string;
  /** id of the role=tabpanel this strip's tabs point aria-controls at. */
  panelId: string;
  /** Class on the role=tablist wrapper (e.g. 'soc-tabs'). */
  stripClass: string;
  /** Class on every tab button (e.g. 'soc-tab'). */
  tabClass: string;
  /** Class added to the selected tab's button on top of tabClass (e.g. 'on'). */
  selectedClass: string;
  tabs: TabStripTab<Id>[];
  selected: Id;
}

export interface TabStripModelTab<Id extends string = string> {
  id: Id;
  label: string;
  selected: boolean;
}

export interface TabStripModel<Id extends string = string> {
  ariaLabel: string;
  panelId: string;
  stripClass: string;
  tabClass: string;
  selectedClass: string;
  tabs: TabStripModelTab<Id>[];
}

export function tabStripModel<Id extends string>(d: TabStripDescriptor<Id>): TabStripModel<Id> {
  return {
    ariaLabel: d.ariaLabel,
    panelId: d.panelId,
    stripClass: d.stripClass,
    tabClass: d.tabClass,
    selectedClass: d.selectedClass,
    tabs: d.tabs.map((tab) => ({ ...tab, selected: tab.id === d.selected })),
  };
}

// The role=tablist markup for a model: one button per tab with aria-selected +
// a roving tabindex (0 on the selected tab, -1 on the rest), matching the
// hand-rolled markup this replaces byte-for-byte.
export function tabStripHtml<Id extends string>(m: TabStripModel<Id>): string {
  const btn = (tab: TabStripModelTab<Id>): string =>
    `<button type="button" class="${m.tabClass} ${tab.selected ? m.selectedClass : ''}" data-tab="${esc(tab.id)}" role="tab" aria-selected="${tab.selected ? 'true' : 'false'}" tabindex="${tab.selected ? '0' : '-1'}" aria-controls="${esc(m.panelId)}">${esc(tab.label)}</button>`;
  return (
    `<div class="${m.stripClass}" role="tablist" aria-label="${esc(m.ariaLabel)}">` +
    `${m.tabs.map(btn).join('')}</div>`
  );
}
