import './style.css';
import { esc, money, num } from './format';
import { setLang, t, type Lang } from './i18n';
import { loadGeo, mapSection } from './map';
import {
  basketSection,
  calcSection,
  contextSection,
  dataSection,
  hero,
  historySection,
  itemsSection,
  regionsSection,
  wishSection,
} from './sections';
import { noteText, readHash, resetEdits, setEdit, setUi, source, subscribe, ui, writeHash, type EditedDatum, type UiState } from './store';
import { getProv, resetProv } from './ui';

const SECTIONS: [string, () => string][] = [
  ['hero', hero],
  ['map', mapSection],
  ['item', itemsSection],
  ['wishlist', wishSection],
  ['basket', basketSection],
  ['regions', regionsSection],
  ['history', historySection],
  ['calc', calcSection],
  ['context', contextSection],
  ['data', dataSection],
];

/** Which hash section a UI key belongs to, so choosing an option updates the shareable URL. */
const HASH_OF: Partial<Record<keyof UiState, string>> = {
  mapMeasure: 'map',
  item: 'item',
  wish: 'wishlist',
  histItem: 'history',
  regionLevel: 'regions',
};

function applyTheme() {
  const root = document.documentElement;
  if (ui.theme === 'auto') root.removeAttribute('data-theme');
  else root.dataset.theme = ui.theme;
}

function chrome() {
  document.documentElement.lang = ui.lang;
  document.title = t('meta.title');
  const bar = document.getElementById('topbar')!;
  const opt = (group: string, v: string, label: string, cur: string) =>
    `<button type="button" data-set="${group}" data-value="${v}" aria-pressed="${v === cur}">${label}</button>`;
  bar.innerHTML = `<a class="brand" href="#top"><span class="brand-mark" aria-hidden="true">⏱</span>Berapa Jam Kerja</a>
    <div class="tb-ctrls">
      <div class="seg seg-sm" role="group" aria-label="${t('lang')}">${opt('lang', 'id', 'ID', ui.lang)}${opt('lang', 'en', 'EN', ui.lang)}</div>
      <div class="seg seg-sm" role="group" aria-label="${t('theme')}">${opt('theme', 'auto', '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/></svg>', ui.theme)}${opt('theme', 'light', '☀', ui.theme)}${opt(
        'theme',
        'dark',
        '☾',
        ui.theme,
      )}</div>
    </div>`;
  bar.querySelectorAll<HTMLButtonElement>('[data-value="auto"]').forEach((b) => b.setAttribute('aria-label', t('theme.auto')));
  bar.querySelectorAll<HTMLButtonElement>('[data-value="light"]').forEach((b) => b.setAttribute('aria-label', t('theme.light')));
  bar.querySelectorAll<HTMLButtonElement>('[data-value="dark"]').forEach((b) => b.setAttribute('aria-label', t('theme.dark')));
  document.getElementById('skip')!.textContent = t('skip');
  document.getElementById('foot')!.innerHTML = `<p>${t('footer')}</p>`;
}

function render() {
  setLang(ui.lang);
  applyTheme();
  chrome();
  resetProv();
  // Keep focus on the control the reader just used, across the re-render.
  const active = document.activeElement as HTMLElement | null;
  const focusKey = active?.dataset.set ? `[data-set="${active.dataset.set}"][data-value="${active.dataset.value}"]` : active?.id ? `#${active.id}` : null;
  const caret = active instanceof HTMLInputElement ? active.selectionStart : null;
  for (const [id, fn] of SECTIONS) {
    const el = document.getElementById(id)!;
    if (shown.has(id)) {
      el.innerHTML = fn();
      el.classList.remove('pending');
    }
  }
  if (focusKey) {
    const el = document.querySelector<HTMLElement>(focusKey);
    el?.focus({ preventScroll: true });
    if (el instanceof HTMLInputElement && caret !== null) {
      const pos = Math.max(0, el.value.length - ((active as HTMLInputElement).value.length - caret));
      el.setSelectionRange(pos, pos);
    }
  }
}

/** Render only the given sections, leaving the rest of the page (and its source buttons) untouched. */
function renderSections(ids: string[]) {
  for (const [id, fn] of SECTIONS) {
    if (!ids.includes(id)) continue;
    const el = document.getElementById(id)!;
    el.innerHTML = fn();
    el.classList.remove('pending');
  }
}

/** Sections render once they come near the screen, so the first paint only builds what is visible. */
const shown = new Set(['hero', 'map', 'item']);
const observer = new IntersectionObserver(
  (entries) => {
    const added: string[] = [];
    for (const e of entries)
      if (e.isIntersecting && !shown.has(e.target.id)) {
        shown.add(e.target.id);
        observer.unobserve(e.target);
        added.push(e.target.id);
      }
    if (added.length) renderSections(added);
  },
  { rootMargin: '400px 0px' },
);

subscribe(render);
matchMedia('(max-width: 560px)').addEventListener('change', render);

