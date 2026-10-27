// The method, in one place:
//   pay per minute = monthly wage ÷ (monthly hours × 60)
//   work time      = price ÷ pay per minute
// Every result carries the weakest status of its inputs, so an estimate anywhere shows up as an estimate on screen.
import type { BasketLine, Datum, MethodFile, Place, PricesFile, SeriesPoint, Status, WishItem } from '../data/types';
import { parseUnit } from '../data/units';

/** A computed number plus the inputs it came from, for the one-click "where is this from" panel. */
export interface Derived {
  value: number | null;
  status: Status;
  inputs: Datum[];
}

const STRENGTH: Record<Status, number> = { official: 3, snapshot: 2, interpolated: 1, estimate: 0 };

export function weakest(statuses: Status[]): Status {
  return statuses.reduce<Status>((w, s) => (STRENGTH[s] < STRENGTH[w] ? s : w), 'official');
}

function derive(value: number | null, inputs: (Datum | undefined)[]): Derived {
  const present = inputs.filter((d): d is Datum => d !== undefined);
  const missing = present.length < inputs.length || present.some((d) => d.value === null);
  return { value: missing ? null : value, status: weakest(present.map((d) => d.status)), inputs: present };
}

/** Wage converted to a month. Daily wages count monthlyHours ÷ workdayHours days. */
export function monthlyWage(place: Place, workdayHours: number): Derived {
  const { wage, monthlyHours } = place;
  if (!wage || wage.value === null || !monthlyHours || monthlyHours.value === null) return derive(null, [wage, monthlyHours]);
  const period = parseUnit(wage.unit)?.den;
  const h = monthlyHours.value;
  const value =
    period === 'month' ? wage.value : period === 'day' ? (wage.value * h) / workdayHours : period === 'hour' ? wage.value * h : null;
  // A monthly wage doesn't depend on the hours figure, so don't let its status weaken the result.
  return derive(value, period === 'month' ? [wage] : [wage, monthlyHours]);
}

export function payPerMinute(place: Place, workdayHours: number): Derived {
  const m = monthlyWage(place, workdayHours);
  const h = place.monthlyHours;
  if (m.value === null || !h || !h.value) return derive(null, [...m.inputs, h]);
  return derive(m.value / (h.value * 60), uniq([...m.inputs, h]));
}

/** Local-currency amount for a price that may be quoted in USD (e.g. wishlist items in Cambodia). */
export function toLocal(price: Datum, place: Place): Derived {
  if (price.value === null) return derive(null, [price]);
  const cur = parseUnit(price.unit)?.num;
  if (cur === place.currency) return derive(price.value, [price]);
  if (cur === 'USD' && place.fxPerUsd?.value) return derive(price.value * place.fxPerUsd.value, [price, place.fxPerUsd]);
  return derive(null, [price, place.fxPerUsd]);
}

export function toUsd(localAmount: number, place: Place): Derived {
  if (place.currency === 'USD') return { value: localAmount, status: 'official', inputs: [] };
  return derive(place.fxPerUsd?.value ? localAmount / place.fxPerUsd.value : null, [place.fxPerUsd]);
}

/** Minutes of minimum-wage work to pay for `price`. */
export function workMinutes(price: Datum | undefined, place: Place, workdayHours: number): Derived {
  if (!price) return derive(null, [undefined]);
  const local = toLocal(price, place);
  const ppm = payPerMinute(place, workdayHours);
  if (local.value === null || ppm.value === null) return derive(null, [...local.inputs, ...ppm.inputs]);
  return derive(local.value / ppm.value, uniq([...local.inputs, ...ppm.inputs]));
}

/**
 * Local-currency cost of a wishlist item in a place. Bundles add up their parts, so a trip is
 * flight + visa with both sources kept. undefined = no data yet; value null = not sold.
 */
