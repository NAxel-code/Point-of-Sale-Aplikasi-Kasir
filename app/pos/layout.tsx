import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'POS Kasir',
}

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Aplikasi Kasir POS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Kasir: Kasir Satu</span>
        </div>
      </header>
      <main className="h-[calc(100vh-60px)]">
        {children}
      </main>
    </div>
  )
}
