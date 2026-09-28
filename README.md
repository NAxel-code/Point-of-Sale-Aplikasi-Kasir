# Mr.Coffee Point of Sale (POS)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Security](https://img.shields.io/badge/Security-Bcrypt%20%7C%20RBAC%20%7C%20RateLimit-emerald?style=flat-square)

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
- [Keamanan & Integritas Data](#keamanan--integritas-data)
- [Akun Pengujian (Demo)](#akun-pengujian-demo)
- [Tech Stack](#tech-stack)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur Folder](#struktur-folder)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Daftar API Endpoints](#daftar-api-endpoints)

---

## Fitur Utama

### 1. Terminal Kasir (POS Screen)
- **Katalog Cepat**: Filter kategori kopi, non-kopi, pastry, serta fitur pencarian instan.
- **Manajemen Keranjang (Cart)**: Menggunakan Zustand store berkecepatan tinggi dengan stepper kuantitas otomatis.
- **Opsi Pesanan Fleksibel**: Mendukung **Dine In** (dengan nomor meja) dan **Take Away**.
- **Multi-Payment Methods**: Mendukung pembayaran **Tunai (Cash)** dengan pecahan uang pas, **QRIS Instant**, dan **Kartu Debit / EDC**.
- **Struk Thermal Siap Cetak (Receipt Preview)**: Pop-up struk kasir termal (58mm/80mm) otomatis muncul setelah transaksi berhasil, lengkap dengan tombol `Cetak Struk` (`window.print()`).

### 2. Operasional Shift & Rekonsiliasi Kas (Cash Drawer)
- **Buka & Tutup Shift**: Input modal kas awal saat buka toko.
- **Rekap Kas Otomatis**: Saat tutup shift, sistem otomatis menjumlahkan `Modal Awal + Total Penjualan Tunai` untuk menghitung uang kas yang seharusnya ada di laci kasir vs uang fisik aktual (**Selisih Kas**).

### 3. Riwayat Pesanan & Pembatalan (Void)
- **Daftar Pesanan Real-Time**: Status pesanan lunas, metode pembayaran, kasir bertugas, dan rincian item.
- **Fitur Void Transaksi**: Kasir/Admin dapat membatalkan transaksi yang keliru dengan mencatat alasan void; stok produk otomatis dikembalikan (*restock*) ke inventaris toko.

### 4. Laporan Finansial & Omzet (Khusus Administrator)
- **KPI Real-Time**: Pendapatan bruto, total transaksi sah, rata-rata order (AOV), dan total porsi terjual.
- **Breakdown Metode Bayar**: Rekap total pendapatan dari uang tunai laci, transfer QRIS bank, dan mesin EDC.
- **Proteksi Akses (403 Forbidden)**: Halaman laporan dilindungi di server; kasir biasa tidak dapat melihat data omzet toko.

---

## Keamanan & Integritas Data

Sistem ini menerapkan standar keamanan aplikasi kasir:

1. **Integritas Harga Sisi Server (Server-Side Price Calculation)**:
   - Harga produk tidak pernah dipercaya dari payload client/browser. Backend selalu mengambil harga resmi langsung dari database (`product.price`) untuk mencegah manipulasi harga (price tampering).
2. **Pencegahan Stok Minus (Negative Inventory Prevention)**:
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
| **ADMIN** | `admin@pos.com` | `admin123` | Akses penuh (Kasir, Kelola Produk, Laporan Kas & Omzet) |
| **CASHIER** | `kasir1@pos.com` | `kasir123` | Operasional kasir (POS, Pesanan, Meja). Akses ke Laporan Kas diblokir (403). |

> *Tips:* Pada halaman login (`/login`), terdapat tombol **1-Click Login** untuk beralih antara akun Admin dan Kasir secara instan.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, Server Components) |
| **Library UI** | React 19, Tailwind CSS v4, Lucide Icons |
| **State Management** | Zustand (Shopping Cart) |
| **Autentikasi & Keamanan** | Bcryptjs, HttpOnly Secure Cookies, Custom Rate Limiter |
| **ORM & Database** | Prisma ORM, SQLite (`dev.db`) / PostgreSQL (Production ready) |

---

## Struktur Folder

```
Point of Sale Aplikasi Kasir/
├── app/
│   ├── api/
│   │   ├── auth/          # Endpoint login, logout, & sesi aktif
│   │   ├── categories/    # Endpoint kategori produk
│   │   ├── products/      # Endpoint katalog & manajemen produk
│   │   ├── shifts/        # Endpoint buka/tutup shift & rekap kas
│   │   └── transactions/  # Endpoint transaksi & void pesanan
│   ├── login/             # Halaman autentikasi terminal kasir
│   ├── pos/
│   │   ├── customers/     # Data loyalitas pelanggan
│   │   ├── orders/        # Riwayat pesanan & aksi void
│   │   ├── reports/       # Laporan omzet & laba (khusus Admin)
│   │   ├── tables/        # Manajemen nomor meja
│   │   └── page.tsx       # Layar utama katalog kasir POS
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Redirect ke rute kasir
├── components/
│   └── pos/
│       ├── CheckoutModal.tsx # Form checkout & struk thermal kasir
│       └── Sidebar.tsx       # Navigasi kasir dengan indikator status role
├── lib/
│   ├── auth.ts            # Helper autentikasi, sesi cookie, & RBAC backend
│   ├── prisma.ts          # Singleton Prisma Client
│   └── rate-limit.ts      # Rate limiter anti-brute force
├── prisma/
│   ├── schema.prisma      # Skema database (User, Shift, Transaction, dll)
│   └── seed.ts            # Script seeding data awal
├── proxy.ts               # Next.js 16 perimeter protection untuk rute /pos
└── store/
    └── useCartStore.ts    # Store keranjang belanja kasir
```

---

## Instalasi & Menjalankan

### Prasyarat
- Node.js ≥ 20

```bash
# 1. Pasang dependensi
npm install

# 2. Sinkronisasi skema database Prisma
npx prisma generate
npx prisma db push

# 3. Masukkan data awal produk & akun demo kasir
node prisma/seed.ts

# 4. Jalankan development server
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
| GET | `/api/categories` | Kasir/Admin | Mengambil daftar kategori produk |
| POST | `/api/categories` | **Admin Saja** | Menambah kategori baru |
| GET | `/api/transactions` | Kasir/Admin | Mengambil riwayat transaksi |
| POST | `/api/transactions` | Kasir/Admin | Membuat transaksi kasir (validasi harga & stok dari DB) |
| POST | `/api/transactions/void` | Kasir/Admin | Membatalkan transaksi & otomatis mengembalikan stok |
| GET | `/api/shifts` | Kasir/Admin | Mengambil daftar shift kasir |
| POST | `/api/shifts` | Kasir/Admin | Buka shift baru atau tutup shift dengan rekap selisih kas |

---

## Catatan Produksi

- Database saat ini menggunakan **SQLite** (`prisma/dev.db`) untuk kemudahan instalasi lokal tanpa perlu konfigurasi database server terpisah.
- Untuk deployment ke lingkungan produksi (misal: Vercel, VPS, AWS), ubah `provider = "sqlite"` menjadi `provider = "postgresql"` pada file [`prisma/schema.prisma`](file:///c:/Users/User/Documents/Project/Point%20of%20Sale%20Aplikasi%20Kasir/prisma/schema.prisma) dan pasang connection string database PostgreSQL pada environment variable `DATABASE_URL`.
