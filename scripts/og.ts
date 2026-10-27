// npm run og: builds the site, screenshots each share view to public/og/<view>.png and writes
// public/s/<view>.html, a tiny page with that image in its Open Graph tags that forwards to the view.
// Re-run after changing data that the share images show, then commit the results.
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

// Playwright isn't a dependency (it's large); use a project or global install:
//   npm i -D playwright && npx playwright install chromium
type Browser = { newPage(o: object): Promise<any>; close(): Promise<void> };
const { chromium } = createRequire(import.meta.url)('playwright') as { chromium: { launch(): Promise<Browser> } };

const root = join(import.meta.dirname, '..');
const base = process.env.BASE ?? '/Indonesia-Tanggal-Tua/';
const site = process.env.SITE_URL ?? `https://kevingit-byte.github.io${base}`;
const views: Record<string, string> = {
  home: 'Berapa jam kerja untuk hidup pas-pasan?',
  'item-rice': 'Satu kilo beras, diukur dengan menit kerja upah minimum',
  'wishlist-iphone': 'iPhone 17: berapa hari kerja upah minimum?',
  'wishlist-switch2': 'Nintendo Switch 2: berapa hari kerja upah minimum?',
  'wishlist-bigmac': 'Big Mac: berapa menit kerja upah minimum?',
  'wishlist-latte': 'Starbucks latte: berapa jam kerja upah minimum?',
  'basket-idr': 'Berapa banyak upah minimum habis untuk kebutuhan pokok',
  'history-rice': 'Beras di Jakarta: makin berat atau makin ringan sejak 2018?',
};

execSync('npx vite build', { cwd: root, stdio: 'inherit' });
const server = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { cwd: root, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2000));
mkdirSync(join(root, 'public/og'), { recursive: true });
mkdirSync(join(root, 'public/s'), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [view, title] of Object.entries(views)) {
    await page.goto(`http://localhost:4174${base}?og=${view}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.og');
    await page.screenshot({ path: join(root, `public/og/${view}.png`), type: 'png' });
    if (view === 'home') continue;
    const target = `../#${view}`;
    writeFileSync(
      join(root, `public/s/${view}.html`),
      `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${title} · Berapa Jam Kerja</title>
<meta property="og:type" content="website"><meta property="og:title" content="${title}">
<meta property="og:description" content="Harga diukur dengan waktu kerja upah minimum: Indonesia, Asia Tenggara, Korea, Jepang.">
<meta property="og:image" content="${site}og/${view}.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${site}#${view}"></head><body><a href="${target}">${title}</a></body></html>\n`,
    );
    console.log('og', view);
  }
} finally {
  await browser.close();
  server.kill();
}
