import { audio } from '../game/audio';
import type { CharacterPreview } from '../render/characters';
import { preloadMechAssets } from '../render/characters/assets';
import { skinCount } from '../render/characters/manifest';
import { playerPortraitDataUrl, visualPortraitDataUrl } from '../render/characters/portrait';
import { MECH_CHROMAS, SKIN_RANKS, type SkinTier, skinRankOrder } from '../sim/content/skins';
import { CLASSES } from '../sim/data';
import type { PlayerClass, SkinRank } from '../sim/types';
import {
  activeCharacterAppearancePreview,
  characterAppearanceOptions,
} from './character_appearance';
import { esc } from './esc';
import type { FocusManager, FocusTrapHandle } from './focus_manager';
import { formatNumber, type TranslationKey, t } from './i18n';
import { QUALITY_COLOR } from './icons';
import { svgIcon } from './ui_icons';

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector(sel) as T;

const classCss = (cls: string): string =>
  `#${((CLASSES as Record<string, { color: number }>)[cls]?.color ?? 0x5fa8ff).toString(16).padStart(6, '0')}`;

// Combat Mech chroma id -> display-name key. Keyed by MECH_CHROMAS[].id.
const MECH_NAME_KEY: Record<string, TranslationKey> = {
  amber_crimson: 'skinEvent.mech.amber_crimson',
  crimson_amber: 'skinEvent.mech.crimson_amber',
  cyan_magenta: 'skinEvent.mech.cyan_magenta',
  magenta_cyan: 'skinEvent.mech.magenta_cyan',
  orange_steel: 'skinEvent.mech.orange_steel',
  steel_orange: 'skinEvent.mech.steel_orange',
  forest_pink: 'skinEvent.mech.forest_pink',
  pink_forest: 'skinEvent.mech.pink_forest',
  amethyst_silver: 'skinEvent.mech.amethyst_silver',
  ivory_copper: 'skinEvent.mech.ivory_copper',
  onyx_gold: 'skinEvent.mech.onyx_gold',
  imperial_crimson: 'skinEvent.mech.imperial_crimson',
  imperial_gold: 'skinEvent.mech.imperial_gold',
  vanguard_azure: 'skinEvent.mech.vanguard_azure',
  vanguard_chrome: 'skinEvent.mech.vanguard_chrome',
};

const SKIN_RANK_NAME_KEY: Record<SkinRank, TranslationKey> = {
  uncommon: 'itemUi.quality.uncommon',
  rare: 'itemUi.quality.rare',
  epic: 'itemUi.quality.epic',
};

export function skinRankName(rank: SkinRank): string {
  return t(SKIN_RANK_NAME_KEY[rank]);
}

export function mechChromaName(id: string): string {
  const key = MECH_NAME_KEY[id];
  return key ? t(key) : id;
}

export function skinTierKey(tier: SkinTier): string {
  return `${tier.rank}:${tier.skin}`;
}

// CSS wheel uses `conic-gradient(from -90deg, ...)`, so the visual centers
// are shifted 90deg from the raw stop midpoints. Add bounded per-roll
// jitter so repeat rolls of the same rarity do not stop at the same point.
export function randomSkinEventLandingAngle(rank: SkinRank): number {
  const jitter = (span: number): number => (Math.random() - 0.5) * span;
  switch (rank) {
    case 'uncommon':
      return -15 + jitter(150);
    case 'rare':
      return -172.5 + jitter(72);
    case 'epic':
      return -247.5 + jitter(28);
  }
  return 0;
}

/** The host state + Hud callbacks this module needs. `Hud` satisfies this
 *  structurally (same field/method names), so its methods pass `this` in
 *  directly; no adapter object required. */
