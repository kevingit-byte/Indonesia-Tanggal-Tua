// Compare two cities side by side: every item measured in each city's own minimum-wage work time.
import type { Datum, Place } from './data/types';
import { landmark, landmarkName } from './art/landmarks';
import { flag } from './art/flags';
import { esc, money, num, pct, rpShort, workTime } from './format';
import { L, t } from './i18n';
import { basket, monthlyWage, toUsd, wishLocal, workMinutes, workMinutesLocal, type Derived } from './lib/model';
import { data, ui } from './store';
import { isWeak, provBtn, shareBtn, statusTag } from './ui';

const wd = () => data().method.workdayHours;
const byId = (id: string) => data().places.places.find((p) => p.id === id) ?? data().places.places[0]!;

interface Row {
  label: string;
  per?: string;
  a: Derived;
  b: Derived;
  /** Shown instead of a value, e.g. "tidak dijual". */
  aEmpty?: string;
  bEmpty?: string;
}

function card(p: Place, side: 'a' | 'b'): string {
  const d = data();
  const m = monthlyWage(p, wd());
  const idr = byId('jakarta').fxPerUsd?.value ?? 0;
  const usd = m.value === null ? null : toUsd(m.value, p).value;
  const hours = p.monthlyHours?.value ?? 0;
  const lm = landmarkName(p.id);
  return `<div class="cmp-card cmp-${side}">
    <div class="cmp-lm" title="${esc(lm ? L(lm) : '')}">${landmark(p.id)}</div>
    <div class="cmp-card-t">
      <div class="cmp-city">${flag(p.iso2, L(p.country))}<b>${esc(L(p.city))}</b></div>
      <small>${esc(L(p.wageLabel))}</small>
      <div class="cmp-wage">${m.value === null ? '–' : provBtn(money(m.value, p.currency), `${t('cmp.wage')}, ${L(p.city)}`, m.inputs)}<span>${t('perMonth')}</span></div>
      <small>${p.currency === 'IDR' || usd === null ? '' : `≈ ${rpShort(usd * idr)} · `}${m.value && hours ? `${money(m.value / hours, p.currency)} ${t('cmp.perHour')}` : ''}</small>
    </div>
  </div>`;
}

function rowsFor(a: Place, b: Place): { basics: Row[]; wish: Row[] } {
  const d = data();
  const priceOf = (p: Place, item: string): Datum | undefined =>
    item === 'rent' ? p.rent : item === 'transit' ? p.transitFare : d.prices.prices[p.id]?.[item];
  const basics: Row[] = [
    ...d.prices.items.map((i) => ({ id: i.id, label: L(i.label), per: `1 ${i.per}` })),
    { id: 'rent', label: t('item.room'), per: t('cmp.month') },
    { id: 'transit', label: t('item.transit'), per: '' },
  ].map(({ id, label, per }) => ({
    label,
    per,
    a: workMinutes(priceOf(a, id), a, wd()),
    b: workMinutes(priceOf(b, id), b, wd()),
  }));
  const all = d.wishlist.items;
  const wish: Row[] = all
    .filter((i) => !i.hidden)
    .map((i) => {
      const la = wishLocal(i, all, a);
      const lb = wishLocal(i, all, b);
      return {
        label: L(i.label),
        a: workMinutesLocal(la, a, wd()),
        b: workMinutesLocal(lb, b, wd()),
        aEmpty: la && la.value === null ? t('notsold') : undefined,
        bEmpty: lb && lb.value === null ? t('notsold') : undefined,
      };
    });
  return { basics, wish };
}

function ratioText(r: Row, a: Place, b: Place): string {
  if (r.a.value === null || r.b.value === null || !r.a.value || !r.b.value) return '';
  const x = r.a.value / r.b.value;
  if (x > 0.95 && x < 1.05) return `<span class="cmp-same">${t('cmp.same')}</span>`;
  const [who, k, cls] = x >= 1 ? [a, x, 'a'] : [b, 1 / x, 'b'];
  return `<span class="cmp-r cmp-r-${cls}">${t('cmp.longer', { city: esc(L(who.city)), x: num(k, k < 10 ? 1 : 0) })}</span>`;
}

