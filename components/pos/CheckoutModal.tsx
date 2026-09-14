import { useState } from "react"
import { useCartStore } from "@/store/useCartStore"
import { X } from "lucide-react"

export default function CheckoutModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const cart = useCartStore()
  const total = cart.subtotal()
  const [cash, setCash] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
          paymentAmount: cashAmount
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg">Pembayaran Tunai</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">Total Tagihan</p>
            <p className="text-4xl font-black text-slate-800">Rp {total.toLocaleString('id-ID')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Uang Diterima</label>
            <input 
              type="text" 
              autoFocus
              className="w-full text-2xl p-3 text-right font-bold border-2 rounded-xl focus:border-blue-500 focus:ring-0 outline-none"
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
                className="py-2 border rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Rp {amount.toLocaleString('id-ID')}
              </button>
            ))}
          </div>

          {cashAmount > 0 && (
            <div className={`p-4 rounded-xl border ${isSufficient ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <div className="flex justify-between items-center font-bold">
                <span>{isSufficient ? 'Kembalian:' : 'Kurang:'}</span>
                <span className="text-xl">Rp {Math.abs(change).toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
        </div>

        <div className="p-4 border-t bg-slate-50">
          <button 
            disabled={!isSufficient || loading}
            onClick={handleProcess}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-sm transition-colors text-lg"
          >
            {loading ? "MEMPROSES..." : "SELESAIKAN TRANSAKSI"}
          </button>
        </div>
      </div>
    </div>
  )
}
