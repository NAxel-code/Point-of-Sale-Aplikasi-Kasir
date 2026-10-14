"use client"

import { Download } from "lucide-react"

export default function ExportCsvButton({ transactions }: { transactions: any[] }) {
  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      alert("Tidak ada transaksi untuk diekspor.")
      return
    }

    const headers = [
      "No Struk",
      "Tanggal & Waktu",
      "Kasir",
      "Pelanggan",
      "Meja",
      "Metode Bayar",
      "Subtotal (Rp)",
      "Diskon (Rp)",
      "Grand Total (Rp)",
      "Status",
      "Daftar Item",
    ]

    const rows = transactions.map((t) => {
      const itemsList = t.items
        ? t.items.map((i: any) => `${i.productName} (${i.quantity}x)`).join("; ")
        : ""

      return [
        `"${t.receiptNumber}"`,
        `"${new Date(t.createdAt).toLocaleString("id-ID")}"`,
        `"${t.cashier?.name || "-"}"`,
        `"${t.customerName || "-"}"`,
        `"${t.tableNumber || "-"}"`,
        `"${t.paymentMethod}"`,
        t.subtotal,
        t.discount || 0,
        t.grandTotal,
        `"${t.status}"`,
        `"${itemsList}"`,
      ]
    })

    // Prepend UTF-8 BOM so Excel opens it with correct characters
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `laporan-penjualan-pos-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-amber-500/50 text-xs font-semibold transition cursor-pointer shadow-sm"
      title="Download Laporan Format CSV (Excel)"
    >
      <Download className="w-4 h-4 text-amber-500" />
      <span>Ekspor CSV</span>
    </button>
  )
}
