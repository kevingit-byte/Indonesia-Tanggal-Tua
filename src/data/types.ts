// Shapes of the JSON files in /data. The validator (scripts/check-data.ts) enforces them at build time.

/**
 * official     – published by a government body or the seller (wage order, tariff, list price)
 * snapshot     – observed at one point in time (a shop page, a market survey, a third-party index)
 * estimate     – our own approximation; replace when a real source turns up
 * interpolated – derived between two published points; never entered by hand for this site
 */
export type Status = 'official' | 'snapshot' | 'estimate' | 'interpolated';

export const STATUSES: readonly Status[] = ['official', 'snapshot', 'estimate', 'interpolated'];

/** One number and everything needed to trace it. `value: null` means "not sold / does not exist here" and needs a `note`. */
export interface Datum {
  value: number | null;
  unit: string;
  /** YYYY-MM-DD: the date the value applies to (effective date, survey date or page-read date). */
  asOf: string;
  sourceId: string;
  status: Status;
  note?: string;
}

export interface Localized {
  id: string;
  en: string;
}

export interface DatasetMeta {
  schemaVersion: 1;
  dataset: string;
  /** YYYY-MM-DD, shown as the "last updated" badge. */
  updated: string;
}

export type WageType = 'UMP' | 'UMK' | 'statutory' | 'sector' | 'reference';

export interface Place {
  id: string;
  city: Localized;
  country: Localized;
  iso2: string;
  iso3: string;
  /** ISO 3166-1 numeric, matches world-atlas feature ids. */
  isoNumeric: string;
  lat: number;
  lon: number;
  /** ISO 4217. */
  currency: string;
  wageType: WageType;
  wageLabel: Localized;
  /** Local currency per US dollar. Omitted when currency is USD. */
  fxPerUsd?: Datum;
  /** Unit is CUR/month, CUR/day or CUR/hour; the model converts to monthly. */
  wage?: Datum;
  monthlyHours?: Datum;
  /** A basic rented room, CUR/month. */
  rent?: Datum;
  /** One local public-transit ride, CUR/ride. */
  transitFare?: Datum;
}

export interface PlacesFile extends DatasetMeta {
  places: Place[];
}

export type Per = 'kg' | 'L' | 'kWh' | 'item' | 'month';

export interface ItemDef {
  id: string;
  label: Localized;
  per: Per;
}

export interface PricesFile extends DatasetMeta {
  items: ItemDef[];
  /** placeId -> itemId -> price in the place's currency. */
  prices: Record<string, Record<string, Datum>>;
}

export interface WishItem extends ItemDef {
  /** Country ISO2 -> price. Unit is local currency or USD per `per`. */
  prices: Record<string, Datum>;
}

export interface WishlistFile extends DatasetMeta {
  items: WishItem[];
}

export interface Region {
  id: string;
  name: string;
  province: string;
  level: 'UMP' | 'UMK';
  wage: Datum;
}

export interface RegionsFile extends DatasetMeta {
  year: number;
  regions: Region[];
  /** National average food prices used to price the same basket against every region's wage. itemId -> Datum. */
  nationalPrices: Record<string, Datum>;
}

export interface SeriesPoint extends Datum {
  year: number;
}

export interface Series {
  id: string;
  label: Localized;
  unit: string;
  points: SeriesPoint[];
}

export interface TimeseriesFile extends DatasetMeta {
  place: string;
  series: Series[];
}

export interface Source {
  id: string;
  title: string;
  publisher: string;
  /** null only for sources with no public page (e.g. the prototype's own estimates). */
  url: string | null;
  /** YYYY-MM-DD the cited figures were read at the source; null = carried over and not yet re-opened. */
  accessed: string | null;
  note?: string;
}

export interface SourcesFile extends DatasetMeta {
  sources: Source[];
}

export interface BasketLine {
  /** An item id from prices.json, or "rent" / "transit" from places.json. */
  item: string;
  qty: number;
  per: Per | 'ride';
}

export interface MethodFile extends DatasetMeta {
  workdayHours: number;
  basket: BasketLine[];
  indexBaseYear: number;
}
