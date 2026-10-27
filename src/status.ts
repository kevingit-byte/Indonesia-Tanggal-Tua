// /status.html: is every number still current? Judged against today's date in the reader's browser.
import './style.css';
import freshnessJson from '../data/freshness.json';
import type { FreshnessFile } from './data/types';
import { esc, num } from './format';
import { L, setLang, t, type Lang } from './i18n';
import { entries, judge, summarise, type Freshness, type Judged } from './lib/freshness';
import { baseData, source, ui } from './store';

const F = freshnessJson as unknown as FreshnessFile;
const d = baseData();
const today = new Date();
const todayIso = today.toISOString().slice(0, 10);

const lang: Lang = (new URLSearchParams(location.search).get('lang') as Lang) || ui.lang;
setLang(lang === 'en' ? 'en' : 'id');
document.documentElement.lang = lang;

/** "jakarta · rice" → "Jakarta · Beras". Unknown parts stay as they are. */
function where(w: string): string {
  return w
    .split(' · ')
    .map((part) => {
      const place = d.places.places.find((p) => p.id === part);
      if (place) return L(place.city);
      const item = d.prices.items.find((i) => i.id === part) ?? d.wishlist.items.find((i) => i.id === part);
      if (item) return L(item.label);
      const country = d.places.places.find((p) => p.iso2 === part);
      if (country) return L(country.country);
      const sector = d.bps.bySector.find((s) => s.id === part);
      if (sector) return L(sector.label);
      if (part === 'wage' || part === 'fx' || part === 'rent' || part === 'transit') return t(`st.f.${part}`);
      const region = d.regions.regions.find((r) => r.id === part);
      if (region) return `${region.level} ${region.name}`;
      return part;
    })
    .join(' · ');
}

const badge = (f: Freshness) => `<span class="st-badge st-${f}">${t(`st.${f}`)}</span>`;

function itemRow(j: Judged): string {
  const s = source(j.datum.sourceId);
  const link = s?.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.publisher)}</a>` : esc(s?.publisher ?? j.datum.sourceId);
  const checked = j.since !== j.datum.asOf ? `<small>${t('st.checked', { d: j.since })}</small>` : '';
  return `<tr><td>${esc(where(j.where))}${j.datum.status === 'estimate' ? ` <span class="tag tag-estimate">${t('status.estimate')}</span>` : ''}</td><td class="mono">${j.datum.asOf}${checked}</td><td class="mono">${j.dueOn}</td><td>${badge(j.freshness)}</td><td>${link}</td></tr>`;
}

function render() {
  const judged = entries(d).map((e) => judge(e, F, today, (id) => source(id)?.accessed ?? null));
  const groups = summarise(judged, F);
  const n = (f: Freshness) => judged.filter((j) => j.freshness === f).length;
  const est = judged.filter((j) => j.datum.status === 'estimate').length;
  const tile = (label: string, v: number, cls = '') => `<div class="st-tile ${cls}"><b>${num(v)}</b><span>${label}</span></div>`;
  const rows = groups
    .map((g) => {
      const k = F.kinds[g.kind]!;
      const counts = [g.current && `${g.current} ${t('st.current').toLowerCase()}`, g.due && `${g.due} ${t('st.due').toLowerCase()}`, g.overdue && `${g.overdue} ${t('st.overdue').toLowerCase()}`]
        .filter(Boolean)
        .join(' · ');
      return `<section class="st-kind st-k-${g.worst}">
        <div class="st-kh"><div><h2 class="h3">${esc(L(k.label))}</h2><small>${esc(L(k.schedule))}</small></div>${badge(g.worst)}</div>
        <p class="st-km">${num(g.count)} ${t('st.total').toLowerCase()} · ${counts}${g.estimates ? ` · ${g.estimates} ${t('st.estimates').toLowerCase()}` : ''} · <span class="mono">${g.oldest}${g.oldest !== g.newest ? ` → ${g.newest}` : ''}</span></p>
        <details${g.worst !== 'current' ? ' open' : ''}><summary>${t('st.items', { n: String(g.count) })}</summary><div class="tablebox"><table><thead><tr><th scope="col">${t('st.where')}</th><th scope="col">${t('st.asOf')}</th><th scope="col">${t('st.dueOn')}</th><th scope="col">${t('st.state')}</th><th scope="col">${t('st.source')}</th></tr></thead><tbody>${g.items
          .map(itemRow)
          .join('')}</tbody></table></div></details>
      </section>`;
    })
    .join('');
  const files = [
    ['places.json', d.places.updated],
    ['prices.json', d.prices.updated],
    ['wishlist.json', d.wishlist.updated],
    ['regions-id.json', d.regions.updated],
    ['timeseries-jakarta.json', d.timeseries.updated],
    ['wid-indonesia.json', d.widId.updated],
    ['wid-world.json', d.widWorld.updated],
    ['bps-wages.json', d.bps.updated],
    ['sources.json', d.sources.updated],
  ]
    .map(([f, u]) => `<li><span class="mono">${f}</span> · ${t('st.fileUpdated', { d: u! })}</li>`)
    .join('');
  document.title = `${t('st.title')} · Berapa Jam Kerja`;
  document.getElementById('main')!.innerHTML = `
    <p><a href="/${lang === 'en' ? '?lang=en' : ''}">${t('st.back')}</a></p>
    <div class="sec-head"><div class="eyebrow">Berapa Jam Kerja</div><h1 class="st-h1">${t('st.title')}</h1><p class="lede">${t('st.lede')}</p><p class="note">${t('st.today', { d: todayIso })}</p></div>
    <div class="st-tiles">${tile(t('st.total'), judged.length)}${tile(t('st.current'), n('current'), 'st-current')}${tile(t('st.due'), n('due'), 'st-due')}${tile(t('st.overdue'), n('overdue'), 'st-overdue')}${tile(t('st.estimates'), est)}</div>
    <p class="st-rules">${t('st.rules')}</p>
    ${rows}
    <section><h2 class="h3">${t('st.files')}</h2><ul class="st-files">${files}</ul><p class="note">${t('st.how')}</p></section>`;
  const opt = (v: Lang, label: string) => `<a class="btn" href="?lang=${v}" aria-current="${v === lang}">${label}</a>`;
  document.getElementById('st-lang')!.innerHTML = `<div class="seg seg-sm" role="group" aria-label="${t('lang')}">${opt('id', 'ID')}${opt('en', 'EN')}</div>`;
  document.getElementById('foot')!.innerHTML = `<p>${t('footer')}</p>`;
}

render();
