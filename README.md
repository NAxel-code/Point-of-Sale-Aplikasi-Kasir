# Mr.Coffee Point of Sale (POS)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Security](https://img.shields.io/badge/Security-Bcrypt%20%7C%20RBAC%20%7C%20RateLimit-emerald?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-38%20Passed-brightgreen?style=flat-square)

<div align="center">
  <img src="/public/images/ui-pos.png" alt="Mr.Coffee POS Terminal" width="600"/>
  <br/>
  <br/>
  <div style="display: flex; justify-content: center; gap: 20px;">
    <img src="/public/images/ui-orders.png" alt="Daftar Pesanan" width="400"/>
    <img src="/public/images/ui-reports.png" alt="Laporan Kas" width="400"/>
  </div>
</div>
<br/>

Aplikasi Point of Sale (POS) / Kasir modern berbasis web dengan **Dark Theme** premium, dirancang khusus untuk mempercepat proses transaksi kasir, manajemen inventaris, rekonsiliasi kas, dan pelaporan keuangan bisnis F&B / retail skala kecil hingga menengah.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Pintasan Keyboard (Speed POS Shortcuts)](#pintasan-keyboard-speed-pos-shortcuts)
- [Keamanan & Integritas Data](#keamanan--integritas-data)
- [Akun Pengujian (Demo)](#akun-pengujian-demo)
- [Tech Stack](#tech-stack)
- [Struktur Folder](#struktur-folder)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Daftar API Endpoints](#daftar-api-endpoints)
- [Catatan Produksi & Deployment](#catatan-produksi--deployment)

---

## Fitur Utama

### 1. Terminal Kasir (POS Screen)
- **Katalog Cepat & Tab Kategori**: Filter kategori kopi, non-kopi, pastry, serta fitur pencarian instan dengan navigasi mulus.
- **Indikator Stok Menipis (*Low Stock Badge*)**: Badge amber berkedip (*pulse*) otomatis muncul saat sisa stok $\le 5$ pcs, dan badge overlay merah saat stok habis (0).
- **Kustomisasi Opsi Chagee Style (*Sugar & Ice Level Modifiers*)**:
  - **Ice Level (Single-Select Grid)**: Pilihan terstruktur baris 1 (`Normal Ice`, `Less Ice`, `No Ice`) dan baris 2 (`Hot`).
  - **Sweetness Level (2x2 Grid)**: Dilengkapi indikator persentase manis khas Chagee: `Normal Sweet (100%)`, `Less Sweet (70%)`, `Slightly Sweet (50%)`, dan `No Additional Sugar (0%)`.
  - **Tambahan / Extras & Milk (Multi-Select)**: `Fresh Milk`, `Oat Milk`, `Extra Shot`, `Gula Pisah`, dan `Takeaway Cup`.
  - **Adaptasi Otomatis Menu Pastry**: Mendeteksi menu pastry/bakery secara dinamis dan menyajikan opsi penyajian suhu (`Hangatkan / Toast` vs `Suhu Ruang`) serta kondimen pastry (`Extra Butter`, `Strawberry Jam`, `Takeaway Box`).
  - **Catatan Khusus & Pratinjau Tiket (*Live Ticket Preview*)**: Kotak teks bebas untuk instruksi spesifik, dilengkapi pratinjau real-time format gabungan (contoh: `Normal Ice • Less Sweet • Oat Milk`) yang langsung tersimpan di keranjang, tercatat di database transaksi, dan otomatis tercetak pada struk thermal.
- **Desain Responsif & Anti-Tabrakan (*Adaptive Responsive Layout*)**:
  - **Header Anti-Collision**: Jam, tanggal, dan status kasir terlindungi dari tabrakan saat dibuka pada layar laptop maupun tablet kasir.
  - **Kolom Proporsional**: Lebar panel tiket pesanan (`w-80 lg:w-[340px] xl:w-96`) dan sidebar disesuaikan agar katalog produk di kolom tengah memiliki ruang yang optimal di berbagai resolusi layar.
  - **Tombol Muat Ulang Menu (*Catalog Recovery*)**: Tombol cepat untuk memuat ulang katalog secara instan jika terjadi gangguan jaringan sementara.
- **Manajemen Keranjang (*Zustand Store*)**:
  - **Local Cart Recovery (Anti-Hilang Saat Refresh)**: Menggunakan middleware `persist` ke `localStorage`. Jika tab tidak sengaja ter-refresh, isi keranjang kasir tidak hilang.
- **Opsi Pesanan Fleksibel**: Mendukung **Dine In** (dengan nomor meja) dan **Take Away**.
- **Potongan Diskon (*Discount Management*)**:
  - Pilihan diskon **Nominal (Rp)** atau **Persentase (%)**.
  - Tombol preset instan: `5%`, `10%`, `Rp 5.000`, dan `Rp 10.000`.
  - Nilai hemat langsung tertera pada rincian pembayaran struk thermal.
- **Metode Pembayaran Lengkap**: Mendukung pembayaran **Tunai (Cash)** dengan pecahan uang pas otomatis, **QRIS Instant**, dan **Kartu Debit / EDC**.
- **Cetak Struk Thermal Standar 58mm/80mm**:
  - Dilengkapi aturan `@media print` khusus printer thermal sehingga hasil cetak bersih dan rapi berlatar putih tanpa background gelap aplikasi atau tombol web.
- **Identitas Tab Browser (Favicon Brand)**: Dilengkapi logo cangkir kopi amber Mr.Coffee (SVG, multi-resolution ICO, dan Apple Touch Icon 180x180).

### 2. Manajemen Produk & Restok Inventaris (Khusus Admin)
- **Halaman `/pos/products`**:
  - Katalog tabel seluruh menu produk dengan pencarian dan filter tab kategori.
  - **Sakelar Status Aktif (`isActive`)**: Mengaktifkan atau menonaktifkan penjualan menu dalam 1 klik.
  - **Modal Tambah & Edit Menu**: Mengubah nama, SKU, kategori, dan harga jual.
  - **Restok Cepat Inventaris**: Tombol cepat `+10`, `+50`, dan modal restok kustom yang otomatis mencatat riwayat mutasi barang (`InventoryMovement` bertipe `IN`).
  - Filter khusus untuk menyaring menu dengan stok menipis ($\le 5$) dan menu habis.

### 3. Operasional Shift & Rekonsiliasi Kas (Cash Drawer)
- **Buka & Tutup Shift**: Input modal kas awal saat buka toko.
- **Rekap Kas Otomatis**: Saat tutup shift, sistem otomatis menjumlahkan `Modal Awal + Total Penjualan Tunai` untuk menghitung uang kas yang seharusnya ada di laci kasir vs uang fisik aktual (**Selisih Kas**).

### 4. Riwayat Pesanan & Pembatalan (Void)
- **Daftar Pesanan Real-Time**: Status pesanan lunas, metode pembayaran, kasir bertugas, dan rincian item.
- **Fitur Void Transaksi**: Kasir/Admin dapat membatalkan transaksi yang keliru dengan mencatat alasan void; stok produk otomatis dikembalikan (*restock*) ke inventaris toko.

### 5. Laporan Finansial & Ekspor Data (Khusus Admin)
- **Filter Rentang Waktu**: Menyaring omzet berdasarkan **Hari Ini**, **7 Hari Terakhir**, **Bulan Ini**, dan **Semua Waktu**.
- **KPI Real-Time**: Pendapatan bruto, total transaksi sah, rata-rata order (AOV), dan total cup/porsi terjual.
- **Breakdown Metode Bayar**: Rekap pendapatan uang tunai laci, QRIS bank, dan mesin EDC.
- **Rekap Diskon Promosi**: Menghitung total nominal potongan diskon yang diberikan ke pelanggan.
- **Ekspor Laporan (CSV)**: Tombol unduh laporan penjualan berformat `.csv` (kompatibel penuh dengan Microsoft Excel berkat UTF-8 BOM) tanpa membutuhkan library berat eksternal.
- **Proteksi Akses (403 Forbidden)**: Halaman laporan dan katalog admin diproteksi di tingkat server; kasir biasa tidak dapat mengaksesnya.

---

## Pintasan Keyboard (Speed POS Shortcuts)

Untuk mempercepat operasional kasir pada jam sibuk (*rush hour*), kasir dapat bernavigasi tanpa mouse:

| Shortcut | Fungsi |
|---|---|
| **`F2`** atau **`/`** | Langsung fokus ke kolom pencarian menu katalog |
| **`F9`** atau **`Spasi`** | Membuka modal pembayaran / checkout secara instan |
| **`Esc`** | Menutup modal checkout / catatan kondimen atau membersihkan pencarian |

---

## Keamanan & Integritas Data

Sistem ini menerapkan standar keamanan aplikasi kasir:

1. **Integritas Harga Sisi Server (*Server-Side Price Integrity*)**:
   - Harga produk tidak pernah dipercaya dari payload client/browser. Backend selalu mengambil harga resmi langsung dari database (`product.price`) untuk mencegah manipulasi harga (*price tampering*).
2. **Pencegahan Stok Minus (*Negative Inventory Prevention*)**:
   - Pengecekan kuota stok dilakukan di dalam transaksi atomik database (ACID via Prisma). Jika stok tersisa tidak cukup, transaksi langsung dibatalkan.
3. **Password Hashing (Bcrypt)**:
   - Password pengguna di-hash menggunakan algoritma **Bcrypt** (cost factor 10). Tidak ada password plaintext yang tersimpan di sistem.
4. **Session & Cookie Security**:
   - Token sesi disimpan dalam cookie `pos_session` dengan atribut `httpOnly: true` (kebal XSS), `sameSite: 'lax'` (kebal CSRF), dan `secure: true` pada production.
   - **Regenerate Session ID**: Setiap kali login baru berhasil, token sesi acak kriptografis diterbitkan dan sesi lama diinvalidasi.
5. **Brute Force & Lockout Protection**:
   - **IP-Level Rate Limiter**: Membatasi percobaan login maksimal 5 kali per 60 detik per IP.
   - **Account Lockout Tracking**: Jika salah memasukkan password 5 kali berturut-turut, akun otomatis dikunci di database selama 15 menit.
6. **Validasi Akses Backend (RBAC Check)**:
   - Pemeriksaan role (`ADMIN` vs `CASHIER`) dilakukan secara ketat pada Server Components dan API Routes, bukan sekadar menyembunyikan tombol di UI.
7. **Prepared Statements**:
   - Seluruh kueri ke database menggunakan Prisma Client parameterized queries untuk mencegah serangan SQL Injection.

---

## Akun Pengujian (Demo)

Sistem telah dilengkapi data *seeding* akun untuk pengujian:

| Role | Email | Password | Hak Akses |
|---|---|---|---|
| **ADMIN** | `admin@pos.com` | `admin123` | Akses penuh (Kasir, Katalog & Stok Admin, Laporan Kas & Omzet) |
| **CASHIER** | `kasir1@pos.com` | `kasir123` | Operasional kasir (POS, Pesanan, Meja). Akses ke Katalog & Laporan diblokir (403). |

> *Tips:* Pada halaman login (`/login`), terdapat tombol **1-Click Login** untuk beralih antara akun Admin dan Kasir secara instan.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, Server Components) |
| **Library UI** | React 19, Tailwind CSS v4, Lucide Icons |
| **State Management** | Zustand dengan LocalStorage Persistence |
| **Autentikasi & Keamanan** | Bcryptjs, HttpOnly Secure Cookies, Custom Rate Limiter |
| **ORM & Database** | Prisma ORM, PostgreSQL (Neon Serverless PostgreSQL / Cloud Ready) |
| **Automated Testing** | Node.js Test Runner + tsx (38 passing tests) |

---

## Struktur Folder

```
Point of Sale Aplikasi Kasir/
├── app/
│   ├── api/
│   │   ├── auth/            # Endpoint login, logout, & sesi aktif
│   │   ├── categories/      # Endpoint kategori produk
│   │   ├── products/        # Endpoint katalog & manajemen produk (GET, POST, PATCH)
│   │   │   └── restock/     # Endpoint restok inventaris cepat (POST)
│   │   ├── shifts/          # Endpoint buka/tutup shift & rekap kas
│   │   └── transactions/    # Endpoint transaksi, diskon, & void pesanan
│   ├── login/               # Halaman autentikasi terminal kasir
│   ├── pos/
│   │   ├── customers/       # Data loyalitas pelanggan
│   │   ├── orders/          # Riwayat pesanan & aksi void
│   │   ├── products/        # Halaman manajemen produk & stok (khusus Admin)
│   │   ├── reports/         # Laporan omzet, filter tanggal & ekspor CSV (khusus Admin)
│   │   ├── tables/          # Manajemen nomor meja
│   │   └── page.tsx         # Layar utama katalog kasir POS
│   ├── icon.svg             # Logo favicon SVG tab browser
│   ├── favicon.ico          # Favicon multi-resolusi
│   ├── layout.tsx           # Root layout dengan konfigurasi metadata icons
│   └── page.tsx             # Redirect ke rute kasir
├── components/
│   └── pos/
│       ├── CheckoutModal.tsx   # Form checkout, input diskon & struk thermal
│       ├── ExportCsvButton.tsx # Komponen tombol ekspor CSV laporan
│       └── Sidebar.tsx         # Navigasi kasir dengan status role
├── lib/
│   ├── auth.ts              # Helper autentikasi, sesi cookie, & RBAC backend
│   ├── prisma.ts            # Singleton Prisma Client
│   └── rate-limit.ts        # Rate limiter anti-brute force
├── prisma/
│   ├── schema.prisma        # Skema database (User, Shift, Transaction, dll)
│   └── seed.ts              # Script seeding data awal
├── scripts/
│   ├── generate_favicon.py  # Generator ikon favicon multi-resolusi
│   └── seed_demo.ts         # Script seeding transaksi demo
├── store/
│   └── useCartStore.ts      # Store keranjang belanja kasir (persisted)
└── tests/                   # Automated unit & integration tests (38 tests)
```

---

## Instalasi & Menjalankan

### Prasyarat
- Node.js ≥ 20
- PostgreSQL database instance (contoh: Neon Serverless Postgres atau lokal)

```bash
# 1. Pasang dependensi
npm install

# 2. Siapkan Environment Variables (.env)
# DATABASE_URL="postgresql://user:password@ep-sample-pooler.neon.tech/neondb?sslmode=require"

# 3. Sinkronisasi skema database Prisma
npx prisma generate
npx prisma db push

# 4. Masukkan data awal produk & akun demo kasir
npx tsx scripts/seed_demo.ts # atau: node prisma/seed.ts

# 5. Jalankan automated test suite
npm test

# 6. Jalankan development server
npm run dev
```

Buka peramban di `http://localhost:3000`. Jika belum memiliki sesi aktif, Anda akan otomatis diarahkan ke halaman login kasir (`/login`).

---

## Daftar API Endpoints

| Method | Endpoint | Hak Akses | Keterangan |
|---|---|---|---|
| POST | `/api/auth/login` | Publik | Login kasir / admin dengan rate limiter & lockout |
| POST | `/api/auth/logout` | Kasir/Admin | Menghapus sesi aktif dan membersihkan cookie |
| GET | `/api/auth/me` | Kasir/Admin | Mengambil data sesi pengguna yang sedang login |
| GET | `/api/products` | Kasir/Admin | Mengambil daftar produk (mendukung filter `?search=`) |
| POST | `/api/products` | **Admin Saja** | Menambah menu/produk baru |
| PATCH | `/api/products` | **Admin Saja** | Mengubah data menu (nama, SKU, harga, status aktif) |
| POST | `/api/products/restock` | **Admin Saja** | Menambah stok produk dengan log mutasi inventaris |
| GET | `/api/categories` | Kasir/Admin | Mengambil daftar kategori produk |
| POST | `/api/categories` | **Admin Saja** | Menambah kategori baru |
| GET | `/api/transactions` | Kasir/Admin | Mengambil riwayat transaksi |
| POST | `/api/transactions` | Kasir/Admin | Membuat transaksi kasir (validasi harga DB, diskon, stok, & catatan) |
| POST | `/api/transactions/void` | Kasir/Admin | Membatalkan transaksi & otomatis mengembalikan stok |
| GET | `/api/shifts` | Kasir/Admin | Mengambil daftar shift kasir |
| POST | `/api/shifts` | Kasir/Admin | Buka shift baru atau tutup shift dengan rekap selisih kas |

---

## Catatan Produksi & Deployment

- Database telah terkonfigurasi menggunakan **PostgreSQL** (`@prisma/client` + `neon` connection pooling ready).
- Siap di-deploy ke **Vercel** atau platform serverless lainnya. Pastikan mengatur environment variable `DATABASE_URL` di Vercel Dashboard dan script `postinstall: "prisma generate"` akan dieksekusi secara otomatis saat build.
