# Method: "Kamu di persentil berapa?"

The section places a household income in the distribution of income among adults in Indonesia and in the world. The idea follows the World Inequality Database's [Income Comparator](https://wid.world/income-comparator/). The code, text and design here are our own, and the data are WID's (credited on the page). Everything is computed in the reader's browser; nothing typed is stored or sent.

Code: `src/lib/percentile.ts` (pure functions, tested in `src/lib/percentile.test.ts`), UI in `src/rank.ts`.

## Data

| File | What | Source |
|---|---|---|
| `data/wid-indonesia.json` | 127 percentile groups (p0–p1 … p99–p100, then p99.0–p99.9 by 0.1, p99.9–p99.99 by 0.01, p99.99–p100 by 0.001) with entry threshold and average | WID bulk download, `WID_data_ID.csv` |
| `data/wid-world.json` | Same, for the world at purchasing-power parity | `WID_data_WO-PPP.csv` |
| `data/bps-wages.json` | Average take-home pay of employees: national, by sex, 17 sectors | BPS Sakernas May 2026 (press release 5 Aug 2026) |

- **Concept.** Pre-tax national income (`ptinc`) under WID's Distributional National Accounts (DINA) guidelines: labour plus capital income, pensions and unemployment benefits, after social contributions, before income tax and social assistance. It includes imputed rent of owner-occupiers and corporate retained earnings, and it sums to national income, so it also contains net taxes on production (VAT and similar).
- **Unit.** Adults aged 20+, income split equally within couples (`j`, age `992`).
- **Variables.** `tptinc992j` (threshold), `aptinc992j` (average). In the bulk CSV they appear as `tptincj992` and `aptincj992`.
- **Year and prices.** Distribution year 2024 for both files. Values in constant 2025 prices (WID's price index `inyixx999i` = 1 in 2025): rupiah for Indonesia, US dollars at PPP for the world.
- **Other factors** (all in `wid-indonesia.json`, each a sourced Datum):
  - production-tax share 7.2% = `mptxgoi999` ÷ `mnninci999` (2024);
  - PPP Rp4.719,44 per US$ = `xlcusp999i` (2025);
  - CPI factor 0,9682 = BPS CPI September 2025 (108,74) ÷ September 2026 (112,31), which turns September-2026 rupiah into 2025 prices (it approximates the 2025 average price level by September 2025);
  - retained-earnings rate 14.9% for shareholdings, as shown by WID's comparator for Indonesia (not in the bulk download; marked `snapshot`).
- **Downloaded** 27 October 2026 with HTTP range requests on `https://wid.world/bulk_download/wid_all_data.zip` (only the four Indonesia and World files were read).
- **Licence.** WID publishes no explicit licence for the bulk data. We credit "World Inequality Database (WID.world)" on the result card and in the footer, link to it, ship only a 127-row extract per region, and exclude its figures from this site's own copyright claim (see LICENSE).

## Steps

1. **Household income per month** = entered amount (÷ 12 if per year) + imputed rent (if the home is owned: what it would rent for per month) + shares × 14.9% ÷ 12.
2. **Per adult** = that ÷ number of adults (1–6+). This is the figure shown as "Per orang dewasa".
3. **To WID units**: × 12 (per year) × 0,9682 (2026 → 2025 prices) ÷ (1 − 0,072) (add production taxes, because WID's incomes include them and a household's own income does not). On the page the amount compared is shown with the tax added, and the tax amount is explained.
4. **Indonesia percentile**: find the last group whose threshold is at or below the income; within the group the position is interpolated linearly between its threshold and the next group's, **for display only**. Above the highest published threshold (p99.999) nothing is extrapolated: the page says "at least the top 0.001%".
5. **World percentile**: the step-3 amount ÷ PPP (Rp4.719,44 per dollar), looked up in the world distribution the same way.
6. **Showing WID amounts back in rupiah** (tooltips, thresholds table, multipliers): the inverse of step 3, so they are on the same basis as what the reader typed: per adult per month, 2026 rupiah, without production taxes. World amounts are first × PPP.
7. **Tiers**: bottom 50% (< P50), middle 40% (P50–P90), top 10%, top 5%, top 1%. "Top X%" = 100 − percentile, rounded together with the percentile so the two always add up to 100.
8. **Multipliers**: average of the top 1% (p99–p100) ÷ reader's income; reader's income ÷ average of the bottom 50%; the world top 1% the same way.
9. **Work time**: the reader's per-adult monthly income is treated as pay for 173 hours (Indonesia's statutory divisor) and compared with the median adult (P50 threshold, step 6) and the Jakarta UMP, for an iPhone 17, a trip to Europe and a month of basics in Jakarta.
10. **Growth since 1980**: average income of each percentile in 2024 ÷ 1980, both in 2025 prices.

