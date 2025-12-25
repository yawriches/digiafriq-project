export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'learner' | 'affiliate' | 'admin'
  active_role: 'learner' | 'affiliate' | 'admin'
  available_roles: ('learner' | 'affiliate' | 'admin')[]
  phone: string | null
  country: string | null
  status?: 'active' | 'suspended' | 'pending' // Optional since it may not exist in DB yet
  learner_has_paid: boolean | null
  learner_payment_date: string | null
  learner_payment_amount: number | null
  learner_payment_reference: string | null
  created_at: string
  updated_at: string
  last_login?: string
  email_verified?: boolean
  // Affiliate/Admin specific stats
  referral_count?: number
  total_withdrawals?: number
  total_commissions?: number
}

export interface UserActivity {
  id: string
  user_id: string
  action: string
  activity_type: 'payment' | 'withdrawal' | 'referral' | 'commission' | 'login' | 'profile_update' | 'other'
  details: Record<string, any> | null
  amount?: number
  currency?: string
  referral_user_id?: string
  referral_user_name?: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface UserPayment {
  id: string
  user_id: string
  course_id: string
  affiliate_id: string | null
  amount: number
  currency: string
  paystack_reference: string | null
  paystack_transaction_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface UserWithdrawal {
  id: string
  reference: string
  user_id: string
  amount_usd: number
  amount_local: number | null
  currency: string
  exchange_rate: number | null
  payout_channel: 'bank' | 'mobile_money'
  account_details: Record<string, any>
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'PAID' | 'FAILED'
  batch_id: string | null
  provider: string | null
  provider_reference: string | null
  provider_response: Record<string, any> | null
  created_at: string
  approved_at: string | null
  approved_by: string | null
  rejected_at: string | null
  rejected_by: string | null
  rejection_reason: string | null
  processed_at: string | null
  paid_at: string | null
  failed_at: string | null
  failure_reason: string | null
  user_ip: string | null
  user_agent: string | null
  notes: string | null
}

export interface AffiliateProfile {
  id: string
  referral_code: string
  learner_link: string
  dcs_link: string
  total_earnings: number
  available_balance: number
  lifetime_referrals: number
  active_referrals: number
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  mobile_money_provider: string | null
  mobile_money_number: string | null
  payout_method: 'bank' | 'mobile_money' | null
  created_at: string
  updated_at: string
}

export interface ReferralStats {
  total_referrals: number
  active_referrals: number
  total_commissions: number
  total_withdrawals: number
  pending_commissions: number
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  pendingUsers: number
  learnersCount: number
  affiliatesCount: number
  adminsCount: number
  recentSignups: number
  totalRevenue: number
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  role?: string
  status?: string
  country?: string
  dateFrom?: string
  dateTo?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
  hasPrevious: boolean
}

export type UserDetailTab = 'overview' | 'details' | 'activity' | 'payments' | 'settings'

export interface BulkAction {
  type: 'delete' | 'activate' | 'suspend' | 'changeRole'
  count: number
  userIds: string[]
  data?: any
}
