# Dashboard Monitoring Kemutakhiran Data

## 1. Tujuan Proyek

Membangun dashboard web interaktif untuk memantau kemutakhiran data lokasi berdasarkan tahun pada tiga sumber data:

- `Input Data W1_Kategori 1`
- `Input Data W2_Kategori 1`
- `Input Data W3_Kategori 1`

File sumber:

`/Users/mac/Lainnya/Check List Ketersediaan Data dan Pekerjaan Sistem Monev.xlsx`

Dashboard harus membantu pengguna:

1. Mengetahui jumlah lokasi berdasarkan kategori tahun.
2. Mengetahui provinsi dan kabupaten/kota yang masih memiliki data lama.
3. Menelusuri data dari tingkat provinsi hingga lokasi.
4. Menampilkan informasi secara ringkas saat dipresentasikan kepada mentor.
5. Mengidentifikasi lokasi yang perlu diprioritaskan untuk pembaruan data.

## 2. Teknologi

### Frontend

- Vite
- Vue 3
- TypeScript
- Vue Router
- Pinia
- Apache ECharts
- Tailwind CSS

### Pengolahan data

- Python
- `openpyxl`
- Hasil pengolahan disimpan sebagai JSON statis.

Dashboard tahap pertama tidak memerlukan backend atau database.

## 3. Arsitektur Data

```text
File Excel
    |
    |-- Input Data W1_Kategori 1
    |-- Input Data W2_Kategori 1
    |-- Input Data W3_Kategori 1
    |
    v
Script validasi dan transformasi Python
    |
    |-- normalisasi nama kolom
    |-- pembersihan nilai kosong
    |-- validasi tahun
    |-- penambahan sumber W1/W2/W3
    |-- klasifikasi kategori tahun
    |-- pembuatan status kabupaten/kota
    |
    v
Data JSON terstruktur
    |
    v
Dashboard Vue
```

## 4. Unit Analisis

Data memiliki beberapa tingkat hierarki:

1. Sumber data: W1, W2, W3
2. Provinsi
3. Kabupaten/Kota
4. Kecamatan
5. Lokasi
6. Tahun data

Level data paling rinci adalah lokasi. Oleh karena itu, dashboard harus membedakan dengan jelas antara:

- jumlah lokasi; dan
- jumlah kabupaten/kota.

Label indikator tidak boleh hanya menggunakan istilah `Jumlah Data` tanpa menjelaskan unit hitungannya.

## 5. Aturan Kategori Tahun Lokasi

Setiap lokasi diklasifikasikan menggunakan kolom `Tahun`:

| Kondisi | Kategori | Warna |
|---|---|---|
| Tahun < 2021 | Di bawah 2021 | Merah |
| Tahun = 2021 | Tahun 2021 | Kuning |
| Tahun > 2021 | Di atas 2021 | Hijau |
| Tahun kosong/tidak valid | Belum diketahui | Abu-abu |

Kategori internal yang digunakan aplikasi:

- `below_2021`
- `year_2021`
- `above_2021`
- `unknown`

## 6. Aturan Status Kabupaten/Kota

Status kabupaten/kota ditentukan dengan prinsip kondisi terburuk dari seluruh lokasi dalam lingkup filter aktif.

Urutan prioritas:

1. Jika terdapat minimal satu lokasi dengan tahun di bawah 2021, status kabupaten/kota adalah `Di bawah 2021`.
2. Jika tidak ada lokasi di bawah 2021 tetapi terdapat lokasi tahun 2021, statusnya adalah `Tahun 2021`.
3. Jika seluruh lokasi memiliki tahun di atas 2021, statusnya adalah `Di atas 2021`.
4. Jika semua tahun kosong/tidak valid, statusnya adalah `Belum diketahui`.
5. Data dengan tahun tidak valid tetap dihitung secara terpisah dan tidak boleh diam-diam dianggap sebagai data terkini.

