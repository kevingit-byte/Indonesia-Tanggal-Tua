// Every section renders to an HTML string from the current data and UI state.
// main.ts re-renders on any change; the page is small enough that this stays instant.
import type { Datum, Place, SeriesPoint } from './data/types';
import { exampleTop, rankCalcCard } from './rank';
import { landmark, landmarkName } from './art/landmarks';
import { flag } from './art/flags';
import { esc, money, narrow, num, pct, rpShort, smart, workTime } from './format';
import { L, t, type Key } from './i18n';
import { basket, toLocal, toUsd, weakest, wishLocal, workMinutes, workMinutesLocal, type Derived } from './lib/model';
import { data, editCount, noteText, source, ui, type EditedDatum } from './store';
import {
  barLegend,
  barRows,
  chips,
  cityLabel,
  combined,
  isWeak,
  provBtn,
  seg,
  shareBtn,
  statusTag,
  type BarRow,
} from './ui';

const FOOD = ['rice', 'eggs', 'chicken', 'beef', 'oil'];
const wd = () => data().method.workdayHours;
const places = () => data().places.places;
const byId = (id: string) => places().find((p) => p.id === id)!;
const priceOf = (p: Place, item: string): Datum | undefined =>
  item === 'rent' ? p.rent : item === 'transit' ? p.transitFare : data().prices.prices[p.id]?.[item];
const wishPrice = (item: string, p: Place) => data().wishlist.items.find((i) => i.id === item)?.prices[p.iso2];

function sortRows(rows: BarRow[]) {
  return rows.sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
}

/** "≈ 3,0 bulan gaji" once something costs at least a month of full-time minimum-wage work. */
function monthsExtra(minutes: number | null, p: Place): string | undefined {
  const h = p.monthlyHours?.value;
  if (minutes === null || !h || minutes < h * 60) return undefined;
  return t('months', { n: num(minutes / (h * 60), 1) });
}

function head(eyebrow: Key, title: Key, lede?: Key, id?: string) {
  return `<div class="sec-head"><div class="eyebrow">${t(eyebrow)}</div><h2${id ? ` id="${id}-h"` : ''}>${t(title)}</h2>${
    lede ? `<p class="lede">${t(lede)}</p>` : ''
  }</div>`;
}

// ---------------------------------------------------------------- hero
export function hero(): string {
  const jkt = byId('jakarta');
  const iphone = (p: Place) => workMinutes(wishPrice('iphone', p), p, wd());
  const rice = (p: Place) => workMinutes(priceOf(p, 'rice'), p, wd());
  const days = (d: Derived) => (d.value === null ? '–' : smart(d.value / (wd() * 60)));
  const mins = (d: Derived) => (d.value === null ? '–' : smart(d.value));
  const ij = iphone(jkt);
  const share = (p: Place) => {
    const b = basket(p, data().prices, data().method);
    return b.total.value !== null && b.wage.value ? pct((b.total.value / b.wage.value) * 100) : '–';
  };
  const rj = rice(jkt);
  const updated = [data().places, data().prices, data().wishlist, data().regions, data().timeseries]
    .map((f) => f.updated)
    .sort()
    .pop();
  const strip = ['jakarta', 'kuala-lumpur', 'singapore', 'bangkok', 'ho-chi-minh-city', 'phnom-penh', 'vientiane', 'manila', 'shanghai', 'seoul', 'tokyo']
    .map((id) => `<span class="sk${id === 'jakarta' ? ' sk-id' : ''}" title="${esc(L(landmarkName(id)!))}">${landmark(id)}</span>`)
    .join('');
  return `
  <div class="hero-top">
    <div class="eyebrow">${t('hero.eyebrow')}</div>
    <span class="badge"><span class="dot" aria-hidden="true"></span>${t('updated')} ${esc(updated ?? '')}</span>
  </div>
  <h1>${t('hero.title.a')} <em>${t('hero.title.b')}</em>${t('hero.title.c')}</h1>
  <p class="lede">${t('hero.lede')}</p>
  <nav class="features" aria-label="${t('feat.nav')}">
    <a class="feat f1" href="#compare">
      <span class="feat-tag f1">${t('feat.1.tag')}</span>
      <span class="feat-ic" aria-hidden="true"><svg viewBox="0 0 32 32" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="17" r="11"/><path d="M16 10v7l5 3M13 3h6"/></svg></span>
      <b class="feat-t">${t('feat.1.title')}</b>
      <span class="feat-d">${t('feat.1.desc', { n: String(data().places.places.length) })}</span>
      <span class="feat-p">${t('feat.1.proof', { x: share(jkt), y: share(byId('tokyo')) })}</span>
      <span class="feat-go">${t('feat.1.go')}</span>
    </a>
    <a class="feat f2" href="#rank">
      <span class="feat-tag f2">${t('feat.2.tag')}</span>
      <span class="feat-ic" aria-hidden="true"><svg viewBox="0 0 118 30" width="118" height="30">${Array.from({ length: 20 }, (_, i) => `<rect class="${i === 11 ? 'me' : i < 11 ? 'lo' : 'hi'}" x="${i * 6}" y="${i === 11 ? 0 : 6}" width="4" height="${i === 11 ? 30 : 24}" rx="1"/>`).join('')}</svg></span>
      <b class="feat-t">${t('feat.2.title')}</b>
      <span class="feat-d">${t('feat.2.desc')}</span>
      <span class="feat-p">${t('feat.2.proof', { x: exampleTop() })}</span>
      <span class="feat-go">${t('feat.2.go')}</span>
    </a>
  </nav>
  <div class="skyline" aria-hidden="true">${strip}</div>
  <div class="verdict">
    <div class="id"><small>${t('hero.v.iphone')}</small><span class="big">${provBtn(days(ij), t('hero.v.iphone'), ij.inputs, 'pv pv-big')}</span><small>${t(
      'hero.v.iphoneVs',
      { x: days(iphone(byId('tokyo'))), y: days(iphone(byId('singapore'))) },
    )}</small><small>${monthsExtra(ij.value, jkt) ?? ''}</small></div>
    <div class="id"><small>${t('hero.v.rice')}</small><span class="big">${provBtn(mins(rj), t('hero.v.rice'), rj.inputs, 'pv pv-big')}</span><small>${t(
      'hero.v.riceVs',
      { x: mins(rice(byId('bangkok'))), y: mins(rice(byId('manila'))) },
    )}</small></div>
  </div>`;
}

