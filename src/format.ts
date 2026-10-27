import { getLang, t } from './i18n';
import { workTimeParts } from './lib/model';

const locale = () => (getLang() === 'id' ? 'id-ID' : 'en-GB');

export function num(v: number, digits = 0): string {
  return new Intl.NumberFormat(locale(), { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v);
}

/** Sensible precision: 3 significant figures for small numbers, whole numbers above 100. */
export function smart(v: number): string {
  const a = Math.abs(v);
  return num(v, a >= 100 ? 0 : a >= 10 ? 1 : 2);
}

const SYMBOL: Record<string, string> = {
  IDR: 'Rp', MYR: 'RM', SGD: 'S$', THB: '฿', VND: '₫', PHP: '₱', USD: 'US$', LAK: '₭', KRW: '₩', JPY: '¥',
};

export function money(v: number, currency: string): string {
  const big = Math.abs(v) >= 1000 || ['IDR', 'VND', 'LAK', 'KRW', 'JPY'].includes(currency);
  const s = num(v, big ? 0 : 2);
  const sym = SYMBOL[currency] ?? currency + ' ';
  const abs = s.replace('-', '');
  const sign = v < 0 ? '−' : '';
  return currency === 'VND' ? `${sign}${abs}${sym}` : `${sign}${sym}${abs}`;
}

/** Short rupiah: "Rp5,7 jt" / "Rp5.7m". */
export function rpShort(v: number): string {
  const id = getLang() === 'id';
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1e6) return `${sign}Rp${num(a / 1e6, 1)}${id ? ' jt' : 'm'}`;
  if (a >= 1e3) return `${sign}Rp${num(a / 1e3, 0)}${id ? ' rb' : 'k'}`;
  return `${sign}Rp${num(a)}`;
}

/** Narrow screens get charts drawn at phone width, so their text stays readable instead of shrinking. */
export const narrow = () => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 560px)').matches;

export function workTime(minutes: number, workdayHours: number): string {
  const p = workTimeParts(minutes, workdayHours);
  const unit = p.unit === 'min' ? t('unit.min') : p.unit === 'h' ? t('unit.h') : t('unit.day');
  return `${smart(p.value)} ${unit}`;
}

export function pct(v: number): string {
  return `${num(v, v < 10 ? 1 : 0)}%`;
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
