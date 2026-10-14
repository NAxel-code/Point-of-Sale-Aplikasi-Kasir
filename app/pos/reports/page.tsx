import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import Link from "next/link"
import ExportCsvButton from "@/components/pos/ExportCsvButton"
import { 
  TrendingUp, 
  Receipt, 
  ShoppingCart, 
  DollarSign, 
  ShieldAlert, 
  Lock, 
  ArrowLeft,
  Banknote,
  QrCode,
  CreditCard,
  Tag,
  Calendar
} from "lucide-react"

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function ReportsPage(props: PageProps) {
  // Hanya Administrator yang diizinkan melihat rekap omzet & laporan keuangan
  const auth = await requireAdmin();

  if (!auth.authorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 bg-zinc-950 p-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-950/30">
          <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/60 border border-rose-800/50 text-rose-400 mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>403 Forbidden - Khusus Pemilik / Admin</span>
        </div>

        <h1 className="text-2xl font-black text-zinc-100 tracking-tight max-w-md">
          Akses Laporan Finansial Dibatasi
        </h1>

        <p className="text-zinc-400 text-xs mt-2 max-w-md leading-relaxed">
          Halaman ini berisi data keuangan sensitif (omzet & laba bruto). Hanya akun dengan role Administrator yang diizinkan mengakses.
        </p>

        {auth.session && (
          <div className="mt-4 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center gap-2">
            <span>Login sebagai:</span>
            <strong className="text-zinc-200">{auth.session.user.name}</strong>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono text-[10px]">
              ROLE: {auth.session.user.role}
            </span>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Kasir POS</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-md shadow-amber-950/40"
          >
            <span>Login sebagai Admin</span>
          </Link>
        </div>
      </div>
    );
  }

  const searchParams = (await props.searchParams) || {};
  const range = searchParams.range || "ALL";

  let dateFilter: any = undefined;
  const now = new Date();

  if (range === "TODAY") {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dateFilter = { gte: startOfToday };
  } else if (range === "LAST_7_DAYS") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = { gte: sevenDaysAgo };
  } else if (range === "THIS_MONTH") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = { gte: startOfMonth };
  }

  // Hanya hitung transaksi yang COMPLETED (transaksi VOID tidak dihitung)
  const transactions = await prisma.transaction.findMany({
    where: { 
      status: "COMPLETED",
      ...(dateFilter ? { createdAt: dateFilter } : {})
    },
    orderBy: { createdAt: 'desc' },
    include: { items: true, cashier: { select: { name: true } } }
  })

  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.grandTotal, 0)
  const totalDiscount = transactions.reduce((sum, tx) => sum + (tx.discount || 0), 0)
  const totalTransactions = transactions.length
  const averageTicket = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0
  
  const totalItemsSold = transactions.reduce((sum, tx) => {
    return sum + tx.items.reduce((s, item) => s + item.quantity, 0)
  }, 0)

  // Breakdown metode pembayaran
  const cashTotal = transactions.filter(t => t.paymentMethod === "CASH").reduce((s, t) => s + t.grandTotal, 0)
  const qrisTotal = transactions.filter(t => t.paymentMethod === "QRIS").reduce((s, t) => s + t.grandTotal, 0)
  const cardTotal = transactions.filter(t => t.paymentMethod === "CARD").reduce((s, t) => s + t.grandTotal, 0)

  const formatRp = (val: number) => 'Rp ' + val.toLocaleString('id-ID')

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Laporan Kas & Penjualan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Shift Aktif
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Role: ADMIN
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Ringkasan pendapatan bruto, rata-rata transaksi, potongan diskon, dan ekspor data kasir.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ExportCsvButton transactions={transactions} />
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar py-1">
        <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1.5 mr-1 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          <span>Periode:</span>
        </span>

        <Link
          href="/pos/reports?range=TODAY"
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            range === "TODAY"
              ? "bg-amber-500 text-zinc-950 font-bold"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Hari Ini
        </Link>

        <Link
          href="/pos/reports?range=LAST_7_DAYS"
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            range === "LAST_7_DAYS"
              ? "bg-amber-500 text-zinc-950 font-bold"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          7 Hari Terakhir
        </Link>

        <Link
          href="/pos/reports?range=THIS_MONTH"
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            range === "THIS_MONTH"
              ? "bg-amber-500 text-zinc-950 font-bold"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Bulan Ini
        </Link>

        <Link
          href="/pos/reports?range=ALL"
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            range === "ALL"
              ? "bg-amber-500 text-zinc-950 font-bold"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Semua Waktu
        </Link>
      </div>


      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Revenue */}
        <div className="bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pendapatan Bruto</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-100 font-mono tracking-tight">
              {formatRp(totalRevenue)}
            </h2>
            <p className="text-[10px] text-zinc-400 mt-1">Akumulasi transaksi valid</p>
          </div>
        </div>

        {/* Card 2: Total Transactions */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Transaksi</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-zinc-300" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-100 font-mono tracking-tight">
              {totalTransactions} <span className="text-xs text-zinc-500 font-sans font-medium">Order Selesai</span>
            </h2>
            <p className="text-[10px] text-zinc-400 mt-1">Struk tercetak</p>
          </div>
        </div>

        {/* Card 3: Average Basket Size */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rata-rata Order (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-zinc-300" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-100 font-mono tracking-tight">
              {formatRp(averageTicket)}
            </h2>
            <p className="text-[10px] text-zinc-400 mt-1">Nilai per pelanggan</p>
          </div>
        </div>

        {/* Card 4: Total Items Sold */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">Produk Terjual</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-zinc-300" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-100 font-mono tracking-tight">
              {totalItemsSold} <span className="text-xs text-zinc-500 font-sans font-medium">Cup / Porsi</span>
            </h2>
            <p className="text-[10px] text-zinc-400 mt-1">Keluar dari inventaris</p>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown Pill Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tunai / Cash Laci</p>
              <p className="text-sm font-bold text-zinc-100 font-mono">{formatRp(cashTotal)}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">QRIS Masuk Bank</p>
              <p className="text-sm font-bold text-zinc-100 font-mono">{formatRp(qrisTotal)}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Debit / EDC Bank</p>
              <p className="text-sm font-bold text-zinc-100 font-mono">{formatRp(cardTotal)}</p>
            </div>
          </div>
        </div>

        {totalDiscount > 0 && (
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between sm:col-span-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Potongan Diskon Promosi</p>
                <p className="text-sm font-bold text-rose-400 font-mono">{formatRp(totalDiscount)}</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
              Hemat Pelanggan
            </span>
          </div>
        )}
      </div>

      {/* Recent Transactions Table */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-zinc-100 text-sm">Aktivitas Transaksi Selesai</h3>
          <p className="text-zinc-500 text-xs mt-0.5">Audit transaksi sah yang masuk ke kasir pada periode terpilih</p>
        </div>
        <span className="text-xs text-zinc-500 font-medium font-mono">
          {transactions.length} transaksi
        </span>
      </div>

      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">Nomor Resi</th>
              <th className="px-4 py-3.5">Metode</th>
              <th className="px-4 py-3.5">Kasir</th>
              <th className="px-4 py-3.5">Pelanggan & Meja</th>
              <th className="px-4 py-3.5">Item Dipesan</th>
              <th className="px-4 py-3.5 text-right">Subtotal</th>
              <th className="px-4 py-3.5 text-right">Diskon</th>
              <th className="px-5 py-3.5 text-right">Grand Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {transactions.slice(0, 30).map((tx) => (
              <tr key={tx.id} className="hover:bg-zinc-800/40 transition">
                <td className="px-5 py-3.5 font-mono font-bold text-amber-400">
                  {tx.receiptNumber}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    tx.paymentMethod === 'CASH' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' :
                    tx.paymentMethod === 'QRIS' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50' :
                    'bg-blue-950/60 text-blue-400 border border-blue-800/50'
                  }`}>
                    {tx.paymentMethod}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-zinc-300">
                  {tx.cashier?.name || '-'}
                </td>
                <td className="px-4 py-3.5 font-medium text-zinc-200">
                  {tx.customerName || 'Tamu / Umum'} {tx.tableNumber ? `(Meja ${tx.tableNumber})` : ''}
                </td>
                <td className="px-4 py-3.5 text-zinc-400">
                  {tx.items.reduce((s, i) => s + i.quantity, 0)} item
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-zinc-400">
                  {formatRp(tx.subtotal)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono">
                  {tx.discount > 0 ? (
                    <span className="text-rose-400 font-semibold">- {formatRp(tx.discount)}</span>
                  ) : (
                    <span className="text-zinc-600">-</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right font-black text-amber-400 font-mono text-sm">
                  {formatRp(tx.grandTotal)}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-zinc-500">
                  Belum ada transaksi pada periode ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
