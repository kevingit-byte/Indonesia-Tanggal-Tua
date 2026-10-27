// Data plus the reader's own edits (localStorage), and the UI state that the URL hash mirrors.
import placesJson from '../data/places.json';
import pricesJson from '../data/prices.json';
import wishJson from '../data/wishlist.json';
import regionsJson from '../data/regions-id.json';
import tsJson from '../data/timeseries-jakarta.json';
import sourcesJson from '../data/sources.json';
import methodJson from '../data/method.json';
import notesIdJson from '../data/notes-id.json';
import type {
  Datum,
  MethodFile,
  PlacesFile,
  PricesFile,
  RegionsFile,
  Source,
  SourcesFile,
  TimeseriesFile,
  WishlistFile,
} from './data/types';
import type { Lang } from './i18n';

const base = {
  places: placesJson as unknown as PlacesFile,
  prices: pricesJson as unknown as PricesFile,
  wishlist: wishJson as unknown as WishlistFile,
  regions: regionsJson as unknown as RegionsFile,
  timeseries: tsJson as unknown as TimeseriesFile,
  sources: sourcesJson as unknown as SourcesFile,
  method: methodJson as unknown as MethodFile,
};
export type Data = typeof base;

/** A Datum the reader changed in the table. The original stays reachable for the source panel. */
export interface EditedDatum extends Datum {
  edited?: { original: number | null };
}

const EDITS_KEY = 'bjk-edits-v1';
const PREFS_KEY = 'bjk-prefs-v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or storage blocked: edits just won't persist */
  }
}

/** Edit keys: "place.<id>.<field>", "price.<placeId>.<item>", "wish.<item>.<iso2>". */
let edits: Record<string, number> = readJson(EDITS_KEY, {});

function lookup(d: Data, key: string): Datum | undefined {
  const [kind, a, b] = key.split('.');
  if (kind === 'place') return (d.places.places.find((p) => p.id === a) as unknown as Record<string, Datum> | undefined)?.[b!];
  if (kind === 'price') return d.prices.prices[a!]?.[b!];
  if (kind === 'wish') return d.wishlist.items.find((i) => i.id === a)?.prices[b!];
  return undefined;
}

let current: Data = build();

function build(): Data {
  const d = structuredClone(base);
  for (const [key, value] of Object.entries(edits)) {
    const datum = lookup(d, key) as EditedDatum | undefined;
    if (!datum || datum.value === value) continue;
    datum.edited = { original: datum.value };
    datum.value = value;
  }
  return d;
}

export const data = () => current;
export const baseData = () => base;
export const editCount = () => Object.keys(edits).length;

export function setEdit(key: string, value: number | null) {
  const orig = lookup(base, key);
  if (value === null || !Number.isFinite(value) || value === orig?.value) delete edits[key];
  else edits[key] = value;
  writeJson(EDITS_KEY, edits);
  current = build();
  emit();
}

export function resetEdits() {
  edits = {};
  writeJson(EDITS_KEY, edits);
  current = build();
  emit();
}

const notesId = (notesIdJson as { notes: Record<string, string> }).notes;

/** Data notes are written in English; show the Indonesian version when the page is in Indonesian. */
export function noteText(note: string): string {
  return ui.lang === 'id' ? (notesId[note] ?? note) : note;
}

export function source(id: string): Source | undefined {
  return base.sources.sources.find((s) => s.id === id);
}

export type Theme = 'auto' | 'light' | 'dark';

export interface UiState {
  lang: Lang;
  theme: Theme;
  mapMeasure: 'basket' | 'rice' | 'iphone' | 'bigmac';
  mapView: 'asia' | 'world';
  item: string;
  itemMode: 'time' | 'usd';
  wish: string;
  leftCurrency: 'local' | 'idr' | 'usd';
  regionLevel: 'UMP' | 'UMK';
  histItem: 'rice' | 'eggs' | 'chicken';
  calcWage: number;
  calcHours: number;
  calcPlace: string;
}

const prefs = readJson<Partial<UiState>>(PREFS_KEY, {});
// ?lang=en / ?lang=id in a shared link wins over the reader's saved choice.
const urlLang = new URLSearchParams(location.search).get('lang');
if (urlLang === 'en' || urlLang === 'id') prefs.lang = urlLang;
export const ui: UiState = {
  lang: prefs.lang ?? 'id',
  theme: prefs.theme ?? 'auto',
  mapMeasure: 'basket',
  mapView: 'asia',
  item: 'rice',
  itemMode: 'time',
  wish: 'iphone',
  leftCurrency: 'idr',
  regionLevel: 'UMP',
  histItem: 'rice',
  calcWage: prefs.calcWage ?? 5729876,
  calcHours: prefs.calcHours ?? 40,
  calcPlace: prefs.calcPlace ?? 'jakarta',
};

const listeners = new Set<() => void>();
export const subscribe = (fn: () => void) => listeners.add(fn);
function emit() {
  listeners.forEach((fn) => fn());
}

export function setUi(patch: Partial<UiState>) {
  Object.assign(ui, patch);
  writeJson(PREFS_KEY, { lang: ui.lang, theme: ui.theme, calcWage: ui.calcWage, calcHours: ui.calcHours, calcPlace: ui.calcPlace });
  emit();
}

// ---- URL hash: "#<section>-<choice>", e.g. #wishlist-iphone, #item-beef, #map-bigmac
const HASH_KEYS: Record<string, keyof UiState> = {
  map: 'mapMeasure',
  item: 'item',
  wishlist: 'wish',
  history: 'histItem',
  regions: 'regionLevel',
};

export function readHash(): string | null {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) return null;
  const [section, ...rest] = h.split('-');
  const key = HASH_KEYS[section!];
  const choice = rest.join('-');
  if (key && choice) (ui as unknown as Record<string, string>)[key] = key === 'regionLevel' ? choice.toUpperCase() : choice;
  return section!;
}

export function writeHash(section: string, choice: string) {
  history.replaceState(null, '', `#${section}-${choice}`);
}
