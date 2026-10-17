# Log Issue & Resolusi Perbaikan (Issues & Fixes Tracker)
## Mr.Coffee Point of Sale (POS)

Dokumen ini mencatat seluruh riwayat masalah (*issues*), kebutuhan operasional (*feature requests*), serta implementasi perbaikan (*fixes*) yang telah diselesaikan sepanjang siklus pengembangan aplikasi kasir Mr.Coffee. Seluruh issue juga telah didaftarkan dan ditautkan pada [GitHub Issues Tracker](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/issues).

---

## Ringkasan Daftar Issue

| No | GitHub Issue | Kategori | Status | Commit Referensi |
|---|---|---|---|---|
| #1 | [Implementasi Autentikasi Backend, RBAC, Rate Limiting, & Integritas Harga](#issue-1-security--architecture-implementasi-autentikasi-backend-rbac-rate-limiting-dan-integritas-harga-server-side) | Security / Core | **Resolved** | [`d6bffa1`](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/commit/d6bffa1) |
| #2 | [Migrasi Database ke Neon PostgreSQL & Kesiapan Vercel](#issue-2-database--infra-migrasi-database-ke-neon-postgresql-serverless--kesiapan-deployment-vercel) | Database / DevOps | **Resolved** | [`71d30b1`](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/commit/71d30b1) |
| #3 | [Local Cart Persistence, Item Modifiers, Diskon Fleksibel, & Cetak Struk](#issue-3-cashier-operations-local-cart-persistence-item-modifiers-diskon-fleksibel-dan-format-cetak-struk-thermal) | Cashier UX / Ops | **Resolved** | [`0575d27`](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/commit/0575d27) |
| #4 | [Katalog & Restok Admin serta Laporan Rentang Waktu dengan Ekspor CSV](#issue-4-admin-operations-katalog--restok-cepat-inventaris-serta-laporan-finansial-rentang-waktu-dengan-ekspor-csv) | Admin / Finance | **Resolved** | [`0575d27`](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/commit/0575d27) |
| #5 | [Revamp Modal Sugar & Ice Level Menyerupai Layout Mobile Chagee](#issue-5-ux--ordering-revamp-modal-sugar--ice-level-opsi-pesanan-menyerupai-layout-mobile-chagee) | Ordering UX | **Resolved** | [`473f100`](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/commit/473f100) |
| #6 | [Perbaikan Tabrakan Elemen Header & Lebar Kolom Responsif Laptop](#issue-6-bugfix--layout-perbaikan-tabrakan-elemen-header-dan-lebar-kolom-responsif-pada-layar-laptop) | Bugfix / Layout | **Resolved** | [`2270044`](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/commit/2270044) |

---

