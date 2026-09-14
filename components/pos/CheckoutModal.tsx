import { useState } from "react"
import { useCartStore } from "@/store/useCartStore"
import { X } from "lucide-react"

export default function CheckoutModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const cart = useCartStore()
  const total = cart.subtotal()
  const [cash, setCash] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")

  const cashAmount = parseInt(cash.replace(/\D/g, '')) || 0
  const change = cashAmount - total
  const isSufficient = cashAmount >= total

  const quickAmounts = [
    total,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
    100000,
    50000
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total).sort((a, b) => a - b).slice(0, 4)

  const handleProcess = async () => {
    if (!isSufficient) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashierId: "mock-cashier-id", // Hardcoded for MVP UI testing
          shiftId: "mock-shift-id",
          items: cart.items,
          paymentAmount: cashAmount,
          customerName,
          tableNumber
        })
      })
      
      if (!res.ok) throw new Error("Gagal memproses transaksi")
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <h2 className="font-bold text-lg text-slate-100">Proses Pesanan</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          <div className="text-center bg-slate-900/50 rounded-2xl py-4 border border-slate-700/50">
            <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Total Tagihan</p>
            <p className="text-3xl font-black text-blue-400">Rp {total.toLocaleString('id-ID')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Nama Pelanggan (Opsional)</label>
              <input 
                type="text" 
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Mis: Budi"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Nomor Meja (Opsional)</label>
              <input 
                type="text" 
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Mis: 12"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Uang Tunai Diterima</label>
            <input 
              type="text" 
              autoFocus
              className="w-full text-xl p-3 bg-slate-900 text-right font-bold border-2 border-slate-700 rounded-xl focus:border-blue-500 focus:ring-0 outline-none text-slate-100"
              value={cash ? `Rp ${cashAmount.toLocaleString('id-ID')}` : ""}
              onChange={(e) => setCash(e.target.value)}
              placeholder="Rp 0"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {quickAmounts.map(amount => (
              <button 
                key={amount}
                onClick={() => setCash(amount.toString())}
                className="py-2.5 border border-slate-700 rounded-xl text-slate-300 font-semibold text-sm hover:bg-slate-700 hover:text-white transition-colors bg-slate-900/50"
              >
                Rp {amount.toLocaleString('id-ID')}
              </button>
            ))}
          </div>

          {cashAmount > 0 && (
            <div className={`p-4 rounded-xl border ${isSufficient ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-900/20 border-rose-500/30 text-rose-400'}`}>
              <div className="flex justify-between items-center font-bold">
                <span>{isSufficient ? 'Kembalian:' : 'Kurang:'}</span>
                <span className="text-xl">Rp {Math.abs(change).toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {error && <p className="text-rose-500 text-xs text-center font-bold bg-rose-900/20 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="p-5 border-t border-slate-700 bg-slate-800">
          <button 
            disabled={!isSufficient || loading}
            onClick={handleProcess}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:shadow-none transition-all text-sm tracking-wide uppercase"
          >
            {loading ? "MEMPROSES..." : "SELESAIKAN TRANSAKSI"}
          </button>
        </div>
      </div>
    </div>
  )
}
