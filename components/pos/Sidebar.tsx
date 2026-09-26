"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Coffee, 
  Receipt, 
  LayoutGrid, 
  Users, 
  BarChart3, 
  Lock,
  Sparkles,
  CircleDot
} from "lucide-react"

const NAV_ITEMS = [
  {
    label: "Kasir (POS)",
    href: "/pos",
    icon: Coffee,
    exact: true
  },
  {
    label: "Daftar Pesanan",
    href: "/pos/orders",
    icon: Receipt,
  },
  {
    label: "Kelola Meja",
    href: "/pos/tables",
    icon: LayoutGrid,
  },
  {
    label: "Pelanggan",
    href: "/pos/customers",
    icon: Users,
  },
  {
    label: "Laporan Kas",
    href: "/pos/reports",
    icon: BarChart3,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between p-4 shrink-0 select-none z-20">
      {/* Top Branding & Navigation */}
      <div className="flex flex-col gap-6">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-950/40 shrink-0 font-bold">
            <Coffee className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-zinc-100 text-base tracking-tight truncate">Mr.Coffee</h1>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>
            <p className="text-[10px] text-amber-500/90 font-bold tracking-widest uppercase">Specialty POS</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Menu Operasional
          </div>

          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 group ${
                  active
                    ? "bg-amber-500/10 text-amber-400 font-semibold shadow-inner"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                )}
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    active ? "text-amber-400 stroke-[2.4]" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Cashier Card */}
      <div className="pt-3 border-t border-zinc-900 flex flex-col gap-2.5">
        <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
              NC
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">Nicholas C.</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] text-zinc-400 font-medium">Shift Pagi</span>
              </div>
            </div>
          </div>
          <button 
            type="button"
            className="w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 flex items-center justify-center transition"
            title="Kunci Layar Kasir"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
