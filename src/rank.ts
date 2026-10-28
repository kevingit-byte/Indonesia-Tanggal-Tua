// "Kamu di persentil berapa?": a household income placed in WID's income distribution for Indonesia and the world,
// or compared with BPS average wages. What the reader types stays in memory on this page: never stored, never sent.
import { icon } from './art/icons';
import { esc, num, rpShort, smart } from './format';
import { L, t } from './i18n';
import { basket, monthlyWage, wishLocal } from './lib/model';
import {
  averageBetween,
  centiles,
  factorsFrom,
  fromWid,
  growthOf,
  MAX_ADULTS,
  perAdultMonthly,
  percentileOf,
  productionTaxAdded,
  thresholdAt,
  tier,
  toWid,
  topShare,
  type Factors,
  type IncomeInput,
  type Position,
} from './lib/percentile';
import { data, ui } from './store';
import { provBtn, seg } from './ui';

interface RankState {
  lens: 'wid' | 'bps';
  amount: number;
  period: 'month' | 'year';
  adults: number;
  own: boolean;
  rent: number;
  hasShares: boolean;
  shares: number;
  pay: number;
  sector: string;
  sex: '' | 'male' | 'female';
  slide: number;
  includeIncome: boolean;
  /** Top share from a shared link (#rank-t42), shown until the reader enters their own income. */
  friendTop: number | null;
}

const st: RankState = {
  lens: 'wid',
  amount: 0,
  period: 'month',
  adults: 1,
  own: false,
  rent: 0,
  hasShares: false,
  shares: 0,
  pay: 0,
  sector: '',
  sex: '',
  slide: 0,
  includeIncome: false,
  friendTop: null,
};

const SLIDES = 6;
const wd = () => data().method.workdayHours;
const F = (): Factors => factorsFrom(data().widId);
const rp = (v: number) => `Rp${num(Math.round(v))}`;
/** Top share and its complement, rounded together so "top 42%" always sits next to "higher than 58%". */
const dec = (p: number) => (topShare(p) < 1 ? 3 : topShare(p) < 10 ? 1 : 0);
const trim = (s: string) => s.replace(/([,.]\d*?)0+$/, '$1').replace(/[,.]$/, '');
const fmtTop = (p: number) => trim(num(topShare(p), dec(p)));
const fmtP = (p: number) => trim(num(100 - topShare(p), dec(p)));
const ratio = (k: number) => (k >= 10 ? num(k, 0) : num(k, 1));
const pctText = (g: number) => `${g >= 0 ? '+' : '−'}${num(Math.abs(g) * 100, 0)}%`;

function input(): IncomeInput {
  return {
    amount: st.amount,
    period: st.period,
    adults: st.adults,
    imputedRent: st.own ? st.rent : 0,
    shares: st.hasShares ? st.shares : 0,
  };
}

/** Everything the result needs, computed once per refresh. */
function compute() {
  const f = F();
  const { widId: id, widWorld: wo } = data();
  const monthly = perAdultMonthly(input(), f);
  const x = toWid(monthly, f);
  const posId = percentileOf(x, id.groups);
  const posWo = percentileOf(x / f.ppp, wo.groups);
  return { f, id, wo, monthly, x, posId, posWo };
}

// ---------------------------------------------------------------- section
export function rankSection(): string {
  const lens = seg('rkLens', t('rk.lens'), [
    { value: 'wid', label: t('rk.lens.wid') },
    { value: 'bps', label: t('rk.lens.bps') },
  ], st.lens);
  return `<div class="sec-head"><div class="eyebrow">${t('rk.eyebrow')}</div><h2 id="rank-h">${t('rk.title')}</h2><p class="lede">${t('rk.lede')}</p></div>
  <p class="rk-privacy"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>${t('rk.privacy')}</p>
  <div class="toolbar">${lens}</div>
  ${st.lens === 'wid' ? widForm() : bpsForm()}
  <div id="rk-res" class="rk-res" aria-live="polite">${st.lens === 'wid' ? widResult() : bpsResult()}</div>`;
}

const moneyInput = (id: string, key: string, value: number, label: string, extra = '') =>
  `<div class="field rk-money"><label for="${id}">${label}</label><div class="rk-in"><span aria-hidden="true">Rp</span><input id="${id}" data-rk="${key}" inputmode="numeric" autocomplete="off" placeholder="0" value="${
    value ? num(value) : ''
  }"${extra}></div></div>`;

