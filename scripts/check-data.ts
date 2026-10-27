// npm run check-data          → fails on schema errors, prints coverage gaps as warnings
// npm run check-data:strict   → also fails on gaps (missing values, sources not re-opened)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  BpsWagesFile,
  Datum,
  FreshnessFile,
  MethodFile,
  PlacesFile,
  PricesFile,
  RegionsFile,
  SourcesFile,
  TimeseriesFile,
  WidFile,
  WishlistFile,
} from '../src/data/types';
import { STATUSES } from '../src/data/types';
import { WAGE_PERIODS, isCurrencyCode, parseUnit } from '../src/data/units';
import { entries, judge } from '../src/lib/freshness';

/** Items that make up the food part of the basket (section "Inside Indonesia"). */
const FOOD = ['rice', 'eggs', 'chicken', 'beef', 'oil'];
const strict = process.argv.includes('--strict');
const verbose = process.argv.includes('--verbose');
const dataDir = join(process.env.DATA_DIR ?? join(import.meta.dirname, '..', 'data'));
const errors: string[] = [];
const gaps: string[] = [];
const notes: string[] = [];
/** file -> paths with no value yet; printed grouped because there are many while data is being filled in. */
const missing = new Map<string, string[]>();

const load = <T>(name: string): T => JSON.parse(readFileSync(join(dataDir, name), 'utf8')) as T;

const isDate = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

function checkMeta(file: string, m: { schemaVersion?: unknown; dataset?: unknown; updated?: unknown }) {
  if (m.schemaVersion !== 1) errors.push(`${file}: schemaVersion must be 1`);
  if (typeof m.dataset !== 'string') errors.push(`${file}: missing dataset name`);
  if (!isDate(m.updated)) errors.push(`${file}: "updated" must be YYYY-MM-DD`);
}

