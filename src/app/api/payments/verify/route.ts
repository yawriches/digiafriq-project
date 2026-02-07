import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { completeReferral } from '@/lib/supabase/referrals'
import { processCommission } from '@/lib/commissions/process-commission'
import {
  createAccountAfterPayment,
  checkExistingAccount,
  sendMagicLinkToExistingUser,
  ensurePasswordAccountForReferral,
  type AccountCreationData
} from '@/lib/auth/account-creation'

function generateTemporaryPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

// Use service role client for payment verification (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

async function invokeEmailEvents(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('email-events', {
      body: payload,
    })

    if (error) {
      console.error('❌ email-events invoke error (verify):', {
        message: (error as any)?.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        context: (error as any)?.context,
        payload,
      })
      return false
    }

    console.log('✅ email-events invoked (verify):', { payload, data })
    return true
  } catch (e) {
    console.error('❌ email-events invoke exception (verify):', {
      error: e instanceof Error ? e.message : String(e),
      payload,
    })
    return false
  }
}

async function sendMembershipReceiptEmail(params: {
  customerEmail: string
  customerName: string
  membershipPackageName: string
  isUpgrade: boolean
  oldMembershipPackageName?: string
}): Promise<void> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const dashboardUrl = appUrl ? `${appUrl}/dashboard` : ''
  const communityUrl = 'https://t.me/digiafriq'

  if (!params.customerEmail) return

  if (params.isUpgrade) {
    const payload = {
      type: 'membership_upgrade',
      to: params.customerEmail,
      name: params.customerName,
      oldPackageName: params.oldMembershipPackageName || 'your previous plan',
      newPackageName: params.membershipPackageName,
      dashboardUrl,
      communityUrl,
    }

    console.log('📧 invoking email-events (membership_upgrade)', {
      to: params.customerEmail,
      newPackageName: params.membershipPackageName,
      oldPackageName: params.oldMembershipPackageName,
    })

    const ok = await invokeEmailEvents(payload)
    console.log('📧 email-events result (membership_upgrade)', { ok })
    return
  }

  const payload = {
    type: 'membership_purchase',
    to: params.customerEmail,
    name: params.customerName,
    packageName: params.membershipPackageName,
    dashboardUrl,
    communityUrl,
  }

  console.log('📧 invoking email-events (membership_purchase)', {
    to: params.customerEmail,
    packageName: params.membershipPackageName,
  })

  const ok = await invokeEmailEvents(payload)
  console.log('📧 email-events result (membership_purchase)', { ok })
}

// Payment provider interfaces
interface PaymentProvider {
  verifyTransaction(reference: string): Promise<any>
  getProviderName(): string
}

// Paystack provider implementation
class PaystackProvider implements PaymentProvider {
  private secretKey: string

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  getProviderName(): string {
    return 'paystack'
  }

  async verifyTransaction(reference: string): Promise<any> {
    console.log('🌐 Verifying with Paystack API:', reference)
    
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('📊 Paystack verification response:', data)
    return data
  }
}

// Kora provider implementation
class KoraProvider implements PaymentProvider {
  private secretKey: string

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  getProviderName(): string {
    return 'kora'
  }