function widForm(): string {
  const r = data().widId.retainedEarningsRate?.value ?? 0;
  const people = Array.from({ length: MAX_ADULTS }, (_, i) =>
    `<span class="rk-person${i < st.adults ? ' on' : ''}" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M4 22c0-5 3.6-8 8-8s8 3 8 8z"/></svg></span>`,
  ).join('');
  return `<div id="rk-chips" class="rk-chips">${chipsHtml()}</div>
  <div class="rk-form">
    <div class="rk-step" id="rk-step1">
      ${moneyInput('rkAmount', 'amount', st.amount, t('rk.s1'))}
      <div class="rk-row">${seg('rkPeriod', t('rk.period'), [
        { value: 'month', label: t('rk.perMonth') },
        { value: 'year', label: t('rk.perYear') },
      ], st.period)}
      <details class="rk-help"><summary>${t('rk.help.q')}</summary><p>${t('rk.help')}</p></details></div>
    </div>
    <div class="rk-step" id="rk-step2">
      <div class="field"><label for="rkAdults">${t('rk.s2')}</label>
        <div class="rk-adults"><input type="range" id="rkAdults" data-rk="adults" min="1" max="${MAX_ADULTS}" step="1" value="${st.adults}" aria-valuetext="${adultsText()}"><span class="rk-people">${people}</span><output for="rkAdults" id="rk-adults-out">${adultsText()}</output></div>
      </div>
      <p class="rk-per" id="rk-per">${perAdultHtml()}</p>
      <p class="note">${t('rk.split')}</p>
    </div>
    <details class="rk-step rk-more" id="rk-step3"${st.own || st.hasShares ? ' open' : ''}><summary>${t('rk.s3')}</summary>
      <label class="rk-check"><input type="checkbox" data-rk="own"${st.own ? ' checked' : ''}> ${t('rk.own')}</label>
      ${st.own ? `${moneyInput('rkRent', 'rent', st.rent, t('rk.rent'))}<p class="note">${t('rk.rent.why')}</p>` : ''}
      <label class="rk-check"><input type="checkbox" data-rk="hasShares"${st.hasShares ? ' checked' : ''}> ${t('rk.shares')}</label>
      ${st.hasShares ? `${moneyInput('rkShares', 'shares', st.shares, t('rk.sharesV'))}<p class="note">${t('rk.shares.why', { r: `${num(r * 100, 1)}%` })}</p>` : ''}
    </details>
  </div>`;
}

const adultsText = () => (st.adults === 1 ? t('rk.adults1') : t('rk.adults', { n: st.adults >= MAX_ADULTS ? `${MAX_ADULTS}+` : String(st.adults) }));

function perAdultHtml(): string {
  if (!st.amount) return '';
  return t('rk.perAdult', { x: `<b>${rp(perAdultMonthly(input(), F()))}</b>` });
}

function chipsHtml(): string {
  if (!st.amount) return '';
  const chip = (target: string, text: string) =>
    `<button type="button" class="rk-chip" data-rk-go="${target}"><span>${esc(text)}</span><span class="rk-pen" aria-hidden="true">✎</span><span class="sr"> · ${t('rk.edit')}</span></button>`;
  const extras = [...(st.own ? [t('rk.chip.own')] : []), ...(st.hasShares ? [t('rk.chip.shares')] : [])].join(' · ') || t('rk.chip.none');
  return `<span class="rk-chips-l">${t('rk.answers')}</span>${chip('rkAmount', `${rp(st.amount)} ${st.period === 'month' ? t('rk.perMonth') : t('rk.perYear')}`)}${chip(
    'rkAdults',
    adultsText(),
  )}${chip('rk-step3', extras)}`;
}

// ---------------------------------------------------------------- WID result
function widResult(): string {
  if (!st.amount) {
    const friend =
      st.friendTop !== null
        ? `<p class="rk-friend">${st.friendTop <= 50 ? t('rk.friend', { x: num(st.friendTop) }) : t('rk.friendPct', { p: num(100 - st.friendTop) })}</p>`
        : '';
    return `${friend}<p class="rk-empty">${t('rk.empty')}</p><div class="rk-empty-card">${strip(null, 'id')}</div>${creditHtml()}`;
  }
  const c = compute();
  const { posId, monthly, f } = c;
  const p = posId.p;
  const headline = posId.aboveTop
    ? t('rk.top', { x: '0,001' })
    : p >= 50
      ? t('rk.top', { x: fmtTop(p) })
      : t('rk.pct', { p: fmtP(p) });
  const added = productionTaxAdded(monthly, f);
  const slides = [slideStrips(c), slideGap(c), slideThresholds(c), slideWork(c), slideGrowth(c), slideShare(c)];
  return `<div class="rk-head">
      <div class="rk-big">${headline}</div>
      <p>${posId.aboveTop ? t('rk.aboveTop') : t('rk.above', { p: fmtP(p) })} <span class="rk-tier tier-${tier(p)}">${t('rk.group')}: ${t(`rk.tier.${tier(p)}`)}</span></p>
      <details class="rk-adj"><summary>${t('rk.compared', { x: `<b>${rp(monthly + added)}</b>` })}</summary><p>${t('rk.taxNote', { x: rp(added) })}</p></details>
      <p class="rk-lens">${t('rk.lensWid', { y: String(c.id.year) })}</p>
    </div>
    ${carousel(slides)}
    ${creditHtml()}`;
}

