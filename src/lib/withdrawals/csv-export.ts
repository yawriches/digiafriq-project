// ============================================================================
// CSV EXPORT UTILITIES FOR PAYSTACK & KORA BULK TRANSFERS
// ============================================================================

import {
  WithdrawalWithUser,
  PaystackCSVRow,
  KoraCSVRow,
  PayoutProvider,
  BankAccountDetails,
  MobileMoneyDetails,
  PAYOUT_CHANNEL,
  PAYSTACK_MOMO_SLUGS
} from './types'

// ============================================================================
// PAYSTACK CSV GENERATION
// ============================================================================

/**
 * Paystack Bulk Transfer CSV Format (matches Paystack's upload template):
 * - Transfer Amount: Amount in main currency unit (GHS, not pesewas)
 * - Transfer Note (Optional): Description/reason
 * - Transfer Reference (Optional): Unique reference
 * - Recipient Code: Overrides all other details if provided
 * - Bank Code or Slug: e.g. mtn-mobile-money, vod-mobile-money, atl-mobile-money
 * - Account Number: Mobile number or bank account number
 * - Account Name (Optional): Name on the account
 * - Email Address (Optional): User email
 *
 * For Ghana mobile money, we use the Bank Code or Slug column with the
 * Paystack mobile money slugs instead of requiring pre-created recipient codes.
 */
export function generatePaystackCSV(
  withdrawals: WithdrawalWithUser[],
  recipientCodes?: Map<string, string> // user_id -> recipient_code (optional)
): { csv: string; errors: string[] } {
  const rows: PaystackCSVRow[] = []
  const errors: string[] = []

  for (const withdrawal of withdrawals) {
    const amount = withdrawal.amount_local || withdrawal.amount_usd
    const recipientCode = recipientCodes?.get(withdrawal.user_id) || ''

    if (withdrawal.payout_channel === PAYOUT_CHANNEL.MOBILE_MONEY) {
      const mobileDetails = withdrawal.account_details as MobileMoneyDetails

      if (!mobileDetails.network_code || !mobileDetails.mobile_number) {
        errors.push(`Missing mobile money details for withdrawal ${withdrawal.reference}`)
        continue
      }

      // Map network code to Paystack slug
      const slug = PAYSTACK_MOMO_SLUGS[mobileDetails.network_code] ||
                   PAYSTACK_MOMO_SLUGS[mobileDetails.network] || ''

      if (!slug) {
        errors.push(`Unknown mobile money network "${mobileDetails.network_code}" for ${withdrawal.reference}`)
        continue
      }

      rows.push({
        transfer_amount: amount,
        transfer_note: `Affiliate payout - ${withdrawal.reference}`,
        transfer_reference: withdrawal.reference,
        recipient_code: recipientCode,
        bank_code_or_slug: slug,
        account_number: mobileDetails.mobile_number,
        account_name: mobileDetails.account_name || withdrawal.user_name,
        email_address: withdrawal.user_email || '',
      })
    } else if (withdrawal.payout_channel === PAYOUT_CHANNEL.BANK) {
      const bankDetails = withdrawal.account_details as BankAccountDetails

      if (!bankDetails.bank_code || !bankDetails.account_number) {
        errors.push(`Missing bank details for withdrawal ${withdrawal.reference}`)
        continue
      }

      rows.push({
        transfer_amount: amount,
        transfer_note: `Affiliate payout - ${withdrawal.reference}`,
        transfer_reference: withdrawal.reference,
        recipient_code: recipientCode,
        bank_code_or_slug: bankDetails.bank_code,
        account_number: bankDetails.account_number,
        account_name: bankDetails.account_name || withdrawal.user_name,
        email_address: withdrawal.user_email || '',
      })
    } else {
      errors.push(`Unknown payout channel for withdrawal ${withdrawal.reference}`)
    }
  }

  // Generate CSV string matching Paystack's exact header format
  const headers = [
    'Transfer Amount',
    'Transfer Note (Optional)',
    'Transfer Reference (Optional)',
    'Recipient Code (This overrides all other details if available)',
    'Bank Code or Slug',
    'Account Number',
    'Account Name (Optional)',
    'Email Address (Optional)'
  ]

  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      `${row.transfer_amount.toFixed(2)},"${escapeCSV(row.transfer_note)}",${row.transfer_reference},${row.recipient_code},${row.bank_code_or_slug},${row.account_number},"${escapeCSV(row.account_name)}",${row.email_address}`
    )
  ]

  return {
    csv: csvRows.join('\n'),
    errors
  }
}