// ---------------------------------------------------------------- 2 · one item
export function itemsSection(): string {
  const d = data();
  const options = [
    ...d.prices.items.map((i) => ({ value: i.id, label: L(i.label) })),
    { value: 'rent', label: t('item.room') },
    { value: 'transit', label: t('item.transit') },
  ];
  const def = d.prices.items.find((i) => i.id === ui.item);
  const label = options.find((o) => o.value === ui.item)?.label ?? ui.item;
  const per = def ? ` / ${def.per}` : '';
  const rows = sortRows(
    places().map((p) => {
      const price = priceOf(p, ui.item);
      if (ui.itemMode === 'usd') {
        const local = price ? toLocal(price, p) : null;
        const usd = local?.value != null ? toUsd(local.value, p) : null;
        const inputs = [...(local?.inputs ?? []), ...(usd?.inputs ?? [])];
        const derived = { value: usd?.value ?? null, ...combined(inputs) };
        return {
          place: p,
          sub: price?.value != null ? money(price.value, p.currency) : undefined,
          value: derived.value,
          display: derived.value === null ? '' : `US$${num(derived.value, derived.value < 10 ? 2 : 0)}`,
          provLabel: `${label}${per}, ${L(p.city)}`,
          derived,
        };
      }
      const m = workMinutes(price, p, wd());
      return {
        place: p,
        sub: price?.value != null ? money(price.value, p.currency) + per : undefined,
        value: m.value,
        display: m.value === null ? '' : workTime(m.value, wd()),
        provLabel: `${label}${per}, ${L(p.city)}`,
        derived: m,
      };
    }),
  );
  return `${head('item.eyebrow', 'item.title', 'item.lede', 'item')}
  <div class="toolbar">${chips('item', t('item.item'), options, ui.item)}
    ${seg('itemMode', t('item.measure'), [
      { value: 'time', label: t('item.time') },
      { value: 'usd', label: t('item.usd') },
    ], ui.itemMode)}</div>
  <div class="bars">${barRows(rows)}</div>
  <div class="foot">${barLegend()}${shareBtn('item', ui.item)}</div>`;
}

