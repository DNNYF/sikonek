'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatTanggal } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { Plus, MessageCircleWarning, CheckCircle } from 'lucide-react'

export default function KeluhanPage() {
  const [loading, setLoading] = useState(true)
  const [keluhan, setKeluhan] = useState([])
  const [customers, setCustomers] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: '',
    issue: '',
    source: 'whatsapp',
    handled_by: '',
  })

  useEffect(() => {
    fetchKeluhan()
    fetchCustomers()
  }, [])

  async function fetchKeluhan() {
    try {
      const { data } = await supabase
        .from('complaints')
        .select(`
          *,
          customers (full_name, whatsapp_number)
        `)
        .order('reported_at', { ascending: false })

      setKeluhan(data || [])
    } catch (error) {
      console.error('Error fetching complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCustomers() {
    const { data } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name')
    setCustomers(data || [])
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const updateData = { status: newStatus }
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      fetchKeluhan()
    } catch (error) {
      console.error('Error updating complaint status:', error)
      alert('Gagal mengubah status keluhan')
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const { error } = await supabase.from('complaints').insert({
        customer_id: parseInt(formData.customer_id),
        issue: formData.issue,
        source: formData.source,
        handled_by: formData.handled_by || null,
        status: 'open',
        reported_at: new Date().toISOString(),
      })

      if (error) throw error

      setShowModal(false)
      setFormData({ customer_id: '', issue: '', source: 'whatsapp', handled_by: '' })
      fetchKeluhan()
    } catch (error) {
      console.error('Error adding complaint:', error)
      alert('Gagal menambah keluhan')
    }
  }

  const filteredKeluhan = keluhan.filter((k) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'open') return k.status === 'open'
    if (filterStatus === 'in_progress') return k.status === 'in_progress'
    if (filterStatus === 'resolved') return k.status === 'resolved'
    return true
  })

  const stats = {
    total: keluhan.length,
    open: keluhan.filter(k => k.status === 'open').length,
    inProgress: keluhan.filter(k => k.status === 'in_progress').length,
    resolved: keluhan.filter(k => k.status === 'resolved').length,
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Keluhan Pelanggan</h1>
          <p className="text-gray-500 mt-1">Kelola dan tindak lanjuti keluhan pelanggan</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Keluhan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageCircleWarning className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <MessageCircleWarning className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Open</p>
              <p className="text-xl font-bold text-red-600">{stats.open}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <MessageCircleWarning className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-xl font-bold text-amber-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-xl font-bold text-emerald-600">{stats.resolved}</p>
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
          Semua ({stats.total})
        </button>
        <button
          onClick={() => setFilterStatus('open')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            filterStatus === 'open'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Open ({stats.open})
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            filterStatus === 'in_progress'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          In Progress ({stats.inProgress})
        </button>
        <button
          onClick={() => setFilterStatus('resolved')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            filterStatus === 'resolved'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Resolved ({stats.resolved})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
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
                  Sumber
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dilaporkan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ditangani Oleh
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredKeluhan.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-gray-50 rounded-full mb-3">
                        <MessageCircleWarning className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Tidak ada keluhan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredKeluhan.map((k, index) => (
                  <tr
                    key={k.id}
                    className="group table-row-modern"
                    style={{ animation: `fadeIn 0.3s ease-out ${index * 0.03}s backwards` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {k.customers?.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {k.customers?.full_name || '-'}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 font-mono">
                            {k.customers?.whatsapp_number || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 line-clamp-2 max-w-xs block">
                        {k.issue}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {k.source}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={k.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {formatTanggal(k.reported_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {k.handled_by || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={k.status}
                        onChange={(e) => handleStatusChange(k.id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 pt-4 pb-4 overflow-y-auto z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tambah Keluhan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pelanggan
                </label>
                <select
                  name="customer_id"
                  required
                  value={formData.customer_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Pilih Pelanggan</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keluhan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="issue"
                  required
                  rows={4}
                  value={formData.issue}
                  onChange={handleChange}
                  placeholder="Jelaskan keluhan pelanggan..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sumber
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['whatsapp', 'telepon', 'langsung'].map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, source }))}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                        formData.source === source
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {source.charAt(0).toUpperCase() + source.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ditangani Oleh
                </label>
                <input
                  type="text"
                  name="handled_by"
                  value={formData.handled_by}
                  onChange={handleChange}
                  placeholder="Nama penanggung jawab (opsional)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 transition-all duration-200 font-medium"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}