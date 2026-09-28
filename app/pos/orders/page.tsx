"use client"

import { useEffect, useState } from "react"
import { 
  Receipt, 
  Calendar, 
  User, 
  Hash, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw,
  Loader2,
  Banknote,
  QrCode,
  CreditCard
} from "lucide-react"

export default function OrdersPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [voidingId, setVoidingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"ALL" | "COMPLETED" | "VOIDED">("ALL")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/transactions")
      if (res.ok) {
        const data = await res.json()
        setTransactions(Array.isArray(data) ? data : [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleVoid = async (id: string, receiptNumber: string) => {
    const reason = window.prompt(`Alasan membatalkan / void transaksi ${receiptNumber}:`, "Salah input kasir / pelanggan batal")
    if (reason === null) return // user canceled prompt

    setVoidingId(id)
    try {
      const res = await fetch("/api/transactions/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id, reason }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Gagal membatalkan transaksi")
      } else {
        alert(data.message || "Transaksi berhasil di-void dan stok dikembalikan ke inventaris.")
        fetchOrders()
      }
    } catch {
      alert("Terjadi kesalahan jaringan.")
    } finally {
      setVoidingId(null)
    }
  }

  const formatRp = (val: number) => "Rp " + val.toLocaleString("id-ID")

  const filteredTransactions = transactions.filter(tx => {
    if (filter === "ALL") return true
    return tx.status === filter
  })

  const validTransactions = transactions.filter(t => t.status === "COMPLETED")
  const totalOmzet = validTransactions.reduce((acc, t) => acc + t.grandTotal, 0)

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-y-auto p-6 md:p-8">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Daftar Pesanan & Riwayat</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {validTransactions.length} Selesai
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Riwayat lengkap transaksi penjualan kasir dan opsi pembatalan (Void) dengan restok otomatis.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Omzet Sah</p>
            <p className="text-base font-black text-amber-400 font-mono">{formatRp(totalOmzet)}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            filter === "ALL" ? "bg-zinc-100 text-zinc-950 font-bold" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Semua ({transactions.length})
        </button>
        <button
          onClick={() => setFilter("COMPLETED")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            filter === "COMPLETED" ? "bg-emerald-500 text-zinc-950 font-bold" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Selesai ({validTransactions.length})
        </button>
        <button
          onClick={() => setFilter("VOIDED")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            filter === "VOIDED" ? "bg-rose-500 text-zinc-950 font-bold" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Dibatalkan (Void) ({transactions.filter(t => t.status === "VOIDED").length})
        </button>
      </div>

      {/* Transactions List */}
      <div className="flex flex-col gap-3.5">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span>Memuat data transaksi kasir...</span>
          </div>
        )}

        {!loading && filteredTransactions.map(tx => {
          const isVoided = tx.status === "VOIDED"

          return (
            <div 
              key={tx.id} 
              className={`bg-zinc-900/90 border rounded-2xl p-5 transition flex flex-col gap-4 shadow-sm ${
                isVoided ? "border-rose-900/50 bg-rose-950/10 opacity-75" : "border-zinc-800 hover:border-zinc-700/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isVoided ? "text-rose-400 bg-rose-950/30 border-rose-800/40" : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  }`}>
                    {tx.receiptNumber}
                  </span>

                  {/* Payment Method Badge */}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono flex items-center gap-1 ${
                    tx.paymentMethod === 'CASH' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' :
                    tx.paymentMethod === 'QRIS' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50' :
                    'bg-blue-950/60 text-blue-400 border border-blue-800/50'
                  }`}>
                    {tx.paymentMethod === 'CASH' && <Banknote className="w-3 h-3" />}
                    {tx.paymentMethod === 'QRIS' && <QrCode className="w-3 h-3" />}
                    {tx.paymentMethod === 'CARD' && <CreditCard className="w-3 h-3" />}
                    <span>{tx.paymentMethod}</span>
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

                  {tx.cashier?.name && (
                    <span className="text-[10px] text-zinc-500">
                      Kasir: {tx.cashier.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 sm:justify-end">
                  {isVoided ? (
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold bg-rose-950/40 border border-rose-800/40 px-2.5 py-1 rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Dibatalkan (Void)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-950/40 border border-emerald-800/30 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Lunas</span>
                    </div>
                  )}

                  <div className="text-right">
                    <span className={`text-lg font-black font-mono ${isVoided ? "line-through text-zinc-500" : "text-zinc-100"}`}>
                      {formatRp(tx.grandTotal)}
                    </span>
                  </div>

                  {!isVoided && (
                    <button
                      type="button"
                      disabled={voidingId === tx.id}
                      onClick={() => handleVoid(tx.id, tx.receiptNumber)}
                      className="p-1.5 rounded-lg border border-zinc-800 hover:border-rose-500/50 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition text-xs flex items-center gap-1"
                      title="Batalkan / Void Transaksi ini dan kembalikan stok"
                    >
                      {voidingId === tx.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px] font-semibold">Void</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Void Reason Banner */}
              {isVoided && tx.voidReason && (
                <div className="px-3 py-1.5 rounded-lg bg-rose-950/30 border border-rose-900/40 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Alasan Void: <strong>{tx.voidReason}</strong> (Stok telah dikembalikan)</span>
                </div>
              )}

              {/* Items Breakdown */}
              <div className="flex flex-wrap gap-2">
                {tx.items.map((item: any) => (
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
          )
        })}

        {!loading && filteredTransactions.length === 0 && (
          <div className="text-center py-24 text-zinc-500 flex flex-col items-center justify-center gap-3">
            <Receipt className="w-12 h-12 stroke-1 text-zinc-700" />
            <p className="font-semibold text-zinc-300 text-sm">Tidak Ada Transaksi Ditemukan</p>
            <p className="text-xs text-zinc-600 max-w-sm">
              Belum ada riwayat pesanan yang sesuai dengan filter ini.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
