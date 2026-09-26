import prisma from "@/lib/prisma"
import { LayoutGrid, UtensilsCrossed, Receipt, Clock } from "lucide-react"

export default async function TablesPage() {
  const transactions = await prisma.transaction.findMany({
    where: { tableNumber: { not: null, notIn: [""] } },
    orderBy: { createdAt: 'desc' },
    take: 60
  })

  // Group transactions by table number
  const tableData: Record<string, any[]> = {}
  for (const tx of transactions) {
    if (tx.tableNumber) {
      if (!tableData[tx.tableNumber]) tableData[tx.tableNumber] = []
      tableData[tx.tableNumber].push(tx)
    }
  }

  const formatRp = (val: number) => 'Rp ' + val.toLocaleString('id-ID')
  const activeTableCount = Object.keys(tableData).length

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Kelola Meja</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {activeTableCount} Meja Terdaftar
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Status dan riwayat aktivitas transaksi per nomor meja pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl">
          <UtensilsCrossed className="w-4 h-4 text-amber-500" />
          <span>Nomor Meja dapat diinput langsung saat checkout kasir</span>
        </div>
      </div>

      {/* Grid Meja */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {Object.entries(tableData).map(([table, txs]) => {
          const totalSpent = txs.reduce((sum, t) => sum + t.grandTotal, 0)
          const latestTx = txs[0]

          return (
            <div 
              key={table} 
              className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Area Dine In
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-black mb-3 group-hover:scale-105 transition font-mono">
                  {table}
                </div>

                <h3 className="font-bold text-zinc-100 text-sm">Meja {table}</h3>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                  <Receipt className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{txs.length} Kali Pesanan</span>
                </p>

                {latestTx && (
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span>Terakhir: {new Date(latestTx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-800/80">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Total Belanja</span>
                <p className="text-xs font-black text-amber-400 font-mono mt-0.5">{formatRp(totalSpent)}</p>
              </div>
            </div>
          )
        })}

        {activeTableCount === 0 && (
          <div className="col-span-full text-center py-24 text-zinc-500 flex flex-col items-center justify-center gap-3">
            <LayoutGrid className="w-12 h-12 stroke-1 text-zinc-700" />
            <p className="font-semibold text-zinc-300 text-sm">Belum Ada Meja yang Aktif</p>
            <p className="text-xs text-zinc-600 max-w-sm">
              Untuk mengaitkan pesanan dengan meja, masukkan nomor meja pada tiket kasir atau saat checkout.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
