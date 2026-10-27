// UI strings. Indonesian is the default; data labels carry their own { id, en } pairs.
export type Lang = 'id' | 'en';

const dict = {
  'meta.title': { id: 'Berapa Jam Kerja', en: 'Berapa Jam Kerja (How Many Hours of Work)' },
  'skip': { id: 'Lewati ke isi', en: 'Skip to content' },
  'hero.eyebrow': { id: 'Upah minimum vs harga · Oktober 2026', en: 'Minimum wage vs prices · October 2026' },
  'hero.title.a': { id: 'Berapa jam kerja untuk', en: 'How many hours of work does it take to' },
  'hero.title.b': { id: 'hidup pas-pasan', en: 'live basic' },
  'hero.title.c': { id: '?', en: '?' },
  'hero.lede': {
    id: 'Harga dalam rupiah terlihat murah kalau dihitung dalam dolar. Ukuran yang lebih adil: berapa lama pekerja bergaji upah minimum harus bekerja untuk membayar beras, kamar kos, ongkos bus, atau iPhone. Situs ini mengubah setiap harga menjadi waktu kerja di Indonesia, Asia Tenggara, Tiongkok, Korea, dan Jepang.',
    en: 'Rupiah prices look cheap in dollars. The fairer test is how long a minimum-wage worker has to work to pay for rice, a room, a bus ride or an iPhone. This site converts every price into work time across Indonesia, Southeast Asia, China, Korea and Japan.',
  },
  'hero.v.iphone': { id: 'iPhone 17 di Jakarta', en: 'iPhone 17 in Jakarta' },
  'hero.v.iphoneVs': { id: 'hari kerja · Tokyo {x} · Singapura {y}', en: 'workdays · Tokyo {x} · Singapore {y}' },
  'hero.v.rice': { id: '1 kg beras di Jakarta', en: '1 kg of rice in Jakarta' },
  'hero.v.riceVs': { id: 'menit kerja · Bangkok {x} · Manila {y}', en: 'minutes of work · Bangkok {x} · Manila {y}' },
  'updated': { id: 'Data diperbarui', en: 'Data updated' },
  'theme': { id: 'Tema', en: 'Theme' },
  'theme.auto': { id: 'Otomatis', en: 'Auto' },
  'theme.light': { id: 'Terang', en: 'Light' },
  'theme.dark': { id: 'Gelap', en: 'Dark' },
  'lang': { id: 'Bahasa', en: 'Language' },
  'nav': { id: 'Bagian', en: 'Sections' },

  'cmp.eyebrow': { id: 'Bandingkan', en: 'Compare' },
  'cmp.title': { id: 'Dua kota, satu ukuran: waktu kerja', en: 'Two cities, one yardstick: work time' },
  'cmp.lede': {
    id: 'Pilih dua kota. Setiap barang diukur dengan upah minimum kotanya sendiri, jadi kamu bisa lihat di mana hidup lebih ringan, dari sekilo beras sampai tiket ke Eropa.',
    en: "Pick two cities. Each item is measured against that city's own minimum wage, so you can see where life is lighter, from a kilo of rice to a ticket to Europe.",
  },
  'cmp.a': { id: 'Kota pertama', en: 'First city' },
  'cmp.b': { id: 'Kota kedua', en: 'Second city' },
  'cmp.swap': { id: 'Tukar kota', en: 'Swap cities' },
  'cmp.wage': { id: 'Upah minimum', en: 'Minimum wage' },
  'cmp.perHour': { id: 'per jam', en: 'per hour' },
  'cmp.month': { id: 'sebulan', en: 'a month' },
  'cmp.basics': { id: 'Kebutuhan pokok', en: 'Basics' },
  'cmp.wish': { id: 'Barang idaman & pengalaman', en: 'Wants & experiences' },
  'cmp.basket': { id: 'Kebutuhan sebulan, % dari upah', en: 'Monthly basics, % of wage' },
  'cmp.longer': { id: '{x}× lebih lama', en: '{x}× longer' },
  'cmp.legendLonger': { id: '= kerja lebih lama di kota ini', en: '= more work in this city' },
  'cmp.longerN': { id: '{n} lebih lama', en: '{n} longer' },
  'cmp.same': { id: 'hampir sama', en: 'about the same' },
  'cmp.summary': {
    id: 'Pekerja upah minimum di {a} harus bekerja lebih lama untuk {n} dari {m} hal yang bisa dibandingkan.',
    en: 'A minimum-wage worker in {a} has to work longer for {n} of {m} comparable things.',
  },
  'hero.cta': { id: 'Bandingkan dua kota →', en: 'Compare two cities →' },
  'map.eyebrow': { id: '1 · Peta', en: '1 · Map' },
  'map.title': { id: 'Di mana kerja upah minimum paling berarti', en: 'Where minimum-wage work goes furthest' },
  'map.lede': {
    id: 'Setiap lingkaran adalah upah minimum sebuah kota diukur terhadap satu hal. Lingkaran lebih besar berarti butuh kerja lebih lama untuk hal yang sama.',
    en: "Each circle is a city's minimum wage measured against one thing. A bigger circle means more work for the same thing.",
  },
  'map.measure': { id: 'Ukuran peta', en: 'Map measure' },
  'map.extent': { id: 'Cakupan peta', en: 'Map extent' },
  'map.asia': { id: 'Asia', en: 'Asia' },
  'map.world': { id: 'Dunia', en: 'World' },
  'map.m.basket': { id: 'Kebutuhan sebulan (% upah)', en: 'Monthly basics (% of wage)' },
  'map.m.rice': { id: '1 kg beras', en: '1 kg rice' },
  'map.m.iphone': { id: 'iPhone 17', en: 'iPhone 17' },
  'map.m.bigmac': { id: 'Big Mac', en: 'Big Mac' },
  'map.aria': { id: 'Peta kota dengan lingkaran sesuai waktu kerja', en: 'Map of cities sized by work time' },
  'map.loading': { id: 'Memuat peta…', en: 'Loading map…' },

  'item.eyebrow': { id: '2 · Satu barang, semua kota', en: '2 · One item, every city' },
  'item.title': { id: 'Harga satu barang, diukur dengan kerja', en: 'The price of one thing, measured in work' },
  'item.lede': {
    id: 'Pilih barang. Batang menunjukkan waktu kerja upah minimum per satuan. Ganti ke dolar untuk melihat kenapa "Indonesia murah" bisa terasa tidak benar.',
    en: 'Pick an item. Bars show minimum-wage work time per unit. Switch to dollars to see why "Indonesia is cheap" can feel untrue.',
  },
  'item.item': { id: 'Barang', en: 'Item' },
  'item.measure': { id: 'Satuan', en: 'Measure' },
  'item.time': { id: 'Waktu kerja', en: 'Work time' },
  'item.usd': { id: 'Dolar AS', en: 'US dollars' },
  'item.room': { id: 'Kamar sebulan', en: 'Room, a month' },
  'item.transit': { id: 'Sekali naik angkutan', en: 'One transit ride' },

  'wish.eyebrow': { id: '3 · Barang idaman', en: '3 · Wishlist' },
  'wish.title': { id: 'Barang yang benar-benar diinginkan orang', en: 'The things people actually want' },
  'wish.lede': {
    id: 'iPhone, Switch, tumbler Stanley, kopi Starbucks, nonton konser BTS, sampai jalan-jalan ke Eropa. Produk yang sama di mana-mana, jadi selisihnya terlihat jelas. Diukur dalam hari kerja 8 jam.',
    en: 'An iPhone, a Switch, a Stanley tumbler, a Starbucks run, a BTS concert, a trip to Europe. Same things everywhere, so they show the gap cleanly. Measured in 8-hour workdays.',
  },
  'wish.bundle': { id: 'Dihitung sebagai {parts}. Klik angkanya untuk melihat sumber masing-masing.', en: 'Counted as {parts}. Click a number to see each source.' },
  'wish.item': { id: 'Barang idaman', en: 'Wanted item' },

  'basket.eyebrow': { id: '4 · Kebutuhan sebulan', en: '4 · A month of basics' },
  'basket.title': { id: 'Berapa banyak upah minimum habis untuk kebutuhan pokok', en: 'How much of a minimum wage the bare basics eat' },
  'basket.lede': {
    id: 'Satu orang, satu bulan: sewa kamar, 8 kg beras, 3 kg telur, 4 kg ayam, 1 kg daging sapi, 2 L minyak goreng, 90 kWh listrik, dan 44 kali naik angkutan. Belum termasuk pulsa, pakaian, kesehatan, keluarga, atau tabungan.',
    en: 'One person, one month: a rented room, 8 kg rice, 3 kg eggs, 4 kg chicken, 1 kg beef, 2 L cooking oil, 90 kWh electricity and 44 transit rides. Nothing for phone, clothes, health, family or savings.',
  },
  'basket.note': {
    id: 'Sisa = upah minimum dikurangi kebutuhan ini. Ini batas paling banyak yang bisa ditabung, sebelum pengeluaran lain.',
    en: 'Left over = minimum wage minus these basics. This is the most a worker could save, before anything else.',
  },
  'basket.currency': { id: 'Mata uang sisa', en: 'Currency for left over' },
  'basket.local': { id: 'Lokal', en: 'Local' },
  'basket.idr': { id: 'Rupiah', en: 'Rupiah' },
  'basket.usd': { id: 'US$', en: 'US$' },
  'basket.city': { id: 'Kota', en: 'City' },
  'basket.share': { id: 'Porsi upah', en: 'Share of wage' },
  'basket.left': { id: 'Sisa', en: 'Left over' },
  'basket.room': { id: 'Kamar', en: 'Room' },
  'basket.food': { id: 'Makanan', en: 'Food' },
  'basket.power': { id: 'Listrik', en: 'Electricity' },
  'basket.transitL': { id: 'Angkutan', en: 'Transit' },
  'basket.over': { id: 'Melebihi upah', en: 'Over the wage' },

  'regions.eyebrow': { id: '5 · Di dalam Indonesia', en: '5 · Inside Indonesia' },
  'regions.title': { id: 'Belanjaan sama, upah sangat berbeda', en: 'Same groceries, very different wages' },
  'regions.lede': {
    id: 'Harga pangan antarprovinsi cukup mirip; upah minimumnya tidak. Ini bagian makanan dari keranjang tadi, dengan harga rata-rata nasional (PIHPS), sebagai porsi UMP atau UMK 2026 tiap daerah.',
    en: "Food prices across provinces are fairly close; minimum wages are not. This is the food part of the basket at national average market prices (PIHPS), as a share of each area's 2026 UMP or UMK.",
  },
  'regions.level': { id: 'Jenis upah', en: 'Wage level' },
  'regions.ump': { id: '38 provinsi (UMP)', en: '38 provinces (UMP)' },
  'regions.umk': { id: 'Kota/kabupaten (UMK)', en: 'Cities/regencies (UMK)' },
  'regions.note': {
    id: 'UMK = upah minimum kota/kabupaten, UMP = batas bawah provinsi. UMP Jawa Barat terendah di Indonesia, tetapi sebagian besar pekerjanya dilindungi UMK yang lebih tinggi. Harga pangan di Papua, Maluku, dan Kalimantan biasanya di atas rata-rata nasional, jadi porsi sebenarnya lebih tinggi dari yang terlihat.',
    en: "UMK = city/regency minimum, UMP = provincial floor. Jawa Barat's UMP is the country's lowest, but most of its workers are covered by higher UMKs. Food in Papua, Maluku and Kalimantan usually costs more than the national average, so real shares there are higher than shown.",
  },

  'hist.eyebrow': { id: '6 · Sejak 2018', en: '6 · Since 2018' },
  'hist.title': { id: 'Makin berat atau makin ringan di Jakarta?', en: 'Harder or easier to earn in Jakarta?' },
  'hist.lede': {
    id: 'UMP Jakarta setiap tahun dibandingkan harga pasar tradisional di Jakarta pada pertengahan Januari (PIHPS Bank Indonesia, tersedia sejak 2018). Garis menunjukkan menit kerja pekerja UMP penuh waktu untuk 1 kg.',
    en: "Jakarta's minimum wage each year against mid-January traditional-market prices in Jakarta (Bank Indonesia PIHPS, available from 2018). The line is the minutes of work one kilo cost a full-time UMP earner.",
  },
  'hist.item': { id: 'Bahan pangan', en: 'Food item' },
  'hist.minutes': { id: 'Menit kerja UMP per kg, Jakarta', en: 'Minutes of UMP work per kg, Jakarta' },
  'hist.index': { id: 'Pertumbuhan sejak 2018 (2018 = 100)', en: 'Growth since 2018 (2018 = 100)' },
  'hist.ump': { id: 'UMP Jakarta', en: 'Jakarta UMP' },
  'hist.year': { id: 'Tahun', en: 'Year' },
  'hist.price': { id: 'Harga per kg', en: 'Price per kg' },
  'hist.mins': { id: 'Menit per kg', en: 'Minutes per kg' },
  'hist.note': {
    id: 'Upah: UMP DKI Jakarta per keputusan gubernur, 2000–2026. Harga: rata-rata pasar tradisional DKI Jakarta menurut PIHPS pada pertengahan Januari. Data PIHPS yang konsisten baru tersedia sejak 2018, jadi grafik dimulai dari sana; tahun sebelumnya tidak ditebak.',
    en: 'Wages: DKI Jakarta UMP per governor decree, 2000–2026. Prices: DKI Jakarta traditional-market average from PIHPS in mid-January. Consistent PIHPS data starts in 2018, so the chart starts there; earlier years are not guessed.',
  },
  'hist.table': { id: 'Tabel data', en: 'Data table' },

  'calc.eyebrow': { id: '7 · Angka kamu sendiri', en: '7 · Your own numbers' },
  'calc.title': { id: 'Cek dengan gajimu', en: 'Check it against your pay' },
  'calc.wage': { id: 'Gaji bersih sebulan (Rp)', en: 'Monthly take-home (Rp)' },
  'calc.hours': { id: 'Jam kerja per minggu', en: 'Hours per week' },
  'calc.place': { id: 'Harga dari', en: 'Prices from' },
  'calc.permin': { id: 'Penghasilanmu per menit', en: 'You earn per minute' },
  'calc.receipt': { id: 'Struk sebulan', en: 'A month, itemised' },
  'calc.total': { id: 'Total kebutuhan', en: 'Basics total' },
  'calc.workdays': { id: 'hari kerja', en: 'workdays' },
  'calc.left': { id: 'Sisa', en: 'Left over' },
  'calc.thanks': { id: 'Terima kasih sudah bekerja', en: 'Thank you for working' },
  'calc.invalid': { id: 'Isi gaji dan jam kerja lebih dari nol.', en: 'Enter a salary and hours above zero.' },

  'ctx.eyebrow': { id: '8 · Kenapa terasa begini', en: '8 · Why it feels this way' },
  'ctx.title': { id: 'Tiga hal di balik himpitan', en: 'Three things behind the squeeze' },
  'ctx.rice.t': { id: 'Beras di sini lebih mahal', en: 'Rice costs more here' },
  'ctx.rice.p': {
    id: 'Bank Dunia berulang kali melaporkan harga beras eceran Indonesia lebih tinggi daripada pasar ASEAN utama lain, dengan selisih sekitar 20%, dan menunjuk pembatasan impor serta rantai pasok yang panjang.',
    en: 'The World Bank has repeatedly reported that Indonesian retail rice is pricier than in other major ASEAN markets, by around 20%, pointing to import restrictions and long supply chains.',
  },
  'ctx.rice.r': {
    id: 'Bantahan pemerintah: Bapanas menolak peringkat itu dan menegaskan harga beras harus tetap wajar bagi petani dalam negeri.',
    en: "The government's rebuttal: Bapanas disputes the ranking and says rice prices have to stay fair for Indonesia's own farmers.",
  },
  'ctx.wage.t': { id: 'Upah minimum terbelah dua', en: 'The wage floor splits in two' },
  'ctx.wage.p': {
    id: 'UMK Kota Bekasi {bekasi}, sementara UMP Jawa Tengah {jateng}. Satu kilo ayam atau telur harganya kurang lebih sama di keduanya. Tempat kerja menentukan apakah kebutuhan pokok terasa ringan atau sesak.',
    en: "Kota Bekasi's UMK is {bekasi} while Central Java's UMP is {jateng}. A kilo of chicken or eggs costs about the same in both. Where you work decides whether basics are easy or tight.",
  },
  'ctx.rent.t': { id: 'Sewa menelan upah kota', en: 'Rent swallows the city wage' },
  'ctx.rent.p': {
    id: 'Di Jakarta, kamar adalah pos terbesar. Upah kota yang lebih tinggi sebagian hanya ilusi kalau kos menghabiskan sepertiganya. Pertalite dan listrik bersubsidi meringankan sisanya.',
    en: 'In Jakarta the room is the single largest line. Higher city wages are partly an illusion once a kos takes a third of the pay. Subsidised Pertalite and electricity soften the rest.',
  },
  'ctx.source': { id: 'Sumber', en: 'Source' },

  'data.eyebrow': { id: '9 · Angka-angkanya', en: '9 · The numbers' },
  'data.title': { id: 'Semua data, bisa diubah', en: 'All data, editable' },
  'data.lede': {
    id: 'Semua grafik di atas membaca tabel ini. Ubah sel mana saja sesuai harga yang kamu bayar dan halaman menghitung ulang. Perubahanmu hanya tersimpan di browser ini.',
    en: 'Every chart above reads from this table. Change any cell to match prices you actually pay and the page recalculates. Your edits stay in this browser only.',
  },
  'data.reset': { id: 'Kembalikan ke data asli', en: 'Reset to original data' },
  'data.units': {
    id: 'Harga dalam mata uang lokal. Beras, telur, ayam, sapi per kg; minyak, bensin per liter; listrik per kWh; kamar per bulan; angkutan per sekali naik. Upah dalam satuan aturannya (bulan, hari, atau jam).',
    en: 'Prices in local currency. Rice, eggs, chicken, beef per kg; oil, petrol per litre; electricity per kWh; room per month; transit per ride. Wages in the unit the law uses (month, day or hour).',
  },
  'data.sources': { id: 'Sumber', en: 'Sources' },
  'data.method': { id: 'Metode', en: 'Method' },
  'data.wage': { id: 'Upah', en: 'Wage' },
  'data.hours': { id: 'Jam/bulan', en: 'Hours/month' },
  'data.fx': { id: 'Kurs per US$', en: 'Per US$' },
  'data.edits': { id: '{n} nilai diubah', en: '{n} values edited' },
  'data.accessed': { id: 'diakses', en: 'accessed' },
  'data.noaccess': { id: 'belum dibuka ulang', en: 'not re-opened' },
  'method.p1': {
    id: 'Upah per menit = upah sebulan ÷ (jam kerja sebulan × 60). Waktu kerja = harga ÷ upah per menit. Barang kecil ditulis dalam menit atau jam, barang besar dalam hari kerja 8 jam.',
    en: 'Pay per minute = monthly wage ÷ (monthly hours × 60). Work time = price ÷ pay per minute. Small items show minutes or hours, big ones 8-hour workdays.',
  },
  'method.p2': {
    id: 'Jam kerja sebulan: 173 (ID, JP), 174 (CN), 191 (SG), 195 (MY), 208 (TH, VN, PH, KH, LA), 209 (KR). Upah harian dikalikan jam sebulan ÷ 8. Setiap angka hasil hitungan ikut status terlemah dari masukannya, jadi apa pun yang dibangun dari perkiraan ditandai perkiraan. Myanmar tidak dimasukkan karena data kurs dan harganya tidak andal.',
    en: 'Monthly hours: 173 (ID, JP), 174 (CN), 191 (SG), 195 (MY), 208 (TH, VN, PH, KH, LA), 209 (KR). Daily wages count monthly hours ÷ 8 days. Every computed figure takes the weakest status of its inputs, so anything built on an estimate is marked as one. Myanmar is left out because its exchange-rate and price data are unreliable.',
  },

  'status.official': { id: 'resmi', en: 'official' },
  'status.snapshot': { id: 'cuplikan', en: 'snapshot' },
  'status.estimate': { id: 'perkiraan', en: 'estimate' },
  'status.interpolated': { id: 'interpolasi', en: 'interpolated' },
  'status.edited': { id: 'diubah', en: 'edited' },
  'legend.solid': { id: 'Data resmi atau cuplikan', en: 'Official or snapshot data' },
  'legend.est': { id: 'Ada perkiraan di dalamnya', en: 'Includes an estimate' },
  'notsold': { id: 'tidak dijual', en: 'not sold' },
  'perMonth': { id: '/bulan', en: '/month' },
  'months': { id: '≈ {n} bulan gaji', en: '≈ {n} months of wages' },
  'nodata': { id: 'belum ada data', en: 'no data yet' },
  'unit.min': { id: 'mnt', en: 'min' },
  'unit.h': { id: 'jam', en: 'h' },
  'unit.day': { id: 'hari', en: 'days' },
  'prov.asof': { id: 'berlaku', en: 'as of' },
  'per.month': { id: 'bulan', en: 'month' },
  'per.day': { id: 'hari', en: 'day' },
  'per.hour': { id: 'jam', en: 'hour' },
  'per.item': { id: 'buah', en: 'item' },
  'per.ride': { id: 'sekali naik', en: 'ride' },
  'prov.title': { id: 'Dari mana angka ini', en: 'Where this number comes from' },
  'prov.close': { id: 'Tutup', en: 'Close' },
  'prov.computed': { id: 'Dihitung dari:', en: 'Computed from:' },
  'prov.open': { id: 'Lihat sumber', en: 'Show source' },
  'share': { id: 'Bagikan tampilan ini', en: 'Share this view' },
  'share.copied': { id: 'Tautan disalin', en: 'Link copied' },
  'footer': {
    id: 'Dibuat untuk pembaca Indonesia. Data terbuka di GitHub; koreksi dipersilakan.',
    en: 'Made for Indonesian readers. Data is open on GitHub; corrections welcome.',
  },
} satisfies Record<string, Record<Lang, string>>;

export type Key = keyof typeof dict;

let lang: Lang = 'id';
export const setLang = (l: Lang) => (lang = l);
export const getLang = () => lang;

export function t(key: Key, vars?: Record<string, string>): string {
  let s: string = dict[key][lang];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

export const L = (x: { id: string; en: string }) => x[lang];