### Thresholds (per adult per month, 2026 rupiah)

| Group | Indonesia (reader's basis) | Indonesia (WID basis, 2025 prices, incl. production taxes) | World (reader's basis, at PPP) |
|---|---|---|---|
| Top 50% (P50) | Rp4.008.245 | Rp4.181.878 | Rp4.518.210 |
| Top 40% (P60) | Rp5.300.096 | Rp5.529.690 | Rp6.590.721 |
| Top 30% (P70) | Rp7.213.257 | Rp7.525.728 | Rp9.870.626 |
| Top 20% (P80) | Rp9.915.615 | Rp10.345.149 | Rp15.045.495 |
| Top 10% (P90) | Rp14.697.732 | Rp15.334.423 | Rp26.104.291 |
| Top 5% (P95) | Rp22.529.844 | Rp23.505.814 | Rp40.187.414 |
| Top 1% (P99) | Rp54.858.715 | Rp57.235.138 | Rp89.028.637 |
| Top 0.1% (P99.9) | Rp218.723.816 | Rp228.198.705 | Rp329.469.322 |
| Top 0.01% (P99.99) | Rp699.304.667 | Rp729.597.822 | Rp1.321.445.566 |

## Reference case and why it differs from WID's comparator

Rp10 juta a month, 2 adults, renting, no shares → Rp5 juta per adult.

| | WID Income Comparator (checked by the site owner) | This site |
|---|---|---|
| Indonesia | about P62 ("top 40%") | **P58** ("top 42%") |
| World | about P36–38 | **P53** |

We did not tune the method to match. The differences, as far as we can tell:

- **Data release.** The bulk data downloaded on 27 October 2026 run to 2024 (2025 prices). The comparator appears to use an earlier release; real incomes grew, so the same rupiah amount ranks lower against newer data.
- **Price level.** We convert 2026 rupiah to WID's 2025 prices (−3.2%). Without this step the case is P59.
- **World.** In WID's own world distribution at PPP (`WO-PPP`, 2024), the median adult earns about US$950 a month at PPP, and Rp5 juta per adult is about US$1.060–1.140 at PPP, so slightly above the world median (P51–53). We could not reproduce P36–38 with the published data, and we do not know the comparator's internal conversion. The test in `percentile.test.ts` pins our own result so a data update that moves it gets noticed.

## The wage lens (BPS)

The brief asked for a second lens: a salary against the distribution of employee wages from BPS Sakernas. **BPS does not publish wage percentiles.** Its tables give average (mean) take-home pay by province, sector, sex, age and education. A distribution needs the Sakernas microdata, which is not public. So the lens is built as a **comparison, not a ranking**: the reader's take-home pay ÷ the national average, the average for their sector and, optionally, for their sex, with a bar chart of all 17 sector averages. The page says plainly that it cannot give a percentile and that averages sit above what most employees earn. No distribution is invented.

Source: BPS press release of 5 August 2026 (Sakernas May 2026), read through CNBC Indonesia's report because bps.go.id refuses automated access. Average Rp3,39 juta; men Rp3,69 juta, women Rp2,86 juta; sectors from Rp2,26 juta (other services) to Rp5,79 juta (mining).

## Privacy

- Inputs live in memory in `src/rank.ts`. They are not written to localStorage, cookies or the URL, and nothing is sent anywhere (checked in a browser run that logged every request: none carried the input).
- A shared link carries only the top share (`#rank-t42`). The income goes into the link (`#rank-i10000000-a2`) only if the reader ticks "Sertakan angka pendapatanku di tautan", which is off by default and says what it does.
- The share card (Post 4:5 or Story 9:16) is drawn on a canvas in the browser. It shows only the percentile, the world percentile, a tier line and, for the top tiers, the public top-1% threshold, never the reader's income. The prefilled share text likewise carries only the percentile.

## Data status (freshness)

`data/freshness.json` gives each indicator kind a publishing cadence and a grace period. A value is **current** while younger than the cadence, **due** within the grace period, and **overdue** after it. Age counts from `asOf`. For prices that stay valid until they change (fares, tariffs, shop prices, visa fees: `"basis": "checked"`) it counts from the later of `asOf` and the day the source was last read. `src/lib/freshness.ts` holds the logic. It drives `/status.html`, which is judged against the reader's date, and `npm run check-data`, which lists overdue values as gaps. Set `TODAY=YYYY-MM-DD` to check against another date.
