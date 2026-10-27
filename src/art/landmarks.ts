// One line-drawn landmark per city, 64×64, stroked in currentColor so it follows the theme.
// Kept deliberately simple: they identify the place, they are not architectural drawings.

const L: Record<string, { name: { id: string; en: string }; d: string }> = {
  jakarta: {
    name: { id: 'Monas', en: 'National Monument (Monas)' },
    d: 'M10 60h44M16 60v-6h32v6M20 54v-5h24v5M29 49l1.5-33h3L35 49M28 16h8M30 16c-2-3 0-6 2-9 2 3 4 6 2 9',
  },
  'kota-bekasi': {
    name: { id: 'KRL Commuter Line', en: 'KRL commuter train' },
    d: 'M8 60h48M14 54h36M18 54V22q0-6 6-6h16q6 0 6 6v32M18 30h28M23 36h6M35 36h6M24 46h0M40 46h0M22 54l-4 6M42 54l4 6M32 16v-6M26 10h12',
  },
  'kuala-lumpur': {
    name: { id: 'Menara Petronas', en: 'Petronas Towers' },
    d: 'M6 60h52M16 60V22l4-6 4 6v38M40 60V22l4-6 4 6v38M20 16V6M44 16V6M24 34h16M18 28h4M18 40h4M18 50h4M42 28h4M42 40h4M42 50h4',
  },
  singapore: {
    name: { id: 'Marina Bay Sands', en: 'Marina Bay Sands' },
    d: 'M4 60h56M12 60l2-38h8l-1 38M28 60l1-38h8l1 38M43 60l-1-38h8l2 38M8 22h50l-2-4H10zM4 64h56',
  },
  bangkok: {
    name: { id: 'Wat Arun', en: 'Wat Arun' },
    d: 'M6 60h52M14 60v-8h36v8M18 52v-8h28v8M22 44l3-14h14l3 14M25 30l3-12h8l3 12M28 18l4-12 4 12M10 52v-6l3-4 3 4v6M48 52v-6l3-4 3 4v6',
  },
  'ho-chi-minh-city': {
    name: { id: 'Menara Bitexco', en: 'Bitexco Financial Tower' },
    d: 'M8 60h48M24 60c-1-18 0-34 6-52 6 18 8 34 6 52M26 30h14l4-3h-6M28 42h8M27 50h10M30 8v-4',
  },
  manila: {
    name: { id: 'Jeepney', en: 'Jeepney' },
    d: 'M4 56h56M8 50V32h40l8 8v10H8M12 32V26h34v6M14 38h8M26 38h8M38 38h6M18 56a4 4 0 1 0 0-.1M46 56a4 4 0 1 0 0-.1M28 26l2-6h4l2 6',
  },
  'phnom-penh': {
    name: { id: 'Monumen Kemerdekaan', en: 'Independence Monument' },
    d: 'M8 60h48M14 60v-6h36v6M18 54v-8h28v8M22 46v-8h20v8M26 38v-8h12v8M28 30l4-20 4 20M24 46l-2-4M42 46l2-4M28 38l-2-4M38 38l2-4',
  },
  vientiane: {
    name: { id: 'Patuxai', en: 'Patuxai victory gate' },
    d: 'M6 60h52M12 60V30h40v30M26 60V46a6 6 0 0 1 12 0v14M12 30l4-6h32l4 6M20 24l2-8 2 8M40 24l2-8 2 8M30 24l2-14 2 14M16 38h4M44 38h4',
  },
  seoul: {
    name: { id: 'N Seoul Tower', en: 'N Seoul Tower' },
    d: 'M4 60c10-10 20-14 28-14s18 4 28 14M30 46V24h4v22M26 24h12l-2-6h-8zM29 18v-4h6v4M32 14V4M24 46h16',
  },
  shanghai: {
    name: { id: 'Menara Mutiara Timur', en: 'Oriental Pearl Tower' },
    d: 'M8 60h48M24 60l6-14M40 60l-6-14M26 46a6 6 0 1 0 12 0a6 6 0 1 0-12 0M30 40V22M34 40V22M28 18a4 4 0 1 0 8 0a4 4 0 1 0-8 0M32 14V3M20 60l10-10M44 60L34 50',
  },
  tokyo: {
    name: { id: 'Menara Tokyo', en: 'Tokyo Tower' },
    d: 'M8 60h48M14 60L29 10h6l15 50M19 44h26M24 28h16M27 18h10M32 10V3M19 44l13-16 13 16M22 60c2-6 6-10 10-10s8 4 10 10',
  },
};

export function landmark(placeId: string, cls = 'lm'): string {
  const l = L[placeId];
  if (!l) return '';
  return `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${l.d}"/></svg>`;
}

export function landmarkName(placeId: string) {
  return L[placeId]?.name;
}
