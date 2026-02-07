// ============================================================================
// WITHDRAWAL MANAGEMENT SYSTEM - TypeScript Types
// ============================================================================

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const WITHDRAWAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED'
} as const

export type WithdrawalStatus = typeof WITHDRAWAL_STATUS[keyof typeof WITHDRAWAL_STATUS]

export const BATCH_STATUS = {
  DRAFT: 'DRAFT',
  READY: 'READY',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  PARTIALLY_COMPLETED: 'PARTIALLY_COMPLETED',
  FAILED: 'FAILED'
} as const

export type BatchStatus = typeof BATCH_STATUS[keyof typeof BATCH_STATUS]

export const PAYOUT_CHANNEL = {
  BANK: 'bank',
  MOBILE_MONEY: 'mobile_money'
} as const

export type PayoutChannel = typeof PAYOUT_CHANNEL[keyof typeof PAYOUT_CHANNEL]

export const PAYOUT_PROVIDER = {
  PAYSTACK: 'PAYSTACK',
  KORA: 'KORA'
} as const

export type PayoutProvider = typeof PAYOUT_PROVIDER[keyof typeof PAYOUT_PROVIDER]

export const AUDIT_ACTIONS = {
  CREATED: 'CREATED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ADDED_TO_BATCH: 'ADDED_TO_BATCH',
  REMOVED_FROM_BATCH: 'REMOVED_FROM_BATCH',
  BATCH_CREATED: 'BATCH_CREATED',
  BATCH_FINALIZED: 'BATCH_FINALIZED',
  BATCH_PROCESSED: 'BATCH_PROCESSED',
  BATCH_COMPLETED: 'BATCH_COMPLETED',
  MARKED_PAID: 'MARKED_PAID',
  MARKED_FAILED: 'MARKED_FAILED',
  REFUND_INITIATED: 'REFUND_INITIATED',
  NOTE_ADDED: 'NOTE_ADDED'
} as const

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS]

// ============================================================================
// WITHDRAWAL STATE MACHINE
// ============================================================================

/**
 * Withdrawal State Machine:
 * 
 *                    ┌─────────────┐
 *                    │   PENDING   │ ◄── User submits (Friday only)
 *                    └──────┬──────┘
 *                           │
 *              ┌────────────┴────────────┐
 *              │                         │
 *              ▼                         ▼
 *       ┌─────────────┐           ┌─────────────┐
 *       │  APPROVED   │           │  REJECTED   │ ◄── Funds frozen (no auto-refund)
 *       └──────┬──────┘           └─────────────┘
 *              │
 *              │ Added to batch
 *              ▼
 *       ┌─────────────┐
 *       │ PROCESSING  │ ◄── Batch sent to provider
 *       └──────┬──────┘
 *              │
 *     ┌────────┴────────┐
 *     │                 │
 *     ▼                 ▼
 * ┌─────────┐     ┌─────────┐
 * │  PAID   │     │ FAILED  │ ◄── Manual review required
 * └─────────┘     └─────────┘
 */

export const WITHDRAWAL_TRANSITIONS: Record<WithdrawalStatus, WithdrawalStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PROCESSING', 'REJECTED'], // Can still reject before processing
  REJECTED: [], // Terminal state (manual intervention for refund)
  PROCESSING: ['PAID', 'FAILED'],
  PAID: [], // Terminal state
  FAILED: ['PROCESSING'] // Can retry
}

export function canTransition(from: WithdrawalStatus, to: WithdrawalStatus): boolean {
  return WITHDRAWAL_TRANSITIONS[from]?.includes(to) ?? false
}

// ============================================================================
// INTERFACES
// ============================================================================

// Bank account details
export interface BankAccountDetails {
  bank_name: string
  bank_code: string
  account_number: string
  account_name: string
}

// Mobile money details
export interface MobileMoneyDetails {
  network: string
  network_code: string
  mobile_number: string
  account_name: string
}

export type AccountDetails = BankAccountDetails | MobileMoneyDetails