// ---------------------------------------------------------------- 3 · wishlist
export function wishSection(): string {
  const d = data();
  const all = d.wishlist.items;
  const visible = all.filter((i) => !i.hidden);
  const item = visible.find((i) => i.id === ui.wish) ?? visible[0]!;
  const rows = sortRows(
    places().map((p) => {
      const local = wishLocal(item, all, p);
      const m = workMinutesLocal(local, p, wd());
      const price = item.prices[p.iso2];
      const sub =
        local?.value == null
          ? undefined
          : price?.value != null
            ? money(price.value, price.unit.split('/')[0] ?? p.currency)
            : money(local.value, p.currency);
      return {
        place: p,
        sub,
        value: m.value,
        display: m.value === null ? '' : workTime(m.value, wd()),
        provLabel: `${L(item.label)}, ${L(p.city)}`,
        derived: m,
        emptyText: local && local.value === null ? t('notsold') : undefined,
        extra: monthsExtra(m.value, p),
      };
    }),
  );
  const parts = item.bundle ? all.filter((i) => item.bundle!.includes(i.id)) : [item];
  const notes = [...new Set(parts.flatMap((x) => Object.values(x.prices)).filter((v) => v.value === null && v.note).map((v) => noteText(v.note!)))]
    .map(esc)
    .join(' ');
  const bundleNote = item.bundle ? `<p class="note">${t('wish.bundle', { parts: parts.map((x) => L(x.label)).join(' + ') })}</p>` : '';
  return `${head('wish.eyebrow', 'wish.title', 'wish.lede', 'wishlist')}
  ${chips('wish', t('wish.item'), visible.map((i) => ({ value: i.id, label: L(i.label) })), item.id)}
  <div class="bars">${barRows(rows)}</div>
  ${bundleNote}${notes ? `<p class="note">${notes}</p>` : ''}
  <div class="foot">${barLegend()}${shareBtn('wishlist', item.id)}</div>`;
}

// ---------------------------------------------------------------- 4 · basket
const GROUPS = [
  { id: 'rent', key: 'basket.room', cls: 'c-rent', items: ['rent'] },
  { id: 'food', key: 'basket.food', cls: 'c-food', items: FOOD },
  { id: 'transit', key: 'basket.transitL', cls: 'c-transit', items: ['transit'] },
  { id: 'power', key: 'basket.power', cls: 'c-power', items: ['electricity'] },
] as const;

export function basketRows() {
  const d = data();
  return places().map((p) => {
    const b = basket(p, d.prices, d.method);
    const groups = GROUPS.map((g) => {
      const parts = b.parts.filter((x) => (g.items as readonly string[]).includes(x.line.item));
      const val = parts.every((x) => x.cost.value !== null) ? parts.reduce((s, x) => s + x.cost.value!, 0) : null;
      const inputs = parts.flatMap((x) => x.cost.inputs);
      return { g, value: val, ...combined(inputs) };
    });
    return { p, b, groups, share: b.total.value !== null && b.wage.value ? b.total.value / b.wage.value : null };
  });
}

