"use client"
import { useEffect, useState } from "react"
import { useCartStore } from "@/store/useCartStore"
import CheckoutModal from "@/components/pos/CheckoutModal"

export default function POSPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const cart = useCartStore()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [search])

  const fetchProducts = async () => {
    const res = await fetch(`/api/products${search ? `?search=${search}` : ''}`)
    const data = await res.json()
    setProducts(data)
  }

  const fetchCategories = async () => {
    const res = await fetch(`/api/categories`)
    const data = await res.json()
    setCategories(data)
  }

  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false)
    cart.clearCart()
    fetchProducts()
  }

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter((p: any) => p.categoryId === activeCategory)

  const formatRp = (val: number) => 'Rp ' + val.toLocaleString('id-ID')

  return (
    <>
      {/* 2. AREA TENGAH: FILTER KATEGORI & KATALOG PRODUK */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900">
        
        {/* Header Info Jam & Status */}
        <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6 text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="font-semibold text-slate-200">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-900/30 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-800/50 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Open Order</span>
          </div>
        </header>

        {/* Search Bar */}
        <div className="px-6 pt-5 pb-3">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Cari menu favorit pelanggan..." 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Kolom Kategori Samping & Grid Produk */}
        <div className="flex-1 overflow-hidden px-6 pb-5 flex gap-4">
          
          {/* Kategori Menu Samping (Vertical) */}
          <div className="w-32 flex flex-col gap-2.5 shrink-0 overflow-y-auto scrollbar-hide">
            
            <button 
              onClick={() => setActiveCategory('all')} 
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition ${activeCategory === 'all' ? 'border-blue-500 bg-slate-800 text-blue-400 shadow-sm border-2' : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-500'}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"></path>
                </svg>
              </div>
              <span className="text-[11px] font-bold leading-tight">Semua</span>
            </button>

            {categories.map((cat: any) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition ${activeCategory === cat.id ? 'border-blue-500 bg-slate-800 text-blue-400 shadow-sm border-2' : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-500'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  </svg>
                </div>
                <span className="text-[11px] font-medium leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Grid Produk Item */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 pb-6">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                  Menu tidak ditemukan.
                </div>
              ) : (
                filteredProducts.map((product: any) => (
                  <div 
                    key={product.id}
                    onClick={() => product.stock > 0 && cart.addItem(product)}
                    className={`bg-slate-800 rounded-2xl p-3 border border-slate-700 hover:border-blue-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group ${product.stock === 0 ? 'opacity-50 grayscale' : ''}`}
                  >
                    <div>
                      <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-900 mb-2.5 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        ) : (
                          <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-200 text-xs leading-snug group-hover:text-blue-400 transition line-clamp-2">{product.name}</h3>
                      
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="bg-slate-900 text-slate-400 font-medium px-1.5 py-0.5 rounded truncate max-w-[60%]">{product.category?.name || 'Umum'}</span>
                        <span className="text-slate-500">Stok: {product.stock}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                      <span className="font-extrabold text-slate-100 text-xs">{formatRp(product.price)}</span>
                      <button className="w-6 h-6 rounded-lg bg-blue-900/50 text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-bold text-xs transition">
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>

      {/* 3. PANEL PESANAN SAAT INI (SISI SAMPING KANAN) */}
      <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col justify-between shrink-0">
        
        {/* Header Keranjang */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-slate-200 text-sm">Pesanan Saat Ini</h2>
          <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-800">
            {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </div>

        {/* Daftar Item Keranjang */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col">
          
          {cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-900/20 border border-blue-900/50 flex items-center justify-center text-blue-500 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
              </div>
              <p className="font-semibold text-slate-300 text-xs">Keranjang masih kosong</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[180px]">Silakan pilih menu di samping</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {cart.items.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-2 rounded-xl border border-slate-700 bg-slate-800 hover:border-slate-600 transition group">
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    {item.imageUrl ? (
                       <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-bold text-slate-200 text-[11px] truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{formatRp(item.price)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => cart.removeItem(item.productId)} className="text-rose-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-1 py-0.5">
                      <button onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)} className="text-slate-400 hover:text-slate-200 font-bold px-1 text-xs">-</button>
                      <span className="text-xs font-semibold px-1 w-4 text-center text-slate-300">{item.quantity}</span>
                      <button onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)} className="text-blue-400 hover:text-blue-300 font-bold px-1 text-xs">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total & Tombol Proses Pesanan */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/50 space-y-3 shrink-0">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-300">{formatRp(cart.subtotal())}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pajak (0%)</span>
              <span className="font-semibold text-slate-300">Rp 0</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center">
            <span className="font-bold text-slate-200 text-sm">Total</span>
            <span className="font-extrabold text-blue-500 text-lg tracking-tight">{formatRp(cart.subtotal())}</span>
          </div>

          <button 
            disabled={cart.items.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition ${cart.items.length === 0 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            <span>PROSES PESANAN</span>
          </button>
        </div>
      </aside>

      {isCheckoutOpen && (
        <CheckoutModal 
          onClose={() => setIsCheckoutOpen(false)} 
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </>
  )
}
