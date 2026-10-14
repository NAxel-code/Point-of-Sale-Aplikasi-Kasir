"use client"

import { useEffect, useState, useMemo } from "react"
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Layers, 
  Coffee, 
  Loader2, 
  X, 
  ShieldAlert, 
  Lock, 
  ArrowLeft,
  ArrowUpRight,
  TrendingUp,
  Tag
} from "lucide-react"
import Link from "next/link"

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  sku: string | null
  name: string
  price: number
  stock: number
  isActive: boolean
  imageUrl: string | null
  categoryId: string | null
  category?: Category | null
  createdAt: string
  updatedAt: string
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [userName, setUserName] = useState("")
  
  // Filter & Search states
  const [search, setSearch] = useState("")
  const [filterTab, setFilterTab] = useState<"ALL" | "LOW_STOCK" | "OUT_OF_STOCK" | string>("ALL")

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [restockProduct, setRestockProduct] = useState<{ id: string; name: string; currentStock: number } | null>(null)
  const [restockQty, setRestockQty] = useState<string>("10")

  // Form states
  const [formName, setFormName] = useState("")
  const [formSku, setFormSku] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formStock, setFormStock] = useState("")
  const [formCategoryId, setFormCategoryId] = useState("")
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  const checkAuthAndLoad = async () => {
    try {
      const authRes = await fetch("/api/auth/me")
      const authData = await authRes.json()
      if (authData.authenticated && authData.user.role === "ADMIN") {
        setIsAdmin(true)
        setUserName(authData.user.name)
        await Promise.all([loadProducts(), loadCategories()])
      } else {
        setIsAdmin(false)
        if (authData.authenticated) {
          setUserName(authData.user.name)
        }
      }
    } catch {
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products")
      if (res.ok) {
        const data = await res.json()
        setProducts(Array.isArray(data) ? data : [])
      }
    } catch {
      // ignore
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch {
      // ignore
    }
  }

  // Quick Restock handler
  const handleQuickRestock = async (productId: string, quantity: number) => {
    try {
      const res = await fetch("/api/products/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          reason: `Restok Cepat Admin (+${quantity})`,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, stock: p.stock + quantity } : p))
        )
      } else {
        alert(data.error || "Gagal melakukan restok")
      }
    } catch {
      alert("Terjadi kesalahan jaringan saat restok")
    }
  }

  // Custom Restock Modal Submit
  const handleCustomRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restockProduct) return
    const qty = parseInt(restockQty)
    if (isNaN(qty) || qty <= 0) {
      alert("Jumlah restok harus lebih dari 0")
      return
    }

    setFormSubmitting(true)
    try {
      const res = await fetch("/api/products/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: restockProduct.id,
          quantity: qty,
          reason: `Restok Manual Admin (+${qty})`,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p.id === restockProduct.id ? { ...p, stock: p.stock + qty } : p))
        )
        setRestockProduct(null)
      } else {
        alert(data.error || "Gagal melakukan restok")
      }
    } catch {
      alert("Terjadi kesalahan jaringan saat restok")
    } finally {
      setFormSubmitting(false)
    }
  }

  // Toggle IsActive
  const handleToggleActive = async (product: Product) => {
    const newStatus = !product.isActive
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          isActive: newStatus,
        }),
      })

      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p.id === product.id ? { ...p, isActive: newStatus } : p))
        )
      } else {
        alert("Gagal mengubah status aktif menu.")
      }
    } catch {
      alert("Terjadi kesalahan jaringan.")
    }
  }

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p)
    setFormName(p.name)
    setFormSku(p.sku || "")
    setFormPrice(p.price.toString())
    setFormStock(p.stock.toString())
    setFormCategoryId(p.categoryId || "")
    setFormError("")
  }

  // Open Add Modal
  const openAddModal = () => {
    setEditingProduct(null)
    setFormName("")
    setFormSku("")
    setFormPrice("")
    setFormStock("20")
    setFormCategoryId(categories[0]?.id || "")
    setFormError("")
    setIsAddModalOpen(true)
  }

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!formName.trim() || !formPrice) {
      setFormError("Nama menu dan harga wajib diisi.")
      return
    }

    const priceNum = parseFloat(formPrice.replace(/\D/g, ''))
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError("Harga harus berupa nominal angka valid.")
      return
    }

    setFormSubmitting(true)

    try {
      if (editingProduct) {
        // UPDATE via PATCH
        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            name: formName.trim(),
            sku: formSku.trim() || null,
            price: priceNum,
            categoryId: formCategoryId || null,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          setProducts(prev => prev.map(p => (p.id === editingProduct.id ? data : p)))
          setEditingProduct(null)
        } else {
          setFormError(data.error || "Gagal memperbarui produk")
        }
      } else {
        // CREATE via POST
        const stockNum = parseInt(formStock) || 0
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            sku: formSku.trim() || null,
            price: priceNum,
            stock: stockNum,
            categoryId: formCategoryId || null,
            isActive: true,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          await loadProducts()
          setIsAddModalOpen(false)
        } else {
          setFormError(data.error || "Gagal menambahkan produk baru")
        }
      }
    } catch {
      setFormError("Terjadi gangguan jaringan.")
    } finally {
      setFormSubmitting(false)
    }
  }

  const formatRp = (val: number) => "Rp " + val.toLocaleString("id-ID")

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search filter
      const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))

      if (!matchesSearch) return false

      // Tab filter
      if (filterTab === "ALL") return true
      if (filterTab === "LOW_STOCK") return p.stock > 0 && p.stock <= 5
      if (filterTab === "OUT_OF_STOCK") return p.stock === 0
      return p.categoryId === filterTab
    })
  }, [products, search, filterTab])

  // Metrics
  const totalProducts = products.length
  const activeProductsCount = products.filter(p => p.isActive).length
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length
  const outOfStockCount = products.filter(p => p.stock === 0).length

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 bg-zinc-950 p-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-950/30">
          <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/60 border border-rose-800/50 text-rose-400 mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>403 Forbidden - Khusus Administrator</span>
        </div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight max-w-md">
          Akses Katalog Produk Dibatasi
        </h1>
        <p className="text-zinc-400 text-xs mt-2 max-w-md leading-relaxed">
          Manajemen menu, penambahan produk, dan restok gudang hanya dapat diakses oleh akun dengan peran Administrator.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Kasir POS</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition"
          >
            <span>Login sebagai Admin</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-y-auto p-6 md:p-8">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Katalog Produk & Inventaris</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Admin Portal
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Kelola daftar menu kopi, penetapan harga, status aktif, dan restok cepat inventaris.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-950/40 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Menu</p>
            <p className="text-xl font-black text-zinc-100 font-mono mt-0.5">{totalProducts}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 text-zinc-300 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Menu Aktif Jual</p>
            <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">{activeProductsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setFilterTab("LOW_STOCK")}
          className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition"
        >
          <div>
            <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Stok Menipis (≤ 5)</p>
            <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{lowStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setFilterTab("OUT_OF_STOCK")}
          className="bg-zinc-900/90 border border-zinc-800 hover:border-rose-500/60 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition"
        >
          <div>
            <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Stok Habis (0)</p>
            <p className="text-xl font-black text-rose-400 font-mono mt-0.5">{outOfStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-400 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        {/* Category & Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterTab === "ALL"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Semua ({products.length})
          </button>

          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterTab(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterTab === c.id
                  ? "bg-amber-500 text-zinc-950 font-bold"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {c.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setFilterTab("LOW_STOCK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
              filterTab === "LOW_STOCK"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-zinc-900 border border-zinc-800 text-amber-400 hover:border-amber-500/40"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Menipis ({lowStockCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("OUT_OF_STOCK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
              filterTab === "OUT_OF_STOCK"
                ? "bg-rose-500 text-white font-bold"
                : "bg-zinc-900 border border-zinc-800 text-rose-400 hover:border-rose-500/40"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Habis ({outOfStockCount})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Products Table Container */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">Menu / Produk</th>
              <th className="px-4 py-3.5">Kategori</th>
              <th className="px-4 py-3.5">Harga Jual</th>
              <th className="px-4 py-3.5">Status Stok</th>
              <th className="px-4 py-3.5 text-center">Status Jual</th>
              <th className="px-5 py-3.5 text-right">Aksi & Restok Cepat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredProducts.map(product => {
              const isOut = product.stock === 0
              const isLow = product.stock > 0 && product.stock <= 5

              return (
                <tr key={product.id} className="hover:bg-zinc-800/30 transition">
                  {/* Menu info */}
                  <td className="px-5 py-3 flex items-center gap-3">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-zinc-800" 
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-800 text-zinc-600">
                        <Coffee className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-zinc-100">{product.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{product.sku || "Tanpa SKU"}</p>
                    </div>
                  </td>

                  {/* Kategori */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 text-[10px] font-medium">
                      {product.category?.name || "Uncategorized"}
                    </span>
                  </td>

                  {/* Harga */}
                  <td className="px-4 py-3 font-mono font-bold text-amber-400">
                    {formatRp(product.price)}
                  </td>

                  {/* Status Stok */}
                  <td className="px-4 py-3">
                    {isOut ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60">
                        <XCircle className="w-3 h-3" />
                        Habis (0)
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-600/60">
                        <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
                        Menipis ({product.stock} pcs)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                        Tersedia ({product.stock} pcs)
                      </span>
                    )}
                  </td>

                  {/* Status Jual Toggle */}
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(product)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                        product.isActive
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900/60"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                      }`}
                      title="Klik untuk mengubah status aktif"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                      <span>{product.isActive ? "Aktif" : "Nonaktif"}</span>
                    </button>
                  </td>

                  {/* Aksi & Quick Restock */}
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickRestock(product.id, 10)}
                        className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-400 border border-zinc-800 text-[10px] font-mono font-bold transition cursor-pointer"
                        title="Tambah stok 10 pcs"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickRestock(product.id, 50)}
                        className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-400 border border-zinc-800 text-[10px] font-mono font-bold transition cursor-pointer"
                        title="Tambah stok 50 pcs"
                      >
                        +50
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRestockProduct({ id: product.id, name: product.name, currentStock: product.stock })
                          setRestockQty("10")
                        }}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-medium transition cursor-pointer"
                        title="Restok kustom"
                      >
                        Restok...
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
                        title="Edit rincian menu"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-500">
                  <Package className="w-8 h-8 stroke-1 text-zinc-600 mx-auto mb-2" />
                  <p className="font-semibold text-zinc-400 text-xs">Tidak ada produk yang sesuai filter</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Tambah atau Edit Menu */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  {editingProduct ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-sm text-zinc-100">
                  {editingProduct ? "Edit Menu & Harga" : "Tambah Menu Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setEditingProduct(null)
                }}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Nama Menu / Produk *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Caramel Macchiato"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    SKU / Kode Menu
                  </label>
                  <input
                    type="text"
                    placeholder="KOP-011"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="25000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                      Stok Awal (pcs)
                    </label>
                    <input
                      type="number"
                      placeholder="20"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setEditingProduct(null)
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-[2] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-950/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {formSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{editingProduct ? "Simpan Perubahan" : "Tambah Menu"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Custom Restok Inventaris */}
      {restockProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-zinc-100">Restok Inventaris</h3>
                  <p className="text-[11px] text-zinc-400 font-medium truncate max-w-[200px]">
                    {restockProduct.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomRestock} className="space-y-3.5">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                <span className="text-zinc-400">Stok Saat Ini:</span>
                <span className="font-mono font-bold text-zinc-100">{restockProduct.currentStock} pcs</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Jumlah Tambahan Stok (pcs) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-1.5">
                {[10, 25, 50, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRestockQty(val.toString())}
                    className="flex-1 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono text-zinc-300 hover:text-amber-400 transition cursor-pointer"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-[2] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-950/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {formSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Konfirmasi Restok</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
