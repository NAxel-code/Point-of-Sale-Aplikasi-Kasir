"use client"

import { useState } from "react"
import { useCartStore } from "@/store/useCartStore"
import { 
  X, 
  Banknote, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Receipt,
  User,
  Hash,
  Loader2
} from "lucide-react"

type PaymentMethod = "CASH" | "QRIS" | "CARD"

export default function CheckoutModal({ 
  onClose, 
  onSuccess,
  defaultCustomerName = "",
  defaultTableNumber = "",
  orderType = "Dine In"
}: { 
  onClose: () => void
  onSuccess: () => void
  defaultCustomerName?: string
  defaultTableNumber?: string
  orderType?: string
}) {
  const cart = useCartStore()
  const total = cart.subtotal()
  
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [cash, setCash] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [customerName, setCustomerName] = useState(defaultCustomerName)
  const [tableNumber, setTableNumber] = useState(defaultTableNumber)
  const [cardRef, setCardRef] = useState("")

  const cashAmount = method === "CASH" 
    ? (parseInt(cash.replace(/\D/g, '')) || 0)
    : total

  const change = cashAmount - total
  const isSufficient = cashAmount >= total

  // Quick denomination suggestions for Indonesian Rupiah
  const generateQuickAmounts = () => {
    const list = [
      total, // Uang pas
      Math.ceil(total / 10000) * 10000,
      Math.ceil(total / 20000) * 20000,
      Math.ceil(total / 50000) * 50000,
      Math.ceil(total / 100000) * 100000,
      50000,
      100000
    ]
    return Array.from(new Set(list))
      .filter(v => v >= total)
      .sort((a, b) => a - b)
      .slice(0, 4)
  }

  const quickAmounts = generateQuickAmounts()

  const handleProcess = async () => {
    if (!isSufficient && method === "CASH") return
    setLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashierId: "mock-cashier-id",
          shiftId: "mock-shift-id",
          items: cart.items,
          paymentAmount: cashAmount,
          customerName: customerName.trim() || undefined,
          tableNumber: tableNumber.trim() || undefined,
          paymentMethod: method,
          orderType
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Gagal memproses transaksi")
      }
      
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 px-6 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Receipt className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-100">Penyelesaian Transaksi</h2>
              <p className="text-xs text-zinc-400">
                {orderType} • {cart.items.reduce((s, i) => s + i.quantity, 0)} Item Pesanan
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar">
          
          {/* Total Tagihan Card */}
          <div className="shrink-0 bg-gradient-to-b from-zinc-800 to-zinc-900/90 rounded-2xl py-4 px-5 border border-zinc-700/80 text-center relative overflow-hidden shadow-md">
            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
              Total yang Harus Dibayar
            </p>
            <p className="text-3xl font-black text-amber-400 tracking-tight font-mono">
              Rp {total.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Info Pelanggan & Meja */}
          <div className="shrink-0 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>Nama Pelanggan</span>
              </label>
              <input 
                type="text" 
                className="w-full px-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-100 text-xs placeholder:text-zinc-600 transition"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Sarah"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-zinc-500" />
                <span>Nomor Meja</span>
              </label>
              <input 
                type="text" 
                className="w-full px-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-100 text-xs placeholder:text-zinc-600 transition"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Contoh: 08"
              />
            </div>
          </div>

          {/* Metode Pembayaran Tabs */}
          <div className="shrink-0">
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2">Pilih Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod("CASH")}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                  method === "CASH"
                    ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm"
                    : "bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Tunai / Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("QRIS")}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                  method === "QRIS"
                    ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm"
                    : "bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>QRIS Instant</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("CARD")}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                  method === "CARD"
                    ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm"
                    : "bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Debit / EDC</span>
              </button>
            </div>
          </div>

          {/* Conditional Content based on Method */}
          {method === "CASH" && (
            <div className="shrink-0 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  Nominal Uang Tunai Diterima
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-500 text-sm">
                    Rp
                  </span>
                  <input 
                    type="text" 
                    autoFocus
                    className="w-full text-lg pl-12 pr-4 py-3 bg-zinc-950 text-right font-mono font-bold border-2 border-zinc-800 focus:border-amber-500 rounded-xl outline-none text-zinc-100 transition"
                    value={cash ? cashAmount.toLocaleString('id-ID') : ""}
                    onChange={(e) => setCash(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Quick Cash Chips */}
              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map(amount => (
                  <button 
                    key={amount}
                    type="button"
                    onClick={() => setCash(amount.toString())}
                    className="py-2.5 px-3 border border-zinc-800 rounded-xl text-zinc-300 font-semibold text-xs hover:border-amber-500/60 hover:text-amber-400 hover:bg-amber-500/5 transition bg-zinc-950/60 flex items-center justify-between"
                  >
                    <span className="text-[10px] text-zinc-500">
                      {amount === total ? "Uang Pas" : "Pecahan"}
                    </span>
                    <span className="font-mono">Rp {amount.toLocaleString('id-ID')}</span>
                  </button>
                ))}
              </div>

              {/* Status Kembalian */}
              {cashAmount > 0 && (
                <div className={`p-4 rounded-xl border transition ${
                  isSufficient 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' 
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-400'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 font-medium text-xs">
                      {isSufficient ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Kembalian untuk Pelanggan:</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Nominal Masih Kurang:</span>
                        </>
                      )}
                    </div>
                    <span className="text-xl font-bold font-mono">
                      Rp {Math.abs(change).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {method === "QRIS" && (
            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-center flex flex-col items-center gap-3">
              <div className="w-44 h-44 bg-white p-3 rounded-2xl flex flex-col items-center justify-center shadow-lg relative">
                {/* Simulated QR Code SVG representation */}
                <div className="w-full h-full bg-zinc-100 border border-zinc-300 rounded-lg p-2 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-zinc-950 rounded-sm p-1"><div className="w-full h-full bg-white p-1"><div className="w-full h-full bg-zinc-950" /></div></div>
                    <div className="w-8 h-8 bg-zinc-950 rounded-sm p-1"><div className="w-full h-full bg-white p-1"><div className="w-full h-full bg-zinc-950" /></div></div>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-[10px] font-black tracking-widest text-zinc-950">QRIS STANDAR</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-zinc-950 rounded-sm p-1"><div className="w-full h-full bg-white p-1"><div className="w-full h-full bg-zinc-950" /></div></div>
                    <div className="w-6 h-6 border-2 border-dashed border-zinc-950 rounded-sm" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">Tunjukkan QRIS ke Pelanggan</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Mendukung GoPay, OVO, Dana, BCA Mobile & Semua Bank</p>
              </div>
            </div>
          )}

          {method === "CARD" && (
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Nomor Referensi / Approval Code Mesin EDC (Opsional)
              </label>
              <input 
                type="text" 
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-100 text-xs placeholder:text-zinc-600 transition font-mono"
                value={cardRef}
                onChange={(e) => setCardRef(e.target.value)}
                placeholder="Contoh: REF-884920"
              />
              <p className="text-[11px] text-zinc-500">
                Lakukan tap atau swipe kartu debit/kredit pelanggan pada mesin EDC kasir.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold bg-rose-950/40 border border-rose-900/60 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 px-6 border-t border-zinc-800 bg-zinc-900/95 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 font-semibold text-xs transition"
          >
            Batal
          </button>
          <button 
            type="button"
            disabled={(!isSufficient && method === "CASH") || loading}
            onClick={handleProcess}
            className="flex-[2] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-950/30 disabled:shadow-none transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Transaksi...</span>
              </>
            ) : (
              <span>Selesaikan & Cetak Struk</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
