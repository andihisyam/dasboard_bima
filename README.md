# Dashboard Monitoring Kemutakhiran Data

Dashboard interaktif untuk menganalisis data lokasi dari sheet W1, W2, dan W3 pada file Excel monitoring.

## Fitur

- Ringkasan nasional dan per provinsi
- Status kabupaten/kota berdasarkan kondisi lokasi terburuk
- Filter bertingkat Provinsi → Kabupaten/Kota → Kecamatan
- Filter sumber W1/W2/W3, kategori tahun, dan tahun aktual
- Grafik status, komposisi kategori, dan distribusi tahun
- Tabel prioritas pembaruan
- Detail lokasi dengan pencarian, sorting, dan pagination
- Tampilan responsif untuk laptop dan layar presentasi

## Aturan status

- `Di bawah 2021`: terdapat minimal satu lokasi dengan tahun < 2021
- `Tahun 2021`: tidak ada lokasi < 2021, tetapi terdapat lokasi tahun 2021
- `Di atas 2021`: seluruh lokasi dengan tahun valid > 2021
- `Belum diketahui`: seluruh lokasi tidak memiliki tahun valid

## Menjalankan dashboard

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

## Production build

```bash
npm test
npm run build
npm run preview
```

## Memperbarui data dari Excel

Sumber default:

`/Users/mac/Lainnya/Check List Ketersediaan Data dan Pekerjaan Sistem Monev.xlsx`

Jalankan:

```bash
PY="$(hermes pm environment documents --extra documents --extra documents-pdf)"
"$PY" scripts/transform_excel.py \
  "/Users/mac/Lainnya/Check List Ketersediaan Data dan Pekerjaan Sistem Monev.xlsx" \
  --output-dir public/data \
  --report-dir reports
```

Kemudian jalankan kembali `npm run build`.

## Hasil transformasi saat ini

- 6.324 lokasi
- 36 provinsi
- 285 kabupaten/kota
- 1.211 lokasi di bawah 2021
- 569 lokasi tahun 2021
- 4.269 lokasi di atas 2021
- 275 lokasi dengan tahun belum diketahui

## Struktur penting

- `WORKFLOW.md` — spesifikasi dan alur kerja
- `scripts/transform_excel.py` — transformasi Excel menjadi JSON
- `public/data/location-records.json` — data dashboard
- `public/data/data-summary.json` — ringkasan hasil transformasi
- `reports/data-quality.json` — laporan kualitas data
- `src/views/` — tiga halaman dashboard
- `src/utils/analytics.ts` — filter dan agregasi
- `tests/test_transform_excel.py` — pengujian aturan transformasi
- `src/utils/analytics.test.ts` — pengujian filter dan agregasi frontend

File Excel asli hanya dibaca dan tidak diubah.
