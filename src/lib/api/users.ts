import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { CURRENCY_RATES } from '@/contexts/CurrencyContext'
import type { 
  User, 
  UserStats, 
  PaginationParams, 
  FilterParams, 
  PaginatedResponse,
  UserActivity,
  UserPayment,
  UserWithdrawal,
  ReferralStats,
  AffiliateProfile
} from '@/types/user-management'

type Profile = Database['public']['Tables']['profiles']['Row']
type Payment = Database['public']['Tables']['payments']['Row']

export async function fetchUsers(
  pagination: PaginationParams,
  filters: FilterParams = {}
): Promise<PaginatedResponse<User>> {
  try {
    // Get session token for auth
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) throw new Error('No session')

    // Build query params
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
      sortBy: pagination.sortBy || 'created_at',
      sortOrder: pagination.sortOrder || 'desc',
    })
    if (filters.search) params.set('search', filters.search)
    if (filters.role && filters.role !== 'all') params.set('role', filters.role)
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)
    if (filters.country && filters.country !== 'all') params.set('country', filters.country)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    if (filters.affiliateStatus) params.set('affiliateStatus', filters.affiliateStatus)
    if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus)

    const response = await fetch(`/api/admin/users?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch users (${response.status})`)
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

export async function fetchUserStats(): Promise<UserStats> {
  try {
    // Get session token for auth
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) throw new Error('No session')

    const response = await fetch('/api/admin/dashboard-stats', {
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch user stats (${response.status})`)
    }

    const data = await response.json()
    const s = data.stats

    return {
      totalUsers: s.totalUsers || 0,
      activeUsers: s.activeUsers || 0,
      suspendedUsers: s.suspendedUsers || 0,
      pendingUsers: s.pendingUsers || 0,
      learnersCount: s.totalLearners || 0,
      affiliatesCount: s.affiliatesOnboarded || 0,
      adminsCount: 0,
      recentSignups: 0,
      totalRevenue: s.totalRevenue || 0,
      unpaidAccounts: s.unpaidAccounts || 0
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    throw error
  }
}

export async function fetchUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    // Enhance user data with referral and withdrawal stats for affiliates/admins
    if (data && ((data as any).role === 'affiliate' || (data as any).role === 'admin')) {
      const stats = await fetchReferralStats(userId)
      return {
        ...(data as any),
        referral_count: stats.total_referrals,
        total_withdrawals: stats.total_withdrawals,
        total_commissions: stats.total_commissions
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

export async function fetchReferralStats(userId: string): Promise<ReferralStats> {
  try {
    // First try to get data from affiliate_profiles table
    const { data: affiliateProfile, error: affiliateError } = await supabase
      .from('affiliate_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!affiliateError && affiliateProfile) {
      // Use data from affiliate_profiles table
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('amount_usd')
        .eq('user_id', userId)
        .eq('status', 'PAID')

      const totalWithdrawals = withdrawals?.reduce((sum: number, w: any) => sum + w.amount_usd, 0) || 0
      const profile = affiliateProfile as any

      return {
        total_referrals: profile.lifetime_referrals,
        active_referrals: profile.active_referrals,
        total_commissions: profile.total_earnings,
        total_withdrawals: totalWithdrawals,
        pending_commissions: profile.available_balance
      }
    }

    // Fallback to calculating from payments table
    const { data: referralPayments, error: referralError } = await supabase
      .from('payments')
      .select('amount, status, user_id')
      .eq('affiliate_id', userId)

    if (referralError) throw referralError

    // Get unique referrals
    const uniqueReferrals = new Set((referralPayments || []).map((p: any) => p.user_id))
    const completedPayments = (referralPayments || []).filter((p: any) => p.status === 'completed')
    
    // Calculate total commissions (assuming 10% commission rate)
    const totalCommissions = completedPayments.reduce((sum: number, payment: any) => sum + (payment.amount * 0.1), 0)

    // Get withdrawals from withdrawals table
    const { data: withdrawals, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select('amount_usd')
      .eq('user_id', userId)
      .eq('status', 'PAID')

    const totalWithdrawals = withdrawals?.reduce((sum: number, w: any) => sum + w.amount_usd, 0) || 0

    return {
      total_referrals: uniqueReferrals.size,
      active_referrals: uniqueReferrals.size, // For now, assume all are active
      total_commissions: totalCommissions,
      total_withdrawals: totalWithdrawals,
      pending_commissions: totalCommissions - totalWithdrawals
    }
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return {
      total_referrals: 0,
      active_referrals: 0,
      total_commissions: 0,
      total_withdrawals: 0,
      pending_commissions: 0
    }
  }
}

export async function fetchUserActivity(
  userId: string,
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<PaginatedResponse<UserActivity>> {
  try {
    const activities: UserActivity[] = []

    // Fetch payments (including referral payments)
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        *,
        profiles!payments_user_id_fkey(full_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (paymentsError) throw paymentsError

    // Add payment activities
    if (payments) {
      payments.forEach((payment: any) => {
        activities.push({
          id: payment.id,
          user_id: payment.user_id,
          action: `Payment ${payment.status}`,
          activity_type: 'payment',
          details: {
            amount: payment.amount,
            currency: payment.currency,
            reference: payment.paystack_reference,
            course_id: payment.course_id
          },
          amount: payment.amount,
          currency: payment.currency,
          ip_address: null,
          user_agent: null,
          created_at: payment.created_at
        })
      })
    }

    // Fetch referral payments (where this user is the affiliate)
    const { data: referralPayments, error: referralError } = await supabase
      .from('payments')
      .select(`
        *,
        profiles!payments_user_id_fkey(full_name)
      `)
      .eq('affiliate_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (referralError) throw referralError

    // Add referral activities
    if (referralPayments) {
      referralPayments.forEach((payment: any) => {
        const commissionAmount = payment.amount * 0.1 // Assuming 10% commission
        activities.push({
          id: `ref_${payment.id}`,
          user_id: userId,
          action: 'Referral Commission Earned',
          activity_type: 'commission',
          details: {
            original_amount: payment.amount,
            commission_rate: 0.1,
            payment_reference: payment.paystack_reference
          },
          amount: commissionAmount,
          currency: payment.currency,
          referral_user_id: payment.user_id,
          referral_user_name: payment.profiles?.full_name || 'Unknown User',
          ip_address: null,
          user_agent: null,
          created_at: payment.created_at
        })
      })
    }

    // Fetch withdrawals using the real withdrawals table structure
    const { data: withdrawals, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!withdrawalError && withdrawals) {
      withdrawals.forEach((withdrawal: any) => {
        const getWithdrawalAction = (status: string) => {
          switch (status) {
            case 'PENDING': return 'Withdrawal Requested'
            case 'APPROVED': return 'Withdrawal Approved'
            case 'REJECTED': return 'Withdrawal Rejected'
            case 'PROCESSING': return 'Withdrawal Processing'
            case 'PAID': return 'Withdrawal Completed'
            case 'FAILED': return 'Withdrawal Failed'
            default: return `Withdrawal ${status}`
          }
        }

        activities.push({
          id: `wd_${withdrawal.id}`,
          user_id: withdrawal.user_id,
          action: getWithdrawalAction(withdrawal.status),
          activity_type: 'withdrawal',
          details: {
            reference: withdrawal.reference,
            payout_channel: withdrawal.payout_channel,
            account_details: withdrawal.account_details,
            provider: withdrawal.provider,
            provider_reference: withdrawal.provider_reference,
            rejection_reason: withdrawal.rejection_reason,
            failure_reason: withdrawal.failure_reason,
            notes: withdrawal.notes
          },
          amount: withdrawal.amount_usd,
          currency: 'USD',
          ip_address: withdrawal.user_ip,
          user_agent: withdrawal.user_agent,
          created_at: withdrawal.created_at
        })
      })
    }

    // Sort all activities by date
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const from = (pagination.page - 1) * pagination.limit
    const to = from + pagination.limit
    const paginatedActivities = activities.slice(from, to)

    return {
      data: paginatedActivities,
      count: activities.length,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(activities.length / pagination.limit),
      hasMore: pagination.page < Math.ceil(activities.length / pagination.limit),
      hasPrevious: pagination.page > 1
    }
  } catch (error) {
    console.error('Error fetching user activity:', error)
    throw error
  }
}

export async function fetchUserPayments(
  userId: string,
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<PaginatedResponse<UserPayment>> {
  try {
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    const from = (pagination.page - 1) * pagination.limit
    const to = from + pagination.limit
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    const totalPages = Math.ceil((count || 0) / pagination.limit)

    return {
      data: data || [],
      count: count || 0,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasMore: pagination.page < totalPages,
      hasPrevious: pagination.page > 1
    }
  } catch (error) {
    console.error('Error fetching user payments:', error)
    throw error
  }
}

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'pending'
): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) throw new Error('No session')

    const response = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`
      },
      body: JSON.stringify({ user_id: userId, action: 'update_status', status })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `Failed to update user status (${response.status})`)
    }
  } catch (error) {
    console.error('Error updating user status:', error)
    throw error
  }
}

