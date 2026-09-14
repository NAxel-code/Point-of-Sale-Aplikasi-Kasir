"use client"
import { useEffect, useState } from "react"
import { useCartStore } from "@/store/useCartStore"
import { Search, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import CheckoutModal from "@/components/pos/CheckoutModal"

export default function POSPage() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const cart = useCartStore()

  useEffect(() => {
    fetchProducts()
  }, [search])

  const fetchProducts = async () => {
    const res = await fetch(`/api/products${search ? `?search=${search}` : ''}`)
    const data = await res.json()
    setProducts(data)
  }

  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false)
    cart.clearCart()
    fetchProducts() // Refresh stock
    alert("Transaksi Berhasil!")
  }

  return (
    <div className="flex h-full">
      {/* Kiri: Daftar Produk */}
      <div className="w-2/3 p-6 flex flex-col h-full">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari produk atau barcode..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 overflow-y-auto pb-6">
          {products.map((product: any) => (
            <div 
              key={product.id} 
              onClick={() => product.stock > 0 && cart.addItem(product)}
              className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <h3 className="font-semibold text-lg text-slate-800 line-clamp-2 min-h-[56px]">{product.name}</h3>
              <div className="mt-4 flex justify-between items-end">
                <span className="text-blue-600 font-bold">Rp {product.price.toLocaleString('id-ID')}</span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Stok: {product.stock}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanan: Keranjang */}
      <div className="w-1/3 bg-white border-l flex flex-col h-full shadow-lg">
        <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
          <ShoppingCart size={20} className="text-slate-700" />
          <h2 className="font-bold text-lg text-slate-800">Keranjang ({cart.items.length})</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p>Keranjang masih kosong</p>
            </div>
          ) : (
            cart.items.map(item => (
              <div key={item.productId} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-800 truncate pr-2">{item.name}</span>
                  <span className="text-slate-800">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Rp {item.price.toLocaleString('id-ID')} / item</span>
                  <div className="flex items-center gap-3 bg-white border rounded-md px-2 py-1">
                    <button onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)} className="text-slate-500 hover:text-blue-600"><Minus size={16}/></button>
                    <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                    <button onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)} className="text-slate-500 hover:text-blue-600"><Plus size={16}/></button>
                  </div>
                  <button onClick={() => cart.removeItem(item.productId)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t bg-white">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium text-slate-600">Total Pembayaran</span>
            <span className="text-2xl font-bold text-slate-800">Rp {cart.subtotal().toLocaleString('id-ID')}</span>
          </div>
          <button 
            disabled={cart.items.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-sm transition-colors text-lg"
          >
            BAYAR SEKARANG
          </button>
        </div>
      </div>
      
      {isCheckoutOpen && (
        <CheckoutModal 
          onClose={() => setIsCheckoutOpen(false)} 
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  )
}
