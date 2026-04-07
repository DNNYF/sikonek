'use client'

import { cn } from '@/lib/utils'

const statusStyles = {
  unpaid: {
    bg: 'bg-amber-50/90',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  paid: {
    bg: 'bg-emerald-50/90',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  overdue: {
    bg: 'bg-rose-50/90',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  waived: {
    bg: 'bg-slate-100/90',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
  },
  open: {
    bg: 'bg-rose-50/90',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  in_progress: {
    bg: 'bg-amber-50/90',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  resolved: {
    bg: 'bg-emerald-50/90',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  active: {
    bg: 'bg-emerald-50/90',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  inactive: {
    bg: 'bg-slate-100/90',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
  },
}

const statusLabels = {
  unpaid: 'Belum Bayar',
  paid: 'Lunas',
  overdue: 'Terlambat',
  waived: 'Dihapus',
  open: 'Buka',
  in_progress: 'Diproses',
  resolved: 'Selesai',
  active: 'Aktif',
  inactive: 'Nonaktif',
}

export function StatusBadge({ status, className }) {
  const styles = statusStyles[status] || statusStyles.inactive
  const label = statusLabels[status] || status

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-all duration-200 hover:-translate-y-0.5',
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full animate-[pulseDot_1.4s_ease-in-out_infinite]', styles.dot)} />
      {label}
    </span>
  )
}