export async function updateUserRole(
  userId: string,
  role: 'learner' | 'affiliate' | 'admin'
): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) throw new Error('No session')

    const response = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`
      },
      body: JSON.stringify({ user_id: userId, action: 'update_role', role })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `Failed to update user role (${response.status})`)
    }
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    // First delete related records
    await supabase.from('payments').delete().eq('user_id', userId)
    
    // Then delete the profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error

    // Note: This doesn't delete from auth.users
    // You'll need a separate service or server-side function for that
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

export async function bulkUpdateUserStatus(
  userIds: string[],
  status: 'active' | 'suspended' | 'pending'
): Promise<void> {
  try {
    // Update each user via the API endpoint
    await Promise.all(userIds.map(id => updateUserStatus(id, status)))
  } catch (error) {
    console.error('Error bulk updating user status:', error)
    throw error
  }
}

export async function fetchAffiliateProfile(userId: string): Promise<AffiliateProfile | null> {
  try {
    const { data, error } = await supabase
      .from('affiliate_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw error
    }

    return data as AffiliateProfile
  } catch (error) {
    console.error('Error fetching affiliate profile:', error)
    return null
  }
}

export async function fetchUserWithAffiliateData(userId: string): Promise<User | null> {
  try {
    // Get basic user data
    const user = await fetchUserById(userId)
    if (!user) return null

    // If user is affiliate or admin, get additional affiliate data
    if (user.role === 'affiliate' || user.role === 'admin') {
      const affiliateProfile = await fetchAffiliateProfile(userId)
      if (affiliateProfile) {
        return {
          ...user,
          referral_count: affiliateProfile.lifetime_referrals,
          total_commissions: affiliateProfile.total_earnings,
          // Add affiliate-specific fields
          referral_code: affiliateProfile.referral_code,
          available_balance: affiliateProfile.available_balance,
          payout_method: affiliateProfile.payout_method
        } as User & { referral_code: string; available_balance: number; payout_method: string | null }
      }
    }

    return user
  } catch (error) {
    console.error('Error fetching user with affiliate data:', error)
    throw error
  }
}

export async function bulkDeleteUsers(userIds: string[]): Promise<void> {
  try {
    // Delete related records first
    await supabase.from('payments').delete().in('user_id', userIds)
    
    // Then delete profiles
    const { error } = await supabase
      .from('profiles')
      .delete()
      .in('id', userIds)

    if (error) throw error
  } catch (error) {
    console.error('Error bulk deleting users:', error)
    throw error
  }
}

export async function exportUsers(filters: FilterParams = {}): Promise<User[]> {
  try {
    let query = supabase.from('profiles').select('*')

    // Apply same filters as fetchUsers
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`)
    }

    if (filters.role && filters.role !== 'all') {
      query = query.eq('role', filters.role)
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.country && filters.country !== 'all') {
      query = query.eq('country', filters.country)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Order and get all results
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error exporting users:', error)
    throw error
  }
}
