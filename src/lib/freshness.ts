// Is every number still current? Each value gets an indicator kind with a publishing cadence (data/freshness.json);
// its age is counted from asOf. Shared by the data status page and check-data, so both judge the same way.
import type {
  BpsWagesFile,
  Datum,
  FreshnessFile,
  PlacesFile,
  PricesFile,
  RegionsFile,
  Status,
  TimeseriesFile,
  WidFile,
  WishlistFile,
} from '../data/types';

export type Freshness = 'current' | 'due' | 'overdue';

export interface Entry {
  kind: string;
  /** Where the value lives, e.g. "Jakarta · rice". */
  where: string;
  datum: Datum;
}

export interface Judged extends Entry {
  /** The date age is counted from: asOf, or the source's last read for "checked" kinds. */
  since: string;
  ageDays: number;
  /** Date after which the value is due for an update. */
  dueOn: string;
  freshness: Freshness;
}

export interface Sources {
  places: PlacesFile;
  prices: PricesFile;
  wishlist: WishlistFile;
  regions: RegionsFile;
  timeseries: TimeseriesFile;
  widId: WidFile;
  widWorld: WidFile;
  bps: BpsWagesFile;
}

const PRICE_KIND: Record<string, string> = { rice: 'food', eggs: 'food', chicken: 'food', beef: 'food', oil: 'food', petrol: 'petrol', electricity: 'electricity' };
const WISH_KIND: Record<string, string> = {
  latte: 'latte',
  bigmac: 'bigmac',
  netflix: 'subscriptions',
  bts: 'concert',
  'flight-paris': 'flights',
  'schengen-visa': 'visa',
};

/** Every dated value the site shows, tagged with its indicator kind. Labels use ids, not translated names. */
export function entries(d: Sources): Entry[] {
  const out: Entry[] = [];
  const add = (kind: string, where: string, datum: Datum | undefined) => {
    if (datum && datum.value !== null) out.push({ kind, where, datum });
  };
  for (const p of d.places.places) {
    add('wage', `${p.id} · wage`, p.wage);
    add('fx', `${p.id} · fx`, p.fxPerUsd);
    add('rent', `${p.id} · rent`, p.rent);
    add('transit', `${p.id} · transit`, p.transitFare);
  }
  for (const [pid, row] of Object.entries(d.prices.prices))
    for (const [item, datum] of Object.entries(row)) add(PRICE_KIND[item] ?? 'food', `${pid} · ${item}`, datum);
  for (const item of d.wishlist.items)
    for (const [iso, datum] of Object.entries(item.prices)) add(WISH_KIND[item.id] ?? 'gadgets', `${item.id} · ${iso}`, datum);
  for (const r of d.regions.regions) add('wage', `${r.id}`, r.wage);
  for (const [item, datum] of Object.entries(d.regions.nationalPrices)) add('food', `national · ${item}`, datum);
  for (const s of d.timeseries.series) {
    const last = s.points[s.points.length - 1];
    if (last) add('history', `${s.id} · ${last.year}`, last);
  }
  for (const w of [d.widId, d.widWorld])
    add('wid', `${w.region} · distribution ${w.year}`, { value: w.mean, unit: w.unit, asOf: w.asOf, sourceId: w.sourceId, status: w.status });
  add('wid', 'ID · production taxes', d.widId.productionTaxShare);
  add('wid', 'ID · PPP', d.widId.pppPerUsd);
  add('wid', 'ID · retained earnings', d.widId.retainedEarningsRate);
  add('cpi', 'ID · CPI', d.widId.cpiToPriceYear);
  add('bps', 'national', d.bps.national);
  add('bps', 'male', d.bps.bySex.male);
  add('bps', 'female', d.bps.bySex.female);
  for (const s of d.bps.bySector) add('bps', s.id, s.wage);
  return out;
}

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** `accessed` returns the day a source was last read (YYYY-MM-DD), or null. */
export function judge(e: Entry, f: FreshnessFile, today: Date, accessed: (sourceId: string) => string | null): Judged {
  const k = f.kinds[e.kind];
  const read = k?.basis === 'checked' ? accessed(e.datum.sourceId) : null;
  const since = read && read > e.datum.asOf ? read : e.datum.asOf;
  const asOf = Date.parse(since);
  const ageDays = Math.floor((today.getTime() - asOf) / DAY);
  const cadence = k?.cadenceDays ?? 365;
  const grace = k?.graceDays ?? 30;
  const freshness: Freshness = ageDays <= cadence ? 'current' : ageDays <= cadence + grace ? 'due' : 'overdue';
  return { ...e, since, ageDays, dueOn: iso(asOf + cadence * DAY), freshness };
}

export interface KindSummary {
  kind: string;
  count: number;
  current: number;
  due: number;
  overdue: number;
  estimates: number;
  newest: string;
  oldest: string;
  /** Worst freshness in the group. */
  worst: Freshness;
  items: Judged[];
}

const RANK: Record<Freshness, number> = { current: 0, due: 1, overdue: 2 };

export function summarise(judged: Judged[], f: FreshnessFile): KindSummary[] {
  return Object.keys(f.kinds)
    .map((kind) => {
      const items = judged.filter((j) => j.kind === kind).sort((a, b) => RANK[b.freshness] - RANK[a.freshness] || a.datum.asOf.localeCompare(b.datum.asOf));
      const dates = items.map((i) => i.datum.asOf).sort();
      const n = (s: Freshness) => items.filter((i) => i.freshness === s).length;
      return {
        kind,
        count: items.length,
        current: n('current'),
        due: n('due'),
        overdue: n('overdue'),
        estimates: items.filter((i) => (i.datum.status as Status) === 'estimate').length,
        newest: dates[dates.length - 1] ?? '',
        oldest: dates[0] ?? '',
        worst: items.reduce<Freshness>((w, i) => (RANK[i.freshness] > RANK[w] ? i.freshness : w), 'current'),
        items,
      };
    })
    .filter((s) => s.count > 0);
}
