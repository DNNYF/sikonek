'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah, getCurrentMonthRange } from '@/lib/utils'
import { StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import { Users, HandCoins, AlertCircle, FileText, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeCustomers: 0,
    unpaidInvoices: 0,
    monthlyRevenue: 0,
    openComplaints: 0,
  })
  const [unpaidInvoices, setUnpaidInvoices] = useState([])
  const [recentComplaints, setRecentComplaints] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const { start: startOfMonth } = getCurrentMonthRange()

      const { count: activeCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('deleted_at', null)

      const { data: unpaidData } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            full_name,
            rt_rw,
            internet_packages (package_name, price)
          )
        `)
        .in('status', ['unpaid', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(10)

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount_paid')
        .gte('paid_at', startOfMonth)

      const { count: openComplaints } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')

      const { data: complaintsData } = await supabase
        .from('complaints')
        .select(`
          *,
          customers (full_name, whatsapp_number)
        `)
        .eq('status', 'open')
        .order('reported_at', { ascending: false })
        .limit(5)

      const monthlyRevenue = paymentsData?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0

      setStats({
        activeCustomers: activeCustomers || 0,
        unpaidInvoices: unpaidData?.length || 0,
        monthlyRevenue,
        openComplaints: openComplaints || 0,
      })

      setUnpaidInvoices(unpaidData || [])
      setRecentComplaints(complaintsData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview bisnis WiFi RT/RW Anda</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Pelanggan Aktif"
          value={stats.activeCustomers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Belum Bayar"
          value={stats.unpaidInvoices}
          subtitle="Invoice unpaid/overdue"
          icon={FileText}
          color="yellow"
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value={formatRupiah(stats.monthlyRevenue)}
          icon={HandCoins}
          color="green"
        />
        <StatCard
          title="Keluhan Open"
          value={stats.openComplaints}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Unpaid Invoices Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Belum Bayar</h2>
              <p className="text-sm text-gray-500 mt-0.5">Invoice yang perlu ditindaklanjuti</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Paket
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tagihan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Jatuh Tempo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unpaidInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-green-50 rounded-full mb-3">
                          <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-gray-500 font-medium">Tidak ada invoice belum bayar</p>
                        <p className="text-gray-400 text-sm mt-1">Semua tagihan sudah lunas!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  unpaidInvoices.map((invoice, index) => (
                    <tr
                      key={invoice.id}
                      className="group table-row-modern"
                      style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s backwards` }}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {invoice.customers?.full_name || '-'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          RT/RW: {invoice.customers?.rt_rw || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {invoice.customers?.internet_packages?.package_name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatRupiah(invoice.amount_due)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Complaints Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Keluhan Terbaru</h2>
              <p className="text-sm text-gray-500 mt-0.5">Keluhan yang perlu ditangani</p>
            </div>
            <div className="p-2 bg-red-50 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Keluhan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Dilaporkan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentComplaints.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-green-50 rounded-full mb-3">
                          <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-gray-500 font-medium">Tidak ada keluhan open</p>
                        <p className="text-gray-400 text-sm mt-1">Semua keluhan sudah ditangani!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentComplaints.map((complaint, index) => (
                    <tr
                      key={complaint.id}
                      className="group table-row-modern"
                      style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s backwards` }}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                          {complaint.customers?.full_name || '-'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {complaint.customers?.whatsapp_number || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 line-clamp-2 max-w-xs block">
                          {complaint.issue}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={complaint.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(complaint.reported_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
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