### Issue #1: [Security & Architecture] Implementasi Autentikasi Backend, RBAC, Rate Limiting, dan Integritas Harga Server-Side
- **Tautan GitHub:** [Issue #1](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/issues/1)
- **Label:** `enhancement`

#### 1. Masalah & Potensi Risiko:
- Pada prototipe awal (MVP), aplikasi belum memiliki proteksi autentikasi akun dan pembagian peran pengguna (Admin vs Kasir).
- Harga produk dikirim mentah dari client ke endpoint transaksi sehingga rentan manipulasi harga (*price tampering*).
- Pengurangan stok tidak berada dalam transaksi database terisolasi, menimbulkan risiko *race condition* dan stok minus saat transaksi ramai.
- Ketiadaan pembatasan request pada rute login membuka celah serangan brute force terhadap password.

#### 2. Solusi & Perbaikan:
- **Bcrypt Hashing:** Seluruh kata sandi di-hash menggunakan Bcrypt (cost factor 10).
- **Session Cookie:** Penggunaan cookie `pos_session` bertipe `httpOnly: true`, `sameSite: 'lax'`, dan `secure: true` di production dengan token kriptografis 64-karakter hex.
- **Server-Side Price Validation:** Endpoint `/api/transactions` mengambil harga langsung dari database (`product.price`) dan menolak manipulasi harga dari sisi browser.
- **Transaksi ACID Atomik:** Eksekusi transaksi dan pengurangan stok dibungkus di dalam `prisma.$transaction`. Jika stok kurang, proses otomatis di-*rollback*.
- **Brute Force Protection:** Menerapkan rate limiting per IP (maks. 5 req/menit) dan mekanisme *account lockout* otomatis selama 15 menit setelah 5 kali gagal login berturut-turut.
- **RBAC:** Proteksi rute dan server components untuk membatasi hak akses role `ADMIN` vs `CASHIER`.
- **Automated Tests:** Menambahkan 38 unit & integration tests (`npm test`).

#### 3. Berkas yang Terpengaruh:
- `lib/auth.ts`, `lib/rate-limit.ts`, `app/api/auth/*`, `app/api/transactions/route.ts`, `tests/*`

---

### Issue #2: [Database & Infra] Migrasi Database ke Neon PostgreSQL Serverless & Kesiapan Deployment Vercel
- **Tautan GitHub:** [Issue #2](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/issues/2)
- **Label:** `enhancement`

#### 1. Masalah & Potensi Risiko:
- SQLite lokal memiliki kelemahan tabel *write lock* pada konkurensi tinggi dan tidak kompatibel dengan serverless compute (sistem file Vercel bersifat *ephemeral / read-only*).

#### 2. Solusi & Perbaikan:
- Mengubah provider skema Prisma dari `sqlite` ke `postgresql`.
- Mengintegrasikan Neon Serverless PostgreSQL dengan *connection pooler* AWS ap-southeast-1.
- Menambahkan skrip `"postinstall": "prisma generate"` di `package.json` dan memutakhirkan `prisma/seed.ts`.
- Mendokumentasikan variabel lingkungan `DATABASE_URL` di `README.md`.

#### 3. Berkas yang Terpengaruh:
- `prisma/schema.prisma`, `prisma/seed.ts`, `package.json`, `README.md`

---

### Issue #3: [Cashier Operations] Local Cart Persistence, Item Modifiers, Diskon Fleksibel, dan Format Cetak Struk Thermal
- **Tautan GitHub:** [Issue #3](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/issues/3)
- **Label:** `enhancement`

#### 1. Masalah & Potensi Risiko:
- Isi keranjang belanja kasir hilang seketika jika halaman browser tidak sengaja ter-refresh.
- Tidak tersedia opsi catatan kondimen per menu (es, gula, bungkus).
- Tidak ada fitur diskon fleksibel (nominal rupiah atau persentase).
- Hasil cetak printer thermal kotor karena mencetak background gelap web dan tombol navigasi.
- Tab browser belum memiliki logo favicon.

#### 2. Solusi & Perbaikan:
- **Local Cart Persistence:** Menerapkan middleware `persist` pada Zustand store (`useCartStore.ts`) ke `localStorage`.
- **Item Notes / Modifiers:** Menambahkan field `note` pada `CartItem`, skema `TransactionItem`, dan modal kustomisasi pesanan kasir.
- **Sistem Diskon Fleksibel:** Menyediakan kalkulasi diskon ganda (**Nominal Rp** vs **Persentase %**) dengan preset cepat (`5%`, `10%`, `Rp 5.000`, `Rp 10.000`) serta validasi server-side.
- **Thermal Print CSS:** Menambahkan aturan `@media print` khusus printer 58mm/80mm di `app/globals.css`.
- **Brand Favicon:** Menghasilkan aset favicon lengkap (`icon.svg`, `favicon.ico`, `apple-icon.png`).

#### 3. Berkas yang Terpengaruh:
- `store/useCartStore.ts`, `components/pos/CheckoutModal.tsx`, `app/globals.css`, `app/icon.svg`, `app/layout.tsx`

---

### Issue #4: [Admin Operations] Katalog & Restok Cepat Inventaris serta Laporan Finansial Rentang Waktu dengan Ekspor CSV
- **Tautan GitHub:** [Issue #4](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/issues/4)
- **Label:** `enhancement`

#### 1. Masalah & Potensi Risiko:
- Pengelola toko tidak memiliki antarmuka untuk menambah menu baru, mematikan penjualan menu (`isActive`), atau mengisi stok di tengah shift.
- Laporan omzet tidak dapat difilter berdasarkan rentang tanggal dan tidak bisa diunduh untuk pembukuan Excel.

#### 2. Solusi & Perbaikan:
- **Katalog Produk Admin (`/pos/products`):** Tabel menu dengan pencarian, filter kategori, sakelar aktif/nonaktif, dan modal tambah/edit produk.
- **Fast Restock:** Tombol restok cepat `+10`, `+50`, dan custom via `/api/products/restock` yang mencatat log mutasi barang (`InventoryMovement`).
- **Laporan Finansial (`/pos/reports`):** Filter rentang waktu (**Hari Ini**, **7 Hari Terakhir**, **Bulan Ini**, **Semua Waktu**) dan KPI finansial real-time.
- **Ekspor CSV:** Tombol `ExportCsvButton` dengan encoding UTF-8 BOM untuk kompatibilitas penuh Microsoft Excel.
- **Proteksi 403:** Membatasi akses kasir biasa ke modul manajerial admin.

#### 3. Berkas yang Terpengaruh:
- `app/pos/products/page.tsx`, `app/api/products/restock/route.ts`, `app/pos/reports/page.tsx`, `components/pos/ExportCsvButton.tsx`

---

### Issue #5: [UX & Ordering] Revamp Modal Sugar & Ice Level Opsi Pesanan Menyerupai Layout Mobile Chagee
- **Tautan GitHub:** [Issue #5](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/issues/5)
- **Label:** `enhancement`

#### 1. Masalah & Potensi Risiko:
- Modal catatan pesanan sebelumnya menggunakan tag cloud yang tidak rapi dan tidak memisahkan antara opsi minuman (sugar & ice level) dan opsi pastry.
- Kasir tidak memiliki batasan *single-select* untuk level es dan level kemanisan.

#### 2. Solusi & Perbaikan:
- **Ice Level (Single-Select):** Grid baris 1 (`Normal Ice`, `Less Ice`, `No Ice`) dan baris 2 (`Hot`).
- **Sweetness Level (2x2 Grid):** Dilengkapi badge persentase manis khas Chagee: `Normal Sweet (100%)`, `Less Sweet (70%)`, `Slightly Sweet (50%)`, `No Additional Sugar (0%)`.
- **Extras & Milk:** Multi-select chips untuk `Fresh Milk`, `Oat Milk`, `Extra Shot`, `Gula Pisah`, `Takeaway Cup`.
- **Adaptasi Menu Pastry Otomatis:** Otomatis menampilkan penyajian suhu (`Hangatkan / Toast` vs `Suhu Ruang`) serta kondimen pastry (`Extra Butter`, `Strawberry Jam`, `Takeaway Box`).
- **Live Ticket Preview:** Pratinjau string gabungan rapi secara langsung (contoh: `Normal Ice • Less Sweet • Oat Milk`) yang tersimpan di keranjang dan tercetak di struk thermal.

#### 3. Berkas yang Terpengaruh:
- `app/pos/page.tsx`

---

### Issue #6: [Bugfix & Layout] Perbaikan Tabrakan Elemen Header dan Lebar Kolom Responsif pada Layar Laptop
- **Tautan GitHub:** [Issue #6](https://github.com/NAxel-code/Point-of-Sale-Aplikasi-Kasir/issues/6)
- **Label:** `bug`

#### 1. Masalah & Potensi Risiko:
- Pada resolusi layar laptop/tablet (1024px–1366px), kolom tengah katalog POS terhimpit oleh Sidebar (256px) dan Panel Tiket Pesanan (384px).
- Badge petunjuk keyboard shortcut (`Shortcut: F2 Cari...`) aktif pada breakpoint `hidden lg:flex` (1024px) sehingga bertabrakan dan menimpa teks jam `13.02` dan status kasir.
- Data katalog produk pada database sempat kosong (0 produk) akibat pembersihan tabel saat uji coba transaksi.

#### 2. Solusi & Perbaikan:
- **Header Anti-Collision:** Mengubah breakpoint badge shortcut menjadi `hidden 2xl:flex` agar hanya muncul pada monitor ekstra lebar (>= 1536px), sepenuhnya menghilangkan tabrakan pada layar laptop.
- Menambahkan properti `shrink-0 min-w-0` serta tipografi adaptif (`sm:inline`) pada tanggal, jam, dan status kasir.
- **Lebar Kolom Proporsional:**
  - Panel Tiket Pesanan: Responsif `w-80 lg:w-[340px] xl:w-96` (memberikan ruang tambahan 40–64px untuk area katalog tengah).
  - Sidebar: Responsif `w-56 lg:w-60 xl:w-64`.
- **Katalog Recovery:** Re-seeding seluruh data produk via `node prisma/seed.ts` dan menambahkan tombol "Muat Ulang Menu" pada katalog kosong.

#### 3. Berkas yang Terpengaruh:
- `app/pos/page.tsx`, `components/pos/Sidebar.tsx`
