"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Coffee, 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  KeyRound, 
  UserCheck 
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault()
    
    const targetEmail = customEmail || email
    const targetPass = customPass || password

    if (!targetEmail || !targetPass) {
      setError("Email dan password wajib diisi.")
      return
    }

    setLoading(true)
    setError("")
    setInfo("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan autentikasi.")
      }

      setInfo(`Login berhasil! Selamat datang, ${data.user.name} (${data.user.role}).`)
      setTimeout(() => {
        router.push("/pos")
        router.refresh()
      }, 500)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat login.")
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: "ADMIN" | "CASHIER") => {
    if (role === "ADMIN") {
      setEmail("admin@pos.com")
      setPassword("admin123")
      handleLogin(undefined, "admin@pos.com", "admin123")
    } else {
      setEmail("kasir1@pos.com")
      setPassword("kasir123")
      handleLogin(undefined, "kasir1@pos.com", "kasir123")
    }
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 font-sans select-none antialiased relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 text-zinc-950 mb-4 shadow-xl shadow-amber-950/50 font-bold">
            <Coffee className="w-9 h-9 stroke-[2.2]" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black tracking-tight text-zinc-100">Mr.Coffee Terminal</h1>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Autentikasi Kasir & Sistem Keamanan RBAC POS
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          <div className="mb-6 flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100">Masuk Terminal</h2>
              <p className="text-xs text-zinc-500">Gunakan akun resmi kasir / manajer</p>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Error & Info Alerts */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{error}</div>
            </div>
          )}

          {info && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Email Pengguna
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="admin@pos.com atau kasir1@pos.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Sandi...</span>
                </>
              ) : (
                <span>Masuk ke Kasir POS</span>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center mb-3">
              Uji Coba Hak Akses RBAC (1-Click Login)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemo("ADMIN")}
                disabled={loading}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/60 hover:bg-zinc-800/60 transition text-left group"
              >
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs mb-0.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Role: ADMIN</span>
                </div>
                <p className="text-[10px] text-zinc-400">admin@pos.com</p>
                <p className="text-[9px] text-zinc-500 mt-1">Akses penuh + Laporan Finansial</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemo("CASHIER")}
                disabled={loading}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/60 hover:bg-zinc-800/60 transition text-left group"
              >
                <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs mb-0.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  <span>Role: CASHIER</span>
                </div>
                <p className="text-[10px] text-zinc-400">kasir1@pos.com</p>
                <p className="text-[9px] text-zinc-500 mt-1">Akses kasir saja, laporan dikunci</p>
              </button>
            </div>
          </div>

          {/* Security Features Badges */}
          <div className="mt-5 pt-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-center gap-2 text-[10px] text-zinc-500">
            <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">Bcrypt Salt 10</span>
            <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">HttpOnly & Secure</span>
            <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">Rate Limited 5x</span>
            <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">DB Lockout Tracking</span>
          </div>

        </div>
      </div>
    </div>
  )
}
