// Where a household income sits in WID's distribution of pre-tax national income per adult.
// Pure functions; METHOD.md explains each step. Nothing here touches the network or storage.
import type { WidFile, WidGroup } from '../data/types';

export interface IncomeInput {
  /** Household income before income tax, excluding social assistance, in current rupiah. */
  amount: number;
  period: 'month' | 'year';
  /** Adults (20+) sharing the income; split equally, as WID does. */
  adults: number;
  /** Rent the household would pay for the home it owns, per month (imputed rent). 0 if renting. */
  imputedRent?: number;
  /** Market value of shareholdings; their retained corporate earnings count as income. */
  shares?: number;
}

/** Conversion factors, all from wid-indonesia.json. */
export interface Factors {
  /** Current rupiah → rupiah of WID's price year. */
  cpi: number;
  /** Production taxes as a share of national income. */
  taxShare: number;
  /** Retained earnings as a share of the value of shares. */
  retained: number;
  /** Rupiah per US dollar at PPP, WID's price year. */
  ppp: number;
}

export function factorsFrom(w: WidFile): Factors {
  return {
    cpi: w.cpiToPriceYear?.value ?? 1,
    taxShare: w.productionTaxShare?.value ?? 0,
    retained: w.retainedEarningsRate?.value ?? 0,
    ppp: w.pppPerUsd?.value ?? NaN,
  };
}

export const MAX_ADULTS = 6;
const clampAdults = (n: number) => Math.min(MAX_ADULTS, Math.max(1, Math.round(n) || 1));

/** Household income per adult per month in current rupiah, including imputed rent and retained earnings. */
export function perAdultMonthly(i: IncomeInput, f: Pick<Factors, 'retained'>): number {
  const base = i.period === 'year' ? i.amount / 12 : i.amount;
  const rent = Math.max(0, i.imputedRent ?? 0);
  const retained = (Math.max(0, i.shares ?? 0) * f.retained) / 12;
  return Math.max(0, base + rent + retained) / clampAdults(i.adults);
}

/** Current rupiah per adult per month → WID units: per year, WID price year, production taxes added. */
export function toWid(monthly: number, f: Factors): number {
  return (monthly * 12 * f.cpi) / (1 - f.taxShare);
}

/** The inverse: a WID amount (per year) as the household income per adult per month a reader would enter. */
export function fromWid(annual: number, f: Factors): number {
  return (annual / 12) * (1 - f.taxShare) / f.cpi;
}

/** The production taxes added to a monthly income for the comparison (shown to the reader). */
export const productionTaxAdded = (monthly: number, f: Factors) => (monthly * f.taxShare) / (1 - f.taxShare);

export interface Position {
  /** Share of adults with a lower income, 0–100. */
  p: number;
  /** True when the income is above the highest threshold WID publishes (p99.999): p is then a floor, not an estimate. */
  aboveTop: boolean;
}

/**
 * Percentile of an income (in the distribution's own units). Within a group the position is interpolated
 * linearly between its threshold and the next group's, for display only. Never extrapolates past the last threshold.
 */
export function percentileOf(x: number, groups: WidGroup[]): Position {
  if (!(x > 0) || x < groups[0]!.threshold) return { p: 0, aboveTop: false };
  let i = 0;
  // Last group whose threshold is at or below x (thresholds never fall; several groups can share 0).
  for (let k = 0; k < groups.length; k++) if (groups[k]!.threshold <= x) i = k;
  const g = groups[i]!;
  const next = groups[i + 1];
  if (!next) return { p: g.p, aboveTop: true };
  const span = next.threshold - g.threshold;
  const frac = span > 0 ? Math.min(1, (x - g.threshold) / span) : 0;
  return { p: g.p + frac * (g.pTo - g.p), aboveTop: false };
}

/** The group that contains percentile p (0 ≤ p < 100). */
export function groupAt(p: number, groups: WidGroup[]): WidGroup {
  let g = groups[0]!;
  for (const x of groups) if (x.p <= p + 1e-9) g = x;
  return g;
}

/** Entry threshold of percentile p, e.g. 90 → the income needed to be in the top 10%. */
export const thresholdAt = (p: number, groups: WidGroup[]) => groupAt(p, groups).threshold;

/** Population-weighted average income of adults between percentiles a and b. */
export function averageBetween(a: number, b: number, groups: WidGroup[]): number {
  let sum = 0;
  let w = 0;
  for (const g of groups) {
    const lo = Math.max(a, g.p);
    const hi = Math.min(b, g.pTo);
    if (hi > lo) {
      sum += g.average * (hi - lo);
      w += hi - lo;
    }
  }
  return w ? sum / w : NaN;
}

/** The 100 whole percentiles (p0–p1 … p99–p100) with their entry threshold and average, for the strip. */
export function centiles(groups: WidGroup[]): { p: number; threshold: number; average: number }[] {
  return Array.from({ length: 100 }, (_, p) => ({ p, threshold: thresholdAt(p, groups), average: averageBetween(p, p + 1, groups) }));
}

export type Tier = 'bottom50' | 'middle40' | 'top10' | 'top5' | 'top1';
export function tier(p: number): Tier {
  return p >= 99 ? 'top1' : p >= 95 ? 'top5' : p >= 90 ? 'top10' : p >= 50 ? 'middle40' : 'bottom50';
}

/** "Top X%": the share of adults with a higher income, rounded the way a reader would say it. */
export function topShare(p: number): number {
  const s = 100 - p;
  // Below 1%, two significant figures (0.94, 0.05): more would be false precision.
  return s >= 10 ? Math.round(s) : s >= 1 ? Math.round(s * 10) / 10 : Math.max(0.001, Number(s.toPrecision(2)));
}

/** Income growth of each percentile between the two years of `w.growth`, as a fraction (1.57 = +157%). */
export const growthOf = (w: WidFile) => w.growth.percentiles.map((x) => (x.from > 0 ? x.to / x.from - 1 : null));