export function basketSection(): string {
  const idr = byId('jakarta').fxPerUsd?.value ?? 0;
  const rows = basketRows().sort((a, b) => (b.share ?? -1) - (a.share ?? -1));
  const body = rows
    .map(({ p, b, groups, share }) => {
      const wage = b.wage.value ?? 0;
      const segs = groups
        .map((g) => {
          if (g.value === null || !wage) return '';
          const w = Math.min((g.value / wage) * 100, 100);
          return `<i class="${g.g.cls}${isWeak(g.status) ? ' weak' : ''}" style="width:${w.toFixed(2)}%" title="${esc(t(g.g.key as Key))}: ${esc(
            money(g.value, p.currency),
          )} (${pct((g.value / wage) * 100)})"></i>`;
        })
        .join('');
      let leftTxt = '–';
      let leftSub = '';
      const lv = b.leftover.value;
      if (lv !== null) {
        if (ui.leftCurrency === 'local') leftTxt = money(lv, p.currency);
        else {
          const usd = toUsd(lv, p).value;
          leftTxt = usd === null ? '–' : ui.leftCurrency === 'usd' ? `US$${num(usd)}` : rpShort(usd * idr);
          leftSub = money(lv, p.currency);
        }
      }
      const shareTxt = share === null ? '–' : pct(share * 100);
      const leftInputs =
        ui.leftCurrency === 'local' ? b.leftover.inputs : [...b.leftover.inputs, ...(p.fxPerUsd ? [p.fxPerUsd] : []), ...(ui.leftCurrency === 'idr' && byId('jakarta').fxPerUsd ? [byId('jakarta').fxPerUsd!] : [])];
      return `<div class="brow${p.iso2 === 'ID' ? ' is-id' : ''}">${cityLabel(p, money(wage, p.currency))}
        <div class="stackwrap"><div class="stack" role="img" aria-label="${esc(
          groups.map((g) => `${t(g.g.key as Key)} ${g.value === null ? '–' : pct((g.value / (wage || 1)) * 100)}`).join(', '),
        )}">${segs}</div>
        <span class="pct">${provBtn(shareTxt, `${t('basket.share')}, ${L(p.city)}`, b.total.inputs.concat(b.wage.inputs))}</span></div>
        <div class="save"><b class="${lv !== null && lv < 0 ? 'neg' : ''}">${statusTag(b.leftover)}${provBtn(leftTxt, `${t('basket.left')}, ${L(p.city)}`, leftInputs)}</b>${
          leftSub ? `<small>${esc(leftSub)}</small>` : ''
        }</div></div>`;
    })
    .join('');
  return `${head('basket.eyebrow', 'basket.title', 'basket.lede', 'basket')}
  <div class="toolbar"><p class="note">${t('basket.note')}</p>
    ${seg('leftCurrency', t('basket.currency'), [
      { value: 'local', label: t('basket.local') },
      { value: 'idr', label: t('basket.idr') },
      { value: 'usd', label: t('basket.usd') },
    ], ui.leftCurrency)}</div>
  <div class="basket"><div class="brow bhead" aria-hidden="true"><span>${t('basket.city')}</span><span>${t('basket.share')}</span><span>${t(
    'basket.left',
  )}</span></div>${body}</div>
  <div class="legend">${GROUPS.map((g) => `<span><i class="sw ${g.cls}"></i>${t(g.key as Key)}</span>`).join('')}<span><i class="sw sw-left"></i>${t(
    'basket.left',
  )}</span><span><i class="sw sw-weak"></i>${t('legend.est')}</span></div>`;
}

// ---------------------------------------------------------------- 5 · regions
export function regionsSection(): string {
  const d = data();
  const foodLines = d.method.basket.filter((l) => FOOD.includes(l.item));
  const priceInputs = foodLines.map((l) => d.regions.nationalPrices[l.item]).filter((x): x is Datum => !!x);
  const food = foodLines.reduce((s, l) => s + (d.regions.nationalPrices[l.item]?.value ?? 0) * l.qty, 0);
  const regs = d.regions.regions
    .filter((r) => r.level === ui.regionLevel)
    .map((r) => ({ r, share: r.wage.value ? food / r.wage.value : null }))
    .sort((a, b) => (b.share ?? 0) - (a.share ?? 0));
  const max = Math.max(...regs.map((x) => x.share ?? 0));
  const rows = regs
    .map(({ r, share }) => {
      const w = share === null ? 0 : (share / max) * 100;
      const inputs = [...priceInputs, r.wage];
      const st = weakest(inputs.map((x) => x.status));
      return `<div class="row is-id${r.id === 'ump-dki-jakarta' || r.id === 'kota-bekasi' ? ' is-hl' : ''}"><span class="lab"><span class="lab-t"><b>${esc(r.name)}</b><span>${esc(
        ui.regionLevel === 'UMK' ? r.province + ' · ' : '',
      )}${rpShort(r.wage.value ?? 0)}</span></span></span><div class="track"><i class="fill${isWeak(st) ? ' weak' : ''}" style="width:${w.toFixed(
        2,
      )}%"></i></div><div class="val">${share === null ? '–' : provBtn(pct(share * 100), `${t('basket.food')}, ${r.name}`, inputs)}</div></div>`;
    })
    .join('');
  return `${head('regions.eyebrow', 'regions.title', 'regions.lede', 'regions')}
  <div class="toolbar"><p class="note">${t('basket.food')}: ${provBtn(rpShort(food), t('basket.food'), priceInputs)}${t('perMonth')}</p>${seg('regionLevel', t('regions.level'), [
    { value: 'UMP', label: t('regions.ump') },
    { value: 'UMK', label: t('regions.umk') },
  ], ui.regionLevel)}</div>
  <div class="bars bars-regions">${rows}</div>
  <p class="note">${t('regions.note')}</p>
  <div class="foot">${shareBtn('regions', ui.regionLevel.toLowerCase())}</div>`;
}

// ---------------------------------------------------------------- 6 · history
interface HistPoint {
  year: number;
  price: SeriesPoint;
  wage: SeriesPoint;
  minutes: number;
}