export function wishLocal(item: WishItem, all: WishItem[], place: Place): Derived | undefined {
  if (item.bundle) {
    const parts = item.bundle.map((id) => {
      const part = all.find((i) => i.id === id);
      return part ? wishLocal(part, all, place) : undefined;
    });
    if (parts.some((x) => x === undefined)) return undefined;
    const ok = parts as Derived[];
    const inputs = ok.flatMap((x) => x.inputs);
    const value = ok.every((x) => x.value !== null) ? ok.reduce((sum, x) => sum + x.value!, 0) : null;
    return { value, status: weakest(inputs.map((d) => d.status)), inputs };
  }
  const d = item.prices[place.iso2];
  return d ? toLocal(d, place) : undefined;
}

/** Minutes of work for an amount already in local currency. */
export function workMinutesLocal(local: Derived | undefined, place: Place, workdayHours: number): Derived {
  if (!local) return derive(null, [undefined]);
  const ppm = payPerMinute(place, workdayHours);
  if (local.value === null || ppm.value === null) return derive(null, [...local.inputs, ...ppm.inputs]);
  return derive(local.value / ppm.value, uniq([...local.inputs, ...ppm.inputs]));
}

export type TimeUnit = 'min' | 'h' | 'day';

/** Minutes for small things, hours up to a working day, 8-hour workdays beyond that. */
export function workTimeParts(minutes: number, workdayHours: number): { value: number; unit: TimeUnit } {
  if (minutes < 60) return { value: minutes, unit: 'min' };
  if (minutes < workdayHours * 60) return { value: minutes / 60, unit: 'h' };
  return { value: minutes / (workdayHours * 60), unit: 'day' };
}

export interface BasketPart {
  line: BasketLine;
  cost: Derived;
}

/** Monthly basics for one place. `total` is null if any line is missing a price. */
export function basket(place: Place, prices: PricesFile, method: MethodFile) {
  const row = prices.prices[place.id] ?? {};
  const parts: BasketPart[] = method.basket.map((line) => {
    const d = line.item === 'rent' ? place.rent : line.item === 'transit' ? place.transitFare : row[line.item];
    if (!d || d.value === null) return { line, cost: derive(null, [d]) };
    return { line, cost: derive(d.value * line.qty, [d]) };
  });
  const totalValue = parts.every((p) => p.cost.value !== null) ? parts.reduce((s, p) => s + p.cost.value!, 0) : null;
  const total = derive(totalValue, uniq(parts.flatMap((p) => p.cost.inputs)));
  const wage = monthlyWage(place, method.workdayHours);
  const leftover =
    total.value !== null && wage.value !== null
      ? derive(wage.value - total.value, uniq([...total.inputs, ...wage.inputs]))
      : derive(null, [...total.inputs, ...wage.inputs]);
  return { parts, total, wage, leftover };
}

/**
 * Fill every year between the first and last published point with a straight line.
 * Published points keep their own status; filled years are marked 'interpolated'.
 */
export function interpolateYears(points: SeriesPoint[]): SeriesPoint[] {
  const sorted = [...points].filter((p) => p.value !== null).sort((a, b) => a.year - b.year);
  const out: SeriesPoint[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i]!;
    out.push(a);
    const b = sorted[i + 1];
    if (!b) break;
    for (let y = a.year + 1; y < b.year; y++) {
      const t = (y - a.year) / (b.year - a.year);
      out.push({
        year: y,
        value: a.value! + (b.value! - a.value!) * t,
        unit: a.unit,
        asOf: `${y}-07-01`,
        sourceId: a.sourceId,
        status: 'interpolated',
        note: `Straight line between ${a.year} and ${b.year}`,
      });
    }
  }
  return out;
}

/** Index a series to base year = 100. Returns null where the base year is missing. */
export function indexTo(points: SeriesPoint[], baseYear: number): { year: number; value: number; status: Status }[] | null {
  const base = points.find((p) => p.year === baseYear)?.value;
  if (!base) return null;
  return points.filter((p) => p.value !== null).map((p) => ({ year: p.year, value: (p.value! / base) * 100, status: p.status }));
}

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
