"use client"
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestMembershipsPage() {
  const [memberships, setMemberships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMemberships()
  }, [])

  const fetchMemberships = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching memberships...')
      const { data, error } = await supabase
        .from('membership_packages')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Query result:', { data, error })
      
      if (error) {
        setError(error.message)
        return
      }

      setMemberships(data || [])
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Memberships</h1>
      <p className="mb-4">Found {memberships.length} membership packages:</p>
      
      {memberships.length === 0 ? (
        <p className="text-gray-500">No memberships found. You may need to create some first.</p>
      ) : (
        <div className="space-y-4">
          {memberships.map((membership) => (
            <div key={membership.id} className="border p-4 rounded">
              <h3 className="font-semibold">{membership.name}</h3>
              <p>ID: {membership.id}</p>
              <p>Type: {membership.member_type}</p>
              <p>Price: {membership.price} {membership.currency}</p>
              <p>Active: {membership.is_active ? 'Yes' : 'No'}</p>
              <a 
                href={`/dashboard/admin/memberships/${membership.id}`}
                className="text-blue-600 hover:underline"
              >
                View Details
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