Status ini digunakan sebagai indikator monitoring, bukan untuk mengubah nilai tahun asli.

## 7. Filter Global

Filter utama:

- Sumber data: Semua, W1, W2, W3
- Provinsi
- Kabupaten/Kota
- Kategori tahun
- Tahun aktual

Filter lanjutan:

- Kecamatan
- Nama lokasi atau pencarian lokasi

Hierarki filter:

```text
Provinsi -> Kabupaten/Kota -> Kecamatan -> Lokasi
```

Ketentuan:

- Pilihan filter tingkat bawah harus mengikuti filter tingkat atas.
- Ketika provinsi berubah, pilihan kabupaten/kota yang sudah tidak valid harus dikosongkan.
- Filter global disimpan di Pinia agar dapat dipertahankan ketika pengguna berpindah halaman.
- Harus tersedia tombol `Reset Filter`.
- Nama lokasi tidak dibuat sebagai slicer besar; gunakan pencarian pada halaman detail.

## 8. Struktur Halaman

Dashboard memiliki tiga halaman pengguna dan satu lapisan data pendukung.

### Halaman 1 — Dashboard Ringkasan

Route: `/`

Tujuan:

Memberikan gambaran umum seluruh data atau data pada provinsi yang dipilih.

#### Filter

1. Sumber W1/W2/W3
2. Provinsi
3. Kategori tahun
4. Tahun aktual

#### Kartu indikator

1. Total provinsi
2. Total kabupaten/kota
3. Total lokasi
4. Kabupaten/kota yang masih memiliki data sampai dengan 2021
5. Kabupaten/kota yang seluruh lokasi validnya sudah di atas 2021

#### Visualisasi

1. Stacked bar status kabupaten/kota per provinsi
2. Donut atau bar komposisi lokasi berdasarkan kategori tahun
3. Grafik distribusi jumlah lokasi per tahun

#### Tabel ringkas

Sepuluh kabupaten/kota dengan prioritas pembaruan tertinggi.

Kolom:

- Provinsi
- Kabupaten/Kota
- Total lokasi
- Lokasi di bawah 2021
- Lokasi tahun 2021
- Lokasi di atas 2021
- Tahun tidak diketahui
- Status

Urutan prioritas:

1. Jumlah lokasi di bawah 2021 terbanyak
2. Jumlah lokasi tahun 2021 terbanyak
3. Jumlah tahun tidak diketahui terbanyak

### Halaman 2 — Analisis Provinsi

Route: `/provinsi`

Tujuan:

Membandingkan kondisi kabupaten/kota dalam suatu provinsi.

#### Filter

1. Sumber W1/W2/W3
2. Provinsi
3. Kabupaten/Kota
4. Kategori tahun
5. Tahun aktual

#### Kartu indikator

1. Total kabupaten/kota
2. Kabupaten/kota berstatus di bawah 2021
3. Kabupaten/kota berstatus tahun 2021
4. Kabupaten/kota berstatus di atas 2021

Status `Belum diketahui` tetap ditampilkan sebagai indikator tambahan jika jumlahnya tidak nol.

#### Visualisasi

1. Horizontal stacked bar jumlah lokasi per kabupaten/kota
2. Persentase lokasi di atas 2021 per kabupaten/kota
3. Distribusi tahun pada provinsi atau kabupaten/kota terpilih

#### Tabel rekap

Kolom:

- Kabupaten/Kota
- Total lokasi
- Di bawah 2021
- Tahun 2021
- Di atas 2021
- Belum diketahui
- Persentase di atas 2021
- Status

### Halaman 3 — Detail Lokasi

Route: `/detail`

Tujuan:

Menelusuri lokasi yang menyebabkan status suatu kabupaten/kota menjadi merah, kuning, atau tidak diketahui.

#### Filter

1. Sumber W1/W2/W3
2. Provinsi
3. Kabupaten/Kota
4. Kecamatan
5. Kategori tahun
6. Tahun aktual
7. Pencarian nama lokasi