export interface CharSkinPainterHost {
  readonly sim: {
    cfg: { playerClass: PlayerClass };
    player: { skin?: number; skinCatalog?: 'class' | 'mech'; level: number };
    accountCosmetics: { mechChromaIds: string[] };
    changeSkin(skin: number, catalog: 'class' | 'mech'): void;
    unequipMechChroma(id: string): void;
    claimEventSkin(index: number): void;
  };
  readonly focusManager: FocusManager;
  charPreview: CharacterPreview | null;
  mechAssetsPromise: Promise<void> | null;
  skinEventEl: HTMLElement | null;
  skinEventTrap: FocusTrapHandle | null;
  skinEventRank: SkinRank | null;
  skinEventTiers: readonly SkinTier[];
  skinEventMode: 'class' | 'mech';
  skinEventSelected: number;
  skinEventSelectedKey: string;
  skinEventWheelAngle: number;
  mountCharPreview(
    container: HTMLElement,
    cls: PlayerClass,
    skin: number,
    previewKey?: string,
  ): void;
  attachTooltip(el: HTMLElement, html: () => string): void;
  showBanner(msg: string): void;
  renderBags(): void;
  renderCharIfOpen(): void;
  closeSkinEvent(): void;
}

export function skinEventChoices(
  host: CharSkinPainterHost,
): { rank: SkinRank; index: number; key: string; id?: string }[] {
  if (host.skinEventMode === 'mech') {
    return MECH_CHROMAS.map((c, i) => ({ rank: c.rank, index: i, key: `mech:${i}`, id: c.id }));
  }
  return host.skinEventTiers.map((tier) => ({
    rank: tier.rank,
    index: tier.skin,
    key: skinTierKey(tier),
  }));
}

export function skinEventPreviewKey(host: CharSkinPainterHost): string {
  return host.skinEventMode === 'mech' ? 'player_mech' : `player_${host.sim.cfg.playerClass}`;
}

// Whether a choice's skin actually exists to render. Mech chromas always do;
// class skins are bounded by how many that class's model ships.
export function skinChoiceAvailable(host: CharSkinPainterHost, index: number): boolean {
  if (host.skinEventMode === 'mech') return true;
  return index < skinCount(`player_${host.sim.cfg.playerClass}`);
}

export function skinChoiceThumb(host: CharSkinPainterHost, index: number): string | null {
  return host.skinEventMode === 'mech'
    ? visualPortraitDataUrl('player_mech', index)
    : playerPortraitDataUrl(host.sim.cfg.playerClass, index);
}

/** Best choice the rolled rank unlocks AND that exists, or null. Works for
 *  both modes via skinEventChoices(). */
export function defaultChoiceSelection(
  host: CharSkinPainterHost,
  rank: SkinRank,
): { index: number; key: string } | null {
  const granted = skinRankOrder(rank);
  let best: { index: number; key: string } | null = null;
  let bestOrder = -1;
  for (const ch of skinEventChoices(host)) {
    const order = skinRankOrder(ch.rank);
    if (order > granted || !skinChoiceAvailable(host, ch.index)) continue;
    if (order > bestOrder) {
      bestOrder = order;
      best = { index: ch.index, key: ch.key };
    }
  }
  return best;
}

