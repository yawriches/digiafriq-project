import { supabase } from './supabase/client'
import { Database } from './supabase/types'

type AffiliateProfile = Database['public']['Tables']['affiliate_profiles']['Row']
type Commission = Database['public']['Tables']['commissions']['Row']
type Payout = Database['public']['Tables']['payouts']['Row']

export interface CommissionWithDetails extends Commission {
  courses: {
    title: string
    thumbnail_url: string | null
  }
  payments: {
    user_id: string
    profiles: {
      full_name: string | null
      email: string
    }
  }
}

export interface PayoutWithCommissions extends Payout {
  payout_commissions: {
    commissions: CommissionWithDetails
  }[]
}

// Get affiliate profile
export async function getAffiliateProfile(): Promise<AffiliateProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('affiliate_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

// Create affiliate profile
export async function createAffiliateProfile(): Promise<AffiliateProfile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // First update user role to affiliate
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'affiliate' })
    .eq('id', user.id)

  if (profileError) throw profileError

  // The trigger will automatically create the affiliate profile
  // Wait a moment and then fetch it
  await new Promise(resolve => setTimeout(resolve, 1000))

  const { data, error } = await supabase
    .from('affiliate_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

// Update affiliate profile
export async function updateAffiliateProfile(updates: Partial<AffiliateProfile>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('affiliate_profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get affiliate statistics
export async function getAffiliateStats() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase.rpc('get_affiliate_stats', {
    affiliate_id_param: user.id
  })

  if (error) throw error
  return data
}

// Get affiliate commissions
export async function getAffiliateCommissions(): Promise<CommissionWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('commissions')
    .select(`
      *,
      courses (
        title,
        thumbnail_url
      ),
      payments (
        user_id,
        profiles (
          full_name,
          email
        )
      )
    `)
    .eq('affiliate_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as CommissionWithDetails[]
}

// Get affiliate payouts
export async function getAffiliatePayouts(): Promise<PayoutWithCommissions[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('payouts')
    .select(`
      *,
      payout_commissions (
        commissions (
          *,
          courses (
            title,
            thumbnail_url
          ),
          payments (
            user_id,
            profiles (
              full_name,
              email
            )
          )
        )
      )
    `)
    .eq('affiliate_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as PayoutWithCommissions[]
}

// Generate affiliate link
export function generateAffiliateLink(courseId: string, affiliateCode: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/courses/${courseId}?ref=${affiliateCode}`
}

// Extract affiliate code from URL
export function extractAffiliateCode(): string | null {
  if (typeof window === 'undefined') return null
  
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('ref')
}

// Store affiliate code in localStorage for attribution
export function storeAffiliateCode(code: string) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('affiliate_code', code)
  localStorage.setItem('affiliate_code_timestamp', Date.now().toString())
}

// Get stored affiliate code (valid for 30 days)
export function getStoredAffiliateCode(): string | null {
  if (typeof window === 'undefined') return null
  
  const code = localStorage.getItem('affiliate_code')
  const timestamp = localStorage.getItem('affiliate_code_timestamp')
  
  if (!code || !timestamp) return null
  
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
  const isExpired = Date.now() - parseInt(timestamp) > thirtyDaysInMs
  
  if (isExpired) {
    localStorage.removeItem('affiliate_code')
    localStorage.removeItem('affiliate_code_timestamp')
    return null
  }
  
  return code
}

// Request payout
export async function requestPayout(amount: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Get affiliate profile for bank details
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliate_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (affiliateError) throw affiliateError

  if (!affiliate.bank_name || !affiliate.account_number || !affiliate.account_name) {
    throw new Error('Please complete your bank details before requesting a payout')
  }

  // Create payout request
  const { data, error } = await supabase
    .from('payouts')
    .insert({
      affiliate_id: user.id,
      amount,
      bank_name: affiliate.bank_name,
      account_number: affiliate.account_number,
      account_name: affiliate.account_name,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get commission summary by period
export async function getCommissionSummary(period: 'week' | 'month' | 'year' = 'month') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  let dateFilter = ''
  switch (period) {
    case 'week':
      dateFilter = "created_at >= date_trunc('week', CURRENT_DATE)"
      break
    case 'month':
      dateFilter = "created_at >= date_trunc('month', CURRENT_DATE)"
      break
    case 'year':
      dateFilter = "created_at >= date_trunc('year', CURRENT_DATE)"
      break
  }

  const { data, error } = await supabase
    .from('commissions')
    .select('amount, status, created_at')
    .eq('affiliate_id', user.id)
    .gte('created_at', dateFilter)

  if (error) throw error

  const summary = {
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    count: data.length
  }

  data.forEach(commission => {
    summary.total += commission.amount
    switch (commission.status) {
      case 'pending':
        summary.pending += commission.amount
        break
      case 'approved':
        summary.approved += commission.amount
        break
      case 'paid':
        summary.paid += commission.amount
        break
    }
  })

  return summary
}

// Get top performing courses for affiliate
export async function getTopPerformingCourses(limit = 5) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('commissions')
    .select(`
      course_id,
      amount,
      courses (
        title,
        thumbnail_url,
        price
      )
    `)
    .eq('affiliate_id', user.id)
    .eq('status', 'approved')

  if (error) throw error

  // Group by course and calculate totals
  const courseMap = new Map()
  
  data.forEach(commission => {
    const courseId = commission.course_id
    if (courseMap.has(courseId)) {
      const existing = courseMap.get(courseId)
      existing.totalCommission += commission.amount
      existing.salesCount += 1
    } else {
      courseMap.set(courseId, {
        courseId,
        course: commission.courses,
        totalCommission: commission.amount,
        salesCount: 1
      })
    }
  })

  // Convert to array and sort by total commission
  const topCourses = Array.from(courseMap.values())
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, limit)

  return topCourses
}