function histPoints(item: string): HistPoint[] {
  const d = data();
  const ump = d.timeseries.series.find((s) => s.id === 'ump')!.points;
  const s = d.timeseries.series.find((x) => x.id === item)!;
  const hours = byId('jakarta').monthlyHours?.value ?? 173;
  return s.points
    .map((price) => {
      const wage = ump.find((u) => u.year === price.year);
      if (!wage?.value || price.value === null) return null;
      return { year: price.year, price, wage, minutes: price.value / (wage.value / (hours * 60)) };
    })
    .filter((x): x is HistPoint => !!x);
}

function lineChart(opts: {
  id: string;
  aria: string;
  series: { name: string; cls: string; pts: { x: number; y: number; weak?: boolean; tip: string }[] }[];
  yFmt: (v: number) => string;
  yMin?: number;
}): string {
  const n = narrow();
  const W = n ? 360 : 640, H = n ? 230 : 260, ml = n ? 34 : 44, mr = n ? 78 : 86, mt = 14, mb = 26;
  const all = opts.series.flatMap((s) => s.pts);
  const xs = all.map((p) => p.x);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const yMax = Math.max(...all.map((p) => p.y)) * 1.12;
  const yMin = opts.yMin ?? 0;
  const sx = (x: number) => ml + ((x - x0) / (x1 - x0 || 1)) * (W - ml - mr);
  const sy = (y: number) => mt + (1 - (y - yMin) / (yMax - yMin)) * (H - mt - mb);
  const ticks = 4;
  const grid = Array.from({ length: ticks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / ticks)
    .map((v) => `<line class="grid" x1="${ml}" x2="${W - mr}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${ml - 6}" y="${sy(v) + 4}" text-anchor="end">${opts.yFmt(v)}</text>`)
    .join('');
  const xt = xs
    .filter((x, i, a) => a.indexOf(x) === i && (!n || (x - x0) % 2 === 0))
    .map((x) => `<text x="${sx(x)}" y="${H - 6}" text-anchor="middle">${x}</text>`)
    .join('');
  const lines = opts.series
    .map((s) => {
      const d = s.pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('');
      const last = s.pts[s.pts.length - 1]!;
      const dots = s.pts
        .map(
          (p) =>
            `<g class="pt" tabindex="0" role="img" aria-label="${esc(p.tip)}"><circle class="hit" cx="${sx(p.x)}" cy="${sy(p.y)}" r="12"/><circle class="dot ${s.cls}${p.weak ? ' open' : ''}" cx="${sx(
              p.x,
            )}" cy="${sy(p.y)}" r="4.5"/><title>${esc(p.tip)}</title></g>`,
        )
        .join('');
      return `<path class="line ${s.cls}" d="${d}"/>${dots}<text class="ann" x="${sx(last.x) + 10}" y="${sy(last.y) + 4}">${esc(s.name)}</text>`;
    })
    .join('');
  return `<svg id="${opts.id}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria)}">${grid}${xt}${lines}</svg>`;
}

export function historySection(): string {
  const d = data();
  const s = d.timeseries.series.find((x) => x.id === ui.histItem)!;
  const pts = histPoints(ui.histItem);
  const first = pts[0]!, last = pts[pts.length - 1]!;
  const base = d.method.indexBaseYear;
  const b0 = pts.find((p) => p.year === base) ?? first;
  const itemName = L(s.label);
  const minutesChart = lineChart({
    id: 'tsMinutes',
    aria: t('hist.minutes'),
    yFmt: (v) => num(v),
    series: [
      {
        name: `${smart(last.minutes)} ${t('unit.min')}`,
        cls: 's-id',
        pts: pts.map((p) => ({ x: p.year, y: p.minutes, weak: isWeak(p.price.status), tip: `${p.year}: ${smart(p.minutes)} ${t('unit.min')} · ${money(p.price.value!, 'IDR')}/kg` })),
      },
    ],
  });
  const idx = (v: number, b: number) => (v / b) * 100;
  const indexChart = lineChart({
    id: 'tsIndex',
    aria: t('hist.index'),
    yFmt: (v) => num(v),
    yMin: 80,
    series: [
      {
        name: t('hist.ump'),
        cls: 's-ink',
        pts: pts.map((p) => ({ x: p.year, y: idx(p.wage.value!, b0.wage.value!), tip: `${t('hist.ump')} ${p.year}: ${num(idx(p.wage.value!, b0.wage.value!))}` })),
      },
      {
        name: itemName.split(',')[0]!,
        cls: 's-id',
        pts: pts.map((p) => ({ x: p.year, y: idx(p.price.value!, b0.price.value!), tip: `${itemName} ${p.year}: ${num(idx(p.price.value!, b0.price.value!))}` })),
      },
    ],
  });
  const change = (last.minutes / first.minutes - 1) * 100;
  const table = `<table class="ts"><caption class="sr">${t('hist.table')}</caption><thead><tr><th scope="col">${t('hist.year')}</th><th scope="col">${t('hist.ump')}</th><th scope="col">${t(
    'hist.price',
  )}</th><th scope="col">${t('hist.mins')}</th></tr></thead><tbody>${pts
    .map(
      (p) =>
        `<tr><th scope="row">${p.year}</th><td>${provBtn(money(p.wage.value!, 'IDR'), `${t('hist.ump')} ${p.year}`, [p.wage])}</td><td>${provBtn(
          money(p.price.value!, 'IDR'),
          `${itemName} ${p.year}`,
          [p.price],
        )}</td><td>${smart(p.minutes)}</td></tr>`,
    )
    .join('')}</tbody></table>`;
  return `${head('hist.eyebrow', 'hist.title', 'hist.lede', 'history')}
  ${chips('histItem', t('hist.item'), d.timeseries.series.filter((x) => x.id !== 'ump').map((x) => ({ value: x.id, label: L(x.label).split(',')[0]! })), ui.histItem)}
  <div class="verdict">
    <div class="id"><small>${esc(itemName)} · ${first.year}</small><span class="big">${smart(first.minutes)}</span><small>${t('hist.mins').toLowerCase()}</small></div>
    <div class="id"><small>${esc(itemName)} · ${last.year}</small><span class="big">${smart(last.minutes)}</span><small>${t('hist.mins').toLowerCase()} · ${change > 0 ? '+' : ''}${pct(
      change,
    ).replace('%', '')}%</small></div>
  </div>
  <figure class="chartbox"><figcaption class="chart-title">${t('hist.minutes')}: ${esc(itemName.split(',')[0]!)}</figcaption>${minutesChart}</figure>
  <figure class="chartbox"><figcaption class="chart-title">${t('hist.index')}</figcaption>${indexChart}
    <div class="legend"><span><i class="sw s-ink-sw"></i>${t('hist.ump')}</span><span><i class="sw c-food"></i>${esc(itemName)}</span></div></figure>
  <details class="tabledetails"><summary>${t('hist.table')}</summary><div class="tablebox">${table}</div></details>
  <p class="note">${t('hist.note')}</p>
  <div class="foot">${shareBtn('history', ui.histItem)}</div>`;
}

// ---------------------------------------------------------------- 7 · calculator
export function calcSection(): string {
  const d = data();
  const p = byId(ui.calcPlace) ?? byId('jakarta');
  const idrPerUsd = byId('jakarta').fxPerUsd?.value ?? 1;
  const toIdr = (local: number) => (p.currency === 'IDR' ? local : (toUsd(local, p).value ?? NaN) * idrPerUsd);
  const monthlyHours = (ui.calcHours * 52) / 12;
  const ok = ui.calcWage > 0 && ui.calcHours > 0;
  const perMin = ok ? ui.calcWage / (monthlyHours * 60) : 0;
  const lines: { label: string; idr: number | null; inputs: Datum[] }[] = [];
  for (const it of d.prices.items) {
    const pr = priceOf(p, it.id);
    lines.push({ label: `${L(it.label)} (1 ${it.per})`, idr: pr?.value != null ? toIdr(pr.value) : null, inputs: pr ? [pr] : [] });
  }
  lines.push({ label: t('item.room'), idr: p.rent?.value != null ? toIdr(p.rent.value) : null, inputs: p.rent ? [p.rent] : [] });
  lines.push({ label: t('item.transit'), idr: p.transitFare?.value != null ? toIdr(p.transitFare.value) : null, inputs: p.transitFare ? [p.transitFare] : [] });
  for (const w of d.wishlist.items.filter((i) => !i.hidden)) {
    const loc = wishLocal(w, d.wishlist.items, p);
    lines.push({ label: L(w.label), idr: loc?.value != null ? toIdr(loc.value) : null, inputs: loc?.inputs ?? [] });
  }
  const mini = lines
    .map(
      (l) =>
        `<div class="r"><span>${esc(l.label)}</span><b>${
          l.idr === null || !ok ? `<span class="na">${l.idr === null ? t('notsold') : '–'}</span>` : provBtn(workTime(l.idr / perMin, wd()), l.label, l.inputs)
        }${statusTag(combined(l.inputs))}</b></div>`,
    )
    .join('');
  const b = basket(p, d.prices, d.method);
  const rLines = b.parts
    .map((x) => {
      const def = d.prices.items.find((i) => i.id === x.line.item);
      const name = x.line.item === 'rent' ? t('basket.room') : x.line.item === 'transit' ? t('basket.transitL') : def ? L(def.label) : x.line.item;
      const qty = x.line.item === 'rent' ? '' : ` ${num(x.line.qty)} ${x.line.per === 'ride' ? '×' : x.line.per}`;
      const idr = x.cost.value === null ? null : toIdr(x.cost.value);
      return { name: name + qty, idr };
    });
  const total = rLines.every((l) => l.idr !== null) ? rLines.reduce((s, l) => s + l.idr!, 0) : null;
  const receipt = `<div class="head">${t('calc.receipt')}</div><div class="head">${esc(L(p.city))} · ${esc(L(p.country))}</div><hr>${rLines
    .map((l) => `<div class="r"><span>${esc(l.name)}</span><span>${l.idr === null ? '–' : num(l.idr)}</span></div>`)
    .join('')}<hr><div class="r tot"><span>${t('calc.total')}</span><span>Rp${total === null ? '–' : num(total)}</span></div>${
    ok && total !== null
      ? `<div class="r"><span>= ${t('calc.workdays')}</span><span>${smart(total / perMin / (wd() * 60))}</span></div><div class="r tot"><span>${t('calc.left')}</span><span class="${
          ui.calcWage - total < 0 ? 'neg' : ''
        }">Rp${num(ui.calcWage - total)}</span></div>`
      : ''
  }<hr><div class="head">${t('calc.thanks')}</div>`;
  return `${head('calc.eyebrow', 'calc.title', undefined, 'calc')}
  <div class="split"><div class="calc">
    <div class="two">
      <div class="field"><label for="calcWage">${t('calc.wage')}</label><input id="calcWage" data-calc="calcWage" inputmode="numeric" autocomplete="off" value="${num(ui.calcWage)}"></div>
      <div class="field"><label for="calcHours">${t('calc.hours')}</label><input id="calcHours" data-calc="calcHours" inputmode="numeric" autocomplete="off" value="${num(ui.calcHours)}"></div>
    </div>
    <div class="field"><label for="calcPlace">${t('calc.place')}</label><select id="calcPlace" data-calc="calcPlace">${places()
      .map((x) => `<option value="${x.id}"${x.id === p.id ? ' selected' : ''}>${esc(L(x.city))}, ${esc(L(x.country))}</option>`)
      .join('')}</select></div>
    <p class="permin">${ok ? `${t('calc.permin')}: <b>Rp${num(perMin)}</b>` : `<span class="neg">${t('calc.invalid')}</span>`}</p>
    ${rankCalcCard()}
    <div class="mini">${mini}</div>
  </div><div class="receipt" aria-live="polite">${receipt}</div></div>`;
}

// ---------------------------------------------------------------- 8 · context
export function contextSection(): string {
  const reg = data().regions.regions;
  const bekasi = reg.find((r) => r.id === 'kota-bekasi')!;
  const jateng = reg.find((r) => r.id === 'ump-jawa-tengah')!;
  const src = (id: string) => {
    const s = source(id);
    return s?.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${t('ctx.source')}: ${esc(s.publisher)}</a>` : '';
  };
  return `${head('ctx.eyebrow', 'ctx.title', undefined, 'context')}
  <div class="context">
    <div class="red"><h3>${t('ctx.rice.t')}</h3><p>${t('ctx.rice.p')}</p><p>${t('ctx.rice.r')}</p><p class="src">${src('jakpost-wb-rice-2022')}</p></div>
    <div><h3>${t('ctx.wage.t')}</h3><p>${t('ctx.wage.p', {
      bekasi: provBtn(rpShort(bekasi.wage.value!), 'UMK Kota Bekasi 2026', [bekasi.wage]),
      jateng: provBtn(rpShort(jateng.wage.value!), 'UMP Jawa Tengah 2026', [jateng.wage]),
    })}</p></div>
    <div><h3>${t('ctx.rent.t')}</h3><p>${t('ctx.rent.p')}</p></div>
  </div>`;
}

