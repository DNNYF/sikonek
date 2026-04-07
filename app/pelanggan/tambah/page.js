'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TambahPelangganPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState([])
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp_number: '',
    address: '',
    rt_rw: '',
    package_id: '',
    pppoe_username: '',
    odp_name: '',
    billing_date: 5,
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  async function fetchPackages() {
    const { data } = await supabase
      .from('internet_packages')
      .select('id, package_name, price, speed_mbps')
      .order('price')
    setPackages(data || [])
    if (data && data.length > 0) {
      setFormData((prev) => ({ ...prev, package_id: data[0].id }))
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedPackage = packages.find((p) => p.id === formData.package_id)
      const now = new Date()
      const billingDateThisMonth = new Date(now.getFullYear(), now.getMonth(), Number(formData.billing_date))
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([{
          full_name: formData.full_name,
          whatsapp_number: formData.whatsapp_number,
          address: formData.address,
          rt_rw: formData.rt_rw,
          package_id: formData.package_id,
          pppoe_username: formData.pppoe_username || null,
          odp_name: formData.odp_name || null,
          billing_date: Number(formData.billing_date),
          is_active: true,
          joined_at: now.toISOString(),
        }])
        .select()
        .single()

      if (customerError) throw customerError

      await supabase.from('invoices').insert({
        customer_id: newCustomer.id,
        billing_period: startOfCurrentMonth,
        amount_due: selectedPackage?.price || 0,
        status: 'unpaid',
        due_date: billingDateThisMonth.toISOString().split('T')[0],
      })

      router.push('/pelanggan')
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Gagal menambah pelanggan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tambah Pelanggan</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="whatsapp_number"
              required
              placeholder="08xxx"
              value={formData.whatsapp_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <textarea
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RT/RW
            </label>
            <input
              type="text"
              name="rt_rw"
              placeholder="003/005"
              value={formData.rt_rw}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paket Internet <span className="text-red-500">*</span>
            </label>
            <select
              name="package_id"
              required
              value={formData.package_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.package_name} - {pkg.speed_mbps} Mbps
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PPPoE Username
              </label>
              <input
                type="text"
                name="pppoe_username"
                value={formData.pppoe_username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Opsional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ODP Name
              </label>
              <input
                type="text"
                name="odp_name"
                value={formData.odp_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Opsional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Tagihan
            </label>
            <input
              type="number"
              name="billing_date"
              min={1}
              max={28}
              value={formData.billing_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Tanggal 1-28 setiap bulan</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}