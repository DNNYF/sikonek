'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah, getMonthRange } from '@/lib/utils'
import { FileBarChart, TrendingUp, HandCoins, Download, CircleMinus } from 'lucide-react'

export default function LaporanPage() {
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState({
    totalTagihan: 0,
    totalTerbayar: 0,
    totalNunggak: 0,
    totalPengeluaran: 0,
    net: 0,
  })
  const [payments, setPayments] = useState([])
  const [expenses, setExpenses] = useState([])

  const fetchLaporan = useCallback(async () => {
    setLoading(true)
    try {
      const { start: startOfMonth, end: endOfMonth } = getMonthRange(selectedYear, selectedMonth)

      const { data: monthPayments } = await supabase
        .from('payments')
        .select(`
          *,
          customers (full_name),
          invoices (billing_period)
        `)
        .gte('paid_at', startOfMonth)
        .lte('paid_at', endOfMonth)
        .order('paid_at', { ascending: false })

      const { data: monthExpenses } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', startOfMonth)
        .lte('expense_date', endOfMonth)
        .order('expense_date', { ascending: false })

      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount_due, status')
        .gte('billing_period', startOfMonth)
        .lte('billing_period', endOfMonth)

      const totalTagihan = invoices?.reduce((sum, inv) => sum + (inv.amount_due || 0), 0) || 0
      const totalTerbayar = monthPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
      const totalPengeluaran = monthExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

      const unpaidInvoices = invoices?.filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue') || []
      const totalNunggak = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0)

      setSummary({
        totalTagihan,
        totalTerbayar,
        totalNunggak,
        totalPengeluaran,
        net: totalTerbayar - totalPengeluaran,
      })

      setPayments(monthPayments || [])
      setExpenses(monthExpenses || [])
    } catch (error) {
      console.error('Error fetching laporan:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchLaporan()
  }, [fetchLaporan])

  function exportCSV() {
    if (payments.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    const headers = ['No', 'Nama Pelanggan', 'Jumlah', 'Metode', 'Tanggal', 'Periode']
    const rows = payments.map((p, index) => [
      index + 1,
      p.customers?.full_name || '-',
      p.amount_paid,
      p.payment_method,
      new Date(p.paid_at).toISOString().split('T')[0],
      p.invoices?.billing_period ? new Date(p.invoices.billing_period).toISOString().split('T')[0] : '-',
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `laporan_pembayaran_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
        <p className="text-gray-500 mt-1">Rekap pembayaran dan pengeluaran bulanan</p>
      </div>

      <div className="flex gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white min-w-[180px]"
          >
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white min-w-[120px]"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Total Tagihan</p>
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileBarChart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatRupiah(summary.totalTagihan)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Total Terbayar</p>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatRupiah(summary.totalTerbayar)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Total Nunggak</p>
            <div className="p-2 bg-red-50 rounded-lg">
              <FileBarChart className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatRupiah(summary.totalNunggak)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Total Pengeluaran</p>
            <div className="p-2 bg-amber-50 rounded-lg">
              <CircleMinus className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatRupiah(summary.totalPengeluaran)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Net</p>
            <div className={`p-2 rounded-lg ${summary.net >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <TrendingUp className={`w-5 h-5 ${summary.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(summary.net)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pembayaran</h2>
              <p className="text-sm text-gray-500 mt-0.5">Riwayat pembayaran bulan ini</p>
            </div>
            <button
              onClick={exportCSV}
              disabled={payments.length === 0}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Metode</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                          <HandCoins className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">Tidak ada pembayaran</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payments.map((p, index) => (
                    <tr key={p.id} className="group table-row-modern" style={{ animation: `fadeIn 0.3s ease-out ${index * 0.03}s backwards` }}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">{p.customers?.full_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-emerald-600">{formatRupiah(p.amount_paid)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 capitalize">{p.payment_method?.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{new Date(p.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Pengeluaran</h2>
            <p className="text-sm text-gray-500 mt-0.5">Riwayat pengeluaran bulan ini</p>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                          <CircleMinus className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">Tidak ada pengeluaran</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((e, index) => (
                    <tr key={e.id} className="group table-row-modern" style={{ animation: `fadeIn 0.3s ease-out ${index * 0.03}s backwards` }}>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 capitalize">{e.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 max-w-xs truncate block">{e.description || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-amber-600">{formatRupiah(e.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{new Date(e.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}