function carousel(slides: { title: string; body: string }[]): string {
  const dots = slides
    .map((s, i) => `<button type="button" class="rk-dot${i === st.slide ? ' on' : ''}" data-rk-slide="${i}" aria-label="${esc(t('rk.slideOf', { i: String(i + 1), n: String(slides.length) }))}: ${esc(s.title)}"${i === st.slide ? ' aria-current="true"' : ''}></button>`)
    .join('');
  return `<section class="rk-car" aria-roledescription="carousel" aria-label="${t('rk.carousel')}">
    <div class="rk-car-nav"><button type="button" class="btn rk-nav" data-rk-step="-1" aria-label="${t('rk.prev')}">←</button><div class="rk-dots">${dots}</div><button type="button" class="btn rk-nav" data-rk-step="1" aria-label="${t('rk.next')}">→</button></div>
    <div class="rk-track" id="rk-track" tabindex="0">${slides
      .map(
        (s, i) =>
          `<div class="rk-slide" role="group" aria-roledescription="slide" aria-label="${esc(t('rk.slideOf', { i: String(i + 1), n: String(slides.length) }))}"><h3 class="h3">${s.title}</h3>${s.body}</div>`,
      )
      .join('')}</div>
  </section>`;
}

type C = ReturnType<typeof compute>;

/** 100 bars, one per percentile; grey below the reader, gold above, rupiah red for the reader. */
function strip(pos: Position | null, where: 'id' | 'wo'): string {
  const at = pos ? Math.min(99, Math.round(pos.p)) : -1;
  const bars = Array.from({ length: 100 }, (_, i) => {
    const cls = i === at ? 'me' : i < at ? 'lo' : 'hi';
    return `<rect class="${pos ? cls : 'q'}" x="${i * 4 + 0.5}" y="0" width="3" height="50"/>`;
  }).join('');
  const pin = (left: number, text: string, cls: string) =>
    `<span class="rk-pin ${cls}" style="left:${left.toFixed(2)}%" aria-hidden="true">${text}</span>`;
  const marker = at >= 0 ? pin(at + 0.5, `${t('rk.you')}<i></i>`, at < 6 ? 'l' : at > 93 ? 'r' : '') : pin(50, '?<i></i>', 'q');
  // Before any income is entered, the tooltip starts at the median.
  const tipAt = at >= 0 ? at : 50;
  const label = where === 'id' ? t('rk.indonesia') : t('rk.world');
  const sub = pos
    ? `<span class="rk-at">${pos.aboveTop ? t('rk.top', { x: '0,001' }) : t('rk.youAt', { p: fmtP(pos.p), x: fmtTop(pos.p) })}</span>`
    : '';
  return `<div class="rk-strip" data-where="${where}" data-at="${at}">
    <div class="rk-strip-h"><b>${label}</b>${sub}</div>
    <div class="rk-strip-b">${marker}<svg viewBox="0 0 400 50" role="slider" tabindex="0" aria-label="${esc(t('rk.stripAria', { where: label }))}" aria-valuemin="0" aria-valuemax="99" aria-valuenow="${tipAt}" aria-valuetext="${esc(tipText(tipAt, where))}" preserveAspectRatio="none">${bars}</svg></div>
    <div class="rk-brackets" aria-hidden="true"><span style="width:50%">${t('rk.b50')}</span><span style="width:40%">${t('rk.m40')}</span><span style="width:10%"><em>${t('rk.t10')}</em></span></div>
    <p class="rk-tip">${esc(tipText(tipAt, where))}</p>
  </div>`;
}

/** Tooltip text for percentile i, in rupiah per adult per month on the reader's basis. */
function tipText(i: number, where: 'id' | 'wo'): string {
  const f = F();
  const w = where === 'id' ? data().widId : data().widWorld;
  const k = where === 'id' ? 1 : f.ppp;
  const thr = fromWid(thresholdAt(i, w.groups) * k, f);
  const avg = fromWid(averageBetween(i, i + 1, w.groups) * k, f);
  const k1 = (v: number) => rp(Math.round(v / 1000) * 1000);
  return t('rk.tip', { p: String(i), avg: k1(avg), thr: k1(thr) });
}

function slideStrips(c: C) {
  const ppp = num(Math.round(c.f.ppp));
  const below = fmtP(c.posId.p);
  return {
    title: t('rk.sl.strips'),
    body: `<p class="note">${t('rk.sl.strips.sub')}</p>
      ${strip(c.posId, 'id')}
      <p class="rk-split"><span class="lo-t">${t('rk.poorer', { p: below })}</span> · <span class="hi-t">${t('rk.richer', { x: fmtTop(c.posId.p) })}</span></p>
      ${strip(c.posWo, 'wo')}
      <p class="note">${t('rk.worldNote', { ppp })} ${t('rk.stripHelp')}</p>`,
  };
}