// ---------------------------------------------------------------- 9 · data table
function cell(key: string, dt: Datum | undefined, label: string): string {
  if (!dt) return `<td><span class="na">–</span></td>`;
  const e = (dt as EditedDatum).edited;
  const tag = isWeak(dt.status) ? `<span class="tag tag-est" title="${t(`status.${dt.status}` as Key)}">~</span>` : '';
  if (dt.value === null) return `<td><span class="na">${t('notsold')}</span></td>`;
  return `<td><input aria-label="${esc(label)}" data-edit="${key}" inputmode="decimal" value="${dt.value}"${e ? ' class="edited"' : ''}>${tag}${provBtn('ⓘ', label, [dt], 'pv pv-i')}</td>`;
}

export function dataSection(): string {
  const d = data();
  const items = d.prices.items;
  const head1 = `<tr><th scope="col">${t('basket.city')}</th><th scope="col">${t('data.wage')}</th><th scope="col">${t('data.hours')}</th><th scope="col">${t(
    'data.fx',
  )}</th><th scope="col">${t('item.room')}</th><th scope="col">${t('item.transit')}</th>${items.map((i) => `<th scope="col">${esc(L(i.label))}</th>`).join('')}</tr>`;
  const body1 = places()
    .map((p) => {
      const c = L(p.city);
      return `<tr><th scope="row">${flag(p.iso2, L(p.country))} ${esc(c)} <small>${p.currency}</small></th>${cell(`place.${p.id}.wage`, p.wage, `${t('data.wage')} ${c} (${p.wage?.unit ?? ''})`)}${cell(
        `place.${p.id}.monthlyHours`,
        p.monthlyHours,
        `${t('data.hours')} ${c}`,
      )}${p.fxPerUsd ? cell(`place.${p.id}.fxPerUsd`, p.fxPerUsd, `${t('data.fx')} ${c}`) : '<td>1</td>'}${cell(`place.${p.id}.rent`, p.rent, `${t('item.room')} ${c}`)}${cell(
        `place.${p.id}.transitFare`,
        p.transitFare,
        `${t('item.transit')} ${c}`,
      )}${items.map((i) => cell(`price.${p.id}.${i.id}`, d.prices.prices[p.id]?.[i.id], `${L(i.label)} ${c}`)).join('')}</tr>`;
    })
    .join('');
  const countries = [...new Map(places().map((p) => [p.iso2, p])).values()];
  const head2 = `<tr><th scope="col"></th>${countries.map((p) => `<th scope="col">${flag(p.iso2, L(p.country))} ${esc(L(p.country))}</th>`).join('')}</tr>`;
  const body2 = d.wishlist.items
    .filter((w) => !w.bundle)
    .map(
      (w) =>
        `<tr><th scope="row">${esc(L(w.label))}</th>${countries
          .map((p) => {
            const pr = w.prices[p.iso2];
            return cell(`wish.${w.id}.${p.iso2}`, pr, `${L(w.label)} ${L(p.country)} (${pr?.unit ?? ''})`);
          })
          .join('')}</tr>`,
    )
    .join('');
  const n = editCount();
  const sources = d.sources.sources
    .map(
      (s) =>
        `<li id="src-${s.id}"><b>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)}</b> · ${esc(s.publisher)} · ${
          s.accessed ? `${t('data.accessed')} ${s.accessed}` : t('data.noaccess')
        }${s.note ? `<br><small>${esc(noteText(s.note))}</small>` : ''}</li>`,
    )
    .join('');
  return `${head('data.eyebrow', 'data.title', 'data.lede', 'data')}
  <div class="toolbar"><p class="note">${t('data.units')}</p><div class="tb-r">${n ? `<span class="tag tag-edit">${t('data.edits', { n: String(n) })}</span>` : ''}<button type="button" class="btn" data-action="reset"${
    n ? '' : ' disabled'
  }>${t('data.reset')}</button></div></div>
  <div class="tablebox"><table class="dt">${head1}${body1}</table></div>
  <div class="tablebox"><table class="dt">${head2}${body2}</table></div>
  <h3 class="h3">${t('data.method')}</h3><p class="note">${t('method.p1')}</p><p class="note">${t('method.p2')}</p>
  <h3 class="h3">${t('data.sources')}</h3><ul class="sources">${sources}</ul>`;
}

