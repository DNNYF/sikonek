'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import { HandCoins, ReceiptText, UserCircle2 } from 'lucide-react'

export function PaymentForm({ invoice, customer, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount_paid: invoice?.amount_due || 0,
    payment_method: 'cash',
    received_by: 'Paman',
  })

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error: paymentError } = await supabase.from('payments').insert({
        invoice_id: invoice.id,
        customer_id: customer.id || invoice.customer_id,
        amount_paid: parseFloat(formData.amount_paid),
        payment_method: formData.payment_method,
        received_by: formData.received_by,
        paid_at: new Date().toISOString(),
      })

      if (paymentError) throw paymentError

      const { error: invoiceError } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoice.id)

      if (invoiceError) throw invoiceError

      onSuccess()
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Gagal mencatat pembayaran: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="surface-card rounded-2xl p-4">
        <div className="flex items-center gap-2 text-slate-700">
          <UserCircle2 className="h-4 w-4 text-blue-600" />
          <p className="text-xs font-semibold uppercase tracking-wide">Pelanggan</p>
        </div>
        <p className="mt-1.5 text-sm font-semibold text-slate-900">{customer?.full_name || '-'}</p>
      </div>

      <div className="surface-card rounded-2xl p-4">
        <div className="flex items-center gap-2 text-slate-700">
          <ReceiptText className="h-4 w-4 text-cyan-600" />
          <p className="text-xs font-semibold uppercase tracking-wide">Periode Invoice</p>
        </div>
        <p className="mt-1.5 text-sm font-semibold text-slate-900">
          {invoice?.billing_period
            ? new Date(invoice.billing_period).toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
              })
            : '-'}
        </p>
      </div>

      <div className="surface-card rounded-2xl p-4">
        <div className="flex items-center gap-2 text-slate-700">
          <HandCoins className="h-4 w-4 text-emerald-600" />
          <p className="text-xs font-semibold uppercase tracking-wide">Jumlah Tagihan</p>
        </div>
        <p className="mt-1.5 text-base font-bold text-slate-900">{formatRupiah(invoice?.amount_due || 0)}</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Jumlah Dibayar</label>
        <input
          type="number"
          name="amount_paid"
          value={formData.amount_paid}
          onChange={handleChange}
          className="input-modern w-full"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Metode Pembayaran</label>
        <select
          name="payment_method"
          value={formData.payment_method}
          onChange={handleChange}
          className="input-modern w-full"
        >
          <option value="cash">Cash/Tunai</option>
          <option value="transfer_bca">Transfer BCA</option>
          <option value="transfer_bri">Transfer BRI</option>
          <option value="transfer_dana">Transfer DANA</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Diterima Oleh</label>
        <input
          type="text"
          name="received_by"
          value={formData.received_by}
          onChange={handleChange}
          className="input-modern w-full"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-400/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
        >
          Batal
        </button>
      </div>
    </form>
  )
}