// Bubble map: one circle per city, area proportional to the chosen measure.
// world-atlas and d3-geo are loaded on demand so they don't hold up the first paint.
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Place } from './data/types';
import { esc, narrow, pct, smart } from './format';
import { L, t } from './i18n';
import { basket, workMinutes, type Derived } from './lib/model';
import { data, ui } from './store';
import { chips, provBtn, seg, shareBtn, statusTag, isWeak } from './ui';

type Geo = typeof import('d3-geo');
let geo: { d3: Geo; countries: GeoJSON.FeatureCollection } | null = null;

export async function loadGeo() {
  if (geo) return;
  const [d3, topo, atlas] = await Promise.all([
    import('d3-geo'),
    import('topojson-client'),
    import('world-atlas/countries-110m.json'),
  ]);
  const t = atlas.default as unknown as Topology<{ countries: GeometryCollection }>;
  geo = { d3, countries: topo.feature(t, t.objects.countries) as unknown as GeoJSON.FeatureCollection };
}

function measure(p: Place): { d: Derived; text: string } {
  const d = data();
  const wd = d.method.workdayHours;
  if (ui.mapMeasure === 'basket') {
    const b = basket(p, d.prices, d.method);
    const v = b.total.value !== null && b.wage.value ? (b.total.value / b.wage.value) * 100 : null;
    return { d: { value: v, status: b.total.status, inputs: [...b.total.inputs, ...b.wage.inputs] }, text: v === null ? '–' : pct(v) };
  }
  const price =
    ui.mapMeasure === 'rice' ? d.prices.prices[p.id]?.rice : d.wishlist.items.find((i) => i.id === ui.mapMeasure)?.prices[p.iso2];
  const m = workMinutes(price, p, wd);
  if (m.value === null) return { d: m, text: price?.value === null ? t('notsold') : '–' };
  const text =
    ui.mapMeasure === 'iphone' ? `${smart(m.value / (wd * 60))} ${t('unit.day')}` : `${smart(m.value)} ${t('unit.min')}`;
  return { d: m, text };
}

export function mapSection(): string {
  const options = (['basket', 'rice', 'iphone', 'bigmac'] as const).map((v) => ({ value: v, label: t(`map.m.${v}`) }));
  return `<div class="sec-head"><div class="eyebrow">${t('map.eyebrow')}</div><h2 id="map-h">${t('map.title')}</h2><p class="lede">${t('map.lede')}</p></div>
  <div class="toolbar">${chips('mapMeasure', t('map.measure'), options, ui.mapMeasure)}${seg('mapView', t('map.extent'), [
    { value: 'asia', label: t('map.asia') },
    { value: 'world', label: t('map.world') },
  ], ui.mapView)}</div>
  <div class="mapbox">${geo ? mapSvg() : `<div class="maploading">${t('map.loading')}</div>`}</div>
  <ol class="maplist">${mapList()}</ol>
  <div class="foot">${shareBtn('map', ui.mapMeasure)}</div>`;
}

/** The same numbers as text, for screen readers and anyone who can't read circles. */
function mapList(): string {
  return data()
    .places.places.map((p) => ({ p, m: measure(p) }))
    .sort((a, b) => (b.m.d.value ?? -1) - (a.m.d.value ?? -1))
    .map(
      ({ p, m }) =>
        `<li class="${p.iso2 === 'ID' ? 'is-id' : ''}"><span>${esc(L(p.city))}</span> ${
          m.d.value === null ? `<span class="na">${esc(m.text)}</span>` : provBtn(esc(m.text), `${t(`map.m.${ui.mapMeasure}`)}, ${L(p.city)}`, m.d.inputs)
        }${statusTag(m.d)}</li>`,
    )
    .join('');
}

/** On phones these sit too close to label legibly; their values are in the list under the map. */
const CROWDED = new Set(['kota-bekasi', 'phnom-penh', 'kuala-lumpur', 'vientiane', 'bangkok', 'bandung', 'surabaya', 'denpasar', 'medan', 'makassar']);
/** Java is too dense to label every Indonesian city even on desktop; these keep their circle and list entry. */
const CROWDED_WIDE = new Set(['bandung', 'kota-bekasi', 'surabaya']);