function bar(d: Derived, max: number, side: 'a' | 'b', label: string, empty?: string): string {
  if (d.value === null) return `<div class="cmp-bar cmp-${side}"><span class="na">${esc(empty ?? t('nodata'))}</span></div>`;
  const w = max ? Math.max(1, (d.value / max) * 100) : 0;
  return `<div class="cmp-bar cmp-${side}"><i class="${isWeak(d.status) ? 'weak' : ''}" style="width:${w.toFixed(1)}%"></i><span>${statusTag(d)}${provBtn(
    workTime(d.value, wd()),
    label,
    d.inputs,
  )}</span></div>`;
}

function rowsHtml(rows: Row[], a: Place, b: Place): string {
  return rows
    .map((r) => {
      const max = Math.max(r.a.value ?? 0, r.b.value ?? 0);
      return `<div class="cmp-row"><div class="cmp-lab"><b>${esc(r.label)}</b>${r.per ? `<small>${esc(r.per)}</small>` : ''}</div>
        <div class="cmp-bars">${bar(r.a, max, 'a', `${r.label}, ${L(a.city)}`, r.aEmpty)}${bar(r.b, max, 'b', `${r.label}, ${L(b.city)}`, r.bEmpty)}</div>
        <div class="cmp-ratio">${ratioText(r, a, b)}</div></div>`;
    })
    .join('');
}

export function compareSection(): string {
  const d = data();
  const a = byId(ui.cmpA);
  const b = byId(ui.cmpB);
  const { basics, wish } = rowsFor(a, b);
  const both = [...basics, ...wish].filter((r) => r.a.value && r.b.value);
  const aLonger = both.filter((r) => r.a.value! > r.b.value! * 1.05).length;
  const ba = basket(a, d.prices, d.method);
  const bb = basket(b, d.prices, d.method);
  const share = (x: ReturnType<typeof basket>) => (x.total.value !== null && x.wage.value ? x.total.value / x.wage.value : null);
  const sa = share(ba);
  const sb = share(bb);
  const opt = (sel: string) =>
    d.places.places.map((p) => `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>${esc(L(p.city))}, ${esc(L(p.country))}</option>`).join('');
  const shareCell = (s: number | null, x: ReturnType<typeof basket>, p: Place) =>
    s === null ? '–' : `${statusTag(x.total)}${provBtn(pct(s * 100), `${t('cmp.basket')}, ${L(p.city)}`, [...x.total.inputs, ...x.wage.inputs])}`;
  return `<div class="sec-head"><div class="eyebrow">${t('cmp.eyebrow')}</div><h2 id="compare-h">${t('cmp.title')}</h2><p class="lede">${t('cmp.lede')}</p></div>
  <div class="cmp-pick">
    <div class="field"><label for="cmpA">${t('cmp.a')}</label><select id="cmpA" data-cmp="cmpA">${opt(a.id)}</select></div>
    <button type="button" class="btn cmp-swap" data-action="swap" aria-label="${t('cmp.swap')}">⇄</button>
    <div class="field"><label for="cmpB">${t('cmp.b')}</label><select id="cmpB" data-cmp="cmpB">${opt(b.id)}</select></div>
  </div>
  <div class="cmp-cards">${card(a, 'a')}${card(b, 'b')}</div>
  <p class="cmp-summary">${t('cmp.summary', { a: esc(L(a.city)), n: String(aLonger), m: String(both.length) })}</p>
  <div class="cmp-month"><div><small>${t('cmp.basket')}</small><b class="cmp-a-t"><span>${esc(L(a.city))}</span> ${shareCell(sa, ba, a)}</b><b class="cmp-b-t"><span>${esc(L(b.city))}</span> ${shareCell(sb, bb, b)}</b></div></div>
  <div class="cmp-group"><h3 class="h3">${t('cmp.basics')}</h3>${rowsHtml(basics, a, b)}</div>
  <div class="cmp-group"><h3 class="h3">${t('cmp.wish')}</h3>${rowsHtml(wish, a, b)}</div>
  <div class="legend"><span><i class="sw cmp-a-sw"></i>${esc(L(a.city))}</span><span><i class="sw cmp-b-sw"></i>${esc(L(b.city))}</span><span><i class="sw sw-weak"></i><span class="est-mark" aria-hidden="true">≈</span>${t('legend.est')}</span></div>
  <div class="foot">${shareBtn('compare', `${a.id}_vs_${b.id}`)}</div>`;
}
