'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  HandCoins,
  MessageCircleWarning,
  FileBarChart,
  Router,
  LogOut,
} from 'lucide-react'

const navigation = [
  { name: 'Catat Pembayaran', href: '/pembayaran', icon: HandCoins, highlight: true },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pelanggan', href: '/pelanggan', icon: Users },
  { name: 'Tagihan', href: '/tagihan', icon: FileText },
  { name: 'Keluhan', href: '/keluhan', icon: MessageCircleWarning },
  { name: 'Laporan', href: '/laporan', icon: FileBarChart },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-full w-64 border-r border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(90%_60%_at_100%_100%,rgba(14,165,233,0.08),transparent_55%)]" />
      <div className="relative flex h-full flex-col">
        <div className="flex h-20 items-center border-b border-slate-200/70 px-5">
          <div className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-sky-400 shadow-lg shadow-blue-400/30 ring-1 ring-white/40">
              <Router className="h-5 w-5 text-white" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-900">WiFi RT/RW</h1>
              <p className="text-xs font-medium text-slate-500">Admin Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-6">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group relative flex items-center overflow-hidden rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-300',
                  item.highlight
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-400/35 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/45'
                    : isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-300/30'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-md hover:shadow-slate-200/70'
                )}
                style={{ animation: `slideIn 0.35s ease-out ${index * 0.05}s backwards` }}
              >
                <span
                  className={cn(
                    'mr-3 grid h-9 w-9 place-items-center rounded-xl transition-all duration-300',
                    item.highlight
                      ? 'bg-white/20 text-white'
                      : isActive
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-600'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <span>{item.name}</span>
                {!item.highlight && isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                )}
                {item.highlight && <span className="absolute right-2 h-12 w-12 rounded-full bg-white/15 blur-2xl" />}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-200/70 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center rounded-2xl px-3.5 py-3 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-rose-50 hover:text-rose-700"
          >
            <span className="mr-3 grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition-all duration-300 group-hover:bg-rose-100 group-hover:text-rose-700">
              <LogOut className="h-4.5 w-4.5" />
            </span>
            Keluar
          </button>
        </div>
      </div>
    </aside>
  )
}
