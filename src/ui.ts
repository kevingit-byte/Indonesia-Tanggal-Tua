// Shared rendering pieces: provenance buttons (one click to the source), status tags, controls, bar rows.
import type { Datum, Place, Status } from './data/types';
import { esc } from './format';
import { L, t, type Key } from './i18n';
import { flag } from './art/flags';
import type { Derived } from './lib/model';
import { weakest } from './lib/model';
import type { EditedDatum } from './store';

export interface Prov {
  label: string;
  value: string;
  inputs: EditedDatum[];
}

const registry = new Map<number, Prov>();
let nextId = 0;
export function resetProv() {
  registry.clear();
  nextId = 0;
}
export const getProv = (id: number) => registry.get(id);

/** Wrap a displayed value in a button that opens its sources. */
export function provBtn(display: string, label: string, inputs: Datum[], cls = 'pv'): string {
  const id = nextId++;
  registry.set(id, { label, value: display, inputs: inputs as EditedDatum[] });
  return `<button type="button" class="${cls}" data-prov="${id}" aria-label="${esc(label)}: ${esc(display)}. ${t('prov.open')}">${display}</button>`;
}

export function isEdited(inputs: Datum[]) {
  return inputs.some((d) => (d as EditedDatum).edited);
}

/** Weak statuses get a visible tag; official and snapshot don't, to keep the page quiet. */
export function statusTag(d: Derived | { status: Status; inputs: Datum[] }): string {
  const tags: string[] = [];
  if (isEdited(d.inputs)) tags.push(`<span class="tag tag-edit">${t('status.edited')}</span>`);
  if (d.status === 'estimate' || d.status === 'interpolated') {
    const label = t(`status.${d.status}` as Key);
    tags.push(`<span class="est-mark" title="${label}" aria-label="${label}">≈</span>`);
  }
  return tags.join('');
}

export const isWeak = (s: Status) => s === 'estimate' || s === 'interpolated';

export function chips(group: string, label: string, options: { value: string; label: string }[], current: string): string {
  return `<div class="chips" role="group" aria-label="${esc(label)}">${options
    .map(
      (o) =>
        `<button type="button" class="chip" data-set="${group}" data-value="${esc(o.value)}" aria-pressed="${o.value === current}">${esc(o.label)}</button>`,
    )
    .join('')}</div>`;
}

export function seg(group: string, label: string, options: { value: string; label: string }[], current: string): string {
  return `<div class="seg" role="group" aria-label="${esc(label)}">${options
    .map(
      (o) =>
        `<button type="button" data-set="${group}" data-value="${esc(o.value)}" aria-pressed="${o.value === current}">${esc(o.label)}</button>`,
    )
    .join('')}</div>`;
}

export function cityLabel(p: Place, sub?: string): string {
  return `<span class="lab">${flag(p.iso2, L(p.country))}<span class="lab-t"><b>${esc(L(p.city))}</b>${
    sub ? `<span>${esc(sub)}</span>` : ''
  }</span></span>`;
}

export interface BarRow {
  place: Place;
  sub?: string;
  value: number | null;
  display: string;
  provLabel: string;
  derived: Derived;
  /** Shown instead of a bar when value is null. */
  emptyText?: string;
}

/** Horizontal bars, Indonesia in rupiah red, others slate. Estimates are hatched. */
export function barRows(rows: BarRow[], max?: number): string {
  const m = max ?? Math.max(...rows.map((r) => r.value ?? 0), 1);
  return rows
    .map((r) => {
      const isId = r.place.iso2 === 'ID';
      const weak = isWeak(r.derived.status);
      const w = r.value === null ? 0 : Math.max(0.5, (r.value / m) * 100);
      const val =
        r.value === null
          ? `<span class="na">${esc(r.emptyText ?? t('nodata'))}</span>`
          : `${statusTag(r.derived)}${provBtn(r.display, r.provLabel, r.derived.inputs)}`;
      return `<div class="row${isId ? ' is-id' : ''}">${cityLabel(r.place, r.sub)}<div class="track">${
        r.value === null ? '' : `<i class="fill${weak ? ' weak' : ''}" style="width:${w.toFixed(2)}%"></i>`
      }</div><div class="val">${val}</div></div>`;
    })
    .join('');
}

export function barLegend(): string {
  return `<div class="legend"><span><i class="sw sw-solid"></i>${t('legend.solid')}</span><span><i class="sw sw-weak"></i><span class="est-mark" aria-hidden="true">≈</span>${t('legend.est')}</span></div>`;
}

export function shareBtn(section: string, choice: string): string {
  return `<button type="button" class="btn btn-ghost share" data-share="${section}-${esc(choice)}">${t('share')}</button>`;
}

export const combined = (inputs: Datum[]) => ({ status: weakest(inputs.map((d) => d.status)), inputs });
