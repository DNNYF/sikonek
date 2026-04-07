'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'

export default function DetailPelangganPage() {
  const params = useParams()
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [complaints, setComplaints] = useState([])
  const [activeTab, setActiveTab] = useState('invoices')
  const [updating, setUpdating] = useState(false)

  const fetchCustomerData = useCallback(async () => {
    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select(`
          *,
          internet_packages (*)
        `)
        .eq('id', id)
        .single()

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`
          *,
          payments (*)
        `)
        .eq('customer_id', id)
        .order('billing_period', { ascending: false })

      const { data: complaintsData } = await supabase
        .from('complaints')
        .select('*')
        .eq('customer_id', id)
        .order('reported_at', { ascending: false })

      setCustomer(customerData)
      setInvoices(invoicesData || [])
      setComplaints(complaintsData || [])
    } catch (error) {
      console.error('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCustomerData()
  }, [fetchCustomerData])

  async function toggleActiveStatus() {
    if (!customer) return
    setUpdating(true)

    try {
      const newStatus = !customer.is_active
      const { error } = await supabase
        .from('customers')
        .update({ is_active: newStatus })
        .eq('id', id)

      if (error) throw error

      setCustomer((prev) => ({ ...prev, is_active: newStatus }))
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Gagal mengubah status pelanggan')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!customer) {
    return <div className="p-8 text-center text-gray-500">Pelanggan tidak ditemukan</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
        <p className="text-gray-500">{customer.whatsapp_number}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">Alamat</p>
            <p className="font-medium">{customer.address || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">RT/RW</p>
            <p className="font-medium">{customer.rt_rw || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Paket</p>
            <p className="font-medium">{customer.internet_packages?.package_name || '-'}</p>
            <p className="text-sm text-gray-500">
              {customer.internet_packages?.price ? formatRupiah(customer.internet_packages.price) : ''}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="mt-1">
              <StatusBadge status={customer.is_active ? 'active' : 'inactive'} />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={toggleActiveStatus}
            disabled={updating}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              customer.is_active ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50`}
          >
            {updating ? 'Memproses...' : customer.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Riwayat Invoice ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'complaints'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Riwayat Keluhan ({complaints.length})
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jatuh Tempo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Belum ada invoice
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => {
                    const payment = invoice.payments?.find((p) => p.invoice_id === invoice.id)
                    return (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(invoice.billing_period).toLocaleDateString('id-ID', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatRupiah(invoice.amount_due)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {payment ? `${formatRupiah(payment.amount_paid)} (${new Date(payment.paid_at).toLocaleDateString('id-ID')})` : '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keluhan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sumber</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dilaporkan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ditangani Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Belum ada keluhan
                    </td>
                  </tr>
                ) : (
                  complaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{complaint.issue}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{complaint.source}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={complaint.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatTanggal(complaint.reported_at)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{complaint.handled_by || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}