import { supabase } from './supabase/client'

export interface PaymentData {
  courseId: string
  affiliateCode?: string
}

export interface PaymentResponse {
  success: boolean
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
  error?: string
}

// Initialize payment with Paystack
export async function initializePayment(paymentData: PaymentData): Promise<PaymentResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('User not authenticated')
    }

    const response = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(paymentData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Payment initialization failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Payment initialization error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Verify payment status
export async function verifyPayment(reference: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('User not authenticated')
    }

    const response = await fetch(`/api/payments/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })

    if (!response.ok) {
      throw new Error('Payment verification failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Payment verification error:', error)
    throw error
  }
}

// Get user's payment history
export async function getPaymentHistory() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        courses (
          title,
          thumbnail_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching payment history:', error)
    throw error
  }
}

// Check if user has access to course
export async function hasAccessToCourse(courseId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false

    const { data, error } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking course access:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking course access:', error)
    return false
  }
}

// Paystack popup integration (for client-side)
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        callback: (response: any) => void
        onClose: () => void
      }) => {
        openIframe: () => void
      }
    }
  }
}

export function openPaystackPopup(options: {
  key: string
  email: string
  amount: number
  currency: string
  reference: string
  onSuccess: (response: any) => void
  onClose: () => void
}) {
  if (typeof window !== 'undefined' && window.PaystackPop) {
    const handler = window.PaystackPop.setup({
      key: options.key,
      email: options.email,
      amount: options.amount,
      currency: options.currency,
      ref: options.reference,
      callback: options.onSuccess,
      onClose: options.onClose
    })

    handler.openIframe()
  } else {
    console.error('Paystack script not loaded')
  }
}