#### Kartu indikator

1. Total lokasi hasil filter
2. Lokasi di bawah 2021
3. Lokasi tahun 2021
4. Lokasi di atas 2021

Data dengan tahun tidak diketahui ditampilkan sebagai indikator tambahan jika jumlahnya tidak nol.

#### Visualisasi

1. Grafik komposisi kategori tahun berdasarkan filter aktif

#### Tabel detail

Kolom utama:

- Sumber
- Provinsi
- Kabupaten/Kota
- Kecamatan
- Nama lokasi
- Tahun
- Kategori tahun
- Kewenangan
- Tingkat kekumuhan

Fitur tabel:

- Sorting
- Pagination
- Pencarian
- Warna status
- Jumlah baris per halaman
- Empty state jika tidak ada hasil

## 9. Struktur Data Master

Setiap record JSON minimal memiliki bentuk:

```ts
interface LocationRecord {
  id: string
  source: 'W1' | 'W2' | 'W3'
  province: string
  regency: string
  district: string
  locationName: string
  year: number | null
  yearCategory: 'below_2021' | 'year_2021' | 'above_2021' | 'unknown'
  authority: string | null
  slumLevel: string | null
}
```

ID harus stabil dan unik. ID dapat dibentuk dari kombinasi sumber, nomor baris sumber, provinsi, kabupaten/kota, dan nama lokasi.

## 10. Normalisasi Data

Script transformasi harus:

1. Membaca hanya tiga sheet W1, W2, dan W3 yang disepakati.
2. Menghapus spasi berlebih pada nama kolom dan nilai teks.
3. Menyamakan nilai kosong, tanda `-`, dan nilai tidak valid menjadi `null` jika sesuai.
4. Mengubah tahun valid menjadi bilangan bulat.
5. Tidak mengarang tahun untuk data yang kosong.
6. Menambahkan kolom `source` berdasarkan nama sheet.
7. Menambahkan kategori tahun.
8. Mempertahankan nilai asli yang diperlukan untuk audit.
9. Mendeteksi duplikasi potensial tanpa langsung menghapusnya.
10. Menghasilkan laporan kualitas data.

## 11. Laporan Kualitas Data

Proses transformasi menghasilkan ringkasan:

- Jumlah baris per sheet
- Jumlah record valid
- Jumlah baris kosong yang diabaikan
- Jumlah tahun tidak valid atau kosong
- Jumlah provinsi unik
- Jumlah kabupaten/kota unik
- Jumlah lokasi unik
- Jumlah duplikasi potensial
- Distribusi kategori tahun

Laporan disimpan sebagai JSON dan ringkasan teks agar hasil transformasi dapat diverifikasi sebelum dipakai dashboard.

## 12. Prinsip Desain Visual

- Tampilan profesional, bersih, dan mudah dipresentasikan.
- Warna status konsisten pada seluruh halaman.
- Merah hanya digunakan untuk prioritas atau kondisi lama.
- Kuning digunakan untuk tahun 2021/perhatian.
- Hijau digunakan untuk data di atas 2021.
- Abu-abu digunakan untuk data tidak diketahui.
- Grafik tidak boleh mengandalkan warna saja; setiap kategori harus memiliki label atau tooltip.
- Angka menggunakan format pemisah ribuan Indonesia.
- Judul visual harus menjelaskan unit, misalnya `Jumlah Lokasi`, bukan hanya `Jumlah Data`.
- Layout harus responsif untuk laptop dan layar presentasi.

## 13. Struktur Folder Proyek

```text
dashboard-monitoring-data/
├── WORKFLOW.md
├── README.md
├── package.json
├── vite.config.ts
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── charts/
│   │   ├── filters/
│   │   ├── cards/
│   │   └── tables/
│   ├── composables/
│   ├── data/
│   ├── layouts/
│   ├── router/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   └── views/
├── public/
│   └── data/
├── scripts/
│   └── transform_excel.py
├── reports/
└── tests/
```

