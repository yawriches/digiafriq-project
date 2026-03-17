import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Verify Paystack webhook signature
function verifyPaystackSignature(payload: string, signature: string): boolean {
  if (!paystackSecretKey || !signature) return false
  const hash = crypto
    .createHmac('sha512', paystackSecretKey)
    .update(payload)
    .digest('hex')
  return hash === signature
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature') || ''

    // Verify signature
    if (!verifyPaystackSignature(rawBody, signature)) {
      console.error('❌ Webhook: Invalid Paystack signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    console.log('🔔 Paystack Webhook received:', event.event)

    // Only handle successful charges
    if (event.event !== 'charge.success') {
      console.log('ℹ️ Webhook: Ignoring event type:', event.event)
      return NextResponse.json({ received: true })
    }

    const data = event.data
    const reference = data.reference
    const customerEmail = data.customer?.email

    console.log('🔔 Webhook charge.success:', {
      reference,
      email: customerEmail,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
    })

    // Check if payment record already exists and is completed with a membership
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status, user_id, membership_package_id')
      .eq('provider_reference', reference)
      .maybeSingle() as any

    if (existingPayment) {
      console.log('🔔 Webhook: Payment record found:', {
        id: existingPayment.id,
        status: existingPayment.status,
      })

      // If payment is already completed, check if membership exists
      if (existingPayment.status === 'completed') {
        const { data: existingMembership } = await supabase
          .from('user_memberships')
          .select('id')
          .eq('payment_id', existingPayment.id)
          .maybeSingle() as any

        if (existingMembership) {
          console.log('⚡ Webhook: Membership already exists, nothing to do')
          return NextResponse.json({ received: true, action: 'already_processed' })
        }

        // Payment completed but no membership — create it
        console.log('⚠️ Webhook: Payment completed but no membership, creating...')
        await createMembershipFromPayment(existingPayment)
        return NextResponse.json({ received: true, action: 'membership_created' })
      }

      // Payment exists but not completed — mark as completed and create membership
      console.log('🔄 Webhook: Updating payment status to completed...')
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          paid_at: data.paid_at || new Date().toISOString(),
        })
        .eq('id', existingPayment.id)

      existingPayment.status = 'completed'
      await createMembershipFromPayment(existingPayment)
      return NextResponse.json({ received: true, action: 'payment_completed_and_membership_created' })
    }

    // No payment record found — this can happen if initialization failed
    // Try to create payment + membership from webhook data
    console.log('⚠️ Webhook: No payment record found for reference, creating from webhook data...')

    const membershipPackageId = data.metadata?.membership_package_id
    const userId = data.metadata?.user_id

    if (!membershipPackageId) {
      console.error('❌ Webhook: No membership_package_id in metadata, cannot process')
      return NextResponse.json({ received: true, action: 'skipped_no_package_id' })
    }

    // Look up user by email if no user_id in metadata
    let resolvedUserId = userId
    if (!resolvedUserId && customerEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle() as any

      resolvedUserId = profile?.id
    }

    if (!resolvedUserId) {
      console.error('❌ Webhook: Cannot resolve user for payment, skipping membership creation')
      // Still create the payment record for tracking
      await supabase.from('payments').insert({
        membership_package_id: membershipPackageId,
        amount: data.amount / 100,
        currency: data.currency,
        payment_provider: 'paystack',
        payment_type: 'membership',
        status: 'completed',
        provider_reference: reference,
        paid_at: data.paid_at || new Date().toISOString(),
        metadata: data.metadata || {},
      })
      return NextResponse.json({ received: true, action: 'payment_saved_no_user' })
    }

    // Create payment record
    const { data: newPayment, error: createError } = await supabase
      .from('payments')
      .insert({
        user_id: resolvedUserId,
        membership_package_id: membershipPackageId,
        amount: data.amount / 100,
        currency: data.currency,
        payment_provider: 'paystack',
        payment_type: 'membership',
        status: 'completed',
        provider_reference: reference,
        paid_at: data.paid_at || new Date().toISOString(),
        metadata: data.metadata || {},
      })
      .select()
      .single() as any

    if (createError) {
      // Duplicate key — payment was likely just created by verify route
      if (createError.code === '23505') {
        console.log('⚡ Webhook: Payment already created (race condition with verify), skipping')
        return NextResponse.json({ received: true, action: 'already_exists' })
      }
      console.error('❌ Webhook: Failed to create payment:', createError)
      return NextResponse.json({ received: true, action: 'error', error: createError.message })
    }

    await createMembershipFromPayment(newPayment)
    return NextResponse.json({ received: true, action: 'full_creation' })

  } catch (error) {
    console.error('❌ Webhook: Unhandled error:', error)
    // Always return 200 to Paystack so they don't retry endlessly
    return NextResponse.json({ received: true, error: 'Internal error' })
  }
}

// Create membership and update roles from a completed payment
async function createMembershipFromPayment(payment: any) {
  try {
    const userId = payment.user_id
    if (!userId) {
      console.error('❌ Webhook createMembership: No user_id on payment')
      return
    }

    // Check idempotency — don't create duplicate memberships
    const { data: existingMembership } = await supabase
      .from('user_memberships')
      .select('id')
      .eq('payment_id', payment.id)
      .maybeSingle() as any

    if (existingMembership) {
      console.log('⚡ Webhook: Membership already exists for payment', payment.id)
      return
    }

    // Get membership package details
    const { data: membershipPackage, error: pkgError } = await supabase
      .from('membership_packages')
      .select('duration_months, member_type, name')
      .eq('id', payment.membership_package_id)
      .single() as any

    if (pkgError || !membershipPackage) {
      console.error('❌ Webhook: Membership package not found:', pkgError)
      return
    }

    // Create membership
    const startDate = new Date()
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + membershipPackage.duration_months)

    const membershipData: any = {
      user_id: userId,
      membership_package_id: payment.membership_package_id,
      payment_id: payment.id,
      started_at: startDate.toISOString(),
      expires_at: expiryDate.toISOString(),
      is_active: true,
      has_digital_cashflow_addon: payment.metadata?.has_digital_cashflow_addon === true || payment.metadata?.has_digital_cashflow_addon === 'true',
    }

    if (membershipPackage.member_type === 'affiliate') {
      membershipData.affiliate_lifetime_access = true
    }

    const { error: membershipError } = await supabase
      .from('user_memberships')
      .insert(membershipData)

    if (membershipError) {
      console.error('❌ Webhook: Failed to create membership:', membershipError)
      return
    }

    console.log('✅ Webhook: Membership created for user', userId)

    // Update user roles
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('available_roles, active_role')
      .eq('id', userId)
      .single() as any

    const currentRoles = currentProfile?.available_roles || []
    const updatedRoles = Array.from(new Set([...currentRoles, 'learner', 'affiliate']))
    const activeRole = currentProfile?.active_role || 'learner'

    await supabase
      .from('profiles')
      .update({
        available_roles: updatedRoles,
        active_role: activeRole,
      })
      .eq('id', userId)

    console.log('✅ Webhook: User roles updated:', updatedRoles)

  } catch (error) {
    console.error('❌ Webhook createMembership error:', error)
  }
}