export function paintCharSkinPicker(host: CharSkinPainterHost): void {
  const row = $('#char-skin-row') as HTMLElement | null;
  if (!row) return;
  const cls = host.sim.cfg.playerClass;
  const options = characterAppearanceOptions(cls, host.sim.accountCosmetics.mechChromaIds);
  row.innerHTML = '';
  row.style.setProperty('--class-color', classCss(cls));
  if (options.length <= 1) return;
  if (options.some((option) => option.kind === 'mech') && !host.mechAssetsPromise) {
    host.mechAssetsPromise = preloadMechAssets();
  }
  const current = Math.max(0, host.sim.player.skin ?? 0);
  const currentCatalog = host.sim.player.skinCatalog ?? 'class';
  for (const option of options) {
    const labelNumber = formatNumber(option.label, { maximumFractionDigits: 0 });
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `skin-swatch${option.kind === currentCatalog && option.skin === current ? ' sel' : ''}`;
    b.textContent = labelNumber;
    b.setAttribute('role', 'listitem');
    b.setAttribute(
      'aria-label',
      option.kind === 'class'
        ? t('auth.chromaOption', { n: labelNumber })
        : mechChromaName(option.chromaId),
    );
    b.addEventListener('click', () => {
      row.querySelectorAll('.skin-swatch').forEach((x) => {
        x.classList.remove('sel');
      });
      b.classList.add('sel');
      if (option.kind === 'class') {
        host.sim.changeSkin(option.skin, 'class');
        const preview = activeCharacterAppearancePreview(
          host.sim.cfg.playerClass,
          option.skin,
          'class',
        );
        host.mountCharPreview(
          $('#char-model-preview'),
          host.sim.cfg.playerClass,
          preview.skin,
          preview.visualKey,
        );
        return;
      }
      host.sim.changeSkin(option.skin, 'mech');
      if (!host.mechAssetsPromise) host.mechAssetsPromise = preloadMechAssets();
      const mechAssets = host.mechAssetsPromise;
      void mechAssets
        .then(() => {
          if (
            ($('#char-window') as HTMLElement).style.display === 'block' &&
            b.classList.contains('sel')
          ) {
            const preview = activeCharacterAppearancePreview(
              host.sim.cfg.playerClass,
              option.skin,
              'mech',
            );
            host.mountCharPreview(
              $('#char-model-preview'),
              host.sim.cfg.playerClass,
              preview.skin,
              preview.visualKey,
            );
          }
        })
        .catch((err) => console.error('failed to load mech cosmetic preview:', err));
      audio.click();
    });
    if (option.kind === 'mech') {
      host.attachTooltip(
        b,
        () =>
          `<div class="tt-name">${esc(mechChromaName(option.chromaId))}</div><div class="tt-sub">${esc(t('skinEvent.unlocked'))}</div>`,
      );
    }
    row.appendChild(b);
  }
  const currentChroma = currentCatalog === 'mech' ? MECH_CHROMAS[current] : null;
  if (currentChroma && host.sim.accountCosmetics.mechChromaIds.includes(currentChroma.id)) {
    const unequip = document.createElement('button');
    unequip.type = 'button';
    unequip.className = 'skin-unequip-btn';
    unequip.textContent = t('skinEvent.unequip');
    unequip.setAttribute('aria-label', t('skinEvent.unequip'));
    unequip.addEventListener('click', () => {
      host.sim.unequipMechChroma(currentChroma.id);
      audio.click();
      host.renderBags();
      host.renderCharIfOpen();
    });
    host.attachTooltip(
      unequip,
      () =>
        `<div class="tt-name">${esc(mechChromaName(currentChroma.id))}</div><div class="tt-sub">${esc(t('skinEvent.unequip'))}</div>`,
    );
    row.appendChild(unequip);
  }
}

function ensureSkinEventEl(host: CharSkinPainterHost): HTMLElement {
  let el = host.skinEventEl;
  if (!el) {
    el = document.createElement('div');
    el.id = 'skin-event';
    el.className = 'skin-event-overlay';
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') host.closeSkinEvent();
    });
    el.addEventListener('mousedown', (e) => {
      if (e.target === el) host.closeSkinEvent();
    });
    document.body.appendChild(el);
    host.skinEventEl = el;
  }
  return el;
}

