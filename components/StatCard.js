'use client'

import { cn } from '@/lib/utils'

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: {
      ring: 'ring-blue-200/70',
      badge: 'bg-gradient-to-br from-blue-600 to-cyan-500',
      soft: 'from-blue-50 to-cyan-50',
      text: 'text-blue-700',
      glow: 'shadow-blue-400/35',
    },
    green: {
      ring: 'ring-emerald-200/70',
      badge: 'bg-gradient-to-br from-emerald-600 to-teal-500',
      soft: 'from-emerald-50 to-teal-50',
      text: 'text-emerald-700',
      glow: 'shadow-emerald-400/35',
    },
    red: {
      ring: 'ring-red-200/70',
      badge: 'bg-gradient-to-br from-red-600 to-rose-500',
      soft: 'from-red-50 to-rose-50',
      text: 'text-red-700',
      glow: 'shadow-red-400/35',
    },
    yellow: {
      ring: 'ring-amber-200/70',
      badge: 'bg-gradient-to-br from-amber-500 to-orange-500',
      soft: 'from-amber-50 to-orange-50',
      text: 'text-amber-700',
      glow: 'shadow-amber-400/35',
    },
    purple: {
      ring: 'ring-fuchsia-200/70',
      badge: 'bg-gradient-to-br from-fuchsia-600 to-indigo-500',
      soft: 'from-fuchsia-50 to-indigo-50',
      text: 'text-fuchsia-700',
      glow: 'shadow-fuchsia-400/35',
    },
    gray: {
      ring: 'ring-slate-200/70',
      badge: 'bg-gradient-to-br from-slate-600 to-slate-500',
      soft: 'from-slate-50 to-slate-100',
      text: 'text-slate-700',
      glow: 'shadow-slate-400/30',
    },
  }

  const colors = colorClasses[color] || colorClasses.blue

  return (
    <div className={cn('group relative overflow-hidden rounded-2xl ring-1 p-5 hover-lift', colors.ring, 'surface-card')}>
      <div className={cn('absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r opacity-90', colors.soft)} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && (
            <p className={cn('mt-2 inline-flex items-center gap-1.5 text-xs font-medium', colors.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full glow-badge', colors.badge)} />
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            'relative grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg transition-all duration-300 group-hover:scale-110',
            colors.badge,
            colors.glow
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="absolute -inset-2 rounded-2xl border border-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </div>
    </div>
  )
}