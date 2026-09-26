import prisma from "@/lib/prisma"
import { Users, Award, ShoppingBag, ArrowUpRight } from "lucide-react"

export default async function CustomersPage() {
  const transactions = await prisma.transaction.findMany({
    where: { customerName: { not: null, notIn: [""] } },
  })

  // Group by customer
  const customers = transactions.reduce((acc: any, tx) => {
    const name = tx.customerName!.trim()
    if (!acc[name]) acc[name] = { totalSpent: 0, visits: 0, lastOrder: tx.createdAt }
    acc[name].totalSpent += tx.grandTotal
    acc[name].visits += 1
    return acc
  }, {})

  const sortedCustomers = Object.entries(customers).sort(
    (a: any, b: any) => b[1].totalSpent - a[1].totalSpent
  )

  const formatRp = (val: number) => 'Rp ' + val.toLocaleString('id-ID')

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Data Pelanggan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {sortedCustomers.length} Terdaftar
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Daftar pelanggan dan riwayat loyalitas berdasarkan nama yang tercatat pada transaksi.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-400">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Tersortir berdasarkan akumulasi total belanja tertinggi</span>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Pelanggan</th>
              <th className="px-6 py-4">Status Loyalitas</th>
              <th className="px-6 py-4">Frekuensi Kunjungan</th>
              <th className="px-6 py-4 text-right">Total Akumulasi Belanja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {sortedCustomers.map(([name, data]: [string, any], index) => {
              const isVIP = data.visits >= 5 || data.totalSpent >= 200000
              const isRegular = data.visits >= 2

              return (
                <tr key={name} className="hover:bg-zinc-800/40 transition">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-100 text-xs">{name}</p>
                      <p className="text-[10px] text-zinc-500">Peringkat #{index + 1}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isVIP ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Award className="w-3 h-3" />
                        VIP Member
                      </span>
                    ) : isRegular ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Regular Guest
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                        New Guest
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{data.visits} Transaksi</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-amber-400 font-mono text-sm">
                      {formatRp(data.totalSpent)}
                    </span>
                  </td>
                </tr>
              )
            })}

            {sortedCustomers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-24 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-10 h-10 stroke-1 text-zinc-700" />
                    <p className="font-semibold text-zinc-300">Belum Ada Data Pelanggan</p>
                    <p className="text-xs text-zinc-600">
                      Masukkan nama pelanggan saat checkout untuk mulai mengumpulkan data loyalitas.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
