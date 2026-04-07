'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole, User, Wifi, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Login gagal')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Tidak dapat terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pl-0 md:pl-0">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-2xl shadow-blue-200/30 backdrop-blur-xl lg:grid-cols-2">
          <div className="relative hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-10 text-white lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_20%,rgba(255,255,255,0.2),transparent_55%),radial-gradient(70%_60%_at_100%_100%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30">
                  <Wifi className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight">WiFi RT/RW</p>
                  <p className="text-sm text-blue-100">Admin Console</p>
                </div>
              </div>

              <h1 className="text-3xl font-bold leading-tight">Sistem Manajemen Operasional</h1>
              <p className="mt-4 text-sm text-blue-100">
                Akses hanya untuk admin terdaftar. Seluruh aktivitas login diamankan dengan sesi HttpOnly.
              </p>

              <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Keamanan Aktif
                </div>
                <p className="mt-2 text-xs text-blue-100">
                  Password diverifikasi hash dan tidak disimpan di browser.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Login Admin</h2>
                <p className="mt-1 text-sm text-slate-500">Masuk untuk mengakses dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Username</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="username"
                      required
                      autoComplete="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="input-modern w-full pl-10"
                      placeholder="Masukkan username"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      required
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input-modern w-full pl-10"
                      placeholder="Masukkan password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-400/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}