import type { Metadata } from 'next'
import Sidebar from '@/components/pos/Sidebar'

export const metadata: Metadata = {
  title: 'Mr.Coffee POS - Point of Sale Terminal',
}

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex overflow-hidden font-sans select-none antialiased">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden min-w-0 bg-zinc-900/40">
        {children}
      </div>
    </div>
  )
}
