import os
import subprocess
import json
import re
from gtts import gTTS
import imageio_ffmpeg

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

SCENES = [
    {
        "id": "scene1_login",
        "title": "LANGKAH 1: AUTENTIKASI KASIR & SISTEM KEAMANAN RBAC",
        "subtitle": "Login Kasir Aman dengan Enkripsi Bcrypt & Pemisahan Role",
        "text": "Halo dan selamat datang di video hands-on aplikasi kasir Mr. Coffee Point of Sale berbasis Next.js. Kita mulai dari halaman login kasir yang dilengkapi sistem keamanan Role Based Access Control, enkripsi sandi bcrypt, dan proteksi sesi aman. Di sini kasir dapat masuk menggunakan akun kasir resmi atau tombol demonstrasi satu klik."
    },
    {
        "id": "scene2_catalog",
        "title": "LANGKAH 2: TERMINAL PENJUALAN & KATALOG MENU",
        "subtitle": "Navigasi Kategori Menu Kopi & Pastry dengan Pencarian Real-Time",
        "text": "Setelah login, kasir diarahkan langsung ke terminal kasir utama. Di bagian atas terdapat jam operasional dan indikator status sistem aktif. Kasir dapat menyaring katalog menu berdasarkan kategori Kopi, Non Kopi, dan Pastry, serta menggunakan fitur pencarian cepat untuk menemukan menu favorit pelanggan secara instan."
    },
    {
        "id": "scene3_cart",
        "title": "LANGKAH 3: PEMILIHAN MENU & MANAJEMEN TIKET PESANAN",
        "subtitle": "Kalkulasi Subtotal Instan, Pengaturan Meja, & Opsi Dine In / Take Away",
        "text": "Untuk membuat pesanan baru, kasir cukup mengklik kartu menu pilihan pelanggan. Setiap item langsung menampilkan counter jumlah dan otomatis masuk ke tiket pesanan di sisi kanan. Kasir dapat mengatur kuantitas, memilih tipe pesanan Dine In atau Take Away, serta menginput nama pelanggan dan nomor meja."
    },
    {
        "id": "scene4_checkout",
        "title": "LANGKAH 4: PROSES CHECKOUT & MULTI-METODE PEMBAYARAN",
        "subtitle": "Dukungan Pembayaran Tunai, QRIS Dinamis, & Kartu Debit / EDC",
        "text": "Setelah pesanan lengkap, kasir menekan tombol Bayar untuk membuka modal checkout. Aplikasi kasir ini mendukung multi-metode pembayaran: Tunai, QRIS, dan Kartu Debit. Pada metode tunai, tersedia tombol cepat nominal pecahan uang pas atau uang kertas, lengkap dengan penghitungan uang kembalian secara otomatis dan akurat."
    },
    {
        "id": "scene5_receipt",
        "title": "LANGKAH 5: CETAK STRUK PEMBAYARAN THERMAL DIGITAL",
        "subtitle": "Pratinjau Struk Kasir Otentik & Update Stok Inventaris Database",
        "text": "Setelah transaksi berhasil divalidasi, sistem langsung menampilkan struk kasir thermal digital. Struk ini memuat nomor bukti transaksi resmi, tanggal, rincian menu, total bayar, hingga identitas kasir yang melayani. Stok produk di database juga langsung berkurang secara otomatis dan aman."
    },
    {
        "id": "scene6_tables",
        "title": "LANGKAH 6: MONITORING & KELOLA MEJA PELANGGAN",
        "subtitle": "Pemantauan Status Meja Dine In & Akumulasi Belanja Per Meja",
        "text": "Sekarang kita beralih ke modul Kelola Meja. Halaman ini memudahkan staf untuk memantau meja pelanggan yang sedang aktif di area Dine In, termasuk Meja delapan yang baru saja bertransaksi. Kasir dapat melihat frekuensi pemesanan serta total transaksi belanja pada setiap meja."
    },
    {
        "id": "scene7_customers",
        "title": "LANGKAH 7: DATA PELANGGAN & TINGKAT LOYALITAS CRM",
        "subtitle": "Klasifikasi Pelanggan Otomatis: VIP Member, Regular, & New Guest",
        "text": "Pada menu Pelanggan, sistem POS mengumpulkan riwayat pelanggan secara otomatis. Pelanggan diklasifikasikan ke dalam tingkatan loyalitas seperti VIP Member dan Tamu Reguler berdasarkan total belanja dan frekuensi kunjungan, sangat berguna untuk program loyalitas kafe."
    },
    {
        "id": "scene8_orders_void",
        "title": "LANGKAH 8: RIWAYAT TRANSAKSI & PEMBATALAN (VOID)",
        "subtitle": "Audit Log Penjualan & Pembatalan Pesanan dengan Pengembalian Stok Otomatis",
        "text": "Di menu Daftar Pesanan, tersaji seluruh riwayat transaksi penjualan beserta rekapan omzet kasir. Jika terdapat salah input atau pembatalan pesanan, kasir dapat menggunakan fitur Void yang aman. Sistem mewajibkan pencatatan alasan dan secara otomatis memulihkan stok inventaris ke database."
    },
    {
        "id": "scene9_reports_admin",
        "title": "LANGKAH 9: LAPORAN KEUANGAN & PROTEKSI AKSES ADMIN",
        "subtitle": "Dashboard Laporan Omzet, Rata-rata Transaksi, & Rincian Pembayaran",
        "text": "Menu Laporan Kas dilindungi hak akses khusus Administrator demi menjaga kerahasiaan finansial toko. Saat masuk sebagai Admin, halaman ini menyajikan dashboard lengkap mencakup total omzet bersih, volume transaksi, rata-rata belanja, serta rincian pendapatan dari Tunai, QRIS, dan Kartu Debit."
    },
    {
        "id": "scene10_conclusion",
        "title": "RINGKASAN: SOLUSI KASIR POS LENGKAP & INTEGRATIF",
        "subtitle": "Mr. Coffee Point of Sale - Solusi Cepat, Andal, dan Siap Operasional",
        "text": "Demikian alur lengkap penggunaan aplikasi Mr. Coffee Point of Sale, mulai dari transaksi kasir yang responsif, manajemen meja, pelacakan loyalitas pelanggan, hingga laporan finansial yang komprehensif. Aplikasi kasir siap digunakan untuk menunjang operasional kafe modern. Terima kasih!"
    }
]

def get_audio_duration(file_path):
    cmd = [
        FFMPEG_EXE,
        "-i", file_path,
        "-f", "null",
        "-"
    ]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True, errors="ignore")
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", res.stderr)
    if match:
        hours, minutes, seconds = match.groups()
        return int(hours) * 3600 + int(minutes) * 60 + float(seconds)
    return 10.0

def generate_all_audio():
    audio_dir = os.path.join(os.getcwd(), "video_assets", "audio")
    os.makedirs(audio_dir, exist_ok=True)
    
    metadata = []
    
    print("Mulai menghasilkan voiceover audio bahasa Indonesia...")
    for idx, scene in enumerate(SCENES):
        audio_file = os.path.join(audio_dir, f"{scene['id']}.mp3")
        tts = gTTS(scene['text'], lang='id')
        tts.save(audio_file)
        
        duration = get_audio_duration(audio_file)
        print(f"[{idx+1}/{len(SCENES)}] {scene['id']}: {duration:.2f} detik")
        
        metadata.append({
            **scene,
            "audio_file": audio_file,
            "duration": duration
        })
        
    meta_path = os.path.join(audio_dir, "scenes_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print("Metadata audio berhasil disimpan di:", meta_path)

if __name__ == "__main__":
    generate_all_audio()
