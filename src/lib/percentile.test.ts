import { describe, expect, it } from 'vitest';
import widId from '../../data/wid-indonesia.json';
import widWo from '../../data/wid-world.json';
import type { WidFile, WidGroup } from '../data/types';
import {
  averageBetween,
  centiles,
  factorsFrom,
  fromWid,
  perAdultMonthly,
  percentileOf,
  productionTaxAdded,
  thresholdAt,
  tier,
  toWid,
  topShare,
} from './percentile';

const ID = widId as unknown as WidFile;
const WO = widWo as unknown as WidFile;
const f = factorsFrom(ID);
const pos = (monthly: number) => percentileOf(toWid(monthly, f), ID.groups).p;

const toy: WidGroup[] = [
  { p: 0, pTo: 50, threshold: 0, average: 50 },
  { p: 50, pTo: 90, threshold: 100, average: 150 },
  { p: 90, pTo: 100, threshold: 200, average: 400 },
];

describe('percentileOf', () => {
  it('handles zero, negative and tiny incomes', () => {
    expect(percentileOf(0, toy)).toEqual({ p: 0, aboveTop: false });
    expect(percentileOf(-5, toy)).toEqual({ p: 0, aboveTop: false });
    expect(percentileOf(1, ID.groups).p).toBeGreaterThanOrEqual(0);
  });
  it('lands exactly on a threshold', () => {
    expect(percentileOf(100, toy).p).toBe(50);
    expect(percentileOf(thresholdAt(90, ID.groups), ID.groups).p).toBeCloseTo(90, 6);
    expect(percentileOf(thresholdAt(50, ID.groups), ID.groups).p).toBeCloseTo(50, 6);
  });
  it('interpolates within a group, for display', () => {
    expect(percentileOf(150, toy).p).toBeCloseTo(70, 6);
  });
  it('never extrapolates above the last published threshold', () => {
    expect(percentileOf(1000, toy)).toEqual({ p: 90, aboveTop: true });
    const top = ID.groups[ID.groups.length - 1]!;
    expect(percentileOf(top.threshold * 10, ID.groups)).toEqual({ p: top.p, aboveTop: true });
  });
  it('rises with income', () => {
    let last = -1;
    for (const m of [1e6, 2e6, 4e6, 8e6, 16e6, 64e6, 256e6]) {
      const p = pos(m);
      expect(p).toBeGreaterThan(last);
      last = p;
    }
  });
});

describe('household inputs', () => {
  it('per year equals per month × 12', () => {
    const a = perAdultMonthly({ amount: 120_000_000, period: 'year', adults: 1 }, f);
    const b = perAdultMonthly({ amount: 10_000_000, period: 'month', adults: 1 }, f);
    expect(a).toBeCloseTo(b, 6);
  });
  it('splits income equally between adults, 1 to 6+', () => {
    const one = perAdultMonthly({ amount: 12_000_000, period: 'month', adults: 1 }, f);
    const six = perAdultMonthly({ amount: 12_000_000, period: 'month', adults: 6 }, f);
    expect(one).toBe(12_000_000);
    expect(six).toBe(2_000_000);
    expect(perAdultMonthly({ amount: 12_000_000, period: 'month', adults: 9 }, f)).toBe(2_000_000);
    expect(perAdultMonthly({ amount: 12_000_000, period: 'month', adults: 0 }, f)).toBe(12_000_000);
    expect(pos(one)).toBeGreaterThan(pos(six));
  });
  it('adds imputed rent for an owned home', () => {
    const rent = perAdultMonthly({ amount: 10_000_000, period: 'month', adults: 2, imputedRent: 2_000_000 }, f);
    expect(rent).toBe(6_000_000);
  });
  it('adds retained earnings on shares at the Indonesian rate', () => {
    expect(f.retained).toBeCloseTo(0.149, 6);
    const s = perAdultMonthly({ amount: 0, period: 'month', adults: 1, shares: 120_000_000 }, f);
    expect(s).toBeCloseTo((120_000_000 * 0.149) / 12, 6);
  });
});

describe('conversions', () => {
  it('fromWid undoes toWid', () => {
    expect(fromWid(toWid(5_000_000, f), f)).toBeCloseTo(5_000_000, 3);
  });
  it('adds production taxes the way WID does: income ÷ (1 − tax share)', () => {
    expect(productionTaxAdded(5_000_000, f)).toBeCloseTo((5_000_000 * f.taxShare) / (1 - f.taxShare), 6);
  });
  it('builds 100 centiles with rising averages at the top', () => {
    const c = centiles(ID.groups);
    expect(c).toHaveLength(100);
    expect(c[99]!.average).toBeGreaterThan(c[98]!.average);
    expect(averageBetween(0, 100, ID.groups)).toBeCloseTo(ID.mean, -4);
  });
  it('names tiers and top shares', () => {
    expect(tier(10)).toBe('bottom50');
    expect(tier(62)).toBe('middle40');
    expect(tier(91)).toBe('top10');
    expect(tier(96)).toBe('top5');
    expect(tier(99.5)).toBe('top1');
    expect(topShare(62)).toBe(38);
    expect(topShare(99.95)).toBe(0.05);
  });
});

describe('reference case: Rp10 juta a month, 2 adults, renting, no shares', () => {
  const m = perAdultMonthly({ amount: 10_000_000, period: 'month', adults: 2 }, f);
  const x = toWid(m, f);
  it('is Rp5 juta per adult', () => expect(m).toBe(5_000_000));
  // WID's online comparator showed about P62 for this case (checked by the site owner).
  // With the WID bulk data of 2026-10 (distribution year 2024, 2025 prices), after converting
  // 2026 rupiah to 2025 prices (−3.2%) and adding production taxes (+7.8%), it is about P58.
  // METHOD.md explains the gap; the test pins our own result so a data change that moves it is noticed.
  it('sits around P58 in Indonesia', () => expect(percentileOf(x, ID.groups).p).toBeCloseTo(58, 0));
  it('sits around P53 in the world (PPP)', () => expect(percentileOf(x / f.ppp, WO.groups).p).toBeGreaterThan(50));
});
