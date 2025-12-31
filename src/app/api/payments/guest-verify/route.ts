import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { sendEmail } from '@/../lib/email'

// Create Supabase admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function invokeEmailEvents(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.functions.invoke('email-events', {
      body: payload,
    })

    if (error) {
      console.error('❌ email-events invoke error (guest-verify):', {
        message: (error as any)?.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        context: (error as any)?.context,
        payload,
      })
      return false
    }

    console.log('✅ email-events invoked (guest-verify):', {
      payload,
      data,
    })
    return true
  } catch (e) {
    console.error('❌ email-events invoke exception (guest-verify):', {
      error: e instanceof Error ? e.message : String(e),
      payload,
    })
    return false
  }
}

// Payment provider interfaces (same as verify route)
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
    
    const endpoint = `https://api.korapay.com/merchant/api/v1/charges/${reference}`
    console.log(`🔍 Using Kora endpoint: ${endpoint}`)
    
    const response = await fetch(endpoint, {
      method: 'GET',
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

    const data = await response.json()
    console.log(`✅ Kora verification response:`, data)
    
    // Normalize Kora response - Kora uses 'successful' while Paystack uses 'success'
    const koraStatus = data.data?.status?.toLowerCase()
    const normalizedStatus = (koraStatus === 'successful' || koraStatus === 'success') ? 'success' : koraStatus
    
    return {
      status: true,
      message: 'Verification successful',
      data: {
        ...data.data,
        status: normalizedStatus,
        reference: data.data?.reference || reference,
        amount: data.data?.amount,
        currency: data.data?.currency,
        paid_at: data.data?.paid_at || data.data?.created_at
      }
    }
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

// Helper to check if payment status indicates success
const isPaymentSuccessful = (status: string | undefined) => {
  const normalizedStatus = status?.toLowerCase()
  return normalizedStatus === 'success' || normalizedStatus === 'successful'
}

// Generate a strong random temporary password
function generateTempPassword(): string {
  // Generate 12 random bytes and convert to base64
  const randomBytes = crypto.randomBytes(12)
  // Create a password with uppercase, lowercase, numbers, and special chars
  const base = randomBytes.toString('base64').slice(0, 12)
  // Ensure it meets password requirements by adding specific characters
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'
  const numbers = '23456789'
  const special = '!@#$%'
  
  // Build password: 2 uppercase + 4 lowercase + 3 numbers + 1 special + 2 random
  const password = 
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)] +
    base.slice(0, 2)
  
  // Shuffle the password characters
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

function getTempPasswordExpiryIso(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

async function sendGuestTempPasswordEmail(params: {
  email: string
  fullName: string
  temporaryPassword: string
}): Promise<boolean> {
  try {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
    const loginUrl = `${appUrl}/login`

    await sendEmail({
      to: params.email,
      subject: 'Welcome to DigiafrIQ — Your Temporary Password',
      template: 'signup.html',
      placeholders: {
        name: params.fullName,
        email: params.email,
        temporaryPassword: params.temporaryPassword,
        loginUrl,
        year: new Date().getFullYear(),
      },
    })

    console.log('✅ Guest temp password email sent to:', params.email)
    return true
  } catch (e) {
    console.error('❌ Failed to send guest temp password email:', {
      email: params.email,
      error: e instanceof Error ? e.message : String(e),
    })
    return false
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 Guest verify API called')
  
  try {
    const body = await request.json()
    console.log('📦 Request body:', JSON.stringify(body, null, 2))
    
    let { reference, referral_code, referral_type } = body

    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Payment reference is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Verifying guest payment:', { reference, referral_code, referral_type })

    // Step 1: Get payment record from database to determine provider
    // NOTE: In this project schema, payments are identified by provider_reference.
    // There is no payments.reference column.
    let paymentRecord = null
    
    // Try provider_reference first
    const { data: recordByProviderRef } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_reference', reference)
      .maybeSingle()
    
    if (recordByProviderRef) {
      paymentRecord = recordByProviderRef
      console.log('✅ Found payment by provider_reference')
    } else {
      // Fallback: Try recent pending payments and match by provider_reference or metadata.reference
      // (Kora may stash the reference inside metadata)
      const { data: recentPayments } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('created_at', { ascending: false })
        .limit(25)

      if (recentPayments) {
        paymentRecord = recentPayments.find((p: any) =>
          p.provider_reference === reference ||
          p.metadata?.reference === reference
        )

        if (paymentRecord) {
          console.log('✅ Found payment in recent pending payments')
        }
      }

      if (!paymentRecord) {
        console.log('⚠️ No payment record found in database, will verify directly with provider')
      }
    }

    console.log('💳 Payment record found:', !!paymentRecord)
    if (paymentRecord) {
      console.log('💳 Payment record details:', {
        id: paymentRecord.id,
        provider: paymentRecord.payment_provider,
        status: paymentRecord.status,
        membership_package_id: paymentRecord.membership_package_id,
        hasMetadata: !!paymentRecord.metadata,
        metadataKeys: paymentRecord.metadata ? Object.keys(paymentRecord.metadata) : []
      })
    }

    // Step 2: Verify payment with providers (same pattern as authenticated verify route)
    // Try both providers to find the transaction
    let verificationData: any = null
    let providerUsed: string | null = null

    // Try Paystack first
    try {
      console.log('🔍 Trying Paystack verification...')
      const paystackProvider = PaymentProviderFactory.create('paystack')
      verificationData = await paystackProvider.verifyTransaction(reference)
      if (verificationData.status && isPaymentSuccessful(verificationData.data?.status)) {
        providerUsed = 'paystack'
        console.log('✅ Transaction found in Paystack')
      }
    } catch (paystackError) {
      console.log('❌ Paystack verification failed:', (paystackError as Error).message)
    }

    // If Paystack failed, try Kora
    if (!verificationData || !verificationData.status || !isPaymentSuccessful(verificationData.data?.status)) {
      try {
        console.log('🔍 Trying Kora verification...')
        const koraProvider = PaymentProviderFactory.create('kora')
        verificationData = await koraProvider.verifyTransaction(reference)
        if (verificationData.status && isPaymentSuccessful(verificationData.data?.status)) {
          providerUsed = 'kora'
          console.log('✅ Transaction found in Kora')
        }
      } catch (koraError) {
        console.log('❌ Kora verification failed:', (koraError as Error).message)
      }
    }

    // If neither provider found the transaction
    if (!verificationData || !verificationData.status || !providerUsed) {
      console.log('❌ VERIFICATION FAILED: Transaction not found in any provider')
      return NextResponse.json({
        success: false,
        message: 'Payment verification failed - transaction not found in any payment provider'
      }, { status: 400 })
    }

    console.log('✅ VERIFICATION SUCCESSFUL with provider:', providerUsed)
    console.log('✅ Payment status:', verificationData.data?.status)

    // Extract data from verification response or payment record
    const paymentData = verificationData.data
    // For Kora, metadata comes from payment record; for Paystack, from verification response
    let metadata = providerUsed === 'kora' 
      ? (paymentRecord?.metadata || {}) 
      : (verificationData.data?.metadata || paymentRecord?.metadata || {})
    
    console.log('📦 Using metadata:', JSON.stringify(metadata, null, 2))

    let email = metadata.guest_email || metadata.email || metadata.user_email || paymentData.customer?.email
    let fullName = metadata.guest_name || metadata.full_name || metadata.user_name || email?.split('@')[0] || 'User'
    let phone = metadata.phone_number || metadata.user_phone || ''
    let country = metadata.guest_country || metadata.country || metadata.user_country || 'Ghana'

    // Extract referral code from metadata if not provided in request body
    if (!referral_code && metadata.referral_code) {
      referral_code = metadata.referral_code
      referral_type = metadata.referral_type || 'learner'
      console.log('📎 Found referral code in metadata:', referral_code)
    }

    if (!email) {
      console.error('❌ No email found in payment data or metadata')
      return NextResponse.json(
        { success: false, message: 'No email found in payment data. Please contact support.' },
        { status: 400 }
      )
    }

    console.log('✅ Payment verified, creating account for:', { email, fullName, country, referral_code })

    // Step 2: Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    let userId: string

    // Temporary password handling (never stored/returned)
    // - For new users: create user with temp password
    // - For existing users: if they haven't set a password yet or temp password is expired/missing, reset to a new temp password
    let tempPassword: string | null = null
    let tempPasswordEmailSent = false
    let isNewUser = false

    if (existingUser) {
      // User exists, use their ID
      userId = existingUser.id
      console.log('👤 User already exists:', userId)

      // Fetch profile to determine whether we should issue/reset a temp password
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('password_set, temp_password_expires_at, full_name')
        .eq('id', userId)
        .maybeSingle()

      const passwordSet = Boolean((existingProfile as any)?.password_set)
      const expiresAt = (existingProfile as any)?.temp_password_expires_at as string | null | undefined
      const isExpired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : true

      const shouldIssueTempPassword = !passwordSet && isExpired

      if (shouldIssueTempPassword) {
        tempPassword = generateTempPassword()
        const tempPasswordExpiresAt = getTempPasswordExpiryIso()

        // Reset password via admin API (do not store it anywhere)
        const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: tempPassword,
          user_metadata: {
            ...existingUser.user_metadata,
            has_temp_password: true,
            temp_password_issued_at: new Date().toISOString(),
          },
        })

        if (updateAuthErr) {
          console.error('❌ Failed to set temp password for existing user:', updateAuthErr)
          return NextResponse.json(
            { success: false, message: 'Failed to generate login credentials. Please contact support.' },
            { status: 500 }
          )
        }

        // Store only the expiry timestamp (no plain password)
        await supabaseAdmin
          .from('profiles')
          .update({
            password_set: false,
            temp_password_expires_at: tempPasswordExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        const nameForEmail = (existingProfile as any)?.full_name || fullName
        tempPasswordEmailSent = await sendGuestTempPasswordEmail({
          email,
          fullName: nameForEmail,
          temporaryPassword: tempPassword,
        })
      }
      
      // Update existing user's profile with payment status
      await supabaseAdmin
        .from('profiles')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    } else {
      // Generate a strong temporary password
      tempPassword = generateTempPassword()
      isNewUser = true
      console.log('🔐 Generated temporary password for new user')

      // Step 3: Create new user account WITH password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword, // Set the temporary password
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
          country,
          created_via: 'guest_checkout',
          referral_code,
          referral_type,
          has_temp_password: true // Flag to indicate temp password
        }
      })

      if (createError || !newUser?.user) {
        console.error('❌ Failed to create user:', createError)
        console.error('❌ Create user error details:', JSON.stringify(createError, null, 2))
        return NextResponse.json(
          { success: false, message: `Failed to create account: ${createError?.message || 'Unknown error'}` },
          { status: 500 }
        )
      }

      userId = newUser.user.id
      console.log('✅ New user created in Supabase Auth:', userId)

      // Calculate temp password expiry (24 hours from now)
      const tempPasswordExpiresAt = getTempPasswordExpiryIso()

      // Step 4: Create profile with payment_status, password_set, and temp_password_expires_at
      // NOTE: Never store the plain temp password in the database.
      console.log('📝 Creating profile for user:', userId)
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          phone,
          country,
          active_role: 'learner',
          available_roles: ['learner'],
          payment_status: 'paid',
          password_set: false,
          temp_password_expires_at: tempPasswordExpiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) {
        console.error('❌ Profile creation error:', profileError)
        console.error('❌ Profile error details:', JSON.stringify(profileError, null, 2))
        // Don't fail the whole request, but log the error
      } else {
        console.log('✅ Profile created successfully:', profileData?.id)
      }

      // Send temp password via email ONLY (never returned)
      tempPasswordEmailSent = await sendGuestTempPasswordEmail({
        email,
        fullName,
        temporaryPassword: tempPassword,
      })
    }

    // Step 5: Create or update payment record
    // First check if payment record already exists (created during initialization)
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_reference', reference)
      .single()
    
    let payment: any
    let paymentError: any
    
    if (existingPayment) {
      // Update existing payment record
      console.log('📝 Updating existing payment record:', existingPayment.id)
      const { data: updatedPayment, error: updateError } = await supabaseAdmin
        .from('payments')
        .update({
          user_id: userId,
          status: 'completed',
          paid_at: new Date().toISOString(),
          metadata: {
            ...existingPayment.metadata,
            guest_checkout: true,
            auto_created_account: !existingUser
          }
        })
        .eq('id', existingPayment.id)
        .select()
        .single()
      
      payment = updatedPayment
      paymentError = updateError
    } else {
      // Create new payment record (fallback)
      console.log('📝 Creating new payment record')
      const { data: newPayment, error: createError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: userId,
          membership_package_id: metadata.membership_package_id,
          amount: paymentData.amount / 100, // Convert from kobo/pesewas to main currency
          currency: paymentData.currency,
          status: 'completed',
          provider: providerUsed, // Use actual provider (paystack or kora)
          provider_reference: reference,
          payment_type: metadata.payment_type || 'membership',
          metadata: {
            ...metadata,
            guest_checkout: true,
            auto_created_account: !existingUser
          },
          paid_at: new Date().toISOString()
        })
        .select()
        .single()
      
      payment = newPayment
      paymentError = createError
    }

    if (paymentError) {
      console.error('❌ Payment record error:', paymentError)
      return NextResponse.json(
        { success: false, message: 'Failed to record payment' },
        { status: 500 }
      )
    }

    console.log('💰 Payment recorded:', payment?.id || 'unknown')

    // Critical: ensure we have a valid payment row loaded from DB before processing referrals.
    // This avoids FK failures when inserting commissions.
    const { data: paymentReload, error: paymentReloadError } = await supabaseAdmin
      .from('payments')
      .select('id, provider_reference, status, base_currency_amount')
      .eq('id', payment.id)
      .maybeSingle()

    if (paymentReloadError || !paymentReload) {
      console.error('❌ Failed to reload payment row after write:', paymentReloadError)
      console.error('❌ Payment reload error details:', JSON.stringify(paymentReloadError, null, 2))
    } else {
      console.log('✅ Payment reloaded for commissions:', {
        id: paymentReload.id,
        provider_reference: paymentReload.provider_reference,
        status: paymentReload.status,
        base_currency_amount: paymentReload.base_currency_amount
      })
      payment = { ...payment, ...paymentReload }
    }

    // Step 6: Create membership
    // Use membership_package_id from payment record (more reliable) or metadata
    const membershipPackageId = payment.membership_package_id || existingPayment?.membership_package_id || metadata.membership_package_id
    const membershipDuration = metadata.duration_months || 12
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + membershipDuration)

    console.log('📋 Creating membership:', { 
      userId, 
      membershipPackageId, 
      paymentId: payment.id,
      duration: membershipDuration,
      hasDCS: metadata.has_digital_cashflow_addon 
    })

    const { error: membershipError } = await supabaseAdmin
      .from('user_memberships')
      .insert({
        user_id: userId,
        membership_package_id: membershipPackageId,
        payment_id: payment.id,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        has_digital_cashflow_addon: metadata.has_digital_cashflow_addon || false
      })

    if (membershipError) {
      console.error('❌ Membership creation error:', membershipError)
      console.error('❌ Membership error details:', JSON.stringify(membershipError, null, 2))
    } else {
      console.log('✅ Membership created successfully')
    }

    // Step 7: Process referral if present (for both new and existing users)
    if (referral_code) {
      console.log('🔗 Processing referral for user:', { userId, referral_code, referral_type, isNewUser })
      await processReferral(userId, referral_code, referral_type || 'learner', payment, metadata)
    } else {
      console.log('ℹ️ No referral code found, skipping referral processing')
    }

    // Step 8: Return success WITHOUT temporary password
    console.log('✅ Guest checkout complete:', {
      email,
      isNewUser,
      tempPasswordIssued: !!tempPassword,
      tempPasswordEmailSent,
    })
    
    return NextResponse.json({
      success: true,
      message: isNewUser
        ? 'Payment verified and account created! Check your email for your temporary password.'
        : (tempPasswordEmailSent
          ? 'Payment verified! Check your email for your temporary password.'
          : 'Payment verified! You can log in with your existing credentials.'),
      email,
      fullName,
      userId,
      isNewUser,
      tempPasswordEmailSent
    })

  } catch (error: any) {
    console.error('❌ Guest verification error:', error)
    console.error('❌ Error stack:', error?.stack)
    console.error('❌ Error message:', error?.message)
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || 'An error occurred during verification',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

async function processReferral(
  userId: string,
  referralCode: string,
  referralType: string,
  payment: any,
  metadata: any
) {
  try {
    console.log('🔗 Processing referral:', { userId, referralCode, referralType })

    // First try to find referrer from referral_codes table
    let referrerId: string | null = null
    
    const { data: referralCodeData, error: codeError } = await supabaseAdmin
      .from('referral_codes')
      .select('user_id')
      .eq('code', referralCode)
      .eq('is_active', true)
      .single()

    if (referralCodeData) {
      referrerId = referralCodeData.user_id
      console.log('✅ Found referrer from referral_codes:', referrerId)
    } else {
      console.log('⚠️ Code not in referral_codes, checking affiliate_profiles...')
      
      // Fallback: try affiliate_profiles table
      const { data: affiliateProfile, error: affiliateError } = await supabaseAdmin
        .from('affiliate_profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .single()

      if (affiliateProfile) {
        referrerId = affiliateProfile.id
        console.log('✅ Found referrer from affiliate_profiles:', referrerId)
      }
    }

    if (!referrerId) {
      console.log('⚠️ No referrer found for code:', referralCode)
      return
    }

    // Get or create affiliate profile for the referrer
    let { data: affiliateProfile, error: profileError } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('id, referral_code, total_earnings, lifetime_referrals, available_balance, active_referrals')
      .eq('id', referrerId)
      .single()

    if (!affiliateProfile) {
      console.log('📝 Creating affiliate profile for referrer:', referrerId)
      
      // Create affiliate profile for the referrer
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://digiafriq.com'
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('affiliate_profiles')
        .insert({
          id: referrerId,
          referral_code: referralCode,
          learner_link: `${baseUrl}/join/learner?ref=${referralCode}`,
          dcs_link: `${baseUrl}/join/dcs?ref=${referralCode}`,
          total_earnings: 0,
          available_balance: 0,
          lifetime_referrals: 0,
          active_referrals: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating affiliate profile:', createError)
      } else {
        affiliateProfile = newProfile
        console.log('✅ Affiliate profile created:', newProfile?.id)
      }
    }

    console.log('✅ Using referrer:', referrerId)

    // Resolve recipient email (affiliate user) from profiles table
    const { data: referrerProfile, error: referrerProfileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', referrerId)
      .maybeSingle()

    if (referrerProfileError) {
      console.error('⚠️ Failed to load referrer profile email:', referrerProfileError)
    }

    const referrerEmail = (referrerProfile as any)?.email as string | undefined

    // Check if referrer is eligible (has active membership with DCS)
    const { data: referrerMembership, error: membershipError } = await supabaseAdmin
      .from('user_memberships')
      .select('*')
      .eq('user_id', referrerId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (membershipError) {
      console.log('⚠️ Error checking referrer membership:', membershipError.message)
    }

    // Allow referral even if membership check fails - they might have DCS
    const hasDCS = referrerMembership?.has_digital_cashflow_addon || false
    console.log('📋 Referrer membership status:', { hasDCS, hasActiveMembership: !!referrerMembership })

    // Create referral record using correct column names from schema
    // link_type: 'learner' or 'dcs' (the type of link clicked)
    // initial_purchase_type: 'learner' or 'learner_dcs' (what they actually bought)
    const initialPurchaseType = metadata.has_digital_cashflow_addon ? 'learner_dcs' : 'learner'
    const linkType = referralType === 'dcs' || referralType === 'affiliate' ? 'dcs' : 'learner'
    
    console.log('📝 Creating referral:', { linkType, initialPurchaseType, referralCode })
    
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: userId,
        referral_code: referralCode,
        link_type: linkType,
        initial_purchase_type: initialPurchaseType,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (referralError) {
      console.error('❌ Referral creation error:', referralError)
      console.error('❌ Referral error details:', JSON.stringify(referralError, null, 2))
      return
    }

    console.log('✅ Referral created:', referral.id)

    // Use base_currency_amount directly (already in USD from payment initialization)
    const paymentAmountUSD = payment.base_currency_amount || 10 // Default to $10 if not set
    console.log('💰 Commission base amount (USD):', paymentAmountUSD)
    
    let commissionAmount = 0
    // Commission logic:
    // - Learner link referral: 80% of $10 = $8
    // - DCS link referral: 80% of $10 + $2 DCS bonus = $10
    // The $2 bonus is ONLY based on link_type, NOT what the buyer purchased

    // 1. Always create learner commission (80% of $10 = $8)
    const learnerBaseAmountUSD = 10
    const learnerCommission = 8
    const { error: learnerCommissionError } = await supabaseAdmin
      .from('commissions')
      .insert({
        affiliate_id: referrerId,
        referral_id: referral.id,
        payment_id: payment.id,
        commission_type: 'learner_initial',
        base_amount: learnerBaseAmountUSD, // Base learner price
        base_currency: 'USD',
        commission_rate: 0.80,
        commission_amount: learnerCommission,
        commission_currency: 'USD',
        status: 'available',
        notes: 'Learner referral commission (80% of $10)'
      })

    if (learnerCommissionError) {
      console.error('❌ Learner commission creation error:', learnerCommissionError)
      console.error('❌ Learner commission error details:', JSON.stringify(learnerCommissionError, null, 2))
      // Critical: do not update affiliate balances if we failed to create the accounting row
      return
    }

    console.log('✅ Learner commission created: $', learnerCommission)
    commissionAmount = learnerCommission

    // 2. DCS Link Bonus: If referral was made via DCS link (linkType === 'dcs'), 
    // add extra $2 commission for the Digital Cashflow System bonus
    if (linkType === 'dcs') {
      console.log('💰 Creating $2 USD DCS bonus commission (referral via DCS link)')
      
      const dcsBonus = 2
      const { error: dcsLinkBonusError } = await supabaseAdmin
        .from('commissions')
        .insert({
          affiliate_id: referrerId,
          referral_id: referral.id,
          payment_id: payment.id,
          commission_type: 'dcs_addon',
          commission_amount: dcsBonus,
          commission_currency: 'USD',
          commission_rate: 0,
          base_amount: dcsBonus,
          base_currency: 'USD',
          status: 'available',
          notes: '$2 USD DCS bonus - referral made via Digital Cashflow link'
        })

      if (dcsLinkBonusError) {
        console.error('❌ Failed to create $2 DCS link bonus:', dcsLinkBonusError)
      } else {
        console.log('✅ $2 USD DCS link bonus created successfully')
        commissionAmount += dcsBonus
      }
    }

    // Fire-and-forget: send a single commission email after all commission inserts succeed
    if (referrerEmail) {
      await invokeEmailEvents({
        type: 'commission',
        to: referrerEmail,
        amount: commissionAmount,
        currency: 'USD',
        source: linkType === 'dcs'
          ? 'Learner referral commission + $2 DCS bonus'
          : 'Learner referral commission',
        date: new Date().toISOString(),
      })
    } else {
      console.log('⚠️ Skipping commission email: missing referrer email')
    }

    // Update affiliate_profiles stats
    if (affiliateProfile) {
      const { error: updateError } = await supabaseAdmin
        .from('affiliate_profiles')
        .update({
          total_earnings: (affiliateProfile.total_earnings || 0) + commissionAmount,
          available_balance: (affiliateProfile.available_balance || 0) + commissionAmount,
          lifetime_referrals: (affiliateProfile.lifetime_referrals || 0) + 1,
          active_referrals: ((affiliateProfile as any).active_referrals || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrerId)

      if (updateError) {
        console.error('❌ Error updating affiliate profile stats:', updateError)
        console.error('❌ Affiliate profile update error details:', JSON.stringify(updateError, null, 2))
      } else {
        console.log('✅ Affiliate profile stats updated successfully')
      }
    }

    const { error: linkConvertError } = await supabaseAdmin
      .from('affiliate_links')
      .update({
        converted: true,
        converted_user_id: userId,
        converted_at: new Date().toISOString()
      })
      .eq('affiliate_id', referrerId)
      .eq('converted', false)
      .order('clicked_at', { ascending: false })
      .limit(1)

    if (linkConvertError) {
      console.log('⚠️ Could not mark affiliate link as converted:', linkConvertError.message)
    } else {
      console.log('✅ Affiliate link marked as converted')
    }
    
  } catch (error) {
    console.error('❌ Referral processing error:', error)
    // Don't fail the main transaction if referral processing fails
  }
}
