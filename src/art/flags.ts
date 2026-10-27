// Simplified national flags as inline SVG (30×20). Drawn by hand so they render the same on every OS,
// unlike emoji flags, which Windows shows as letters.

const star = (cx: number, cy: number, r: number, fill: string) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.4 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
};

const stripes = (colors: [string, number][]) => {
  const total = colors.reduce((s, [, w]) => s + w, 0);
  let y = 0;
  return colors
    .map(([c, w]) => {
      const h = (20 * w) / total;
      const r = `<rect x="0" y="${y.toFixed(2)}" width="30" height="${(h + 0.05).toFixed(2)}" fill="${c}"/>`;
      y += h;
      return r;
    })
    .join('');
};

const BODY: Record<string, string> = {
  ID: stripes([['#CE1126', 1], ['#FFFFFF', 1]]),
  JP: `<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#BC002D"/>`,
  VN: `<rect width="30" height="20" fill="#DA251D"/>${star(15, 10.4, 6, '#FFFF00')}`,
  TH: stripes([['#A51931', 1], ['#F4F5F8', 1], ['#2D2A4A', 2], ['#F4F5F8', 1], ['#A51931', 1]]),
  LA: `${stripes([['#CE1126', 1], ['#002868', 2], ['#CE1126', 1]])}<circle cx="15" cy="10" r="4" fill="#fff"/>`,
  SG: `${stripes([['#EF3340', 1], ['#FFFFFF', 1]])}<circle cx="6" cy="5" r="3.2" fill="#fff"/><circle cx="7.3" cy="5" r="3" fill="#EF3340"/>${[
    [9.6, 3],
    [11.3, 4.3],
    [10.7, 6.3],
    [8.5, 6.3],
    [7.9, 4.3],
  ]
    .map(([x, y]) => star(x!, y!, 0.75, '#fff'))
    .join('')}`,
  MY: `${Array.from({ length: 14 }, (_, i) => `<rect x="0" y="${((20 / 14) * i).toFixed(2)}" width="30" height="${(20 / 14 + 0.05).toFixed(2)}" fill="${i % 2 ? '#fff' : '#CC0001'}"/>`).join('')}<rect width="15" height="11.43" fill="#010066"/><circle cx="5.6" cy="5.7" r="3.6" fill="#FC0"/><circle cx="6.6" cy="5.7" r="3" fill="#010066"/>${star(10.6, 5.7, 2.6, '#FC0')}`,
  PH: `${stripes([['#0038A8', 1], ['#CE1126', 1]])}<polygon points="0,0 17.3,10 0,20" fill="#fff"/><circle cx="5.8" cy="10" r="2.2" fill="#FCD116"/>${star(1.6, 2.6, 1, '#FCD116')}${star(1.6, 17.4, 1, '#FCD116')}${star(14.2, 10, 1, '#FCD116')}`,
  KH: `${stripes([['#032EA1', 1], ['#E00025', 2], ['#032EA1', 1]])}<g fill="#fff"><rect x="9" y="12.2" width="12" height="1.4"/><rect x="10" y="9" width="2" height="3.2"/><rect x="18" y="9" width="2" height="3.2"/><rect x="13.6" y="7.4" width="2.8" height="4.8"/><polygon points="10,9 11,6.8 12,9"/><polygon points="18,9 19,6.8 20,9"/><polygon points="13.6,7.4 15,4.6 16.4,7.4"/></g>`,
  KR: `<rect width="30" height="20" fill="#fff"/><g transform="rotate(33.7 15 10)"><path d="M10 10a5 5 0 0 1 10 0z" fill="#CD2E3A"/><path d="M10 10a5 5 0 0 0 10 0z" fill="#0047A0"/><circle cx="12.5" cy="10" r="2.5" fill="#CD2E3A"/><circle cx="17.5" cy="10" r="2.5" fill="#0047A0"/></g><g fill="#000">${[
    [5.2, 4.2, -33.7],
    [24.8, 15.8, -33.7],
    [24.8, 4.2, 33.7],
    [5.2, 15.8, 33.7],
  ]
    .map(
      ([x, y, r]) =>
        `<g transform="rotate(${r} ${x} ${y})"><rect x="${x! - 2.5}" y="${y! - 1.9}" width="5" height="0.9"/><rect x="${x! - 2.5}" y="${y! - 0.45}" width="5" height="0.9"/><rect x="${x! - 2.5}" y="${y! + 1}" width="5" height="0.9"/></g>`,
    )
    .join('')}</g>`,
};

export function flag(iso2: string, label: string, cls = 'flag'): string {
  const body = BODY[iso2];
  if (!body) return '';
  return `<svg class="${cls}" viewBox="0 0 30 20" role="img" aria-label="${label}"><title>${label}</title>${body}<rect width="30" height="20" fill="none" stroke="rgba(0,0,0,.18)" stroke-width=".6"/></svg>`;
}
