# Berapa Jam Kerja

How many hours of minimum-wage work do rice, a room, a bus ride or an iPhone cost in Indonesia, compared with Southeast Asia, Korea and Japan? Every price on the site is converted into work time.

Status: **all nine sections built**: map, one item across cities, wishlist, monthly basket, regions inside Indonesia, Jakarta since 2018, salary calculator, context, editable data table. Bahasa Indonesia by default, English toggle, light/dark theme. Lighthouse mobile (local build): performance 92–93, accessibility 100, best practices 100, SEO 100.

## Run it

```sh
npm install
npm run dev            # local site
npm run check-data     # validate /data (also runs as part of build)
npm test               # unit tests for the method
npm run build          # check-data + typecheck + static build into dist/
```

The site builds for the domain root. `BASE=/<path>/ npm run build` builds for a sub-path instead (e.g. GitHub Pages).

### Deploy

Live at https://indonesia-tanggal-tua.vercel.app/. Vercel builds and publishes every push to `main` (and gives each pull request a preview link); its build runs `npm run build`, so a data error stops the deploy. `.github/workflows/check.yml` runs tests and the build on pull requests.

### Share images

`npm run og` screenshots each shareable view into `public/og/*.png` and writes `public/s/<view>.html` (Open Graph tags + redirect to `#<view>`). It needs Playwright (`npm i -D playwright && npx playwright install chromium`). Re-run after data changes that the share cards show, and commit the output.

## Project layout

```
data/                     all numbers, versioned; nothing numeric lives in code
  places.json             cities: wage, wage type, monthly hours, FX, rent, transit fare
  prices.json             groceries and utilities per place
  wishlist.json           iPhone, Switch 2, Stanley, Starbucks, Big Mac, Netflix per country
  regions-id.json         2026 UMP/UMK for Indonesian regions
  timeseries-jakarta.json Jakarta UMP 2000–2026 and published rice-price anchors
  sources.json            every source: title, publisher, URL, access date
  notes-id.json           Indonesian version of every English note (shown when the page is in Indonesian)
  method.json             basket quantities, workday length, index base year
scripts/check-data.ts     validator (npm run check-data)
scripts/og.ts             share images and share pages (npm run og)
src/main.ts               page shell, events, source dialog, URL hash
src/sections.ts           one renderer per section (HTML strings)
src/map.ts                bubble map (d3-geo + world-atlas 110m, loaded on demand)
src/art/                  hand-drawn SVG flags and city landmarks
src/i18n.ts               Indonesian / English strings
src/store.ts              data + reader's edits (localStorage) + UI state
src/data/types.ts         TypeScript shapes of the data files
src/data/units.ts         unit parsing shared by the model and the validator
src/lib/model.ts          the method: pay per minute, work time, basket, interpolation
DATA_UPDATE.md            monthly update checklist
```

## Data rules

Every number is a **Datum**:

```json
{ "value": 5729876, "unit": "IDR/month", "asOf": "2026-01-01", "sourceId": "kemnaker-ump-2026", "status": "official", "note": "optional" }
```

| field | meaning |
|---|---|
| `value` | a number, or `null` for "not sold here" (a `note` saying why is then required) |
| `unit` | `<numerator>/<denominator>`: `IDR/kg`, `THB/day`, `KRW/hour`, `IDR/USD`, `h/month` |
| `asOf` | `YYYY-MM-DD` the value applies to: effective date, survey date, or the day a shop page was read |
| `sourceId` | an `id` in `sources.json` |
| `status` | `official` (government or seller), `snapshot` (observed once: shop page, survey, third-party index), `estimate` (our approximation), `interpolated` |

- A value that has not been found yet is **left out** of the file, not set to `null` and not guessed. The validator lists these as gaps.
- Wages are stored in the unit the law uses (per month, day or hour). The model converts them using `monthlyHours` and `method.workdayHours`.
- Wishlist prices may be in local currency or USD (Cambodia prices in USD); the model converts with `fxPerUsd`.
- Time series store **published anchors only**. The site draws straight lines between them and marks those years `interpolated`. The validator rejects hand-entered interpolated points.
- `sources.json` `accessed: null` means the figure was carried over from the prototype and its source has not been re-opened yet.

`npm run check-data` fails on: a value without unit, date, source or status; an unknown source id; a unit that doesn't match the field (e.g. `JPY/item` for Thailand, a wage per week); an `asOf` after the file's `updated` date; `null` without a note. It prints gaps (missing values, sources not re-opened, values still citing the prototype) as warnings. `npm run check-data:strict` turns gaps into failures; use it before calling the data complete. Add `--verbose` to list every missing value.

## Method

- Pay per minute = monthly wage ÷ (monthly hours × 60). Work time = price ÷ pay per minute.
- Monthly hours: 173 (ID, JP), 174 (CN), 191 (SG), 195 (MY), 208 (TH, VN, PH, KH, LA), 209 (KR): each country's statutory normal week × 52 ÷ 12 (Korea's official 209), stored per place with the law in `note`.
- Daily wages count monthly hours ÷ 8 days (e.g. Bangkok ฿400 × 26).
- Monthly basics basket for one person (`method.json`): one room, 8 kg rice, 3 kg eggs, 4 kg chicken, 1 kg beef, 2 L oil, 90 kWh electricity, 44 transit rides. Leftover = wage − basket.
- Every computed figure carries the weakest status of its inputs, so anything built on an estimate is shown as an estimate.
- Jakarta history uses Bank Indonesia PIHPS (mid-January, DKI Jakarta traditional markets), which starts in 2018. Earlier years are not guessed; published pre-2018 rice anchors can be added to `timeseries-jakarta.json` and the chart will draw them, with years in between marked interpolated.
- Myanmar is left out: its exchange rate and price data are unreliable.

## Design notes

- Indonesia in rupiah red, every other city in slate. Hatched bars, dashed bubbles and a ≈ mark mean the number includes an estimate; the legend says so under every chart.
- Every number on screen is a button: one click opens where it comes from (value, unit, date, status, source link, note), including all inputs of a computed figure.
- Each city carries its flag and a line-drawn landmark (Monas, Petronas Towers, Marina Bay Sands, Wat Arun, Bitexco, a jeepney, Independence Monument, Patuxai, N Seoul Tower, Tokyo Tower, a KRL train for Bekasi).
- Basket colours (room, food, transit, electricity) are validated for colour-blind separation and 3:1 contrast in both themes.
- Sections render as they near the screen; the map and world atlas load after first paint.
- Bahasa Indonesia by default; `?lang=en` (or the ID | EN switch) gives English, and the switch updates the address so it can be shared as-is.
- URL hash keeps the view: `#wishlist-iphone`, `#item-beef`, `#map-bigmac`, `#history-eggs`, `#regions-umk`.

## Updating data

See [DATA_UPDATE.md](DATA_UPDATE.md).
