import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface Country {
  id: string
  name: string
  code: string | null
  is_active: boolean
  is_default: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// Helper to get auth headers
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`
  }
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (fetchError) throw fetchError

      setCountries(data || [])
    } catch (err: any) {
      console.error('Error fetching countries:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getDefaultCountry = () => {
    return countries.find(c => c.is_default)?.name || ''
  }

  return {
    countries,
    loading,
    error,
    getDefaultCountry,
    refetch: fetchCountries
  }
}

// Admin hook with full access
export function useAdminCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/countries')
      if (!response.ok) throw new Error('Failed to fetch countries')

      const { countries: data } = await response.json()
      setCountries(data || [])
    } catch (err: any) {
      console.error('Error fetching countries:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createCountry = async (country: Partial<Country>) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/countries', {
        method: 'POST',
        headers,
        body: JSON.stringify(country)
      })

      if (!response.ok) throw new Error('Failed to create country')

      await fetchCountries()
      return { success: true }
    } catch (err: any) {
      console.error('Error creating country:', err)
      return { success: false, error: err.message }
    }
  }

  const updateCountry = async (id: string, updates: Partial<Country>) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/countries', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, ...updates })
      })

      if (!response.ok) throw new Error('Failed to update country')

      await fetchCountries()
      return { success: true }
    } catch (err: any) {
      console.error('Error updating country:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteCountry = async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/admin/countries?id=${id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) throw new Error('Failed to delete country')

      await fetchCountries()
      return { success: true }
    } catch (err: any) {
      console.error('Error deleting country:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    countries,
    loading,
    error,
    createCountry,
    updateCountry,
    deleteCountry,
    refetch: fetchCountries
  }
}
