// ============================================================================
// WITHDRAWAL SERVICE - Database Operations
// ============================================================================

import { supabase } from '@/lib/supabase/client'
import {
  Withdrawal,
  WithdrawalWithUser,
  WithdrawalBatch,
  WithdrawalAuditLog,
  PaystackRecipient,
  CreateWithdrawalRequest,
  WithdrawalStatus,
  BatchStatus,
  PayoutProvider,
  MINIMUM_WITHDRAWAL_USD,
  isWithdrawalDay
} from './types'

async function invokeEmailEvents(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any).functions.invoke('email-events', {
      body: payload,
    })

    if (error) {
      console.error('❌ email-events invoke error (withdrawal-service):', {
        message: (error as any)?.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        context: (error as any)?.context,
        payload,
      })
      return false
    }

    console.log('✅ email-events invoked (withdrawal-service):', { payload, data })
    return true
  } catch (e) {
    console.error('❌ email-events invoke exception (withdrawal-service):', {
      error: e instanceof Error ? e.message : String(e),
      payload,
    })
    return false
  }
}

// ============================================================================
// CURRENCY CONVERSION RATES
// ============================================================================

// Currency conversion rates - rate = 1 USD in local currency
// These rates should match the rates used in checkout pages
export const CURRENCY_RATES: Record<string, { rate: number; symbol: string; name: string }> = {
  USD: { rate: 1, symbol: '$', name: 'US Dollar' },
  GHS: { rate: 10.0, symbol: '₵', name: 'Ghanaian Cedi' },
  NGN: { rate: 888.89, symbol: '₦', name: 'Nigerian Naira' },
  KES: { rate: 129.44, symbol: 'KSh', name: 'Kenyan Shilling' },
  ZAR: { rate: 17.22, symbol: 'R', name: 'South African Rand' },
  XOF: { rate: 561.11, symbol: 'CFA', name: 'West African CFA Franc' },
  XAF: { rate: 561.11, symbol: 'XAF', name: 'Central African CFA Franc' },
}

/**
 * Get exchange rate for a currency (1 USD = X local currency)
 */
export function getExchangeRate(currency: string): number {
  return CURRENCY_RATES[currency]?.rate || 1
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_RATES[currency]?.symbol || currency
}

// ============================================================================
// USER WITHDRAWAL OPERATIONS
// ============================================================================

/**
 * Generate a unique withdrawal reference
 */
function generateReference(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `WD-${dateStr}-${random}`
}

/**
 * Create a new withdrawal request (user action)
 */
export async function createWithdrawal(
  request: CreateWithdrawalRequest
): Promise<{ data: Withdrawal | null; error: string | null }> {
  try {
    // Validate withdrawal day
    if (!isWithdrawalDay()) {
      return { data: null, error: 'Withdrawals can only be submitted on Fridays' }
    }

    // Validate minimum amount
    if (request.amount_usd < MINIMUM_WITHDRAWAL_USD) {
      return { data: null, error: `Minimum withdrawal amount is $${MINIMUM_WITHDRAWAL_USD} USD` }
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'You must be logged in to create a withdrawal' }
    }

    // Get user's affiliate profile to check available balance
    const { data: affiliateProfile, error: profileError } = await supabase
      .from('affiliate_profiles' as any)
      .select('id, available_balance')
      .eq('id', user.id)
      .single()

    if (profileError || !affiliateProfile) {
      console.error('Error fetching affiliate profile:', profileError)
      return { data: null, error: 'Could not find your affiliate profile' }
    }

    const availableBalance = (affiliateProfile as any).available_balance || 0

    // Check if user has sufficient balance
    if (request.amount_usd > availableBalance) {
      return { 
        data: null, 
        error: `Insufficient balance. You have $${availableBalance.toFixed(2)} available.` 
      }
    }

    // Generate reference
    const reference = generateReference()

    // Get exchange rate for the currency
    const currency = request.currency || 'GHS'
    const exchangeRate = getExchangeRate(currency)
    const amountLocal = request.amount_usd * exchangeRate

    // Insert withdrawal directly using raw insert
    const insertData = {
      reference,
      user_id: user.id,
      amount_usd: request.amount_usd,
      amount_local: amountLocal,
      currency: currency,
      exchange_rate: exchangeRate,
      payout_channel: request.payout_channel,
      account_details: request.account_details,
      status: 'PENDING'
    }

    console.log('Inserting withdrawal:', insertData)

    const { data: withdrawal, error } = await supabase
      .from('withdrawals' as any)
      .insert(insertData as any)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating withdrawal:', JSON.stringify(error, null, 2))
      // Check for duplicate reference
      if (error.code === '23505') {
        // Retry with new reference
        return createWithdrawal(request)
      }
      return { data: null, error: error.message || 'Failed to create withdrawal' }
    }

    // Deduct the withdrawal amount from available balance
    const newBalance = availableBalance - request.amount_usd
    const { error: updateError } = await (supabase as any)
      .from('affiliate_profiles')
      .update({ 
        available_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating balance:', updateError)
      // Note: Withdrawal was created but balance update failed
      // This should be handled by admin or a background job
    } else {
      console.log(`Balance updated: $${availableBalance.toFixed(2)} -> $${newBalance.toFixed(2)}`)
    }

    console.log('Withdrawal created:', withdrawal)
    return { data: withdrawal as Withdrawal, error: null }
  } catch (err: any) {
    console.error('Error in createWithdrawal:', err)
    return { data: null, error: err.message || 'An unexpected error occurred' }
  }
}