function mapSvg(): string {
  const { d3, countries } = geo!;
  const n = narrow();
  const W = n ? 360 : 640, H = ui.mapView === 'asia' ? (n ? 400 : 460) : n ? 200 : 340;
  const proj =
    ui.mapView === 'asia'
      ? d3.geoMercator().fitExtent(
          [[10, 10], [W - 10, H - 10]],
          { type: 'MultiPoint', coordinates: n ? [[96, -9], [142, 40]] : [[92, -11], [146, 44]] } as GeoJSON.MultiPoint,
        )
      : d3.geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' } as unknown as GeoJSON.Polygon);
  const path = d3.geoPath(proj);
  const ps = data().places.places;
  const have = new Set(ps.map((p) => p.isoNumeric));
  const land = countries.features
    .filter((f) => f.id !== '010')
    .map((f) => {
      const cls = f.id === '360' ? 'land idn' : have.has(String(f.id)) ? 'land has' : 'land';
      return `<path class="${cls}" d="${path(f) ?? ''}"/>`;
    })
    .join('');
  const ms = ps.map((p) => ({ p, m: measure(p) }));
  const max = Math.max(...ms.map((x) => x.m.d.value ?? 0), 1);
  const rMax = ui.mapView === 'asia' ? (n ? 20 : 30) : n ? 11 : 20;
  // Small offsets keep neighbouring labels (Jakarta/Bekasi, Bangkok/Vientiane) from colliding.
  const nudge: Record<string, [number, number, 'start' | 'end']> = {
    jakarta: [-1, 1, 'end'],
    'kota-bekasi': [1, 1, 'start'],
    vientiane: [1, -1, 'start'],
    bangkok: [-1, 0, 'end'],
    'kuala-lumpur': [-1, 2, 'end'],
    singapore: [1, 1, 'start'],
    'phnom-penh': [-1, 2.2, 'end'],
    'ho-chi-minh-city': [1, 0, 'start'],
    surabaya: [-1, -1.8, 'end'],
    denpasar: [1, 0.2, 'start'],
    medan: [-1, 0, 'end'],
    makassar: [1, 0, 'start'],
  };
  const bubbles = ms
    .sort((a, b) => (b.m.d.value ?? 0) - (a.m.d.value ?? 0))
    .map(({ p, m }) => {
      const xy = proj([p.lon, p.lat]);
      if (!xy) return '';
      const [x, y] = xy;
      const v = m.d.value;
      const r = v === null ? 4 : Math.max(3, Math.sqrt(v / max) * rMax);
      const isId = p.iso2 === 'ID';
      let [dx, dy, anchor] = nudge[p.id] ?? [1, 0, 'start'];
      // Labels near an edge go to the other side of the bubble instead of being cut off.
      const room = 74;
      if (anchor === 'end' && x - r - room < 0) [dx, anchor] = [1, 'start'];
      if (anchor === 'start' && x + r + room > W) [dx, anchor] = [-1, 'end'];
      const lx = x + dx * (r + 4);
      const ly = y + dy * (r * 0.6) + 4;
      const label =
        (ui.mapView === 'asia' && (n ? !CROWDED.has(p.id) : !CROWDED_WIDE.has(p.id))) || (isId && p.id === 'jakarta')
          ? `<text x="${lx.toFixed(1)}" y="${(ly - 6).toFixed(1)}" text-anchor="${anchor}">${esc(L(p.city))}</text><text class="v" x="${lx.toFixed(1)}" y="${(ly + 7).toFixed(1)}" text-anchor="${anchor}">${esc(m.text)}</text>`
          : '';
      const cls = `bub ${isId ? 'b-id' : 'b-other'}${v === null || isWeak(m.d.status) ? ' open' : ''}`;
      return `<g><circle class="${cls}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"><title>${esc(L(p.city))}: ${esc(m.text)}</title></circle>${label}</g>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('map.aria'))}"><rect class="ocean" width="${W}" height="${H}"/>${land}${bubbles}</svg>`;
}
