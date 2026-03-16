"use client"
import React, { useState } from 'react'
import { useAdminCountries, Country } from '@/lib/hooks/useCountries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Loader2, CheckCircle, XCircle, Globe } from 'lucide-react'
import { toast } from 'sonner'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'

const CountriesPage = () => {
  const { countries, loading, createCountry, updateCountry, deleteCountry, refetch } = useAdminCountries()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCountry, setEditingCountry] = useState<Country | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_active: true,
    is_default: false,
    display_order: 0
  })
  const [submitting, setSubmitting] = useState(false)

  const handleOpenModal = (country?: Country) => {
    if (country) {
      setEditingCountry(country)
      setFormData({
        name: country.name,
        code: country.code || '',
        is_active: country.is_active,
        is_default: country.is_default,
        display_order: country.display_order
      })
    } else {
      setEditingCountry(null)
      setFormData({
        name: '',
        code: '',
        is_active: true,
        is_default: false,
        display_order: countries.length
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCountry(null)
    setFormData({
      name: '',
      code: '',
      is_active: true,
      is_default: false,
      display_order: 0
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let result
      if (editingCountry) {
        result = await updateCountry(editingCountry.id, formData)
      } else {
        result = await createCountry(formData)
      }

      if (result.success) {
        toast.success(editingCountry ? 'Country updated successfully' : 'Country created successfully')
        handleCloseModal()
        refetch()
      } else {
        toast.error(result.error || 'Failed to save country')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    const result = await deleteCountry(id)
    if (result.success) {
      toast.success('Country deleted successfully')
      refetch()
    } else {
      toast.error(result.error || 'Failed to delete country')
    }
  }

  const handleToggleActive = async (country: Country) => {
    const result = await updateCountry(country.id, { is_active: !country.is_active })
    if (result.success) {
      toast.success(`Country ${!country.is_active ? 'activated' : 'deactivated'}`)
      refetch()
    } else {
      toast.error(result.error || 'Failed to update country')
    }
  }

  const handleSetDefault = async (country: Country) => {
    const result = await updateCountry(country.id, { is_default: true })
    if (result.success) {
      toast.success(`${country.name} set as default country`)
      refetch()
    } else {
      toast.error(result.error || 'Failed to set default country')
    }
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Countries Management">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-[#ed874a]" />
          <span className="ml-2 text-sm text-gray-500">Loading countries...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title="Countries Management">
      <div className="max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Countries Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage countries displayed in signup form</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-[#ed874a] hover:bg-[#d76f32] text-xs h-9 rounded-lg"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Country
        </Button>
      </div>

      {/* Countries Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Country</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Default</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((country, index) => (
                <tr key={country.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-5 text-sm text-gray-600">{country.display_order}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{country.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-sm text-gray-600">{country.code || '-'}</td>
                  <td className="py-3 px-5">
                    <button
                      onClick={() => handleToggleActive(country)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        country.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {country.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {country.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-5">
                    {country.is_default ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ed874a]/10 text-[#ed874a]">
                        <CheckCircle className="w-3 h-3" />
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(country)}
                        className="text-xs text-gray-500 hover:text-[#ed874a] underline"
                      >
                        Set as default
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(country)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(country.id, country.name)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {countries.length === 0 && (
          <div className="text-center py-14">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No countries found</p>
            <p className="text-xs text-gray-500 mt-1">Add your first country to get started</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCountry ? 'Edit Country' : 'Add Country'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ghana"
                  required
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country Code
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., GH"
                  maxLength={2}
                  className="text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="text-sm"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#ed874a] rounded focus:ring-[#ed874a]"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4 text-[#ed874a] rounded focus:ring-[#ed874a]"
                  />
                  <span className="text-sm text-gray-700">Set as default</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1 text-sm h-9 rounded-lg"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#ed874a] hover:bg-[#d76f32] text-sm h-9 rounded-lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingCountry ? 'Update' : 'Create'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminDashboardLayout>
  )
}

export default CountriesPage
