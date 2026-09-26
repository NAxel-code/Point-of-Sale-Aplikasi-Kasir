"use client"

import { useEffect, useState, useMemo } from "react"
import { useCartStore } from "@/store/useCartStore"
import CheckoutModal from "@/components/pos/CheckoutModal"
import { 
  Search, 
  X, 
  Calendar, 
  Clock, 
  Coffee, 
  Plus, 
  Minus, 
  Trash2, 
  UtensilsCrossed, 
  ShoppingBag, 
  Layers, 
  ArrowRight,
  User,
  Hash,
  AlertTriangle
} from "lucide-react"

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [orderType, setOrderType] = useState<"Dine In" | "Take Away">("Dine In")
  const [customerName, setCustomerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  const cart = useCartStore()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    const timer = setInterval(() => setCurrentTime(new Date()), 30000)
    return () => clearInterval(timer)
  }, [search])

  const fetchProducts = async () => {
    const res = await fetch(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      setProducts(data)
    }
  }

  const fetchCategories = async () => {
    const res = await fetch(`/api/categories`)
    const data = await res.json()
    if (Array.isArray(data)) {
      setCategories(data)
    }
  }

  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false)
    cart.clearCart()
    setCustomerName("")
    setTableNumber("")
    fetchProducts()
  }

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products
    return products.filter((p: any) => p.categoryId === activeCategory)
  }, [products, activeCategory])

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length }
    for (const p of products) {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1
      }
    }
    return counts
  }, [products])

  // Map of product in cart quantity
  const inCartQty = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of cart.items) {
      map[item.productId] = item.quantity
    }
    return map
  }, [cart.items])

  const formatRp = (val: number) => 'Rp ' + val.toLocaleString('id-ID')
  const totalItemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      {/* AREA UTAMA: HEADER, HORIZONTAL CATEGORIES & KATALOG PRODUK */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 px-6 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-5 text-xs text-zinc-400">
            <div className="flex items-center gap-2 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <span className="w-1 h-1 rounded-full bg-zinc-700" />

            <div className="flex items-center gap-2 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-zinc-200 font-mono">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-950/40 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-800/40 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Kasir Aktif</span>
            </div>
          </div>
        </header>

        {/* Filter Bar: Search & Horizontal Category Pills */}
        <div className="px-6 pt-4 pb-2 flex flex-col gap-3 shrink-0">
          
          {/* Search Input Bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Cari menu kopi, minuman, atau pastry favorit..." 
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs placeholder:text-zinc-500 text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 transition shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                type="button"
                onClick={() => setSearch("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Horizontal Category Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                activeCategory === "all"
                  ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-950/40 font-bold"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Menu</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeCategory === "all" ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
              }`}>
                {categoryCounts["all"] || 0}
              </span>
            </button>

            {categories.map((cat: any) => {
              const count = categoryCounts[cat.id] || 0
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                    isActive
                      ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-950/40 font-bold"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Product Catalog Grid Container */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-500 text-xs gap-2">
              <Coffee className="w-10 h-10 stroke-1 text-zinc-600 mb-1" />
              <p className="font-semibold text-zinc-400">Tidak ada menu yang sesuai</p>
              <p className="text-[11px] text-zinc-600">Coba ganti kata kunci pencarian atau pilih kategori lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 pb-8">
              {filteredProducts.map((product: any) => {
                const isOutOfStock = product.stock === 0
                const isLowStock = product.stock > 0 && product.stock <= 10
                const qty = inCartQty[product.id] || 0

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && cart.addItem(product)}
                    className={`group relative bg-zinc-900/90 rounded-2xl p-3 border transition-all duration-200 flex flex-col justify-between select-none ${
                      isOutOfStock 
                        ? 'border-zinc-800/50 opacity-50 grayscale cursor-not-allowed' 
                        : 'border-zinc-800 hover:border-amber-500/60 hover:bg-zinc-900 hover:shadow-lg hover:shadow-amber-950/20 cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      {/* Product Thumbnail with Overlay Badges */}
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-zinc-950 mb-2.5 flex items-center justify-center border border-zinc-800/60">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <Coffee className="w-8 h-8 text-zinc-700" />
                        )}

                        {/* In-Cart Counter Pill */}
                        {qty > 0 && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-zinc-950 font-black text-xs px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1">
                            <span>{qty}x</span>
                          </div>
                        )}

                        {/* Stock Warning Pill */}
                        {isLowStock && (
                          <div className="absolute bottom-2 left-2 bg-amber-950/80 border border-amber-600/50 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Sisa {product.stock}</span>
                          </div>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-rose-400 font-bold text-xs uppercase tracking-wider">
                            Stok Habis
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <h3 className="font-semibold text-zinc-100 text-xs leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="text-zinc-500 font-medium truncate max-w-[65%]">
                          {product.category?.name || 'Reguler'}
                        </span>
                        {!isLowStock && !isOutOfStock && (
                          <span className="text-zinc-500 font-mono">
                            Stok: {product.stock}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Action Button */}
                    <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="font-extrabold text-amber-400 text-xs font-mono">
                        {formatRp(product.price)}
                      </span>
                      <button 
                        type="button"
                        disabled={isOutOfStock}
                        className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-zinc-950 flex items-center justify-center font-bold text-xs transition duration-150 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* SISI KANAN: PANEL TIKET PESANAN / ORDER BILL */}
      <aside className="w-96 bg-zinc-950 border-l border-zinc-800/80 flex flex-col justify-between shrink-0 select-none z-10">
        
        {/* Header Tiket Order */}
        <div className="h-16 px-5 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-zinc-100 text-sm tracking-tight">Tiket Pesanan</h2>
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
              {totalItemsCount}
            </span>
          </div>

          {cart.items.length > 0 && (
            <button
              type="button"
              onClick={() => cart.clearCart()}
              className="text-[11px] font-semibold text-zinc-500 hover:text-rose-400 transition"
            >
              Reset
            </button>
          )}
        </div>

        {/* Order Options: Dine In / Take Away Switcher */}
        <div className="p-4 border-b border-zinc-800/70 bg-zinc-900/40 space-y-2.5 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setOrderType("Dine In")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                orderType === "Dine In"
                  ? "bg-amber-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Dine In (Meja)</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderType("Take Away")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                orderType === "Take Away"
                  ? "bg-amber-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Take Away</span>
            </button>
          </div>

          {/* Quick inputs for Table & Customer Name */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Pelanggan (opsional)"
                className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/80"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            {orderType === "Dine In" && (
              <div className="relative w-28">
                <Hash className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Meja"
                  className="w-full pl-7 pr-2 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/80 font-mono"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Daftar Item Tiket Pesanan */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center my-auto p-6">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-600 mb-3">
                <Coffee className="w-7 h-7" />
              </div>
              <p className="font-semibold text-zinc-300 text-xs">Pesanan Masih Kosong</p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">
                Sentuh atau klik menu di katalog untuk menambahkan pesanan ke tiket ini
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {cart.items.map(item => (
                <div 
                  key={item.productId} 
                  className="p-2.5 rounded-xl border border-zinc-800/90 bg-zinc-900/70 hover:border-zinc-700 transition group flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-zinc-800" 
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-800">
                          <Coffee className="w-4 h-4 text-zinc-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-100 text-xs truncate leading-snug">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {formatRp(item.price)}
                        </p>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => cart.removeItem(item.productId)} 
                      className="text-zinc-600 hover:text-rose-400 p-1 opacity-60 group-hover:opacity-100 transition"
                      title="Hapus menu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50">
                    <span className="font-bold text-amber-400 text-xs font-mono">
                      {formatRp(item.price * item.quantity)}
                    </span>

                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                      <button 
                        type="button"
                        onClick={() => {
                          if (item.quantity > 1) {
                            cart.updateQuantity(item.productId, item.quantity - 1)
                          } else {
                            cart.removeItem(item.productId)
                          }
                        }} 
                        className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="text-xs font-bold px-1.5 min-w-5 text-center text-zinc-200 font-mono">
                        {item.quantity}
                      </span>

                      <button 
                        type="button"
                        disabled={item.quantity >= item.stock}
                        onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)} 
                        className="w-5 h-5 rounded flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-zinc-800 disabled:text-zinc-700 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bill Summary & Bayar Button */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 space-y-3 shrink-0">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal ({totalItemsCount} item)</span>
              <span className="font-semibold text-zinc-200 font-mono">{formatRp(cart.subtotal())}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Pajak Restoran</span>
              <span className="font-medium text-zinc-500 font-mono">Termasuk</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center">
            <div>
              <span className="font-bold text-zinc-200 text-sm">Total Tagihan</span>
              <p className="text-[10px] text-zinc-500">Harga nett</p>
            </div>
            <span className="font-black text-amber-400 text-xl tracking-tight font-mono">
              {formatRp(cart.subtotal())}
            </span>
          </div>

          <button 
            type="button"
            disabled={cart.items.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition duration-200 ${
              cart.items.length === 0 
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40 cursor-pointer active:scale-[0.99]'
            }`}
          >
            <span>Bayar Sekarang</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </aside>

      {/* Checkout Modal Popup */}
      {isCheckoutOpen && (
        <CheckoutModal 
          onClose={() => setIsCheckoutOpen(false)} 
          onSuccess={handleCheckoutSuccess}
          defaultCustomerName={customerName}
          defaultTableNumber={tableNumber}
          orderType={orderType}
        />
      )}
    </>
  )
}