  async verifyTransaction(reference: string): Promise<any> {
    console.log('🌐 Verifying with Kora API:', reference)
    
    // Correct Kora API endpoint from documentation
    const endpoint = `https://api.korapay.com/merchant/api/v1/charges/${reference}`
    
    console.log(`🔍 Using Kora endpoint: ${endpoint}`)
    
    const response = await fetch(endpoint, {
      method: 'GET', // Kora uses GET for verification
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📨 Kora API response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Kora API error (${response.status}):`, errorText)
      throw new Error(`Kora API error: ${response.status} - ${errorText}`)
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type')
    console.log(`📄 Response content type: ${contentType}`)

    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error(`❌ Kora API returned non-JSON response:`, text.substring(0, 200))
      throw new Error(`Kora API returned invalid response format. Expected JSON, got ${contentType || 'unknown'}`)
    }

    const data = await response.json()
    console.log(`✅ Kora verification response:`, data)
    
    // Validate Kora response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Kora response: not an object')
    }

    // Kora response should have data.status field according to documentation
    if (!data.data) {
      throw new Error('Invalid Kora response: missing data field')
    }

    // Normalize Kora response to match our expected format
    // Kora uses 'successful' while Paystack uses 'success' - normalize to 'success'
    const koraStatus = data.data.status?.toLowerCase();
    const normalizedStatus = (koraStatus === 'successful' || koraStatus === 'success') ? 'success' : koraStatus;
    
    const normalizedResponse = {
      status: true, // Kora returns 200 for successful API calls
      message: 'Verification successful',
      data: {
        ...data.data,
        status: normalizedStatus, // Normalized to 'success' for consistency
        reference: data.data.reference || reference,
        amount: data.data.amount,
        currency: data.data.currency,
        paid_at: data.data.paid_at || data.data.created_at,
        id: data.data.id || data.data.transaction_id
      }
    }

    console.log(`✅ Normalized Kora response:`, normalizedResponse)
    return normalizedResponse
  }
}

// Payment provider factory
class PaymentProviderFactory {
  static create(provider: string): PaymentProvider {
    switch (provider.toLowerCase()) {
      case 'paystack':
        return new PaystackProvider(process.env.PAYSTACK_SECRET_KEY!)
      case 'kora':
        return new KoraProvider(process.env.KORA_SECRET_KEY!)
      default:
        throw new Error(`Unsupported payment provider: ${provider}`)
    }
  }
}

// Helper function to process commission creation for referrals
async function processReferralCommissions(payment: any, verificationData: any) {
  console.log('🔗 Checking for referral commissions...')
  
  try {
    // Check if this user was referred (look for both pending and completed referrals)
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', payment.user_id)
      .in('status', ['pending', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single() as any

    if (referralError || !referral) {
      console.log('ℹ️ No pending referral found for user')
      return
    }

    console.log('✅ Found referral:', referral)

    const { data: referrerProfile, error: referrerProfileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', referral.referrer_id)
      .maybeSingle() as any

    if (referrerProfileError) {
      console.error('⚠️ Failed to load referrer profile email (verify):', referrerProfileError)
    }

    const referrerEmail = (referrerProfile as any)?.email as string | undefined

    // Name is crucial for commission emails. Prefer profiles.full_name, fallback to auth user metadata.
    let referrerName = (referrerProfile as any)?.full_name as string | undefined
    if (!referrerName || !String(referrerName).trim()) {
      try {
        const { data: authUser, error: authUserErr } = await supabase.auth.admin.getUserById(
          referral.referrer_id
        ) as any
        if (authUserErr) {
          console.error('⚠️ Failed to load auth user for referrer name (verify):', authUserErr)
        }
        referrerName =
          (authUser as any)?.user?.user_metadata?.full_name ||
          (authUser as any)?.user?.user_metadata?.name ||
          (authUser as any)?.user?.email?.split?.('@')?.[0]
      } catch (e) {
        console.error('⚠️ Exception loading auth user for referrer name (verify):', e)
      }
    }

    if (!referrerName || !String(referrerName).trim()) {
      console.error('❌ Missing referrer full_name; skipping commission email to avoid blank greeting', {
        referrerId: referral.referrer_id,
        referrerEmail,
      })
    }

    // Get membership package details to determine commission type
    const { data: membershipPackage, error: packageError } = await supabase
      .from('membership_packages')
      .select('member_type, name')
      .eq('id', payment.membership_package_id)
      .single() as any

    if (packageError || !membershipPackage) {
      console.error('❌ Failed to get membership package details:', packageError)
      return
    }

    console.log('📦 Membership package:', membershipPackage)

    // ── Centralized commission processor (idempotent, 59.78%) ───────────
    const paymentAmountUSD = payment.base_currency_amount || payment.amount || 10
    const result = await processCommission({
      supabase,
      affiliateId: referral.referrer_id,
      referralId: referral.id,
      paymentId: payment.id,
      paymentAmountUSD,
      source: 'verify',
    })

    if (result.skipped) {
      // Commission already exists — still mark referral as completed
      const referralCompleted = await completeReferral(referral.id)
      console.log('✅ Referral marked as completed (commission already existed):', referralCompleted)
      return
    }

    if (result.error) {
      console.error('❌ [verify] Commission failed:', result.error)
      return
    }

    const commissionAmount = result.commissionAmount ?? 0

    // Send commission email
    if (referrerEmail && referrerName && String(referrerName).trim()) {
      await invokeEmailEvents({
        type: 'commission',
        to: referrerEmail,
        name: referrerName,
        productName: membershipPackage.name,
        commissionAmount,
        communityUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/community` : 'https://digiafriq.com/community',
      })
    }

    // Mark referral as completed
    const referralCompleted = await completeReferral(referral.id)
    if (referralCompleted) {
      console.log('✅ Referral marked as completed')
    } else {
      console.error('❌ Failed to mark referral as completed')
    }

  } catch (commissionError) {
    console.error('❌ Error processing referral commissions:', commissionError)
    // Don't fail the payment verification if commission processing fails
  }
}

