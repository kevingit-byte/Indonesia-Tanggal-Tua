// Unit strings are "<numerator>/<denominator>", e.g. "IDR/kg", "JPY/hour", "IDR/USD", "h/month".
// Shared by the model and the validator so both agree on what a unit means.

export interface ParsedUnit {
  num: string;
  den: string;
}

export function parseUnit(unit: string): ParsedUnit | null {
  const m = /^([A-Za-z]+)\/([A-Za-z]+)$/.exec(unit);
  return m ? { num: m[1]!, den: m[2]! } : null;
}

export const WAGE_PERIODS = ['month', 'day', 'hour'] as const;
export type WagePeriod = (typeof WAGE_PERIODS)[number];

export const isCurrencyCode = (s: string) => /^[A-Z]{3}$/.test(s);
