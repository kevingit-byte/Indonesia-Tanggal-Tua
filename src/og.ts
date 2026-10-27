// ?og=<view> renders one view as a 1200×630 card for Open Graph images (scripts/og.ts screenshots it).
import { setLang } from './i18n';
import { basketSection, hero, historySection, itemsSection, wishSection } from './sections';
import { setUi, ui } from './store';

/** Views that get their own share image. Keys match the URL hash ("#wishlist-iphone"). */
export const OG_VIEWS: Record<string, () => string> = {
  home: hero,
  'item-rice': () => (setUi({ item: 'rice' }), itemsSection()),
  'wishlist-iphone': () => (setUi({ wish: 'iphone' }), wishSection()),
  'wishlist-iphone18pro': () => (setUi({ wish: 'iphone18pro' }), wishSection()),
  'wishlist-switch2': () => (setUi({ wish: 'switch2' }), wishSection()),
  'wishlist-bigmac': () => (setUi({ wish: 'bigmac' }), wishSection()),
  'wishlist-latte': () => (setUi({ wish: 'latte' }), wishSection()),
  'basket-idr': () => (setUi({ leftCurrency: 'idr' }), basketSection()),
  'history-rice': () => (setUi({ histItem: 'rice' }), historySection()),
};

export function renderOg(view: string) {
  setLang(ui.lang);
  const fn = OG_VIEWS[view] ?? OG_VIEWS.home!;
  document.documentElement.dataset.theme = 'light';
  document.body.className = 'og-mode';
  const body = fn();
  // Name the chosen item on the card; the section title alone is generic.
  const chosen = document.createElement('div');
  chosen.innerHTML = body;
  const pick = chosen.querySelector('.chip[aria-pressed="true"]')?.textContent;
  document.body.innerHTML = `<div class="og"><div class="og-brand"><span class="brand-mark">⏱</span> Berapa Jam Kerja${
    pick && view !== 'home' ? `<span class="og-pick">${pick}</span>` : ''
  }</div><section class="og-body${view === 'home' ? ' hero' : ''}">${body}</section></div>`;
}