export function paintSkinEventWheel(host: CharSkinPainterHost): void {
  const rank = host.skinEventRank;
  if (rank === null) return;

  const el = ensureSkinEventEl(host);
  const title = esc(t('skinEvent.title'));
  const landed = esc(skinRankName(rank));
  el.innerHTML =
    `<div class="se-wheel-stage" role="dialog" aria-modal="true" aria-label="${title}">` +
    `<div class="se-wheel-pointer" aria-hidden="true"></div>` +
    `<div class="se-wheel" style="--land-angle:${host.skinEventWheelAngle}deg" aria-hidden="true">` +
    `<svg class="se-wheel-labels" viewBox="0 0 200 200">` +
    `<defs><path id="se-wheel-label-ring" d="M 100 25 A 75 75 0 1 1 99.9 25"/></defs>` +
    `<text class="se-wheel-label-bg uncommon"><textPath href="#se-wheel-label-ring" startOffset="4%">${esc(skinRankName('uncommon'))}</textPath></text>` +
    `<text class="se-wheel-label-bg rare"><textPath href="#se-wheel-label-ring" startOffset="48%">${esc(skinRankName('rare'))}</textPath></text>` +
    `<text class="se-wheel-label-bg epic"><textPath href="#se-wheel-label-ring" startOffset="69%">${esc(skinRankName('epic'))}</textPath></text>` +
    `<text class="se-wheel-label-fg"><textPath href="#se-wheel-label-ring" startOffset="4%">${esc(skinRankName('uncommon'))}</textPath></text>` +
    `<text class="se-wheel-label-fg"><textPath href="#se-wheel-label-ring" startOffset="48%">${esc(skinRankName('rare'))}</textPath></text>` +
    `<text class="se-wheel-label-fg"><textPath href="#se-wheel-label-ring" startOffset="69%">${esc(skinRankName('epic'))}</textPath></text>` +
    `</svg>` +
    `</div>` +
    `<div class="se-wheel-result" style="--tier-color:${QUALITY_COLOR[rank] ?? '#fff'}">` +
    `<span>${landed}</span>` +
    `<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>` +
    `<b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b>` +
    `<b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div>` +
    `</div>`;
  if (!host.skinEventTrap)
    host.skinEventTrap = host.focusManager.open({ root: () => host.skinEventEl });
  el.classList.add('open');
}

