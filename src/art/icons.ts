// One small line icon per item, 24×24, stroked in currentColor. Keyed by item id in prices.json / wishlist.json,
// plus 'rent' and 'transit' for the place-level fields.

const I: Record<string, string> = {
  rice: 'M3 12h18a9 8 0 0 1-18 0zM6.5 12c.5-2.8 3-4.5 5.5-4.5s5 1.7 5.5 4.5M9 5.5l.8-2M13.5 5.5l.8-2',
  eggs: 'M9.5 4C12.5 4 15 9 15 13a5.5 5.5 0 0 1-11 0c0-4 2.5-9 5.5-9zM16.5 9.5c2.3.4 3.8 3.4 3.8 6a3.8 3.8 0 0 1-5.6 3.4',
  chicken: 'M14.5 3.5a6 6 0 0 1 6 6c0 4.2-4 6.5-7.5 6.5l-2.7 2.7a2 2 0 1 1-2.8 1.6 2 2 0 1 1-1.6-2.8L8.6 14.3C8.6 10.6 10.5 3.5 14.5 3.5z',
  beef: 'M4.5 9.5c2-4.5 9.5-6.5 14-3s2.5 11-2.5 12.5-11.5.5-12.5-3.5c-.4-2 0-4 1-6zM12 10.5a2 2 0 1 0 0 .1',
  oil: 'M10 2h4v3l2 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-3zM8 12h8M8 17h8',
  petrol: 'M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M6.5 7.5h5M14 10h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3',
  electricity: 'M13 2 5 13.5h6L10 22l8-12h-6z',
  rent: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5.5h4V20',
  transit: 'M5 17V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v11zM5 11h14M8 20v-3M16 20v-3M8.5 14h.01M15.5 14h.01M10 5.5h4',
  iphone: 'M7.5 2h9a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM10.5 4.5h3M11 19h2',
  iphone18pro: 'M7.5 2h9a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8.5 5h5v5h-5zM11 19h2',
  switch2: 'M3 7.5A2.5 2.5 0 0 1 5.5 5H8v14H5.5A2.5 2.5 0 0 1 3 16.5zM16 5h2.5A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5H16zM8 5h8v14H8M5.5 9.5h.01M18.5 14.5h.01',
  stanley: 'M6.5 5h9L14.5 21h-7zM5.5 5h11M15.6 8.5H18a2 2 0 0 1 2 2v3.5a2 2 0 0 1-2 2h-2.6M10 5V2.5h3.5',
  latte: 'M4.5 9h12v5a6 6 0 0 1-12 0zM16.5 10h1.5a2.5 2.5 0 0 1 0 5h-1.8M8 2.5v3M11 2.5v3M14 2.5v3M4 22h13',
  bigmac: 'M4 10.5a8 6.5 0 0 1 16 0zM3 13.5h18M4 16.5h16M5 19.5h14a1 1 0 0 0 1-1v-2H4v2a1 1 0 0 0 1 1z',
  netflix: 'M3 4.5h18v12.5H3zM8 21h8M10 8v6l5-3z',
  bts: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 9l11-2',
  europe: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
};

export function icon(id: string, cls = 'ic'): string {
  const d = I[id];
  if (!d) return '';
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}
