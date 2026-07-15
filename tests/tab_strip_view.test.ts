import { describe, expect, it } from 'vitest';
import { tabStripHtml, tabStripModel } from '../src/ui/tab_strip_view';

describe('tabStripModel', () => {
  it('marks only the selected tab', () => {
    const m = tabStripModel({
      ariaLabel: 'Social',
      panelId: 'soc-body-panel',
      stripClass: 'soc-tabs',
      tabClass: 'soc-tab',
      selectedClass: 'on',
      tabs: [
        { id: 'friends', label: 'Friends' },
        { id: 'guild', label: 'Guild' },
      ],
      selected: 'guild',
    });
    expect(m.tabs).toEqual([
      { id: 'friends', label: 'Friends', selected: false },
      { id: 'guild', label: 'Guild', selected: true },
    ]);
  });

  it('is DOM-free / same-input-same-output regardless of caller shape', () => {
    const descriptor = {
      ariaLabel: 'x',
      panelId: 'p',
      stripClass: 's',
      tabClass: 't',
      selectedClass: 'on',
      tabs: [{ id: 'a', label: 'A' }],
      selected: 'a',
    };
    expect(tabStripModel(descriptor)).toEqual(tabStripModel({ ...descriptor }));
  });
});

describe('tabStripHtml', () => {
  it('renders role=tablist / role=tab markup with a roving tabindex and aria-selected', () => {
    const html = tabStripHtml(
      tabStripModel({
        ariaLabel: 'Social',
        panelId: 'soc-body-panel',
        stripClass: 'soc-tabs',
        tabClass: 'soc-tab',
        selectedClass: 'on',
        tabs: [
          { id: 'friends', label: 'Friends' },
          { id: 'guild', label: 'Guild' },
        ],
        selected: 'friends',
      }),
    );
    expect(html).toBe(
      '<div class="soc-tabs" role="tablist" aria-label="Social">' +
        '<button type="button" class="soc-tab on" data-tab="friends" role="tab" aria-selected="true" tabindex="0" aria-controls="soc-body-panel">Friends</button>' +
        '<button type="button" class="soc-tab " data-tab="guild" role="tab" aria-selected="false" tabindex="-1" aria-controls="soc-body-panel">Guild</button>' +
        '</div>',
    );
  });

  it('escapes label / aria-label / id text', () => {
    const html = tabStripHtml(
      tabStripModel({
        ariaLabel: '<x>',
        panelId: 'p',
        stripClass: 's',
        tabClass: 't',
        selectedClass: 'on',
        tabs: [{ id: 'a', label: '<b>&"\'' }],
        selected: 'a',
      }),
    );
    expect(html).toContain('aria-label="&lt;x&gt;"');
    expect(html).toContain('&lt;b&gt;&amp;&quot;&#39;');
  });
});
