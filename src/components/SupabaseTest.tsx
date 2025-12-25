"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export const SupabaseTest = () => {
  const [status, setStatus] = useState('Testing...')
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        
        if (error) {
          setStatus(`Connection Error: ${error.message}`)
          setDetails(error)
        } else {
          setStatus('✅ Supabase Connected Successfully')
          setDetails({ profilesTable: 'accessible', data })
        }
      } catch (err: any) {
        setStatus(`Network Error: ${err.message}`)
        setDetails(err)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Supabase Connection Test</h3>
      <p className="mb-2">{status}</p>
      {details && (
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </div>
  )
}
