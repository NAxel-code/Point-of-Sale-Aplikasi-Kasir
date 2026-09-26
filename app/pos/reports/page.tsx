import prisma from "@/lib/prisma"
import { BarChart3, TrendingUp, Receipt, ShoppingCart, DollarSign, ArrowUpRight } from "lucide-react"

export default async function ReportsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  })

  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.grandTotal, 0)
  const totalTransactions = transactions.length
  const averageTicket = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0
  
  const totalItemsSold = transactions.reduce((sum, tx) => {
    return sum + tx.items.reduce((s, item) => s + item.quantity, 0)
  }, 0)

  const formatRp = (val: number) => 'Rp ' + val.toLocaleString('id-ID')

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Laporan Kas & Penjualan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Shift Aktif
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Ringkasan pendapatan bruto, rata-rata transaksi, dan audit aktivitas kasir.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-400">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Laporan terupdate otomatis secara real-time</span>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <p className="text-[10px] text-zinc-400 mt-1">Akumulasi seluruh transaksi</p>
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
              <BarChart3 className="w-4 h-4 text-zinc-300" />
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

      {/* Recent Transactions Table */}
      <div className="mb-4">
        <h3 className="font-bold text-zinc-100 text-sm">Aktivitas Transaksi Terbaru</h3>
        <p className="text-zinc-500 text-xs mt-0.5">Audit 10 transaksi terakhir yang masuk ke sistem kasir</p>
      </div>

      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Nomor Resi</th>
              <th className="px-6 py-4">Waktu Transaksi</th>
              <th className="px-6 py-4">Pelanggan & Meja</th>
              <th className="px-6 py-4">Item Dipesan</th>
              <th className="px-6 py-4 text-right">Total Transaksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {transactions.slice(0, 10).map((tx) => (
              <tr key={tx.id} className="hover:bg-zinc-800/40 transition">
                <td className="px-6 py-4 font-mono font-bold text-amber-400">
                  {tx.receiptNumber}
                </td>
                <td className="px-6 py-4 text-zinc-400">
                  {new Date(tx.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-6 py-4 font-medium text-zinc-200">
                  {tx.customerName || 'Tamu / Umum'} {tx.tableNumber ? `(Meja ${tx.tableNumber})` : ''}
                </td>
                <td className="px-6 py-4 text-zinc-400">
                  {tx.items.reduce((s, i) => s + i.quantity, 0)} item
                </td>
                <td className="px-6 py-4 text-right font-black text-zinc-100 font-mono text-sm">
                  {formatRp(tx.grandTotal)}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                  Belum ada transaksi tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