/**
 * Get user's withdrawal history
 */
export async function getUserWithdrawals(
  userId?: string
): Promise<{ data: Withdrawal[]; error: string | null }> {
  try {
    let query = (supabase as any)
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

/**
 * Get single withdrawal by ID
 */
export async function getWithdrawal(
  withdrawalId: string
): Promise<{ data: Withdrawal | null; error: string | null }> {
  try {
    const { data, error } = await (supabase as any)
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message }
  }
}

// ============================================================================
// ADMIN WITHDRAWAL OPERATIONS
// ============================================================================

/**
 * Helper to fetch user profiles for withdrawals
 */
async function enrichWithdrawalsWithUserInfo(withdrawals: any[]): Promise<WithdrawalWithUser[]> {
  if (withdrawals.length === 0) return []

  // Get unique user IDs
  const userIds = [...new Set(withdrawals.map(w => w.user_id))]

  // Fetch profiles with country
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, country')
    .in('id', userIds)

  // Create lookup map
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

  // Enrich withdrawals
  return withdrawals.map(w => ({
    ...w,
    user_name: (profileMap.get(w.user_id) as any)?.full_name || 'Unknown',
    user_email: (profileMap.get(w.user_id) as any)?.email || 'Unknown',
    user_country: (profileMap.get(w.user_id) as any)?.country || 'Unknown'
  }))
}

/**
 * Get all withdrawals with user info (admin)
 */
export async function getAllWithdrawals(
  status?: WithdrawalStatus,
  limit?: number
): Promise<{ data: WithdrawalWithUser[]; error: string | null }> {
  try {
    let query = supabase
      .from('withdrawals' as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return { data: [], error: error.message }
    }

    // Enrich with user info
    const withdrawals = await enrichWithdrawalsWithUserInfo(data || [])

    return { data: withdrawals, error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

/**
 * Get pending withdrawals (admin)
 */
export async function getPendingWithdrawals(): Promise<{ data: WithdrawalWithUser[]; error: string | null }> {
  return getAllWithdrawals('PENDING')
}

/**
 * Get approved withdrawals not in a batch (admin)
 */
export async function getApprovedWithdrawals(): Promise<{ data: WithdrawalWithUser[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('withdrawals' as any)
      .select('*')
      .eq('status', 'APPROVED')
      .is('batch_id', null)
      .order('approved_at', { ascending: true })

    if (error) {
      return { data: [], error: error.message }
    }

    const withdrawals = await enrichWithdrawalsWithUserInfo(data || [])
    return { data: withdrawals, error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

/**
 * Approve withdrawal (admin)
 */
export async function approveWithdrawal(
  withdrawalId: string,
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = (await supabase.auth.getUser()).data.user

    const { error } = await (supabase as any).rpc('approve_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_admin_id: user?.id,
      p_notes: notes
    })

    if (error) {
      return { success: false, error: error.message }
    }

    try {
      const withdrawalUserId = (withdrawalForEmail as any)?.user_id as string | undefined
      if (withdrawalUserId) {
        const { data: profile, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('email')
          .eq('id', withdrawalUserId)
          .maybeSingle()

        if (profileError) {
          console.error('⚠️ Failed to load affiliate email for payout:', profileError)
        }

        const to = (profile as any)?.email as string | undefined
        if (to) {
          await invokeEmailEvents({
            type: 'payout',
            to,
            amount: (withdrawalForEmail as any)?.amount_usd,
            currency: 'USD',
            paymentMethod: 'Withdrawal',
            referenceId: (withdrawalForEmail as any)?.reference || providerReference || withdrawalId,
            date: new Date().toISOString(),
          })
        }
      }
    } catch (emailErr) {
      console.error('⚠️ Payout email send failed (non-blocking):', emailErr)
    }

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Reject withdrawal (admin)
 */
export async function rejectWithdrawal(
  withdrawalId: string,
  reason: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = (await supabase.auth.getUser()).data.user

    const { error } = await (supabase as any).rpc('reject_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_admin_id: user?.id,
      p_reason: reason
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Mark withdrawal as paid (admin)
 */
export async function markWithdrawalPaid(
  withdrawalId: string,
  providerReference?: string,
  providerResponse?: Record<string, any>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = (await supabase.auth.getUser()).data.user

    const { data: withdrawalForEmail, error: withdrawalForEmailError } = await (supabase as any)
      .from('withdrawals')
      .select('id, user_id, amount_usd, amount_local, currency, reference')
      .eq('id', withdrawalId)
      .maybeSingle()

    if (withdrawalForEmailError) {
      console.error('⚠️ Failed to load withdrawal for email:', withdrawalForEmailError)
    }

    const { error } = await (supabase as any).rpc('mark_withdrawal_paid', {
      p_withdrawal_id: withdrawalId,
      p_admin_id: user?.id,
      p_provider_reference: providerReference,
      p_provider_response: providerResponse
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Mark withdrawal as failed (admin)
 */
export async function markWithdrawalFailed(
  withdrawalId: string,
  failureReason: string,
  providerResponse?: Record<string, any>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = (await supabase.auth.getUser()).data.user

    const { error } = await (supabase as any).rpc('mark_withdrawal_failed', {
      p_withdrawal_id: withdrawalId,
      p_admin_id: user?.id,
      p_failure_reason: failureReason,
      p_provider_response: providerResponse
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Create a new withdrawal batch (admin)
 */
export async function createBatch(
  provider: PayoutProvider,
  currency?: string,
  notes?: string
): Promise<{ data: WithdrawalBatch | null; error: string | null }> {
  try {
    const user = (await supabase.auth.getUser()).data.user

    const { data: batchId, error } = await (supabase as any).rpc('create_withdrawal_batch', {
      p_admin_id: user?.id,
      p_provider: provider,
      p_currency: currency || 'GHS',
      p_notes: notes
    })

    if (error) {
      return { data: null, error: error.message }
    }

    // Fetch the created batch
    const { data: batch, error: fetchError } = await (supabase as any)
      .from('withdrawal_batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (fetchError) {
      return { data: null, error: fetchError.message }
    }

    return { data: batch, error: null }
  } catch (err: any) {
    return { data: null, error: err.message }
  }
}

/**
 * Get all batches (admin)
 */
export async function getBatches(
  status?: BatchStatus
): Promise<{ data: WithdrawalBatch[]; error: string | null }> {
  try {
    let query = (supabase as any)
      .from('withdrawal_batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

/**
 * Get batch with withdrawals (admin)
 */
export async function getBatchWithWithdrawals(
  batchId: string
): Promise<{ batch: WithdrawalBatch | null; withdrawals: WithdrawalWithUser[]; error: string | null }> {
  try {
    // Get batch
    const { data: batch, error: batchError } = await (supabase as any)
      .from('withdrawal_batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (batchError) {
      return { batch: null, withdrawals: [], error: batchError.message }
    }

    // Get withdrawals in batch
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals' as any)
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })

    if (withdrawalsError) {
      return { batch, withdrawals: [], error: withdrawalsError.message }
    }

    const withdrawalsWithUser = await enrichWithdrawalsWithUserInfo(withdrawals || [])

    return { batch, withdrawals: withdrawalsWithUser, error: null }
  } catch (err: any) {
    return { batch: null, withdrawals: [], error: err.message }
  }
}

/**
 * Add withdrawals to batch (admin)
 */
export async function addWithdrawalsToBatch(
  withdrawalIds: string[],
  batchId: string
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []
  const user = (await supabase.auth.getUser()).data.user

  for (const withdrawalId of withdrawalIds) {
    const { error } = await (supabase as any).rpc('add_withdrawal_to_batch', {
      p_withdrawal_id: withdrawalId,
      p_batch_id: batchId,
      p_admin_id: user?.id
    })

    if (error) {
      errors.push(`Failed to add ${withdrawalId}: ${error.message}`)
    }
  }

  return { success: errors.length === 0, errors }
}

/**
 * Finalize batch (mark as ready for processing)
 */
export async function finalizeBatch(
  batchId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = (await supabase.auth.getUser()).data.user

    const { error } = await (supabase as any)
      .from('withdrawal_batches')
      .update({
        status: 'READY',
        finalized_at: new Date().toISOString(),
        finalized_by: user?.id
      })
      .eq('id', batchId)
      .eq('status', 'DRAFT')

    if (error) {
      return { success: false, error: error.message }
    }

    // Log audit
    await (supabase as any)
      .from('withdrawal_audit_log')
      .insert({
        batch_id: batchId,
        admin_id: user?.id,
        action: 'BATCH_FINALIZED',
        previous_status: 'DRAFT',
        new_status: 'READY'
      })

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ============================================================================
// AUDIT LOG OPERATIONS
// ============================================================================

/**
 * Get audit logs for a withdrawal
 */
export async function getWithdrawalAuditLogs(
  withdrawalId: string
): Promise<{ data: WithdrawalAuditLog[]; error: string | null }> {
  try {
    const { data, error } = await (supabase as any)
      .from('withdrawal_audit_log')
      .select(`
        *,
        admin:admin_id (
          email
        )
      `)
      .eq('withdrawal_id', withdrawalId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    const logs = (data || []).map((log: any) => ({
      ...log,
      admin_email: log.admin?.email
    }))

    return { data: logs, error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

/**
 * Get all audit logs (admin)
 */
export async function getAllAuditLogs(
  limit?: number
): Promise<{ data: WithdrawalAuditLog[]; error: string | null }> {
  try {
    let query = (supabase as any)
      .from('withdrawal_audit_log')
      .select(`
        *,
        admin:admin_id (
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      return { data: [], error: error.message }
    }

    const logs = (data || []).map((log: any) => ({
      ...log,
      admin_email: log.admin?.email
    }))

    return { data: logs, error: null }
  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get withdrawal statistics (admin)
 */
export async function getWithdrawalStats(): Promise<{
  data: {
    pending_count: number
    pending_amount: number
    approved_count: number
    approved_amount: number
    paid_this_week: number
    paid_amount_this_week: number
  } | null
  error: string | null
}> {
  try {
    // Get pending stats
    const { data: pending } = await (supabase as any)
      .from('withdrawals')
      .select('amount_usd')
      .eq('status', 'PENDING')

    // Get approved stats
    const { data: approved } = await (supabase as any)
      .from('withdrawals')
      .select('amount_usd')
      .eq('status', 'APPROVED')
      .is('batch_id', null)

    // Get paid this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: paidThisWeek } = await (supabase as any)
      .from('withdrawals')
      .select('amount_usd')
      .eq('status', 'PAID')
      .gte('paid_at', weekAgo.toISOString())

    return {
      data: {
        pending_count: pending?.length || 0,
        pending_amount: pending?.reduce((sum: number, w: any) => sum + (w.amount_usd || 0), 0) || 0,
        approved_count: approved?.length || 0,
        approved_amount: approved?.reduce((sum: number, w: any) => sum + (w.amount_usd || 0), 0) || 0,
        paid_this_week: paidThisWeek?.length || 0,
        paid_amount_this_week: paidThisWeek?.reduce((sum: number, w: any) => sum + (w.amount_usd || 0), 0) || 0
      },
      error: null
    }
  } catch (err: any) {
    return { data: null, error: err.message }
  }
}