// Withdrawal record
export interface Withdrawal {
  id: string
  reference: string
  user_id: string
  amount_usd: number
  amount_local: number | null
  currency: string
  exchange_rate: number | null
  payout_channel: PayoutChannel
  account_details: AccountDetails
  status: WithdrawalStatus
  batch_id: string | null
  provider: PayoutProvider | null
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

// Withdrawal with user info (for admin views)
export interface WithdrawalWithUser extends Withdrawal {
  user_name: string
  user_email: string
  user_country?: string
}

// Withdrawal batch
export interface WithdrawalBatch {
  id: string
  batch_reference: string
  provider: PayoutProvider
  total_withdrawals: number
  total_amount_usd: number
  total_amount_local: number | null
  currency: string
  status: BatchStatus
  successful_count: number
  failed_count: number
  created_by: string
  created_at: string
  finalized_at: string | null
  finalized_by: string | null
  processed_at: string | null
  processed_by: string | null
  completed_at: string | null
  csv_generated_at: string | null
  csv_file_url: string | null
  notes: string | null
}

// Audit log entry
export interface WithdrawalAuditLog {
  id: string
  withdrawal_id: string | null
  batch_id: string | null
  admin_id: string
  admin_email: string | null
  action: AuditAction
  previous_status: WithdrawalStatus | null
  new_status: WithdrawalStatus | null
  details: Record<string, any> | null
  reason: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// Paystack recipient
export interface PaystackRecipient {
  id: string
  user_id: string
  recipient_code: string
  recipient_type: string
  bank_code: string | null
  account_number: string | null
  account_name: string | null
  mobile_number: string | null
  network_code: string | null
  is_active: boolean
  is_verified: boolean
  currency: string
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

// ============================================================================
// CSV EXPORT TYPES
// ============================================================================

// Paystack Bulk Transfer CSV Row (matches Paystack's upload template)
export interface PaystackCSVRow {
  transfer_amount: number // Amount in main currency unit (GHS)
  transfer_note: string // Description/reason
  transfer_reference: string // Unique reference
  recipient_code: string // Paystack recipient_code (overrides other fields if set)
  bank_code_or_slug: string // e.g. mtn-mobile-money, vod-mobile-money, atl-mobile-money
  account_number: string // Mobile number or bank account number
  account_name: string // Name on the account
  email_address: string // User email
}

// Kora Bulk Transfer CSV Row
export interface KoraCSVRow {
  reference: string
  amount: number // In major currency unit
  currency: string
  bank_code: string
  account_number: string
  account_name: string
  narration: string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateWithdrawalRequest {
  amount_usd: number
  payout_channel: PayoutChannel
  account_details: AccountDetails
  currency?: string
}

export interface ApproveWithdrawalRequest {
  withdrawal_id: string
  notes?: string
}

export interface RejectWithdrawalRequest {
  withdrawal_id: string
  reason: string
}

export interface CreateBatchRequest {
  provider: PayoutProvider
  currency?: string
  notes?: string
}

export interface AddToBatchRequest {
  withdrawal_ids: string[]
  batch_id: string
}

export interface MarkPaidRequest {
  withdrawal_id: string
  provider_reference?: string
  provider_response?: Record<string, any>
}

export interface MarkFailedRequest {
  withdrawal_id: string
  failure_reason: string
  provider_response?: Record<string, any>
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const MINIMUM_WITHDRAWAL_USD = 8.00
export const WITHDRAWAL_DAY = 5 // Friday (0 = Sunday)

// Bank codes for Ghana (Paystack)
export const GHANA_BANK_CODES: Record<string, string> = {
  'GCB Bank': 'GCB',
  'Ecobank Ghana': 'ECO',
  'Fidelity Bank': 'FBG',
  'Stanbic Bank': 'STB',
  'Standard Chartered': 'SCB',
  'Access Bank': 'ABG',
  'Zenith Bank': 'ZEN',
  'CalBank': 'CAL',
  'First Atlantic Bank': 'FAB',
  'Prudential Bank': 'PRU',
  'UBA Ghana': 'UBA',
  'Republic Bank': 'REP',
  'Societe Generale': 'SGB',
  'GT Bank': 'GTB',
  'First National Bank': 'FNB'
}

// Mobile Money network codes for Ghana
export const GHANA_MOMO_CODES: Record<string, string> = {
  'mtn': 'MTN',
  'vodafone': 'VOD',
  'airteltigo': 'ATL'
}

// Paystack Bank Code or Slug for Ghana Mobile Money
// These are the exact slugs Paystack expects in the bulk transfer CSV
export const PAYSTACK_MOMO_SLUGS: Record<string, string> = {
  'mtn': 'mtn-mobile-money',
  'MTN': 'mtn-mobile-money',
  'vodafone': 'vod-mobile-money',
  'VOD': 'vod-mobile-money',
  'airteltigo': 'atl-mobile-money',
  'ATL': 'atl-mobile-money',
  'mtn-mobile-money': 'mtn-mobile-money',
  'vod-mobile-money': 'vod-mobile-money',
  'atl-mobile-money': 'atl-mobile-money',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isWithdrawalDay(): boolean {
  // TODO: Re-enable Friday-only check after testing
  // return new Date().getDay() === WITHDRAWAL_DAY
  return true // Allow withdrawals any day for testing
}

export function getStatusColor(status: WithdrawalStatus): string {
  switch (status) {
    case 'PENDING': return 'yellow'
    case 'APPROVED': return 'blue'
    case 'PROCESSING': return 'purple'
    case 'PAID': return 'green'
    case 'REJECTED': return 'red'
    case 'FAILED': return 'red'
    default: return 'gray'
  }
}

export function getBatchStatusColor(status: BatchStatus): string {
  switch (status) {
    case 'DRAFT': return 'gray'
    case 'READY': return 'blue'
    case 'PROCESSING': return 'purple'
    case 'COMPLETED': return 'green'
    case 'PARTIALLY_COMPLETED': return 'yellow'
    case 'FAILED': return 'red'
    default: return 'gray'
  }
}

export function formatWithdrawalAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    GHS: '₵',
    NGN: '₦'
  }
  return `${symbols[currency] || currency} ${amount.toFixed(2)}`
}