function slideGap(c: C) {
  const { f, id, wo, monthly } = c;
  const cen = centiles(id.groups).map((x) => fromWid(x.average, f));
  const top1 = fromWid(averageBetween(99, 100, id.groups), f);
  const bottom50 = fromWid(averageBetween(0, 50, id.groups), f);
  const top1Wo = fromWid(averageBetween(99, 100, wo.groups) * f.ppp, f);
  const max = cen[98]! * 1.12;
  const W = 400, H = 170, bw = 4;
  const at = Math.min(99, Math.round(c.posId.p));
  const bars = cen
    .map((v, i) => {
      const h = Math.min(H - 14, (v / max) * (H - 14));
      return `<rect class="${i === at ? 'me' : i < at ? 'lo' : 'hi'}" x="${i * bw + 0.5}" y="${H - h}" width="3" height="${h}"/>`;
    })
    .join('');
  const yMe = H - Math.min(H - 14, (monthly / max) * (H - 14));
  const cut = `<path class="cut" d="M392 ${18}l10 -4M392 ${23}l10 -4"/>`;
  const ticks = [0.25, 0.5, 0.75].map((q) => {
    const v = max * q;
    const y = H - q * (H - 14);
    return `<line class="grid" x1="0" x2="${W}" y1="${y}" y2="${y}"/><text class="ax" x="2" y="${y - 3}">${rpShort(v)}</text>`;
  }).join('');
  const below = monthly < bottom50;
  return {
    title: t('rk.sl.gap'),
    body: `<figure class="rk-fig"><figcaption class="note">${t('rk.gap.chart')}</figcaption>
      <svg viewBox="0 0 ${W} ${H + 4}" role="img" aria-label="${esc(t('rk.gap.chart'))}">${ticks}${bars}${cut}<line class="me-l" x1="0" x2="${W}" y1="${yMe}" y2="${yMe}"/><text class="me-t" x="4" y="${Math.max(10, yMe - 4)}">${t('rk.you')} · ${rpShort(monthly)}</text></svg>
      <p class="note">${t('rk.gap.cut', { x: rpShort(top1) })}</p></figure>
      <ul class="rk-facts">
        <li>${t('rk.gap.top1', { x: `<b>${rpShort(top1)}</b>`, k: `<b>${ratio(top1 / monthly)}</b>` })}</li>
        <li>${below ? t('rk.gap.bottomBelow', { x: rpShort(bottom50) }) : t('rk.gap.bottom', { k: `<b>${ratio(monthly / bottom50)}</b>`, x: rpShort(bottom50) })}</li>
        <li>${t('rk.gap.world', { k: `<b>${ratio(top1Wo / monthly)}</b>` })}</li>
      </ul>`,
  };
}

function slideThresholds(c: C) {
  const { f, id, wo, monthly } = c;
  const rows = [50, 10, 5, 1, 0.1]
    .map((top) => {
      const p = 100 - top;
      const thr = fromWid(thresholdAt(p, id.groups), f);
      const thrWo = fromWid(thresholdAt(p, wo.groups) * f.ppp, f);
      const reached = monthly >= thr;
      return `<tr class="${reached ? 'ok' : ''}"><th scope="row">${reached ? '<span class="tick" aria-hidden="true">✓</span>' : ''}${t('rk.thr.top', { x: num(top, top < 1 ? 1 : 0) })}</th><td>${rpShort(thr)}${st.adults > 1 ? `<small>${t('rk.thr.houseShort', { x: rpShort(thr * st.adults) })}</small>` : ''}</td><td>${rpShort(thrWo)}</td></tr>`;
    })
    .join('');
  return {
    title: t('rk.sl.thr'),
    body: `<div><table class="rk-thr"><thead><tr><th scope="col">${t('rk.thr.group')}</th><th scope="col">${t('rk.thr.adult')}</th><th scope="col">${t('rk.thr.world')}</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="note">${t('rk.thr.note')}</p>`,
  };
}

