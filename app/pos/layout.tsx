import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mr.Coffee POS',
}

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-950 text-slate-100 p-2 md:p-5 min-h-screen flex flex-col items-center justify-center select-none font-sans">
      {/* Tablet Bezel Frame */}
      <div className="w-full max-w-[1380px] bg-black p-3 md:p-4 rounded-[2.5rem] shadow-2xl border-[6px] border-slate-900 ring-1 ring-slate-800/50">
        
        {/* Screen Container */}
        <div className="bg-slate-900 w-full rounded-[1.8rem] overflow-hidden flex h-[760px]">

          {/* 1. SIDEBAR NAVBAR (SISI SAMPING KIRI) */}
          <aside className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
            
            {/* Bagian Atas: Logo & Menu Utama */}
            <div className="flex flex-col gap-6">
              
              {/* Logo Mr.Coffee */}
              <div className="flex items-center gap-3 px-2 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                </div>
                <div>
                  <h1 className="font-extrabold text-slate-100 text-base leading-tight tracking-tight">Mr.Coffee</h1>
                  <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">POS Terminal</p>
                </div>
              </div>

              {/* Menu Navigasi Samping */}
              <nav className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">Navigasi Utama</span>
                
                {/* Kasir / POS */}
                <Link href="/pos" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-100 font-medium text-xs transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span>Kasir (POS)</span>
                </Link>

                <Link href="/pos/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-100 font-medium text-xs transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <span>Daftar Pesanan</span>
                </Link>

                <Link href="/pos/tables" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-100 font-medium text-xs transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  <span>Kelola Meja</span>
                </Link>

                <Link href="/pos/customers" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-100 font-medium text-xs transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <span>Pelanggan</span>
                </Link>

                <Link href="/pos/reports" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-100 font-medium text-xs transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                  <span>Laporan Kas</span>
                </Link>
              </nav>
            </div>

            {/* Bagian Bawah: Info Kasir & Kunci Terminal */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                  N
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 leading-tight">Nicholas</p>
                  <p className="text-[10px] text-emerald-500 font-semibold">Shift Pagi</p>
                </div>
              </div>
              <button className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 flex items-center justify-center transition" title="Kunci Terminal">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0110 0v4"></path>
                </svg>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
