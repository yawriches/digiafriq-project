import { SupabaseClient } from '@supabase/supabase-js'

const COMMISSION_RATE = 0.60

interface CommissionInput {
  supabase: SupabaseClient
  affiliateId: string
  referralId: string
  paymentId: string
  paymentAmountUSD: number
  source: string // e.g. 'guest-verify' or 'verify' — for tracing
}

interface CommissionResult {
  created: boolean
  skipped: boolean
  commissionId?: string
  commissionAmount?: number
  error?: string
}

/**
 * Centralized, idempotent commission processor.
 *
 * Rules:
 *  - Only ONE commission per payment_id (idempotency).
 *  - Always 60 % of the USD base amount.
 *  - Works with any SupabaseClient (service-role or anon).
 */
export async function processCommission({
  supabase,
  affiliateId,
  referralId,
  paymentId,
  paymentAmountUSD,
  source,
}: CommissionInput): Promise<CommissionResult> {
  try {
    // ── Idempotency check ──────────────────────────────────────────────
    const { data: existing } = await supabase
      .from('commissions')
      .select('id, commission_amount, notes')
      .eq('payment_id', paymentId)
      .maybeSingle()

    if (existing) {
      console.log(`⚠️ [${source}] Commission already exists for payment ${paymentId}, skipping:`, existing)
      return { created: false, skipped: true, commissionId: existing.id, commissionAmount: existing.commission_amount }
    }

    // ── Calculate ──────────────────────────────────────────────────────
    const commissionAmount = paymentAmountUSD * COMMISSION_RATE

    console.log(`💰 [${source}] Creating ${COMMISSION_RATE * 100}% commission:`, {
      affiliateId,
      paymentId,
      paymentAmountUSD,
      commissionAmount,
    })

    // ── Insert ─────────────────────────────────────────────────────────
    const { data: commission, error: insertError } = await supabase
      .from('commissions')
      .insert({
        affiliate_id: affiliateId,
        referral_id: referralId,
        payment_id: paymentId,
        commission_type: 'learner_referral',
        base_amount: paymentAmountUSD,
        base_currency: 'USD',
        commission_rate: COMMISSION_RATE,
        commission_amount: commissionAmount,
        commission_currency: 'USD',
        status: 'available',
        notes: `AI Cashflow Sale (${COMMISSION_RATE * 100}% commission) [${source}]`,
      })
      .select()
      .single()

    if (insertError) {
      console.error(`❌ [${source}] Commission insert error:`, insertError)
      return { created: false, skipped: false, error: insertError.message }
    }

    console.log(`✅ [${source}] Commission created: $${commissionAmount}`, commission?.id)
    return { created: true, skipped: false, commissionId: commission?.id, commissionAmount }
  } catch (err: any) {
    console.error(`❌ [${source}] Unexpected commission error:`, err)
    return { created: false, skipped: false, error: err?.message || String(err) }
  }
}
