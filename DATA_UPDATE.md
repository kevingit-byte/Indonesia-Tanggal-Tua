# Monthly data update

Do this once a month, plus the dated items below. After editing, run `npm run check-data` and bump `updated` in each file you touched (it drives the "last updated" badge).

## Every month

- [ ] **Indonesian food prices**: Bank Indonesia PIHPS (https://www.bi.go.id/hargapangan), national average, latest date. Update `prices.json` for Indonesian places: rice (beras medium), eggs (telur ayam ras), chicken (daging ayam ras), beef (daging sapi), cooking oil (minyak goreng). `status: snapshot`, `asOf` = the PIHPS date.
- [ ] **Rice series**: if a new year has started, add a `rice` anchor to `timeseries-jakarta.json` from the same PIHPS read.
- [ ] **FX**: update `fxPerUsd` in `places.json` for every non-USD currency, all from one source and one date.
- [ ] **Wishlist**: re-read Apple store pages (iPhone 17 256 GB) and retailer pages for Switch 2, Stanley Quencher 40 oz, Starbucks grande latte and Netflix Standard. Use the seller's own page where one exists and set `asOf` to the day read.
- [ ] Run `npm run check-data` and look at the gaps list: work down the values still citing `bjk-prototype-2026-10`.

## Dated

- [ ] **January and July**: The Economist Big Mac index release (https://github.com/TheEconomist/big-mac-data). Update `bigmac` prices.
- [ ] **November–December**: Kemnaker and provincial governors announce next year's **UMP** (by 21 November) and **UMK** (by 30 November–December). Update `regions-id.json` (set `year`), the Indonesian places in `places.json`, and add the new Jakarta UMP point to `timeseries-jakarta.json`.
- [ ] **Each country's wage review**: Japan (October, MHLW regional minimums), Korea (decided August, effective 1 January), Vietnam (decree, usually 1 January or 1 July), Philippines (NCR wage orders, NWPC), Thailand (Wage Committee), Malaysia (Minimum Wages Order), Cambodia (garment sector, announced September–October for 1 January), Laos, Singapore (MOM Local Qualifying Salary).
- [ ] **Fuel and electricity** when Pertamina or PLN announce a change (PLN tariff adjustments are quarterly).

## Rules

- Never type a number without a source. If you must approximate, set `status: estimate` and say how in `note`.
- Not sold in a country → `value: null` with a `note`. Not found yet → leave the field out.
- Don't add interpolated points to the time series; add published anchors only.
- Add every new source to `sources.json` with the date you read it.
- Write notes in English and add the Indonesian version to `notes-id.json` (key = the English note). `check-data` lists notes without one.
