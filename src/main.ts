// Placeholder until the sections are built: lists each dataset and its "last updated" date.
import places from '../data/places.json';
import prices from '../data/prices.json';
import wishlist from '../data/wishlist.json';
import regions from '../data/regions-id.json';
import timeseries from '../data/timeseries-jakarta.json';
import sources from '../data/sources.json';

const table = document.querySelector<HTMLTableElement>('#datasets')!;
for (const d of [places, prices, wishlist, regions, timeseries, sources]) {
  const row = table.insertRow();
  row.insertCell().textContent = d.dataset;
  row.insertCell().textContent = d.updated;
}