// ---- events
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const set = target.closest<HTMLElement>('[data-set]');
  if (set) {
    const key = set.dataset.set as keyof UiState;
    const value = set.dataset.value!;
    if (key === 'lang') {
      setLang(value as Lang);
      const url = new URL(location.href);
      url.searchParams.set('lang', value);
      history.replaceState(null, '', url);
    }
    setUi({ [key]: value } as Partial<UiState>);
    const section = HASH_OF[key];
    if (section) writeHash(section, value.toLowerCase());
    return;
  }
  const pv = target.closest<HTMLElement>('[data-prov]');
  if (pv) return openProv(Number(pv.dataset.prov));
  const share = target.closest<HTMLElement>('[data-share]');
  if (share) return doShare(share);
  if (target.closest('[data-action="reset"]')) resetEdits();
});

document.addEventListener('change', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.dataset.edit) {
    const v = el.value.trim() === '' ? null : Number(el.value.replace(',', '.'));
    setEdit(el.dataset.edit, v !== null && Number.isFinite(v) && v >= 0 ? v : null);
  }
  if (el.dataset.calc === 'calcPlace') setUi({ calcPlace: el.value });
});

document.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  const k = el.dataset.calc;
  if (k === 'calcWage' || k === 'calcHours') {
    const v = Number(el.value.replace(/[^\d]/g, ''));
    setUi({ [k]: v } as Partial<UiState>);
  }
});

// ---- provenance dialog
const dialog = document.getElementById('prov') as HTMLDialogElement;
/** "kg", "L", "kWh" stay as they are; words get translated. */
function perLabel(per: string): string {
  const k = `per.${per}`;
  return k in PER ? t(k as keyof typeof PER) : per;
}
const PER = { 'per.month': 1, 'per.day': 1, 'per.hour': 1, 'per.item': 1, 'per.ride': 1 } as const;

function openProv(id: number) {
  const p = getProv(id);
  if (!p) return;
  const items = p.inputs
    .map((d: EditedDatum) => {
      const s = source(d.sourceId);
      const [cur, per] = d.unit.split('/');
      const val =
        d.value === null
          ? t('notsold')
          : /^[A-Z]{3}$/.test(cur!)
            ? `${money(d.value, cur!)} / ${perLabel(per!)}`
            : `${num(d.value, 2)} ${cur === 'h' ? t('unit.h') : cur} / ${perLabel(per!)}`;
      const orig = d.edited ? `<div class="pv-edit">${t('status.edited')} · ${d.edited.original === null ? '–' : num(d.edited.original, 2)}</div>` : '';
      const link = s?.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s?.title ?? d.sourceId);
      return `<li><div class="pv-val"><b>${esc(val)}</b><span class="tag tag-${d.status}">${t(`status.${d.status}`)}</span></div>${orig}
        <div>${link}</div><div class="pv-meta">${esc(s?.publisher ?? '')} · ${t('prov.asof')} ${esc(d.asOf)}${
          s?.accessed ? ` · ${t('data.accessed')} ${s.accessed}` : ''
        }</div>${d.note ? `<div class="pv-note">${esc(noteText(d.note))}</div>` : ''}</li>`;
    })
    .join('');
  dialog.innerHTML = `<form method="dialog"><div class="pv-head"><div><div class="eyebrow">${t('prov.title')}</div><h3>${esc(p.label)}</h3><div class="pv-value">${p.value}</div></div><button class="btn" autofocus>${t(
    'prov.close',
  )}</button></div>${p.inputs.length > 1 ? `<p class="note">${t('prov.computed')}</p>` : ''}<ul class="pv-list">${items}</ul></form>`;
  dialog.showModal();
}
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});

const OG_KEYS = new Set(['item-rice', 'wishlist-iphone', 'wishlist-switch2', 'wishlist-bigmac', 'wishlist-latte', 'basket-idr', 'history-rice']);

async function doShare(btn: HTMLElement) {
  const key = btn.dataset.share!;
  const dir = location.pathname.replace(/[^/]*$/, '');
  const url = OG_KEYS.has(key) ? `${location.origin}${dir}s/${key}.html` : `${location.origin}${location.pathname}#${key}`;
  history.replaceState(null, '', `#${btn.dataset.share}`);
  try {
    if (navigator.share) await navigator.share({ title: t('meta.title'), url });
    else {
      await navigator.clipboard.writeText(url);
      btn.textContent = t('share.copied');
    }
  } catch {
    /* share sheet dismissed */
  }
}

// ---- start
const og = new URLSearchParams(location.search).get('og');
if (og) {
  import('./og').then((m) => m.renderOg(og));
} else {
  const section = readHash();
  if (section) shown.add(section);
  for (const [id] of SECTIONS) {
    const el = document.getElementById(id)!;
    if (!shown.has(id)) {
      el.classList.add('pending');
      observer.observe(el);
    }
  }
  render();
  if (section) document.getElementById(section)?.scrollIntoView();
  loadGeo().then(() => renderSections(['map']));
}