// ============================================================================
// KORA CSV GENERATION
// ============================================================================

/**
 * Kora Bulk Transfer CSV Format:
 * - reference: Unique reference for the transfer
 * - amount: Amount in major currency unit (GHS, NGN)
 * - currency: Currency code (GHS, NGN)
 * - bank_code: Bank code for the destination
 * - account_number: Destination account number
 * - account_name: Name on the destination account
 * - narration: Description for the transfer
 */
export function generateKoraCSV(withdrawals: WithdrawalWithUser[]): { csv: string; errors: string[] } {
  const rows: KoraCSVRow[] = []
  const errors: string[] = []

  for (const withdrawal of withdrawals) {
    const accountDetails = withdrawal.account_details

    // Validate required fields based on payout channel
    if (withdrawal.payout_channel === PAYOUT_CHANNEL.BANK) {
      const bankDetails = accountDetails as BankAccountDetails
      
      if (!bankDetails.bank_code || !bankDetails.account_number || !bankDetails.account_name) {
        errors.push(`Missing bank details for withdrawal ${withdrawal.reference}`)
        continue
      }

      rows.push({
        reference: withdrawal.reference,
        amount: withdrawal.amount_local || withdrawal.amount_usd,
        currency: withdrawal.currency,
        bank_code: bankDetails.bank_code,
        account_number: bankDetails.account_number,
        account_name: bankDetails.account_name,
        narration: `Affiliate payout - ${withdrawal.reference}`
      })
    } else if (withdrawal.payout_channel === PAYOUT_CHANNEL.MOBILE_MONEY) {
      const mobileDetails = accountDetails as MobileMoneyDetails
      
      if (!mobileDetails.network_code || !mobileDetails.mobile_number) {
        errors.push(`Missing mobile money details for withdrawal ${withdrawal.reference}`)
        continue
      }

      // For Kora mobile money, use network code as bank_code
      rows.push({
        reference: withdrawal.reference,
        amount: withdrawal.amount_local || withdrawal.amount_usd,
        currency: withdrawal.currency,
        bank_code: mobileDetails.network_code,
        account_number: mobileDetails.mobile_number,
        account_name: mobileDetails.account_name || withdrawal.user_name,
        narration: `Affiliate payout - ${withdrawal.reference}`
      })
    } else {
      errors.push(`Unknown payout channel for withdrawal ${withdrawal.reference}`)
    }
  }

  // Generate CSV string
  const headers = ['reference', 'amount', 'currency', 'bank_code', 'account_number', 'account_name', 'narration']
  const csvRows = [
    headers.join(','),
    ...rows.map(row => 
      `${row.reference},${row.amount.toFixed(2)},${row.currency},${row.bank_code},${row.account_number},"${escapeCSV(row.account_name)}","${escapeCSV(row.narration)}"`
    )
  ]

  return {
    csv: csvRows.join('\n'),
    errors
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escape special characters for CSV
 */
function escapeCSV(value: string): string {
  if (!value) return ''
  // Escape double quotes by doubling them
  return value.replace(/"/g, '""')
}

/**
 * Generate CSV based on provider
 */
export function generateProviderCSV(
  provider: PayoutProvider,
  withdrawals: WithdrawalWithUser[],
  recipientCodes?: Map<string, string>
): { csv: string; errors: string[]; filename: string } {
  const timestamp = new Date().toISOString().split('T')[0]
  
  if (provider === 'PAYSTACK') {
    const result = generatePaystackCSV(withdrawals, recipientCodes)
    return {
      ...result,
      filename: `paystack_bulk_transfer_${timestamp}.csv`
    }
  } else if (provider === 'KORA') {
    const result = generateKoraCSV(withdrawals)
    return {
      ...result,
      filename: `kora_bulk_transfer_${timestamp}.csv`
    }
  }

  return {
    csv: '',
    errors: [`Unknown provider: ${provider}`],
    filename: ''
  }
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.href = url
  link.download = filename
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Parse CSV file (for importing results)
 */
export function parseCSV<T>(csv: string, headers: string[]): T[] {
  const lines = csv.trim().split('\n')
  const results: T[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const obj: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    
    results.push(obj as T)
  }

  return results
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  values.push(current.trim())
  return values
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate withdrawals before CSV generation
 */
export function validateWithdrawalsForExport(
  withdrawals: WithdrawalWithUser[]
): { valid: WithdrawalWithUser[]; invalid: { withdrawal: WithdrawalWithUser; reason: string }[] } {
  const valid: WithdrawalWithUser[] = []
  const invalid: { withdrawal: WithdrawalWithUser; reason: string }[] = []

  for (const withdrawal of withdrawals) {
    // Check status
    if (withdrawal.status !== 'APPROVED') {
      invalid.push({ withdrawal, reason: `Invalid status: ${withdrawal.status}` })
      continue
    }

    // Check amount
    if (!withdrawal.amount_usd || withdrawal.amount_usd <= 0) {
      invalid.push({ withdrawal, reason: 'Invalid amount' })
      continue
    }

    // Check account details
    if (!withdrawal.account_details) {
      invalid.push({ withdrawal, reason: 'Missing account details' })
      continue
    }

    // Validate based on payout channel
    if (withdrawal.payout_channel === PAYOUT_CHANNEL.BANK) {
      const details = withdrawal.account_details as BankAccountDetails
      if (!details.bank_code || !details.account_number || !details.account_name) {
        invalid.push({ withdrawal, reason: 'Incomplete bank details' })
        continue
      }
    } else if (withdrawal.payout_channel === PAYOUT_CHANNEL.MOBILE_MONEY) {
      const details = withdrawal.account_details as MobileMoneyDetails
      if (!details.network_code || !details.mobile_number) {
        invalid.push({ withdrawal, reason: 'Incomplete mobile money details' })
        continue
      }
    }

    valid.push(withdrawal)
  }

  return { valid, invalid }
}

/**
 * Check for duplicate payouts (same account, same day)
 */
export function checkDuplicatePayouts(
  withdrawals: WithdrawalWithUser[]
): { duplicates: WithdrawalWithUser[][]; unique: WithdrawalWithUser[] } {
  const accountMap = new Map<string, WithdrawalWithUser[]>()
  
  for (const withdrawal of withdrawals) {
    const accountKey = getAccountKey(withdrawal)
    
    if (!accountMap.has(accountKey)) {
      accountMap.set(accountKey, [])
    }
    accountMap.get(accountKey)!.push(withdrawal)
  }

  const duplicates: WithdrawalWithUser[][] = []
  const unique: WithdrawalWithUser[] = []

  for (const [, group] of accountMap) {
    if (group.length > 1) {
      duplicates.push(group)
    } else {
      unique.push(group[0])
    }
  }

  return { duplicates, unique }
}

/**
 * Generate unique key for account to detect duplicates
 */
function getAccountKey(withdrawal: WithdrawalWithUser): string {
  const details = withdrawal.account_details
  
  if (withdrawal.payout_channel === PAYOUT_CHANNEL.BANK) {
    const bankDetails = details as BankAccountDetails
    return `bank:${bankDetails.bank_code}:${bankDetails.account_number}`
  } else {
    const mobileDetails = details as MobileMoneyDetails
    return `mobile:${mobileDetails.network_code}:${mobileDetails.mobile_number}`
  }
}