// Helper function to process membership creation
async function processMembershipCreation(payment: any, verificationData: any) {
  console.log('🎉 PAYMENT VERIFICATION COMPLETED SUCCESSFULLY')
  console.log('📋 Final payment record:', {
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    membership_package_id: payment.membership_package_id
  })

  // Get customer email from verification data
  const customerEmail = verificationData.data?.customer?.email
  
  // Fetch actual user name from profiles table if we have user_id
  let customerName = verificationData.data?.customer?.first_name 
    ? `${verificationData.data.customer.first_name} ${verificationData.data.customer.last_name || ''}`.trim()
    : verificationData.data?.customer?.email?.split('@')[0] || 'User'
  
  if (payment.user_id) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', payment.user_id)
        .maybeSingle() as any
      
      if (profile?.full_name && profile.full_name.trim()) {
        customerName = profile.full_name.trim()
        console.log('✅ Fetched user name from profile:', customerName)
      }
    } catch (error) {
      console.error('⚠️ Failed to fetch user name from profile:', error)
    }
  }

  console.log('👤 Customer info:', { email: customerEmail, name: customerName })

  // Get referral data from payment metadata
  // IMPORTANT: Prioritize payment record metadata (Kora doesn't return metadata in verification)
  const referralCode = payment.metadata?.referral_code || verificationData.data?.metadata?.referral_code
  const referralType = (payment.metadata?.referral_type || verificationData.data?.metadata?.referral_type) as 'learner' | 'affiliate' | undefined

  console.log('🔗 Referral info:', { 
    referralCode, 
    referralType,
    source: payment.metadata?.referral_code ? 'payment_record' : 'verification_data'
  })

  // Get membership package details - prioritize payment record over verification metadata
  // This is important because Kora doesn't return metadata in verification response like Paystack does
  const membershipPackageId = payment.membership_package_id || verificationData.data?.metadata?.membership_package_id
  console.log('🎫 Membership package ID:', membershipPackageId)
  console.log('🔍 Source: payment record =', payment.membership_package_id, ', verification metadata =', verificationData.data?.metadata?.membership_package_id)
  
  if (!membershipPackageId) {
    console.error('❌ No membership package ID found in payment record or verification metadata')
    return NextResponse.json({
      success: false,
      message: 'Missing membership package information'
    }, { status: 400 })
  }

  try {
    console.log('🔍 Looking up membership package details for ID:', membershipPackageId)
    
    // Get membership package details
    const { data: membershipPackage, error: membershipError } = await supabase
      .from('membership_packages')
      .select('duration_months, member_type, name')
      .eq('id', membershipPackageId)
      .maybeSingle() as any

    console.log('📊 Membership package query result:', {
      packageFound: !!membershipPackage,
      packageError: membershipError?.message,
      packageDetails: membershipPackage
    })

    if (membershipError || !membershipPackage) {
      console.error('❌ Failed to get membership package details:', membershipError)
      return NextResponse.json({
        success: false,
        message: 'Invalid membership package'
      }, { status: 400 })
    }

    console.log('✅ Membership package found:', {
      duration_months: membershipPackage.duration_months,
      member_type: membershipPackage.member_type,
      name: membershipPackage.name
    })

    // Check if account already exists
    let userId = payment.user_id
    let accountCreated = false
    let magicLinkSent = false
    let oldMembershipPackageName: string | undefined = undefined
    let temporaryPassword: string | undefined = undefined

    if (!userId && customerEmail) {
      console.log('🔍 No user_id in payment, checking if account exists for email:', customerEmail)
      
      const accountExists = await checkExistingAccount(customerEmail)
      
      if (accountExists) {
        console.log('✅ Account exists for email; using existing account')

        // Look up the user's current active membership package name (for upgrade email)
        try {
          // Resolve user id for this email (admin listUsers is not available here)
          const { data: profileForEmail } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .maybeSingle() as any

          const existingUserId = profileForEmail?.id

          const { data: existingMembership } = await supabase
            .from('user_memberships')
            .select('membership_package_id, membership_packages(name)')
            .eq('user_id', existingUserId)
            .eq('is_active', true)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle() as any

          oldMembershipPackageName = existingMembership?.membership_packages?.name
        } catch (e) {
          console.error('❌ Failed to lookup old membership package name (non-critical):', e)
        }

        // Existing account: resolve userId from profiles (needed for membership updates)
        try {
          const { data: profileForEmail, error: profileErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .maybeSingle() as any

          if (profileErr) {
            console.error('❌ Failed to resolve existing user id from profiles:', profileErr)
          }

          userId = profileForEmail?.id || userId
        } catch (e) {
          console.error('❌ Exception resolving existing user id from profiles:', e)
        }
      }

      if (!accountExists) {
        console.log('🆕 Creating new account after payment (temporary password flow)')

        temporaryPassword = generateTemporaryPassword()

        const accountData: AccountCreationData = {
          email: customerEmail,
          fullName: customerName,
          membershipType: membershipPackage.member_type,
          referralCode,
          referralType,
        }

        const createdAccount = await createAccountAfterPayment({
          ...accountData,
          temporaryPassword,
        } as any)

        if (!createdAccount) {
          console.error('❌ Failed to create account after payment')
          return NextResponse.json({
            success: false,
            message: 'Failed to create user account'
          }, { status: 500 })
        }

        console.log('✅ Account created successfully:', {
          userId: createdAccount.userId,
          email: createdAccount.email,
          magicLinkSent: createdAccount.magicLinkSent,
        })

        userId = createdAccount.userId
        accountCreated = true
        magicLinkSent = createdAccount.magicLinkSent

        // Update payment with user_id
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({ user_id: userId })
          .eq('id', payment.id) as any
          
        if (paymentUpdateError) {
          console.error('❌ Failed to update payment with user_id:', paymentUpdateError)
        } else {
          console.log('✅ Payment updated with user_id')
        }
      }
    }

    if (!userId) {
      console.error('❌ No user ID available for membership creation')
      return NextResponse.json({
        success: false,
        message: 'User identification failed'
      }, { status: 400 })
    }

    // Create user membership record
    const startDate = new Date()
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + membershipPackage.duration_months)

    console.log('📅 Creating user membership:', {
      user_id: userId,
      membership_package_id: membershipPackageId,
      payment_id: payment.id,
      start_date: startDate.toISOString(),
      expiry_date: expiryDate.toISOString()
    })

    // Check if this is an addon upgrade or new membership
    // IMPORTANT: Prioritize payment record metadata over provider metadata (Kora doesn't return metadata)
    const paymentMetadata = payment.metadata || {}
    const providerMetadata = verificationData.data?.metadata || {}
    const metadata = { ...providerMetadata, ...paymentMetadata } // Payment record takes precedence

    // Upgrade detection for dashboard flow:
    // - user upgrades membership package (not addon-only): metadata.is_upgrade === true
    // - addon-only upgrade (digital cashflow): payment_type === 'addon_upgrade' or metadata.is_addon_upgrade
    const isMembershipUpgrade =
      metadata.is_upgrade === true ||
      metadata.is_upgrade === 'true'
    
    // Also check payment_type column for addon_upgrade
    const isAddonUpgrade = payment.payment_type === 'addon_upgrade' || 
                           metadata.is_addon_upgrade === true || 
                           metadata.is_addon_upgrade === 'true'
    const hasDCSAddon = metadata.has_digital_cashflow_addon === true || 
                        metadata.has_digital_cashflow_addon === 'true'

    console.log('🔍 Addon detection:', { 
      isAddonUpgrade, 
      hasDCSAddon, 
      isMembershipUpgrade,
      paymentType: payment.payment_type,
      paymentMetadata,
      providerMetadata 
    })

    if (isAddonUpgrade) {
      // UPDATE existing membership with DCS addon
      console.log('🔄 Processing DCS addon upgrade for user:', userId)
      
      const { error: updateError } = await supabase
        .from('user_memberships')
        .update({
          has_digital_cashflow_addon: true
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (updateError) {
        console.error('❌ DATABASE ERROR: Failed to update membership with DCS addon:', updateError)
        console.error('❌ Full addon update error:', JSON.stringify(updateError, null, 2))
      } else {
        console.log('✅ DCS addon added to existing membership successfully')

        // Send upgrade email for DCS addon unlock (affiliate access requirement)
        // Note: we reuse membership_upgrade template for now.
        try {
          const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
          const dashboardUrl = appUrl ? `${appUrl}/dashboard` : ''
          const communityUrl = 'https://t.me/digiafriq'

          console.log('📧 invoking email-events (membership_upgrade: dcs_addon)', {
            to: customerEmail,
          })

          const ok = await invokeEmailEvents({
            type: 'membership_upgrade',
            to: customerEmail,
            name: customerName,
            oldPackageName: 'your previous plan',
            newPackageName: 'Digital Cashflow System',
            dashboardUrl,
            communityUrl,
          })
          console.log('📧 email-events result (membership_upgrade: dcs_addon)', { ok })
        } catch (e) {
          console.error('❌ Failed to invoke DCS addon upgrade email via email-events (non-critical):', e)
        }
      }
    } else {
      // CREATE new membership
      const membershipData: any = {
        user_id: userId,
        membership_package_id: membershipPackageId,
        payment_id: payment.id,
        started_at: startDate.toISOString(),
        expires_at: expiryDate.toISOString(),
        is_active: true,
        has_digital_cashflow_addon: hasDCSAddon
      };

      // Add lifetime access for affiliate memberships
      if (membershipPackage.member_type === 'affiliate') {
        membershipData.affiliate_lifetime_access = true;
        console.log('👑 Lifetime affiliate access granted');
      }

      console.log('📝 Creating membership with data:', membershipData)

      const { error: membershipCreateError } = await supabase
        .from('user_memberships')
        .insert(membershipData) as any

      if (membershipCreateError) {
        console.error('❌ DATABASE ERROR: Failed to create user membership:', membershipCreateError)
        console.error('❌ Full membership creation error:', JSON.stringify(membershipCreateError, null, 2))
      } else {
        console.log('✅ User membership created successfully with DCS addon:', hasDCSAddon)
      }
    }

    // AI Cashflow Program: Grant both learner AND affiliate access for all payments
    // Since AI Cashflow is the single entry point, all paying users get full access
    console.log('🎯 AI Cashflow payment detected, granting full access (learner + affiliate)...')
    
    // Get current available_roles
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('available_roles, active_role')
      .eq('id', userId)
      .single() as any

    const currentRoles = currentProfile?.available_roles || []
    // Add both learner and affiliate roles
    const updatedRoles = Array.from(new Set([...currentRoles, 'learner', 'affiliate']))
    
    // Keep current active_role if set, otherwise default to learner
    const activeRole = currentProfile?.active_role || 'learner'
    
    const { error: roleUpdateError } = await supabase
      .from('profiles')
      .update({ 
        available_roles: updatedRoles,
        active_role: activeRole
      })
      .eq('id', userId) as any

    if (roleUpdateError) {
      console.error('❌ DATABASE ERROR: Failed to update user roles:', roleUpdateError)
      console.error('❌ Full role update error:', JSON.stringify(roleUpdateError, null, 2))
    } else {
      console.log('✅ User granted full access with available_roles:', updatedRoles)
    }

    // Send referral signup email ONLY when this payment is via referral link.
    // (Referral signup payments are created through the referral flow and require a temporary password.)
    const isReferralSignupPayment =
      payment.payment_type === 'referral_membership' ||
      metadata.is_referral_signup === true ||
      metadata.is_referral_signup === 'true' ||
      Boolean(referralCode)

    // For referral signups we require: a password-based account exists + we email the temporary password.
    // If the email already exists, we reset the password to a new temporary one.
    if (isReferralSignupPayment && customerEmail) {
      try {
        console.log('🔐 Ensuring password-based account for referral signup payment')

        temporaryPassword = generateTemporaryPassword()

        const ensured = await ensurePasswordAccountForReferral({
          email: customerEmail,
          fullName: customerName,
          membershipType: membershipPackage.member_type,
          referralCode,
          referralType,
          temporaryPassword,
          supabaseAdmin: supabase, // Pass service role client for admin operations
        })

        if (ensured?.userId) {
          if (!payment.user_id || payment.user_id !== ensured.userId) {
            const { error: paymentUpdateError } = await supabase
              .from('payments')
              .update({ user_id: ensured.userId })
              .eq('id', payment.id) as any

            if (paymentUpdateError) {
              console.error('❌ Failed to update payment with ensured user_id:', paymentUpdateError)
            } else {
              console.log('✅ Payment updated with ensured user_id')
            }
          }

          userId = ensured.userId
          accountCreated = ensured.created
          console.log('✅ Password account ensured:', { userId, accountCreated, hasTemporaryPassword: Boolean(temporaryPassword) })
        } else {
          console.error('❌ Failed to ensure password-based account for referral signup', {
            customerEmail,
            customerName,
            membershipType: membershipPackage?.member_type,
            hasReferralCode: Boolean(referralCode),
          })
          // Set temporaryPassword to undefined to skip email
          temporaryPassword = undefined
        }
      } catch (e) {
        console.error('❌ Exception ensuring password-based account for referral signup:', e)
      }
    }

    if (isReferralSignupPayment) {
      if (!customerEmail) {
        console.error('❌ Referral signup detected but missing customerEmail; cannot send signup_referral email', {
          paymentId: payment.id,
          reference: payment.reference,
        })
      } else {
        console.log('📧 Preparing referral signup email', {
          accountCreated,
          hasTemporaryPassword: Boolean(temporaryPassword),
          paymentType: payment.payment_type,
          referralCode,
        })

        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
        const loginUrl = appUrl ? `${appUrl}/login` : ''

        try {
          // Referral signup requirement: always include a real temporary password.
          const payload: Record<string, unknown> = {
            type: 'signup_referral',
            to: customerEmail,
            name: customerName,
            email: customerEmail,
            packageName: membershipPackage?.name || membershipPackage?.member_type || 'selected',
            loginUrl,
          }

          if (!temporaryPassword) {
            console.error('❌ Referral signup email requires temporaryPassword but none was generated; skipping email (non-fatal)', {
              paymentId: payment.id,
              reference: payment.reference,
              accountCreated,
            })
            // Don't block payment verification - just skip the email
          } else {
            payload.temporaryPassword = temporaryPassword
            console.log('📧 Sending referral signup email with temporary password', { accountCreated })

          console.log('📧 invoking email-events (signup_referral)', {
            to: customerEmail,
            packageName: payload.packageName,
            accountCreated,
          })

            const ok = await invokeEmailEvents(payload)
            console.log('📧 email-events result (signup_referral)', { ok })
          }
        } catch (welcomeEmailErr) {
          console.error('❌ Failed to invoke referral signup email via email-events (non-critical):', welcomeEmailErr)
        }
      }
    } else {
      console.log('ℹ️ Not a referral signup payment; skipping signup_referral email', {
        paymentType: payment.payment_type,
        hasReferralCode: Boolean(referralCode),
        is_referral_signup: metadata.is_referral_signup,
      })
    }

    // Process referral commissions
    await processReferralCommissions(payment, verificationData)

    // Send dashboard membership purchase/upgrade emails (non-referral flow)
    // - membership_purchase: user buys membership via dashboard
    // - membership_upgrade: user upgrades membership via dashboard
    // Skip addon upgrades and accounts created via referral (handled by signup_referral email above)
    if (!accountCreated && customerEmail && !isAddonUpgrade && !isReferralSignupPayment) {
      try {
        await sendMembershipReceiptEmail({
          customerEmail,
          customerName,
          membershipPackageName: membershipPackage?.name || 'your membership',
          isUpgrade: Boolean(isMembershipUpgrade),
          oldMembershipPackageName,
        })
      } catch (receiptErr) {
        console.error('❌ Failed to invoke membership receipt email via email-events (non-critical):', receiptErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      accountCreated,
      magicLinkSent,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: 'completed',
        membership_package_id: membershipPackageId
      }
    })

  } catch (membershipError) {
    console.error('❌ ERROR: Exception during membership processing:', membershipError)
    console.error('❌ Full membership exception:', JSON.stringify(membershipError, null, 2))
    
    return NextResponse.json({
      success: false,
      message: 'Membership creation failed',
      details: membershipError instanceof Error ? membershipError.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { reference, user_id } = await request.json()

    console.log('🔍 PAYMENT VERIFICATION STARTED')
    console.log('📥 Request data:', { reference, user_id })

    if (!reference) {
      console.log('❌ ERROR: No payment reference provided')
      return NextResponse.json(
        { success: false, message: 'Payment reference is required' },
        { status: 400 }
      )
    }

    console.log('✅ Reference validated:', reference)

    try {
      console.log('🔍 Looking up payment in database with reference:', reference)
      console.log('🔍 Search details:', { reference, user_id })

      // First, check if payment exists in our database (check provider_reference column)
      let payment: any = null
      let paymentError: any = null
      
      try {
        const { data: initialPayment, error: initialError } = await supabase
          .from('payments')
          .select(`
            id,
            user_id,
            membership_package_id,
            amount,
            currency,
            base_currency_amount,
            status,
            provider_reference,
            payment_provider,
            payment_type,
            metadata,
            created_at
          `)
          .eq('provider_reference', reference)
          .maybeSingle() as any

        payment = initialPayment
        paymentError = initialError
      } catch (queryError) {
        console.error('❌ Database query error:', queryError)
        paymentError = queryError
      }

      console.log('📊 Database query result:', { 
        paymentFound: !!payment, 
        paymentError: paymentError?.message,
        paymentId: payment?.id,
        paymentStatus: payment?.status,
        paymentUserId: payment?.user_id,
        requestedUserId: user_id,
        paymentProvider: payment?.payment_provider,
        providerReference: payment?.provider_reference
      })

      // If payment not found with provider_reference, try to find it by user_id and recent creation
      if (!payment || paymentError) {
        console.log('🔍 Payment not found by reference, searching by user and recent creation...')
        
        let recentPayment: any = null
        let recentError: any = null
        
        try {
          const { data: foundRecentPayment, error: foundRecentError } = await supabase
            .from('payments')
            .select(`
              id,
              user_id,
              membership_package_id,
              amount,
              currency,
              base_currency_amount,
              status,
              provider_reference,
              payment_provider,
              payment_type,
              metadata,
              created_at
            `)
            .eq('user_id', user_id)
            .eq('status', 'pending')
            .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Last 30 minutes
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle() as any

          recentPayment = foundRecentPayment
          recentError = foundRecentError
        } catch (recentQueryError) {
          console.error('❌ Recent payment query error:', recentQueryError)
          recentError = recentQueryError
        }

        console.log('📊 Recent payment search result:', {
          recentPaymentFound: !!recentPayment,
          recentError: recentError?.message,
          recentPaymentId: recentPayment?.id,
          recentPaymentStatus: recentPayment?.status,
          recentProviderReference: recentPayment?.provider_reference
        })

        if (recentPayment && !recentError) {
          console.log('✅ Found recent payment, using it for verification')
          
          // Update the payment with the provider reference if it's missing
          if (!recentPayment.provider_reference) {
            console.log('🔄 Updating recent payment with provider reference...')
            try {
              const { error: updateError } = await supabase
                .from('payments')
                .update({ provider_reference: reference })
                .eq('id', recentPayment.id)
              
              if (updateError) {
                console.error('❌ Failed to update provider reference:', updateError)
              } else {
                console.log('✅ Updated provider reference for recent payment')
                recentPayment.provider_reference = reference
              }
            } catch (updateError) {
              console.error('❌ Exception updating provider reference:', updateError)
            }
          }
          
          payment = recentPayment
          paymentError = null
        }
      }

      if (paymentError) {
        console.error('❌ DATABASE ERROR: Payment not found in database:', paymentError)
        console.error('❌ Full error details:', JSON.stringify(paymentError, null, 2))
        return NextResponse.json(
          { success: false, message: 'Payment not found', details: paymentError.message },
          { status: 404 }
        )
      }

      // If payment doesn't exist, we need to create it after verification
      if (!paymentError && !payment) {
        console.log('❌ PAYMENT RECORD NOT FOUND: No payment record exists in database for reference:', reference)
        console.log('🔄 Will create payment record if verification succeeds')
        
        // Try to verify with all providers to find which one has the transaction
        let verificationData = null
        let providerUsed = null

        // Helper to check if payment status indicates success (handles both 'success' and 'successful')
        const isPaymentSuccessful = (status: string | undefined) => {
          const normalizedStatus = status?.toLowerCase();
          return normalizedStatus === 'success' || normalizedStatus === 'successful';
        };

        // Try Paystack first
        try {
          const paystackProvider = PaymentProviderFactory.create('paystack')
          verificationData = await paystackProvider.verifyTransaction(reference)
          if (verificationData.status && isPaymentSuccessful(verificationData.data.status)) {
            providerUsed = 'paystack'
            console.log('✅ Transaction found in Paystack')
          }
        } catch (paystackError) {
          console.log('❌ Paystack verification failed:', (paystackError as Error).message)
        }

        // If Paystack failed, try Kora
        if (!verificationData || !verificationData.status || !isPaymentSuccessful(verificationData.data.status)) {
          try {
            const koraProvider = PaymentProviderFactory.create('kora')
            verificationData = await koraProvider.verifyTransaction(reference)
            if (verificationData.status && isPaymentSuccessful(verificationData.data.status)) {
              providerUsed = 'kora'
              console.log('✅ Transaction found in Kora')
            }
          } catch (koraError) {
            console.log('❌ Kora verification failed:', (koraError as Error).message)
          }
        }

        if (!verificationData || !verificationData.status || !providerUsed) {
          console.log('❌ VERIFICATION FAILED: Transaction not found in any provider')
          return NextResponse.json({
            success: false,
            message: 'Payment verification failed - transaction not found in any payment provider',
            details: 'The reference was not found in Paystack or Kora systems'
          })
        }

        console.log('✅ VERIFICATION SUCCESSFUL with provider:', providerUsed)
        console.log('✅ Payment status:', verificationData.data.status)
        
        // Create payment record as fallback
        const membershipPackageId = verificationData.data?.metadata?.membership_package_id
        if (!membershipPackageId) {
          console.error('❌ Cannot create fallback payment: No membership_package_id in verification metadata')
          return NextResponse.json({
            success: false,
            message: 'Payment verification failed - missing membership information'
          })
        }

        console.log('🔄 Creating fallback payment record...')
        const { data: newPayment, error: createError } = await supabase
          .from('payments')
          .insert({
            user_id: user_id,
            membership_package_id: membershipPackageId,
            amount: verificationData.data.amount / 100, // Convert from kobo/cents
            currency: verificationData.data.currency,
            payment_provider: providerUsed,
            payment_type: 'membership',
            status: 'completed',
            provider_reference: reference, // Use provider_reference for all providers
            paid_at: verificationData.data.paid_at || new Date().toISOString()
          })
          .select()
          .single() as any

        if (createError) {
          console.error('❌ Failed to create fallback payment record:', createError)
          
          // Check if it's a duplicate key error - if so, try to find existing record
          if (createError.code === '23505') {
            console.log('🔄 Duplicate payment detected, trying to find existing record...')
            const { data: existingPayment } = await supabase
              .from('payments')
              .select('*')
              .eq('provider_reference', reference)
              .single() as any
              
            if (existingPayment) {
              console.log('✅ Found existing payment record:', existingPayment)
              return await processMembershipCreation(existingPayment, verificationData)
            } else {
              return NextResponse.json({
                success: false,
                message: 'Payment record conflict',
                details: 'Duplicate payment reference detected'
              })
            }
          } else {
            return NextResponse.json({
              success: false,
              message: 'Failed to create payment record',
              details: createError.message
            })
          }
        } else {
          console.log('✅ Fallback payment record created successfully:', newPayment)
          return await processMembershipCreation(newPayment, verificationData)
        }
      }

      if (!payment) {
        console.error('❌ PAYMENT RECORD NOT FOUND: No payment record exists in database for reference:', reference)
        console.error('❌ This means the payment initialization may have failed or the record was not saved')
        return NextResponse.json(
          { success: false, message: 'Payment record not found in database', details: 'Payment was successful but record not saved in system' },
          { status: 404 }
        )
      }

      // If payment is already completed, return success
      if (payment.status === 'completed') {
        console.log('✅ PAYMENT ALREADY VERIFIED - No action needed')
        console.log('📋 Payment details:', {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          membership_package_id: payment.membership_package_id
        })
        return NextResponse.json({
          success: true,
          message: 'Payment already verified',
          payment: {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            membership_package_id: payment.membership_package_id || null
          }
        })
      }

      console.log('🔄 Payment not completed yet, proceeding with provider verification')
      console.log('💳 Current payment status:', payment.status)
      console.log('💳 Payment provider:', payment.payment_provider)

      // Verify with the appropriate payment provider
      let provider: PaymentProvider
      try {
        provider = PaymentProviderFactory.create(payment.payment_provider || 'paystack')
      } catch (providerError) {
        console.error('❌ CONFIGURATION ERROR: Unsupported payment provider:', payment.payment_provider)
        return NextResponse.json(
          { success: false, message: 'Unsupported payment provider', details: (providerError as Error).message },
          { status: 500 }
        )
      }

      console.log(`🌐 Starting verification with ${provider.getProviderName()} API...`)

      let verificationData
      try {
        verificationData = await provider.verifyTransaction(reference)
        console.log('📊 Provider verification response:', JSON.stringify(verificationData, null, 2))
      } catch (verificationError) {
        console.error('❌ ERROR: Failed to verify with provider:', verificationError)
        console.error('❌ Full verification error:', JSON.stringify(verificationError, null, 2))
        return NextResponse.json(
          { success: false, message: 'Payment verification failed with provider', details: (verificationError as Error).message },
          { status: 500 }
        )
      }

      // Check for successful payment - accept both 'success' and 'successful' (Kora uses 'successful')
      const paymentStatus = verificationData.data.status?.toLowerCase();
      const isSuccessful = paymentStatus === 'success' || paymentStatus === 'successful';
      
      if (!verificationData.status || !isSuccessful) {
        console.log('❌ PROVIDER VERIFICATION FAILED')
        console.log('❌ Provider response:', {
          status: verificationData.status,
          message: verificationData.message,
          dataStatus: verificationData.data.status,
          normalizedStatus: paymentStatus,
          isSuccessful,
          data: verificationData.data
        })
      
        console.log('🔄 Updating payment status to failed in database...')
        
        // Update payment status to failed
        const { error: updateError } = await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id) as any

        if (updateError) {
          console.error('❌ DATABASE ERROR: Failed to update payment status to failed:', updateError)
        }

        return NextResponse.json({
          success: false,
          message: 'Payment verification failed',
          details: `Payment status: ${verificationData.data.status || 'unknown'}`
        })
      }

      console.log('✅ PROVIDER VERIFICATION SUCCESSFUL')
      console.log('💰 Payment details from provider:', {
        amount: verificationData.data.amount,
        currency: verificationData.data.currency,
        paid_at: verificationData.data.paid_at,
        transaction_id: verificationData.data.id
      })

      console.log('🔄 Updating payment status to completed in database...')
      
      // Update payment status to completed
      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          paid_at: verificationData.data.paid_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id) as any

      if (updateError) {
        console.error('❌ DATABASE ERROR: Failed to update payment status:', updateError)
        console.error('❌ Full update error:', JSON.stringify(updateError, null, 2))
        return NextResponse.json(
          { success: false, message: 'Failed to update payment status', details: updateError.message },
          { status: 500 }
        )
      }

      console.log('✅ Payment status updated to completed successfully')

      // Continue with membership creation
      return await processMembershipCreation(payment, verificationData)

    } catch (error) {
      console.error('💥 CRITICAL ERROR: Payment verification failed with exception:', error)
      console.error('💥 Full error details:', JSON.stringify(error, null, 2))
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('💥 CRITICAL ERROR: Request parsing failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Invalid request format',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}
