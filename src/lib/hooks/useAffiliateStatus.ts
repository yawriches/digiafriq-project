import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface AffiliateCourse {
  id: string
  title: string
  completed: boolean
  progress: number
}

interface AffiliateStatus {
  affiliate_unlocked: boolean
  affiliate_course: AffiliateCourse | null
  loading: boolean
  error: string | null
}

export const useAffiliateStatus = () => {
  const [status, setStatus] = useState<AffiliateStatus>({
    affiliate_unlocked: false,
    affiliate_course: null,
    loading: true,
    error: null
  })

  
  const checkStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }))

      const response = await fetch('/api/affiliate/unlock')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check affiliate status')
      }

      const data = await response.json()
      
      setStatus({
        affiliate_unlocked: data.affiliate_unlocked,
        affiliate_course: data.affiliate_course,
        loading: false,
        error: null
      })
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to check affiliate status'
      }))
    }
  }

  const unlockFeatures = async () => {
    try {
      const response = await fetch('/api/affiliate/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlock affiliate features')
      }

      // Update local status
      setStatus(prev => ({
        ...prev,
        affiliate_unlocked: true
      }))

      return { success: true, message: data.message }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to unlock affiliate features' 
      }
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return {
    ...status,
    checkStatus,
    unlockFeatures
  }
}
