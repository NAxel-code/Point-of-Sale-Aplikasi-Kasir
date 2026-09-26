import prisma from "@/lib/prisma"
import { Receipt, Calendar, User, Hash, CheckCircle2 } from "lucide-react"

export default async function OrdersPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  })

  const totalOmzet = transactions.reduce((acc, t) => acc + t.grandTotal, 0)
  const formatRp = (val: number) => 'Rp ' + val.toLocaleString('id-ID')

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-y-auto p-6 md:p-8">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Daftar Pesanan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {transactions.length} Selesai
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Riwayat lengkap transaksi penjualan yang telah diproses kasir.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Penjualan</p>
            <p className="text-base font-black text-amber-400 font-mono">{formatRp(totalOmzet)}</p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex flex-col gap-3.5">
        {transactions.map(tx => (
          <div 
            key={tx.id} 
            className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 transition flex flex-col gap-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  {tx.receiptNumber}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{new Date(tx.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{tx.customerName || 'Tamu / Umum'}</span>
                  {tx.tableNumber && (
                    <span className="text-amber-400 font-semibold ml-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Meja {tx.tableNumber}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 sm:justify-end">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-950/40 border border-emerald-800/30 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Lunas</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-zinc-100 font-mono">
                    {formatRp(tx.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Items Breakdown */}
            <div className="flex flex-wrap gap-2">
              {tx.items.map(item => (
                <div 
                  key={item.id} 
                  className="bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs"
                >
                  <span className="text-amber-400 font-black font-mono">{item.quantity}x</span>
                  <span className="text-zinc-200 font-medium">{item.productName}</span>
                  <span className="text-zinc-500 font-mono text-[11px]">({formatRp(item.productPrice)})</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-24 text-zinc-500 flex flex-col items-center justify-center gap-3">
            <Receipt className="w-12 h-12 stroke-1 text-zinc-700" />
            <p className="font-semibold text-zinc-300 text-sm">Belum Ada Transaksi</p>
            <p className="text-xs text-zinc-600 max-w-sm">
              Transaksi yang Anda selesaikan di kasir POS akan otomatis tercatat dan tersusun rapi di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