const sourcesFile = load<SourcesFile>('sources.json');
checkMeta('sources.json', sourcesFile);
const sourceIds = new Set<string>();
const usedSources = new Map<string, number>();
for (const s of sourcesFile.sources) {
  const at = `sources.json: ${s.id ?? '(no id)'}`;
  if (!s.id) errors.push(`${at}: missing id`);
  if (sourceIds.has(s.id)) errors.push(`${at}: duplicate id`);
  sourceIds.add(s.id);
  if (!s.title) errors.push(`${at}: missing title`);
  if (!s.publisher) errors.push(`${at}: missing publisher`);
  if (s.url === undefined) errors.push(`${at}: url must be a string or null`);
  else if (s.url === null) gaps.push(`${at}: no public URL`);
  else if (!/^https:\/\//.test(s.url)) errors.push(`${at}: url must be https`);
  if (s.accessed === undefined) errors.push(`${at}: accessed must be a date or null`);
  else if (s.accessed === null) gaps.push(`${at}: no access date (carried over or editorial; accessed: null)`);
  else if (!isDate(s.accessed)) errors.push(`${at}: accessed must be YYYY-MM-DD`);
}

/**
 * Check one value. `expectedUnit` is either an exact unit string or a predicate for the cases
 * where several units are valid (wages per month/day/hour, wishlist prices in local currency or USD).
 */
function checkDatum(
  at: string,
  d: Datum | undefined,
  expectedUnit: string | ((u: string) => boolean),
  updated: string,
  unitHint = 'a valid unit for this field',
) {
  if (d === undefined) {
    const [file, path] = at.split(': ');
    missing.set(file!, [...(missing.get(file!) ?? []), path!]);
    return;
  }
  if (typeof d !== 'object' || d === null) {
    errors.push(`${at}: must be an object with value/unit/asOf/sourceId/status`);
    return;
  }
  if (d.value === null) {
    if (!d.note) errors.push(`${at}: value is null ("not sold") but has no note saying why`);
  } else if (typeof d.value !== 'number' || !Number.isFinite(d.value) || d.value < 0) {
    errors.push(`${at}: value must be a non-negative number or null`);
  }
  const unitOk = typeof expectedUnit === 'string' ? d.unit === expectedUnit : typeof d.unit === 'string' && expectedUnit(d.unit);
  if (!unitOk) {
    const want = typeof expectedUnit === 'string' ? expectedUnit : unitHint;
    errors.push(`${at}: unit "${d.unit}" is inconsistent, expected ${want}`);
  }
  if (!isDate(d.asOf)) errors.push(`${at}: asOf must be YYYY-MM-DD`);
  else if (d.asOf > updated) errors.push(`${at}: asOf ${d.asOf} is after the dataset's "updated" date ${updated}`);
  if (!d.sourceId) errors.push(`${at}: missing sourceId`);
  else if (!sourceIds.has(d.sourceId)) errors.push(`${at}: unknown sourceId "${d.sourceId}"`);
  else usedSources.set(d.sourceId, (usedSources.get(d.sourceId) ?? 0) + 1);
  if (!STATUSES.includes(d.status)) errors.push(`${at}: status must be one of ${STATUSES.join(' | ')}`);
}

// ---- method.json
const method = load<MethodFile>('method.json');
checkMeta('method.json', method);
if (!(method.workdayHours > 0)) errors.push('method.json: workdayHours must be positive');

// ---- places.json
const placesFile = load<PlacesFile>('places.json');
checkMeta('places.json', placesFile);
const placeIds = new Set<string>();
const currencyByIso2 = new Map<string, string>();
for (const p of placesFile.places) {
  const at = `places.json: ${p.id}`;
  if (placeIds.has(p.id)) errors.push(`${at}: duplicate id`);
  placeIds.add(p.id);
  for (const k of ['iso2', 'iso3', 'isoNumeric'] as const) if (!p[k]) errors.push(`${at}: missing ${k}`);
  if (!isCurrencyCode(p.currency)) errors.push(`${at}: currency must be an ISO 4217 code`);
  if (!(Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180)) errors.push(`${at}: lat/lon out of range`);
  if (!p.city?.id || !p.city?.en) errors.push(`${at}: city needs id and en labels`);
  if (!['UMP', 'UMK', 'statutory', 'sector', 'reference'].includes(p.wageType)) errors.push(`${at}: bad wageType`);
  const prev = currencyByIso2.get(p.iso2);
  if (prev && prev !== p.currency) errors.push(`${at}: currency ${p.currency} differs from other ${p.iso2} places (${prev})`);
  currencyByIso2.set(p.iso2, p.currency);

  const cur = p.currency;
  if (cur === 'USD') {
    if (p.fxPerUsd) errors.push(`${at}: fxPerUsd must be omitted when currency is USD`);
  } else checkDatum(`${at}.fxPerUsd`, p.fxPerUsd, `${cur}/USD`, placesFile.updated);
  checkDatum(
    `${at}.wage`,
    p.wage,
    (u) => {
      const pu = parseUnit(u);
      return !!pu && pu.num === cur && (WAGE_PERIODS as readonly string[]).includes(pu.den);
    },
    placesFile.updated,
    WAGE_PERIODS.map((x) => `${cur}/${x}`).join(' | '),
  );
  checkDatum(`${at}.monthlyHours`, p.monthlyHours, 'h/month', placesFile.updated);
  if (p.monthlyHours?.value != null && (p.monthlyHours.value < 120 || p.monthlyHours.value > 260))
    errors.push(`${at}.monthlyHours: ${p.monthlyHours.value} h/month is implausible`);
  checkDatum(`${at}.rent`, p.rent, `${cur}/month`, placesFile.updated);
  checkDatum(`${at}.transitFare`, p.transitFare, `${cur}/ride`, placesFile.updated);
}
const currencyOf = (placeId: string) => placesFile.places.find((p) => p.id === placeId)?.currency;

// ---- prices.json
const pricesFile = load<PricesFile>('prices.json');
checkMeta('prices.json', pricesFile);
const itemIds = new Set(pricesFile.items.map((i) => i.id));
for (const pid of Object.keys(pricesFile.prices)) if (!placeIds.has(pid)) errors.push(`prices.json: unknown place "${pid}"`);
for (const pid of placeIds) {
  const row = pricesFile.prices[pid] ?? {};
  for (const k of Object.keys(row)) if (!itemIds.has(k)) errors.push(`prices.json: ${pid}.${k} is not a defined item`);
  for (const item of pricesFile.items)
    checkDatum(`prices.json: ${pid}.${item.id}`, row[item.id], `${currencyOf(pid)}/${item.per}`, pricesFile.updated);
}

// ---- method basket refers to real things
for (const line of method.basket) {
  if (line.item === 'rent' || line.item === 'transit') continue;
  const def = pricesFile.items.find((i) => i.id === line.item);
  if (!def) errors.push(`method.json: basket item "${line.item}" is not in prices.json`);
  else if (def.per !== line.per) errors.push(`method.json: basket "${line.item}" is per ${line.per}, prices.json is per ${def.per}`);
}

// ---- wishlist.json
const wish = load<WishlistFile>('wishlist.json');
checkMeta('wishlist.json', wish);
const wishIds = new Set(wish.items.map((i) => i.id));
for (const item of wish.items) {
  if (item.bundle) {
    for (const part of item.bundle) if (!wishIds.has(part)) errors.push(`wishlist.json: ${item.id} bundles unknown item "${part}"`);
    if (Object.keys(item.prices).length) errors.push(`wishlist.json: ${item.id} is a bundle and must not have its own prices`);
    continue;
  }
  for (const iso of Object.keys(item.prices))
    if (!currencyByIso2.has(iso)) errors.push(`wishlist.json: ${item.id}.${iso} is not a country in places.json`);
  for (const [iso, cur] of currencyByIso2) {
    checkDatum(
      `wishlist.json: ${item.id}.${iso}`,
      item.prices[iso],
      (u) => u === `${cur}/${item.per}` || u === `USD/${item.per}`,
      wish.updated,
      `${cur}/${item.per} | USD/${item.per}`,
    );
  }
}

// ---- regions-id.json
const regions = load<RegionsFile>('regions-id.json');
checkMeta('regions-id.json', regions);
for (const r of regions.regions) {
  if (!['UMP', 'UMK'].includes(r.level)) errors.push(`regions-id.json: ${r.id}: level must be UMP or UMK`);
  checkDatum(`regions-id.json: ${r.id}.wage`, r.wage, 'IDR/month', regions.updated);
  if (r.wage?.asOf && !r.wage.asOf.startsWith(String(regions.year)))
    errors.push(`regions-id.json: ${r.id}: asOf ${r.wage.asOf} is not in ${regions.year}`);
}

for (const item of pricesFile.items.filter((i) => FOOD.includes(i.id)))
  checkDatum(`regions-id.json: nationalPrices.${item.id}`, regions.nationalPrices?.[item.id], `IDR/${item.per}`, regions.updated);

// ---- timeseries-jakarta.json
const ts = load<TimeseriesFile>('timeseries-jakarta.json');
checkMeta('timeseries-jakarta.json', ts);
if (!placeIds.has(ts.place)) errors.push(`timeseries-jakarta.json: unknown place "${ts.place}"`);
for (const s of ts.series) {
  if (s.points.length === 0) gaps.push(`timeseries-jakarta.json: series "${s.id}" has no points yet`);
  let lastYear = -Infinity;
  for (const pt of s.points) {
    const at = `timeseries-jakarta.json: ${s.id}[${pt.year}]`;
    if (!Number.isInteger(pt.year)) errors.push(`${at}: year must be an integer`);
    if (pt.year <= lastYear) errors.push(`${at}: years must be strictly increasing`);
    lastYear = pt.year;
    checkDatum(at, pt, s.unit, ts.updated);
    if (pt.status === 'interpolated')
      errors.push(`${at}: store only published anchors; the site interpolates between them and marks the result`);
  }
}

// ---- wid-*.json: income distributions (World Inequality Database)
const wids: WidFile[] = [];
for (const name of ['wid-indonesia.json', 'wid-world.json']) {
  const w = load<WidFile>(name);
  wids.push(w);
  checkMeta(name, w);
  checkDatum(`${name}: distribution`, { value: w.mean, unit: w.unit, asOf: w.asOf, sourceId: w.sourceId, status: w.status }, `${w.currency}/year`, w.updated);
  if (!isDate(w.downloaded)) errors.push(`${name}: downloaded must be YYYY-MM-DD`);
  if (!w.variables?.threshold || !w.variables?.average) errors.push(`${name}: name the WID variable codes used`);
  const g = w.groups;
  if (g[0]?.p !== 0 || g[g.length - 1]?.pTo !== 100) errors.push(`${name}: groups must run from p0 to p100`);
  for (let i = 0; i < g.length; i++) {
    const x = g[i]!;
    if (!(x.pTo > x.p)) errors.push(`${name}: group ${i} has pTo <= p`);
    if (i && Math.abs(g[i - 1]!.pTo - x.p) > 1e-9) errors.push(`${name}: group ${i} does not start where group ${i - 1} ends`);
    if (i && x.threshold < g[i - 1]!.threshold) errors.push(`${name}: thresholds must not fall (p${x.p})`);
    if (x.average < x.threshold) errors.push(`${name}: average below threshold at p${x.p}`);
  }
  if (w.growth.percentiles.length !== 100) errors.push(`${name}: growth needs 100 percentiles`);
  for (const k of ['productionTaxShare', 'pppPerUsd', 'cpiToPriceYear', 'retainedEarningsRate'] as const) {
    const d = w[k];
    if (d) checkDatum(`${name}: ${k}`, d, k === 'pppPerUsd' ? `${w.currency}/USD` : 'ratio', w.updated);
  }
}
if (!wids[0]?.productionTaxShare || !wids[0]?.pppPerUsd || !wids[0]?.cpiToPriceYear || !wids[0]?.retainedEarningsRate)
  errors.push('wid-indonesia.json: needs productionTaxShare, pppPerUsd, cpiToPriceYear and retainedEarningsRate');
if (wids[0] && wids[1] && wids[0].priceYear !== wids[1].priceYear) errors.push('wid files must share one priceYear');

// ---- bps-wages.json
const bps = load<BpsWagesFile>('bps-wages.json');
checkMeta('bps-wages.json', bps);
checkDatum('bps-wages.json: national', bps.national, 'IDR/month', bps.updated);
checkDatum('bps-wages.json: bySex.male', bps.bySex?.male, 'IDR/month', bps.updated);
checkDatum('bps-wages.json: bySex.female', bps.bySex?.female, 'IDR/month', bps.updated);
for (const s of bps.bySector) {
  if (!s.label?.id || !s.label?.en) errors.push(`bps-wages.json: ${s.id} needs id and en labels`);
  checkDatum(`bps-wages.json: bySector.${s.id}`, s.wage, 'IDR/month', bps.updated);
}

// ---- freshness.json: publishing schedules, and which values are past theirs
const fresh = load<FreshnessFile>('freshness.json');
checkMeta('freshness.json', fresh);
for (const [k, v] of Object.entries(fresh.kinds)) {
  if (!(v.cadenceDays > 0) || !(v.graceDays >= 0)) errors.push(`freshness.json: ${k} needs cadenceDays > 0 and graceDays >= 0`);
  if (v.basis !== 'asOf' && v.basis !== 'checked') errors.push(`freshness.json: ${k}.basis must be "asOf" or "checked"`);
  if (!v.label?.id || !v.label?.en || !v.schedule?.id || !v.schedule?.en) errors.push(`freshness.json: ${k} needs id/en label and schedule`);
}
{
  const accessed = new Map(sourcesFile.sources.map((s) => [s.id, s.accessed]));
  const all = entries({ places: placesFile, prices: pricesFile, wishlist: wish, regions, timeseries: ts, widId: wids[0]!, widWorld: wids[1]!, bps });
  for (const e of all) if (!fresh.kinds[e.kind]) errors.push(`freshness.json: no schedule for indicator kind "${e.kind}"`);
  const judged = all.map((e) => judge(e, fresh, new Date(process.env.TODAY ?? Date.now()), (id) => accessed.get(id) ?? null));
  const late = judged.filter((j) => j.freshness === 'overdue');
  const due = judged.filter((j) => j.freshness === 'due');
  if (late.length)
    gaps.push(`freshness: ${late.length} values overdue for an update${verbose ? `:\n      ${late.map((j) => `${j.where} (${j.kind}, since ${j.since})`).join('\n      ')}` : ' (--verbose to list; see /status.html)'}`);
  if (due.length) notes.push(`freshness: ${due.length} values due for an update soon (see /status.html)`);
}

// ---- notes-id.json: Indonesian versions of every English note
const notesId = load<{ schemaVersion: 1; dataset: string; updated: string; notes: Record<string, string> }>('notes-id.json');
checkMeta('notes-id.json', notesId);
const allNotes = new Set<string>();
const collect = (o: unknown): void => {
  if (Array.isArray(o)) o.forEach(collect);
  else if (o && typeof o === 'object') {
    const note = (o as { note?: unknown }).note;
    if (typeof note === 'string') allNotes.add(note);
    Object.values(o).forEach(collect);
  }
};
[placesFile, pricesFile, wish, regions, ts, sourcesFile, ...wids, bps].forEach(collect);
const untranslated = [...allNotes].filter((n) => !notesId.notes[n]);
if (untranslated.length)
  gaps.push(`notes-id.json: ${untranslated.length} notes have no Indonesian version${verbose ? `:\n      ${untranslated.join('\n      ')}` : ' (--verbose to list)'}`);
for (const k of Object.keys(notesId.notes)) if (!allNotes.has(k)) notes.push(`notes-id.json: translation for a note no longer in the data: "${k.slice(0, 60)}…"`);

// ---- report
for (const s of sourcesFile.sources) if (!usedSources.has(s.id)) notes.push(`sources.json: ${s.id} is not cited by any value`);
const prototypeCount = usedSources.get('bjk-prototype-2026-10') ?? 0;
if (prototypeCount) gaps.push(`${prototypeCount} values still cite the prototype (bjk-prototype-2026-10) and need re-verification`);

const total = [...usedSources.values()].reduce((a, b) => a + b, 0);
console.log(`check-data: ${total} values, ${sourceIds.size} sources, ${placeIds.size} places`);
if (notes.length) console.log(`\nNotes (${notes.length}):\n  ${notes.join('\n  ')}`);
for (const [file, paths] of missing) {
  gaps.push(`${file}: ${paths.length} values missing${verbose ? `:\n      ${paths.join('\n      ')}` : ' (--verbose to list)'}`);
}
if (gaps.length) console.log(`\nGaps (${gaps.length}):\n  ${gaps.join('\n  ')}`);
if (errors.length) console.error(`\nErrors (${errors.length}):\n  ${errors.join('\n  ')}`);

if (errors.length || (strict && gaps.length)) {
  console.error(`\ncheck-data failed${strict && !errors.length ? ' (strict: gaps count as failures)' : ''}`);
  process.exit(1);
}
console.log('\ncheck-data passed');