## 14. Tahapan Pengerjaan

### Tahap 1 — Audit data

- Periksa struktur W1, W2, dan W3.
- Hitung jumlah data efektif setiap sheet.
- Identifikasi nilai tahun kosong/tidak valid.
- Periksa konsistensi nama provinsi dan kabupaten/kota.
- Periksa duplikasi potensial.

Output:

- Laporan audit data
- Keputusan normalisasi

### Tahap 2 — Transformasi data

- Buat script Python.
- Gabungkan W1, W2, dan W3.
- Tambahkan sumber dan kategori tahun.
- Hasilkan JSON data master.
- Hasilkan laporan kualitas data.

Output:

- `public/data/location-records.json`
- `public/data/data-summary.json`
- laporan kualitas data

### Tahap 3 — Fondasi aplikasi

- Inisialisasi Vite + Vue 3 + TypeScript.
- Konfigurasi router.
- Konfigurasi Pinia.
- Konfigurasi Tailwind CSS.
- Buat layout, navigasi, tema, dan filter global.

### Tahap 4 — Dashboard Ringkasan

- Buat kartu indikator.
- Buat grafik status per provinsi.
- Buat komposisi kategori tahun.
- Buat distribusi tahun.
- Buat tabel prioritas.

### Tahap 5 — Analisis Provinsi

- Buat filter hierarkis.
- Buat grafik per kabupaten/kota.
- Buat indikator persentase kemutakhiran.
- Buat tabel rekap kabupaten/kota.

### Tahap 6 — Detail Lokasi

- Buat filter tingkat lokasi.
- Buat pencarian.
- Buat tabel detail dengan pagination dan sorting.
- Buat ekspor hasil filter jika diperlukan pada tahap berikutnya.

### Tahap 7 — Pengujian dan verifikasi

- Verifikasi total dashboard terhadap hasil script Python.
- Uji kombinasi filter.
- Uji reset filter.
- Uji data kosong dan tahun tidak valid.
- Uji tampilan responsif.
- Jalankan pemeriksaan TypeScript, lint, unit test, dan production build.

## 15. Kriteria Selesai

Dashboard dianggap selesai apabila:

1. Ketiga sheet sumber berhasil digabung tanpa mengubah file Excel asli.
2. Total record pada dashboard sama dengan hasil transformasi yang terverifikasi.
3. Kategori tahun dihitung sesuai aturan.
4. Status kabupaten/kota menggunakan kondisi lokasi terburuk.
5. Filter Provinsi → Kabupaten/Kota → Kecamatan berjalan konsisten.
6. Ketiga halaman dapat dibuka tanpa error.
7. Seluruh kartu, grafik, dan tabel merespons filter aktif.
8. Data kosong/tidak valid ditampilkan secara eksplisit.
9. Tampilan dapat digunakan pada laptop dan layar presentasi.
10. Production build berhasil.
11. README menjelaskan cara memperbarui data dari file Excel dan menjalankan dashboard.

## 16. Batasan Tahap Pertama

Tahap pertama belum mencakup:

- Login pengguna
- Database dan backend API
- Penyuntingan data langsung melalui dashboard
- Sinkronisasi otomatis dengan file Excel daring
- Peta geografis
- Hak akses per pengguna

Fitur tersebut dapat ditambahkan setelah dashboard inti selesai dan tervalidasi.

## 17. Keputusan Final

- Jumlah halaman dashboard pengguna: 3
- Halaman pendukung data: tidak ditampilkan sebagai halaman publik
- Sumber data: tiga sheet Excel W1, W2, dan W3
- Level analisis utama: lokasi dan kabupaten/kota
- Batas kategori tahun: 2021
- Framework: Vue 3 dengan Vite dan TypeScript
- Grafik: Apache ECharts
- State filter: Pinia
- Data tahap pertama: JSON statis hasil preprocessing Python
- File Excel asli: dipertahankan dan tidak diubah
