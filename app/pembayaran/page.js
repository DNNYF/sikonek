'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PaymentForm } from '@/components/PaymentForm'
import { Search, HandCoins, CheckCircle } from 'lucide-react'

export default function PembayaranPage() {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadCustomers() {
      const { data } = await supabase
        .from('customers')
        .select('id, full_name, whatsapp_number')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('full_name')

      if (isMounted) {
        setCustomers(data || [])
      }
    }

    loadCustomers()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleCustomerSelect(customerId) {
    if (!customerId) {
      setSelectedCustomer(null)
      setInvoices([])
      setSelectedInvoice(null)
      return
    }

    setLoading(true)
    const customer = customers.find((c) => c.id === customerId)
    setSelectedCustomer(customer)

    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .in('status', ['unpaid', 'overdue'])
      .order('due_date')

    setInvoices(data || [])
    setSelectedInvoice(data && data.length > 0 ? data[0] : null)
    setLoading(false)
  }

  function handlePaymentSuccess() {
    setPaymentSuccess(true)
    setShowPaymentForm(false)
    setSelectedInvoice(null)

    setTimeout(() => {
      setPaymentSuccess(false)
      setSelectedCustomer(null)
      setInvoices([])
      setSearchTerm('')
    }, 4000)
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.whatsapp_number.includes(searchTerm)
  )

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Catat Pembayaran</h1>
        <p className="text-gray-500 mt-1">Catat pembayaran dari pelanggan dengan cepat</p>
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

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <HandCoins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Form Pembayaran</h2>
              <p className="text-sm text-gray-500">Cari pelanggan dan catat pembayaran</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cari Pelanggan</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Ketik nama atau nomor WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 input-modern"
                />
              </div>

              {searchTerm && (
                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl shadow-lg">
                  {filteredCustomers.length === 0 ? (
                    <p className="px-4 py-3 text-gray-500 text-sm">Pelanggan tidak ditemukan</p>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          handleCustomerSelect(customer.id)
                          setSearchTerm('')
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent border-b border-gray-100 last:border-0 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {customer.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{customer.full_name}</div>
                            <div className="text-sm text-gray-500 font-mono">{customer.whatsapp_number}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="pt-6 border-t border-gray-100">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {selectedCustomer.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pelanggan Terpilih</p>
                      <p className="font-bold text-gray-900">{selectedCustomer.full_name}</p>
                      <p className="text-sm text-gray-600 font-mono">{selectedCustomer.whatsapp_number}</p>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-6">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-100 border-t-blue-600"></div>
                    <p className="text-gray-500 mt-2">Memuat tagihan...</p>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="p-4 bg-emerald-50 rounded-full w-fit mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-gray-500 font-medium">Tidak ada tagihan belum bayar</p>
                    <p className="text-gray-400 text-sm mt-1">Semua invoice pelanggan ini sudah lunas</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Invoice</label>
                    <select
                      value={selectedInvoice?.id || ''}
                      onChange={(e) => {
                        const invoice = invoices.find((i) => i.id === e.target.value)
                        setSelectedInvoice(invoice)
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {invoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {new Date(invoice.billing_period).toLocaleDateString('id-ID', {
                            month: 'long',
                            year: 'numeric',
                          })}{' '}
                          - Jatuh tempo: {new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </option>
                      ))}
                    </select>

                    {selectedInvoice && (
                      <div className="mt-4">
                        <button
                          onClick={() => setShowPaymentForm(true)}
                          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 font-medium text-lg hover:scale-105"
                        >
                          Catat Pembayaran
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPaymentForm && selectedInvoice && (
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