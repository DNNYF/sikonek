'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah, hariTerlambat } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { PaymentForm } from '@/components/PaymentForm'
import { CheckCircle, FileText, Clock, HandCoins } from 'lucide-react'

export default function TagihanPage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    try {
      const { data } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (full_name, whatsapp_number, rt_rw)
        `)
        .in('status', ['unpaid', 'overdue', 'paid', 'waived'])
        .order('due_date')

      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleMarkPaid(invoice) {
    setSelectedInvoice(invoice)
    setShowPaymentModal(true)
  }

  function handlePaymentSuccess() {
    setShowPaymentModal(false)
    setSelectedInvoice(null)
    fetchInvoices()
  }

  const filteredInvoices = invoices.filter((invoice) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'unpaid') return invoice.status === 'unpaid'
    if (filterStatus === 'overdue') return invoice.status === 'overdue'
    if (filterStatus === 'paid') return invoice.status === 'paid'
    if (filterStatus === 'waived') return invoice.status === 'waived'
    return true
  })

  const stats = {
    total: invoices.length,
    unpaid: invoices.filter(i => i.status === 'unpaid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    paid: invoices.filter(i => i.status === 'paid').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Daftar Tagihan</h1>
        <p className="text-gray-500 mt-1">Kelola dan pantau semua tagihan pelanggan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unpaid</p>
              <p className="text-xl font-bold text-amber-600">{stats.unpaid}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <HandCoins className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-xl font-bold text-emerald-600">{stats.paid}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            filterStatus === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Semua ({invoices.length})
        </button>
        <button
          onClick={() => setFilterStatus('unpaid')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            filterStatus === 'unpaid'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Unpaid ({stats.unpaid})
        </button>
        <button
          onClick={() => setFilterStatus('overdue')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            filterStatus === 'overdue'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Overdue ({stats.overdue})
        </button>
        <button
          onClick={() => setFilterStatus('paid')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            filterStatus === 'paid'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Paid ({stats.paid})
        </button>
        <button
          onClick={() => setFilterStatus('waived')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            filterStatus === 'waived'
              ? 'bg-gray-600 text-white shadow-lg shadow-gray-500/30'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Waived
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nama Pelanggan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  RT/RW
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tagihan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jatuh Tempo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Keterlambatan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-gray-50 rounded-full mb-3">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Tidak ada tagihan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    className="group table-row-modern"
                    style={{ animation: `fadeIn 0.3s ease-out ${index * 0.03}s backwards` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {invoice.customers?.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {invoice.customers?.full_name || '-'}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {invoice.customers?.whatsapp_number || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {invoice.customers?.rt_rw || '-'}
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
                      {invoice.status === 'unpaid' || invoice.status === 'overdue' ? (
                        <span className={`text-sm font-medium ${hariTerlambat(invoice.due_date) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {hariTerlambat(invoice.due_date)} hari
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-6 py-4">
                      {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                        <button
                          onClick={() => handleMarkPaid(invoice)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-200 hover:scale-105"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Tandai Lunas
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tandai Lunas</h2>
            <PaymentForm
              invoice={selectedInvoice}
              customer={selectedInvoice.customers}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}