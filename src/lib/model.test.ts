import { describe, expect, it } from 'vitest';
import type { Datum, MethodFile, Place, PricesFile, SeriesPoint } from '../data/types';
import { basket, indexTo, interpolateYears, monthlyWage, payPerMinute, weakest, workMinutes, workTimeParts } from './model';

const d = (value: number | null, unit: string, status: Datum['status'] = 'official'): Datum => ({
  value,
  unit,
  asOf: '2026-01-01',
  sourceId: 'test',
  status,
});

const place = (over: Partial<Place>): Place => ({
  id: 'x',
  city: { id: 'X', en: 'X' },
  country: { id: 'X', en: 'X' },
  iso2: 'XX',
  iso3: 'XXX',
  isoNumeric: '000',
  lat: 0,
  lon: 0,
  currency: 'IDR',
  wageType: 'UMP',
  wageLabel: { id: '', en: '' },
  ...over,
});

const jakarta = place({ wage: d(5729876, 'IDR/month'), monthlyHours: d(173, 'h/month'), fxPerUsd: d(18065, 'IDR/USD', 'snapshot') });

describe('wages', () => {
  it('keeps monthly wages as they are', () => {
    expect(monthlyWage(jakarta, 8).value).toBe(5729876);
  });
  it('turns a daily wage into monthly using monthlyHours ÷ workday', () => {
    const bkk = place({ currency: 'THB', wage: d(400, 'THB/day'), monthlyHours: d(208, 'h/month', 'estimate') });
    const m = monthlyWage(bkk, 8);
    expect(m.value).toBe(10400);
    expect(m.status).toBe('estimate');
  });
  it('turns an hourly wage into monthly (Korea: 10,320 × 209)', () => {
    const seoul = place({ currency: 'KRW', wage: d(10320, 'KRW/hour'), monthlyHours: d(209, 'h/month') });
    expect(monthlyWage(seoul, 8).value).toBe(2156880);
  });
  it('pay per minute = wage ÷ (hours × 60)', () => {
    expect(payPerMinute(jakarta, 8).value).toBeCloseTo(5729876 / (173 * 60), 6);
  });
});

describe('work time', () => {
  it('converts a local price', () => {
    const m = workMinutes(d(17249000, 'IDR/item'), jakarta, 8);
    expect(m.value).toBeCloseTo(17249000 / (5729876 / 10380), 3);
  });
  it('converts a USD price with the place FX and inherits its status', () => {
    const m = workMinutes(d(1, 'USD/item'), jakarta, 8);
    expect(m.value).toBeCloseTo(18065 / (5729876 / 10380), 6);
    expect(m.status).toBe('snapshot');
  });
  it('returns null for "not sold"', () => {
    expect(workMinutes(d(null, 'IDR/item'), jakarta, 8).value).toBeNull();
  });
  it('formats as minutes, hours or workdays', () => {
    expect(workTimeParts(30, 8)).toEqual({ value: 30, unit: 'min' });
    expect(workTimeParts(90, 8)).toEqual({ value: 1.5, unit: 'h' });
    expect(workTimeParts(960, 8)).toEqual({ value: 2, unit: 'day' });
  });
});

describe('basket', () => {
  const method: MethodFile = {
    schemaVersion: 1,
    dataset: 'method',
    updated: '2026-10-27',
    workdayHours: 8,
    indexBaseYear: 2002,
    basket: [
      { item: 'rent', qty: 1, per: 'month' },
      { item: 'rice', qty: 8, per: 'kg' },
      { item: 'transit', qty: 44, per: 'ride' },
    ],
  };
  const prices: PricesFile = {
    schemaVersion: 1,
    dataset: 'prices',
    updated: '2026-10-27',
    items: [{ id: 'rice', label: { id: 'Beras', en: 'Rice' }, per: 'kg' }],
    prices: { x: { rice: d(15000, 'IDR/kg', 'snapshot') } },
  };
  it('totals the lines and computes leftover with the weakest status', () => {
    const p = { ...jakarta, rent: d(1500000, 'IDR/month', 'estimate'), transitFare: d(3500, 'IDR/ride') };
    const b = basket(p, prices, method);
    expect(b.total.value).toBe(1500000 + 8 * 15000 + 44 * 3500);
    expect(b.leftover.value).toBe(5729876 - b.total.value!);
    expect(b.leftover.status).toBe('estimate');
  });
  it('gives no total when a line is missing', () => {
    expect(basket(jakarta, prices, method).total.value).toBeNull();
  });
});

describe('time series', () => {
  const pt = (year: number, value: number): SeriesPoint => ({ ...d(value, 'IDR/kg'), year });
  it('fills gaps with straight lines and marks them', () => {
    const out = interpolateYears([pt(2002, 3000), pt(2004, 4000)]);
    expect(out.map((p) => [p.year, p.value, p.status])).toEqual([
      [2002, 3000, 'official'],
      [2003, 3500, 'interpolated'],
      [2004, 4000, 'official'],
    ]);
  });
  it('indexes to a base year', () => {
    expect(indexTo([pt(2002, 50), pt(2003, 75)], 2002)?.map((p) => p.value)).toEqual([100, 150]);
  });
  it('ranks statuses', () => {
    expect(weakest(['official', 'snapshot'])).toBe('snapshot');
    expect(weakest(['snapshot', 'interpolated'])).toBe('interpolated');
    expect(weakest(['interpolated', 'estimate'])).toBe('estimate');
  });
});