export function paintSkinEvent(host: CharSkinPainterHost): void {
  const rank = host.skinEventRank;
  if (rank === null) return;
  const cls = host.sim.cfg.playerClass;
  const granted = skinRankOrder(rank);
  const mech = host.skinEventMode === 'mech';
  const previewKey = skinEventPreviewKey(host);

  // Build the shell once and reuse it across opens so the single 3D canvas
  // can be moved in/out via setContainer without being recreated.
  const el = ensureSkinEventEl(host);

  const title = esc(t('skinEvent.title'));
  const rankName = skinRankName(rank);
  el.innerHTML =
    `<div class="panel skin-event-panel" role="dialog" aria-modal="true" aria-label="${title}">` +
    `<div class="se-body"><div class="se-left">` +
    `<div class="se-roll-banner" style="--tier-color:${QUALITY_COLOR[rank] ?? '#fff'}">${esc(t('skinEvent.rolled', { rank: rankName }))}</div>` +
    `<div class="se-tiers" role="radiogroup" aria-label="${title}"></div>` +
    `<button type="button" class="btn se-lockin" data-lockin>${esc(t('skinEvent.lockIn'))}</button>` +
    `</div><div class="se-preview-col">` +
    `<div class="se-preview"><div class="se-preview-hint">${esc(t('skinEvent.previewHint'))}</div></div>` +
    `<div class="se-preview-name" data-preview-name></div>` +
    `</div></div></div>`;

  const tiersEl = el.querySelector('.se-tiers') as HTMLElement;
  const lockInBtn = el.querySelector('[data-lockin]') as HTMLButtonElement;
  const swatches: HTMLButtonElement[] = [];

  const syncSelection = (): void => {
    let selectedCanLock = false;
    for (const b of swatches) {
      const sel = b.dataset.choice === host.skinEventSelectedKey;
      b.classList.toggle('sel', sel);
      b.setAttribute('aria-checked', String(sel));
      b.tabIndex = sel ? 0 : -1;
      if (sel && b.dataset.lockable === 'true') selectedCanLock = true;
    }
    lockInBtn.disabled = !selectedCanLock;
  };

  const nameEl = el.querySelector('[data-preview-name]') as HTMLElement;
  const choiceName = (ch: { rank: SkinRank; id?: string }): string =>
    mech && ch.id ? mechChromaName(ch.id) : skinRankName(ch.rank);

  const select = (ch: { rank: SkinRank; index: number; key: string; id?: string }): void => {
    host.skinEventSelected = ch.index;
    host.skinEventSelectedKey = ch.key;
    host.charPreview?.setSkin(ch.index);
    nameEl.textContent = choiceName(ch);
    syncSelection();
    audio.click();
  };

  const choices = skinEventChoices(host);
  // Highest rank at the top (epic -> uncommon), matching the design sketch.
  // Class mode shows one swatch per tier; mech mode shows every chroma in it.
  for (const tierRank of [...SKIN_RANKS].reverse()) {
    const rankChoices = choices.filter((c) => c.rank === tierRank);
    if (!rankChoices.length) continue;
    const order = skinRankOrder(tierRank);
    const unlocked = order <= granted;
    const anyAvailable = rankChoices.some((c) => skinChoiceAvailable(host, c.index));
    const rawName = skinRankName(tierRank);
    const row = document.createElement('div');
    row.className = `se-tier${unlocked ? '' : ' locked'}`;
    row.style.setProperty('--tier-color', QUALITY_COLOR[tierRank] ?? '#fff');
    const hint = !unlocked
      ? `<span class="se-tier-hint">${svgIcon('lock')}${esc(t('skinEvent.lockedHint', { rank: rawName }))}</span>`
      : !anyAvailable
        ? `<span class="se-tier-hint">${esc(t('skinEvent.unavailable'))}</span>`
        : '';
    row.innerHTML =
      `<div class="se-tier-head"><span class="se-tier-name">${esc(rawName)}</span>${hint}</div>` +
      `<div class="se-swatches"></div>`;
    const swatchesEl = row.querySelector('.se-swatches') as HTMLElement;

    rankChoices.forEach((ch, i) => {
      const available = skinChoiceAvailable(host, ch.index);
      const label = choiceName(ch);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'se-swatch';
      b.dataset.skin = String(ch.index);
      b.dataset.choice = ch.key;
      b.dataset.lockable = String(unlocked && available);
      b.setAttribute('role', 'radio');
      if (available) {
        const url = skinChoiceThumb(host, ch.index);
        if (!unlocked) b.classList.add('locked');
        b.innerHTML = url ? `<img src="${esc(url)}" alt="">` : String(i + 1);
        b.setAttribute(
          'aria-label',
          mech ? label : t('skinEvent.optionAria', { rank: rawName, index: i + 1 }),
        );
        b.addEventListener('click', () => select(ch));
        host.attachTooltip(
          b,
          () =>
            `<div class="tt-name">${esc(label)}</div>` +
            (unlocked
              ? ''
              : `<div class="tt-sub">${esc(t('skinEvent.lockedHint', { rank: rawName }))}</div>`),
        );
        swatches.push(b);
      } else {
        b.classList.add('unavailable');
        b.setAttribute('aria-disabled', 'true');
        b.innerHTML = unlocked
          ? '<span class="se-lock">-</span>'
          : `<span class="se-lock">${svgIcon('lock')}</span>`;
        b.setAttribute('aria-label', unlocked ? t('skinEvent.unavailable') : t('skinEvent.locked'));
        host.attachTooltip(
          b,
          () =>
            `<div class="tt-name">${esc(rawName)}</div><div class="tt-sub">${esc(t('skinEvent.unavailable'))}</div>`,
        );
      }
      swatchesEl.appendChild(b);
    });
    tiersEl.appendChild(row);
  }

  lockInBtn.addEventListener('click', () => {
    if (host.skinEventSelected < 0 || lockInBtn.disabled) return;
    host.sim.claimEventSkin(host.skinEventSelected);
    host.showBanner(t('skinEvent.unlocked'));
    audio.levelUp();
    host.closeSkinEvent();
    if ($('#bags').style.display !== 'none') host.renderBags();
  });

  // Show, mount the shared 3D preview into the right column, focus the choice.
  if (!host.skinEventTrap)
    host.skinEventTrap = host.focusManager.open({ root: () => host.skinEventEl });
  el.classList.add('open');
  host.mountCharPreview(
    el.querySelector('.se-preview') as HTMLElement,
    cls,
    host.skinEventSelected >= 0 ? host.skinEventSelected : 0,
    mech ? previewKey : undefined,
  );
  const selChoice = choices.find((c) => c.key === host.skinEventSelectedKey);
  if (selChoice) nameEl.textContent = choiceName(selChoice);
  syncSelection();
  (swatches.find((b) => b.dataset.choice === host.skinEventSelectedKey) ?? swatches[0])?.focus();
}
