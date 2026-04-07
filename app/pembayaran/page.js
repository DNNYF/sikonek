'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PaymentForm } from '@/components/PaymentForm'
import { StatusBadge } from '@/components/StatusBadge'
import { Search, HandCoins, CheckCircle } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

export default function PembayaranPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [customerRows, setCustomerRows] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  function getErrorMessage(error) {
    if (!error) return 'Unknown error'
    if (typeof error === 'string') return error

    const message = error.message || 'Error tanpa pesan'
    const details = error.details ? ` | details: ${error.details}` : ''
    const hint = error.hint ? ` | hint: ${error.hint}` : ''
    const code = error.code ? ` | code: ${error.code}` : ''

    return `${message}${details}${hint}${code}`
  }

  const fetchPembayaranData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, full_name, whatsapp_number')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('full_name')

      if (customersError) throw customersError

      const customerIds = (customersData || []).map((customer) => customer.id)
      let invoicesData = []

      if (customerIds.length > 0) {
        const chunkSize = 100
        const invoiceChunks = []

        for (let index = 0; index < customerIds.length; index += chunkSize) {
          const chunkIds = customerIds.slice(index, index + chunkSize)

          const { data: invoicesResult, error: invoicesError } = await supabase
            .from('invoices')
            .select('id, customer_id, billing_period, amount_due, status, due_date')
            .in('customer_id', chunkIds)
            .in('status', ['unpaid', 'overdue', 'paid'])
            .order('due_date', { ascending: true })

          if (invoicesError) throw invoicesError

          invoiceChunks.push(...(invoicesResult || []))
        }

        invoicesData = invoiceChunks
      }

      const invoicesByCustomer = invoicesData.reduce((acc, invoice) => {
        if (!acc[invoice.customer_id]) {
          acc[invoice.customer_id] = []
        }
        acc[invoice.customer_id].push(invoice)
        return acc
      }, {})

      const rows = (customersData || []).map((customer) => {
        const customerInvoices = invoicesByCustomer[customer.id] || []
        const pendingInvoices = customerInvoices.filter((invoice) => invoice.status === 'unpaid' || invoice.status === 'overdue')
        const paidInvoices = customerInvoices.filter((invoice) => invoice.status === 'paid')

        return {
          ...customer,
          whatsapp_number: customer.whatsapp_number || '',
          pendingCount: pendingInvoices.length,
          pendingAmount: pendingInvoices.reduce((sum, invoice) => sum + (invoice.amount_due || 0), 0),
          nextInvoice: pendingInvoices[0] || null,
          hasPaidHistory: paidInvoices.length > 0,
        }
      })

      setCustomerRows(rows)
    } catch (fetchError) {
      console.error('Error fetching pembayaran data:', fetchError)
      setError(`Gagal memuat data pembayaran: ${getErrorMessage(fetchError)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPembayaranData()
  }, [fetchPembayaranData])

  function handleOpenPayment(row) {
    if (!row.nextInvoice) return
    setSelectedCustomer(row)
    setSelectedInvoice(row.nextInvoice)
    setShowPaymentForm(true)
  }

  async function handlePaymentSuccess() {
    setPaymentSuccess(true)
    setShowPaymentForm(false)
    setSelectedCustomer(null)
    setSelectedInvoice(null)
    await fetchPembayaranData()

    setTimeout(() => {
      setPaymentSuccess(false)
    }, 4000)
  }

  const filteredRows = customerRows.filter((row) => {
    const normalizedName = (row.full_name || '').toLowerCase()
    const normalizedWa = row.whatsapp_number || ''
    const matchesSearch = normalizedName.includes(searchTerm.toLowerCase()) || normalizedWa.includes(searchTerm)

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unpaid' && row.pendingCount > 0) ||
      (filterStatus === 'paid' && row.pendingCount === 0 && row.hasPaidHistory)

    return matchesSearch && matchesStatus
  })

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
        <h1 className="text-3xl font-bold text-gray-900">Catat Pembayaran</h1>
        <p className="text-gray-500 mt-1">Pilih pelanggan dari tabel lalu catat pembayaran</p>
      </div>

      {paymentSuccess && (
        <div className="mb-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 text-center shadow-xl shadow-emerald-500/30 animate-slide-in">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Pembayaran Berhasil!</h3>
            <p className="text-emerald-100">Invoice telah ditandai sebagai lunas</p>
          </div>
        </div>
      )}

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
            <HandCoins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Daftar Pembayaran Pelanggan</h2>
            <p className="text-sm text-gray-500">Filter pelanggan yang sudah bayar dan belum bayar</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama atau nomor WA..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 input-modern"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                filterStatus === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus('unpaid')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                filterStatus === 'unpaid' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Belum Bayar
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                filterStatus === 'paid'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Sudah Bayar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pelanggan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No WA</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tagihan Aktif</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    Tidak ada data pelanggan
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="group table-row-modern"
                    style={{ animation: `fadeIn 0.3s ease-out ${index * 0.03}s backwards` }}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{row.full_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded-md">{row.whatsapp_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      {row.pendingCount > 0 ? (
                        <div>
                          <div className="text-sm font-semibold text-red-600">{row.pendingCount} invoice</div>
                          <div className="text-xs text-gray-500">{formatRupiah(row.pendingAmount)}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Tidak ada tunggakan</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.pendingCount > 0 ? (
                        <StatusBadge status="unpaid" />
                      ) : row.hasPaidHistory ? (
                        <StatusBadge status="paid" />
                      ) : (
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600">Belum Ada Tagihan</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenPayment(row)}
                        disabled={!row.nextInvoice}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Catat Pembayaran
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentForm && selectedInvoice && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Catat Pembayaran</h2>
            <PaymentForm
              invoice={selectedInvoice}
              customer={selectedCustomer}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}