function slideWork(c: C) {
  const d = data();
  const jkt = d.places.places.find((p) => p.id === 'jakarta')!;
  const hours = jkt.monthlyHours?.value ?? 173;
  const median = fromWid(thresholdAt(50, c.id.groups), c.f);
  const ump = monthlyWage(jkt, wd());
  const people = [
    { label: t('rk.work.you'), m: c.monthly, me: true, inputs: [] as Parameters<typeof provBtn>[2] },
    { label: t('rk.work.median'), m: median, me: false, inputs: [] },
    { label: t('rk.work.ump'), m: ump.value ?? NaN, me: false, inputs: ump.inputs },
  ];
  const items = ['iphone', 'europe']
    .map((id) => {
      const item = d.wishlist.items.find((i) => i.id === id);
      const price = item ? wishLocal(item, d.wishlist.items, jkt) : undefined;
      return item && price?.value ? { id, label: L(item.label), price: price.value, inputs: price.inputs } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const bk = basket(jkt, d.prices, d.method).total;
  const cell = (m: number, price: number, inputs: Parameters<typeof provBtn>[2], label: string) => {
    const days = price / (m / (hours * 60)) / (wd() * 60);
    return provBtn(`${smart(days)} ${t('unit.day')}`, label, inputs);
  };
  const who = (p: (typeof people)[number]) => `<span class="${p.me ? 'me' : ''}"><small>${esc(p.label)} · ${rpShort(p.m)}</small>`;
  const rows = items
    .map((it) => `<div class="rk-wi"><div class="rk-wi-t">${icon(it.id)}${esc(it.label)}</div><div class="rk-wi-c">${people.map((p) => `${who(p)}${cell(p.m, it.price, it.inputs, `${it.label}, ${p.label}`)}</span>`).join('')}</div></div>`)
    .join('');
  const bRow =
    bk.value !== null
      ? `<div class="rk-wi"><div class="rk-wi-t">${icon('rice')}${t('rk.work.basket')}</div><div class="rk-wi-c">${people
          .map((p) => `${who(p)}${provBtn(t('rk.work.ofIncome', { x: `${num((bk.value! / p.m) * 100, 0)}%` }), `${t('rk.work.basket')}, ${p.label}`, bk.inputs)}</span>`)
          .join('')}</div></div>`
      : '';
  return {
    title: t('rk.sl.work'),
    body: `<p>${t('rk.work.lede', { h: num(hours) })}</p><div class="rk-work">${rows}${bRow}</div><p class="note">${t('rk.work.note')}</p>`,
  };
}

function slideGrowth(c: C) {
  const { id } = c;
  const g = growthOf(id);
  const vals = g.filter((x): x is number => x !== null);
  const lo = Math.min(0, ...vals), hi = Math.max(...vals);
  const W = 400, H = 160, pad = 18;
  const y = (v: number) => H - pad - ((v - lo) / (hi - lo)) * (H - 2 * pad);
  const pts = g.map((v, i) => (v === null ? null : `${i * 4 + 2},${y(v).toFixed(1)}`));
  const path = pts.reduce((acc, p, i) => (p ? acc + `${acc && pts[i - 1] ? 'L' : 'M'}${p}` : acc), '');
  const at = Math.min(99, Math.round(c.posId.p));
  const mine = g[at];
  const gp = id.growth.percentiles;
  const avg = (a: number, b: number, k: 'from' | 'to') => gp.slice(a, b).reduce((s, x) => s + x[k], 0) / (b - a);
  const top1 = gp[99]!.to / gp[99]!.from - 1;
  const bottom = avg(0, 50, 'to') / avg(0, 50, 'from') - 1;
  const zero = `<line class="grid" x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}"/>`;
  const ticks = [hi / 2, hi].map((v) => `<line class="grid" x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="2" y="${y(v) - 3}">${pctText(v)}</text>`).join('');
  return {
    title: t('rk.sl.growth', { from: String(id.growth.from) }),
    body: `<figure class="rk-fig"><figcaption class="note">${t('rk.growth.chart', { from: String(id.growth.from), to: String(id.growth.to) })}</figcaption>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('rk.growth.chart', { from: String(id.growth.from), to: String(id.growth.to) }))}">${zero}${ticks}<path class="gl" d="${path}"/>${
        mine !== null && mine !== undefined ? `<circle class="me-d" cx="${at * 4 + 2}" cy="${y(mine)}" r="5"/>` : ''
      }<text class="ax" x="2" y="${H - 2}">p0</text><text class="ax" x="${W - 2}" y="${H - 2}" text-anchor="end">p99</text></svg></figure>
      <ul class="rk-facts">${mine !== null && mine !== undefined ? `<li>${t('rk.growth.you', { p: String(at), g: `<b>${pctText(mine)}</b>`, from: String(id.growth.from) })}</li>` : ''}
      <li>${t('rk.growth.top1', { g: pctText(top1), h: pctText(bottom) })}</li></ul>`,
  };
}

function cardText(p: number, aboveTop: boolean): string {
  return aboveTop ? t('rk.card.top', { x: '0,001' }) : p >= 50 ? t('rk.card.top', { x: fmtTop(p) }) : t('rk.card.pct', { p: fmtP(p) });
}

function slideShare(c: C) {
  const text = `${cardText(c.posId.p, c.posId.aboveTop)} ${t('rk.card.ask')}`;
  return {
    title: t('rk.sl.share'),
    body: `<p>${t('rk.share.lede')}</p>
      <canvas id="rk-card" width="1200" height="630" class="rk-card" role="img" aria-label="${esc(t('rk.card.alt', { text }))}"></canvas>
      <div class="rk-share-btns"><button type="button" class="btn" data-rk-share="image">${t('rk.share.img')}</button><button type="button" class="btn" data-rk-share="download">${t('rk.share.dl')}</button><button type="button" class="btn" data-rk-share="link">${t('rk.share.link')}</button></div>
      <label class="rk-check"><input type="checkbox" data-rk="includeIncome"${st.includeIncome ? ' checked' : ''}> ${t('rk.share.opt')}</label>
      <p class="note">${t('rk.share.optNote')}</p>`,
  };
}

function creditHtml(): string {
  const w = data().widId;
  const wid = `<a href="https://wid.world/" target="_blank" rel="noopener">World Inequality Database (WID.world)</a>`;
  const f = F();
  const lines = [
    t('rk.method.1', { r: `${num((w.retainedEarningsRate?.value ?? 0) * 100, 1)}%` }),
    t('rk.method.2'),
    t('rk.method.3', { c: num(f.cpi, 4), t: num(f.taxShare, 3) }),
    t('rk.method.4'),
    t('rk.method.5', { ppp: num(Math.round(f.ppp)) }),
    t('rk.method.6'),
  ];
  const srcs = [w.cpiToPriceYear!, w.productionTaxShare!, w.pppPerUsd!, w.retainedEarningsRate!];
  return `<div class="rk-credit"><p class="note">${t('rk.credit', { wid, y: String(w.year), py: String(w.priceYear), d: w.downloaded })} ${provBtn(
    '⧉',
    t('rk.method.q'),
    [{ value: w.mean, unit: w.unit, asOf: w.asOf, sourceId: w.sourceId, status: w.status, note: w.concept }, ...srcs],
  )}</p>
    <details class="rk-method"><summary>${t('rk.method.q')}</summary><ol>${lines.map((l) => `<li>${l}</li>`).join('')}</ol></details></div>`;
}

// ---------------------------------------------------------------- BPS lens
function bpsForm(): string {
  const b = data().bps;
  const opts = [`<option value="">${t('rk.bps.allSectors')}</option>`, ...b.bySector.map((s) => `<option value="${s.id}"${s.id === st.sector ? ' selected' : ''}>${esc(L(s.label))}</option>`)].join('');
  return `<div class="rk-form">
    ${moneyInput('rkPay', 'pay', st.pay, t('rk.bps.amount'))}
    <div class="field"><label for="rkSector">${t('rk.bps.sector')}</label><select id="rkSector" data-rk="sector">${opts}</select></div>
    <div class="field"><span class="rk-lab" id="rkSexL">${t('rk.bps.sex')}</span>${seg('rkSex', t('rk.bps.sex'), [
      { value: '', label: t('rk.bps.sexNone') },
      { value: 'male', label: t('rk.bps.male') },
      { value: 'female', label: t('rk.bps.female') },
    ], st.sex)}</div>
  </div>`;
}

function bpsResult(): string {
  const b = data().bps;
  const nat = b.national.value ?? NaN;
  const caveat = `<p class="rk-caveat">${t('rk.bps.caveat')}</p><p class="rk-lens">${t('rk.lensBps', { s: b.survey })}</p>`;
  if (!st.pay) return `<p class="rk-empty">${t('rk.empty')}</p>${caveat}`;
  const sec = b.bySector.find((s) => s.id === st.sector);
  const sex = st.sex ? b.bySex[st.sex] : null;
  const lines = [
    `<li>${t('rk.bps.nat', { x: provBtn(rp(nat), t('rk.lens.bps'), [b.national]), s: b.survey })}</li>`,
    sec?.wage.value ? `<li>${t('rk.bps.sec', { k: `<b>${ratio(st.pay / sec.wage.value)}</b>`, name: esc(L(sec.label)), x: provBtn(rp(sec.wage.value), L(sec.label), [sec.wage]) })}</li>` : '',
    sex?.value ? `<li>${t('rk.bps.sexLine', { k: `<b>${ratio(st.pay / sex.value)}</b>`, sex: t(`rk.bps.${st.sex as 'male' | 'female'}`), x: provBtn(rp(sex.value), t(`rk.bps.${st.sex as 'male' | 'female'}`), [sex]) })}</li>` : '',
  ].join('');
  const rows = [...b.bySector].sort((x, y) => (y.wage.value ?? 0) - (x.wage.value ?? 0));
  const max = Math.max(st.pay, ...rows.map((r) => r.wage.value ?? 0)) * 1.05;
  const bars = rows
    .map(
      (r) =>
        `<div class="rk-bar${r.id === st.sector ? ' sel' : ''}"><span class="lab">${esc(L(r.label))}</span><span class="track"><i style="width:${(((r.wage.value ?? 0) / max) * 100).toFixed(1)}%"></i></span><span class="v">${rpShort(r.wage.value ?? 0)}</span></div>`,
    )
    .join('');
  const me = `${((st.pay / max) * 100).toFixed(1)}%`;
  return `<div class="rk-head"><div class="rk-big">${t('rk.bps.head', { k: ratio(st.pay / nat) })}</div><ul class="rk-facts">${lines}</ul></div>
    <figure class="rk-fig"><figcaption class="note">${t('rk.bps.chart', { s: b.survey })}</figcaption><p class="rk-me-key"><i aria-hidden="true"></i>${t('rk.bps.you')}: ${rpShort(st.pay)}</p><div class="rk-bars" style="--me:${me}">${bars}</div></figure>
    ${caveat}`;
}

// ---------------------------------------------------------------- calculator card (uses the calculator's pay as 1 adult)
export function rankCalcCard(): string {
  if (!(ui.calcWage > 0)) return '';
  const f = F();
  const pos = percentileOf(toWid(ui.calcWage, f), data().widId.groups);
  const text = pos.p >= 50 || pos.aboveTop ? t('rk.calc', { x: pos.aboveTop ? '0,001' : fmtTop(pos.p) }) : t('rk.calcPct', { p: fmtP(pos.p) });
  return `<div class="rk-calc"><p>${text}</p><a href="#rank" class="btn" data-rk-from-calc>${t('rk.calc.cta')}</a></div>`;
}

// ---------------------------------------------------------------- hash: #rank-t42 (top share only) or, if the reader opts in, #rank-i10000000-a2-y
export function readRankHash(hash: string) {
  const m = /^#rank-(.*)$/.exec(decodeURIComponent(hash));
  if (!m) return;
  const parts = m[1]!.split('-');
  for (const part of parts) {
    if (/^t[\d.]+$/.test(part)) st.friendTop = Math.min(100, Math.max(0, Number(part.slice(1))));
    if (/^i\d+$/.test(part)) st.amount = Number(part.slice(1));
    if (/^a\d$/.test(part)) st.adults = Math.min(MAX_ADULTS, Math.max(1, Number(part.slice(1))));
    if (part === 'y') st.period = 'year';
  }
}

function shareUrl(): string {
  const c = compute();
  const top = c.posId.aboveTop ? 0.001 : topShare(c.posId.p);
  const choice = st.includeIncome ? `i${Math.round(st.amount)}-a${st.adults}${st.period === 'year' ? '-y' : ''}` : `t${top}`;
  return `${location.origin}${location.pathname}#rank-${choice}`;
}

// ---------------------------------------------------------------- share card
async function drawCard(): Promise<HTMLCanvasElement | null> {
  const cv = document.getElementById('rk-card') as HTMLCanvasElement | null;
  if (!cv || !st.amount) return cv;
  const c = compute();
  const g = cv.getContext('2d');
  if (!g) return cv;
  try {
    await document.fonts?.ready;
  } catch {
    /* fonts unavailable: system fallback is fine */
  }
  const W = 1200, H = 630;
  g.fillStyle = '#f3f5f3';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#c2303a';
  g.fillRect(0, 0, W, 14);
  g.fillStyle = '#16201e';
  g.font = '800 34px Archivo, system-ui, sans-serif';
  g.fillText('⏱ Berapa Jam Kerja', 70, 92);
  g.font = '800 76px Archivo, system-ui, sans-serif';
  const line = cardText(c.posId.p, c.posId.aboveTop);
  wrap(g, line, 70, 210, W - 140, 86);
  g.fillStyle = '#c2303a';
  g.font = '800 60px Archivo, system-ui, sans-serif';
  g.fillText(t('rk.card.ask'), 70, 400);
  // the strip
  const at = Math.min(99, Math.round(c.posId.p));
  const x0 = 70, bw = (W - 140) / 100;
  for (let i = 0; i < 100; i++) {
    g.fillStyle = i === at ? '#c2303a' : i < at ? '#b9c2bf' : '#b8860b';
    g.fillRect(x0 + i * bw + 1, i === at ? 440 : 452, bw - 2, i === at ? 80 : 56);
  }
  g.fillStyle = '#56635f';
  g.font = '400 24px "IBM Plex Sans", system-ui, sans-serif';
  g.fillText(`${t('rk.b50')}`, x0, 556);
  g.fillText(`${t('rk.m40')}`, x0 + bw * 50, 556);
  g.textAlign = 'right';
  g.fillText(`${t('rk.t10')}`, W - 70, 556);
  g.textAlign = 'left';
  g.font = '400 22px "IBM Plex Sans", system-ui, sans-serif';
  g.fillText(`indonesia-tanggal-tua.vercel.app · data: WID.world ${c.id.year}`, 70, 604);
  return cv;
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > max && line) {
      g.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = test;
  }
  g.fillText(line, x, y);
}

async function share(kind: string, btn: HTMLElement) {
  if (kind === 'link') {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = t('rk.share.copied');
    } catch {
      prompt(t('rk.share.link'), url);
    }
    return;
  }
  const cv = await drawCard();
  if (!cv) return;
  const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, 'image/png'));
  if (!blob) return;
  const file = new File([blob], 'posisi-pendapatan.png', { type: 'image/png' });
  if (kind === 'image' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: `${cardText(compute().posId.p, compute().posId.aboveTop)} ${t('rk.card.ask')}`, url: shareUrl() });
      return;
    } catch {
      /* dismissed */
      return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------------------------------------------------------------- live updates without re-rendering the form
function refresh() {
  const res = document.getElementById('rk-res');
  if (!res) return;
  res.innerHTML = st.lens === 'wid' ? widResult() : bpsResult();
  const chips = document.getElementById('rk-chips');
  if (chips) chips.innerHTML = chipsHtml();
  const per = document.getElementById('rk-per');
  if (per) per.innerHTML = perAdultHtml();
  const track = document.getElementById('rk-track');
  if (track) track.scrollLeft = st.slide * track.clientWidth;
  drawCard();
}

function rerender() {
  const el = document.getElementById('rank');
  if (!el) return;
  const active = document.activeElement as HTMLElement | null;
  const id = active?.id;
  el.innerHTML = rankSection();
  if (id) document.getElementById(id)?.focus({ preventScroll: true });
  refresh();
}

function goSlide(i: number) {
  st.slide = Math.max(0, Math.min(SLIDES - 1, i));
  const track = document.getElementById('rk-track');
  track?.scrollTo({ left: st.slide * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  updateDots();
}

function updateDots() {
  document.querySelectorAll<HTMLElement>('.rk-dot').forEach((d, i) => {
    d.classList.toggle('on', i === st.slide);
    if (i === st.slide) d.setAttribute('aria-current', 'true');
    else d.removeAttribute('aria-current');
  });
}

/** Typed digits → "10.000.000", keeping the caret after the same digit. */
function formatMoneyInput(el: HTMLInputElement): number {
  const caret = el.selectionStart ?? el.value.length;
  const digitsBefore = el.value.slice(0, caret).replace(/\D/g, '').length;
  const n = Number(el.value.replace(/\D/g, '').slice(0, 15)) || 0;
  el.value = n ? num(n) : '';
  let pos = 0, seen = 0;
  while (pos < el.value.length && seen < digitsBefore) {
    if (/\d/.test(el.value[pos]!)) seen++;
    pos++;
  }
  el.setSelectionRange(pos, pos);
  return n;
}

function moveStrip(svg: Element, i: number) {
  const box = svg.closest<HTMLElement>('.rk-strip')!;
  const where = box.dataset.where as 'id' | 'wo';
  const text = tipText(i, where);
  svg.setAttribute('aria-valuenow', String(i));
  svg.setAttribute('aria-valuetext', text);
  box.querySelector('.rk-tip')!.textContent = text;
  box.querySelectorAll('rect').forEach((r, k) => r.classList.toggle('cur', k === i));
}

export function bindRank() {
  document.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    const k = el.dataset.rk;
    if (!k) return;
    if (k === 'amount' || k === 'rent' || k === 'shares' || k === 'pay') {
      st[k] = formatMoneyInput(el);
      if (k === 'amount' && st.amount) st.friendTop = null;
    } else if (k === 'adults') {
      st.adults = Number(el.value);
      el.setAttribute('aria-valuetext', adultsText());
      const out = document.getElementById('rk-adults-out');
      if (out) out.textContent = adultsText();
      document.querySelectorAll('.rk-person').forEach((p, i) => p.classList.toggle('on', i < st.adults));
    } else return;
    refresh();
  });
  document.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement;
    const k = el.dataset.rk;
    if (k === 'own' || k === 'hasShares') {
      st[k] = el.checked;
      rerender();
    } else if (k === 'includeIncome') st.includeIncome = el.checked;
    else if (k === 'sector') {
      st.sector = el.value;
      refresh();
    }
  });
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const set = target.closest<HTMLElement>('[data-set^="rk"]');
    if (set) {
      e.stopImmediatePropagation();
      const v = set.dataset.value!;
      if (set.dataset.set === 'rkLens') {
        st.lens = v as RankState['lens'];
        rerender();
      } else if (set.dataset.set === 'rkPeriod') {
        st.period = v as RankState['period'];
        set.parentElement?.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === set)));
        refresh();
      } else if (set.dataset.set === 'rkSex') {
        st.sex = v as RankState['sex'];
        set.parentElement?.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === set)));
        refresh();
      }
      return;
    }
    const go = target.closest<HTMLElement>('[data-rk-go]');
    if (go) {
      const el = document.getElementById(go.dataset.rkGo!);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.querySelector('summary')?.focus();
      } else el?.focus();
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    const step = target.closest<HTMLElement>('[data-rk-step]');
    if (step) return goSlide(st.slide + Number(step.dataset.rkStep));
    const dot = target.closest<HTMLElement>('[data-rk-slide]');
    if (dot) return goSlide(Number(dot.dataset.rkSlide));
    const sh = target.closest<HTMLElement>('[data-rk-share]');
    if (sh) return void share(sh.dataset.rkShare!, sh);
    if (target.closest('[data-rk-from-calc]')) {
      st.lens = 'wid';
      st.amount = ui.calcWage;
      st.period = 'month';
      st.adults = 1;
      st.friendTop = null;
      setTimeout(rerender, 0);
    }
  }, true);
  document.addEventListener(
    'scroll',
    (e) => {
      const tr = e.target as HTMLElement;
      if (tr.id !== 'rk-track') return;
      const i = Math.round(tr.scrollLeft / tr.clientWidth);
      if (i !== st.slide) {
        st.slide = i;
        updateDots();
      }
    },
    true,
  );
  document.addEventListener('keydown', (e) => {
    const el = e.target as HTMLElement;
    if (el.id === 'rk-track' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      goSlide(st.slide + (e.key === 'ArrowRight' ? 1 : -1));
    }
    if (el.matches('.rk-strip svg') && ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const now = Number(el.getAttribute('aria-valuenow'));
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? 99 : Math.max(0, Math.min(99, now + (e.key === 'ArrowRight' ? 1 : -1)));
      moveStrip(el, next);
    }
  });
  document.addEventListener('pointermove', (e) => {
    const svg = (e.target as Element).closest?.('.rk-strip svg');
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    moveStrip(svg, Math.max(0, Math.min(99, Math.round(((e.clientX - r.left) / r.width) * 100))));
  });
}

/** Called after a full page render, so the canvas card is drawn once the section is in the DOM. */
export function afterRankRender() {
  const track = document.getElementById('rk-track');
  if (track) track.scrollLeft = st.slide * track.clientWidth;
  drawCard();
}
