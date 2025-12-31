import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCommission, completeReferral } from '@/lib/supabase/referrals'
import { 
  createAccountAfterPayment, 
  checkExistingAccount, 
  sendMagicLinkToExistingUser,
  type AccountCreationData 
} from '@/lib/auth/account-creation'
import { 
  generateWelcomeEmailHTML, 
  generateWelcomeEmailText,
  type WelcomeEmailData 
} from '@/lib/email/templates'

// Use service role client for payment verification (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
      .select('email')
      .eq('id', referral.referrer_id)
      .maybeSingle() as any

    if (referrerProfileError) {
      console.error('⚠️ Failed to load referrer profile email (verify):', referrerProfileError)
    }

    const referrerEmail = (referrerProfile as any)?.email as string | undefined

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

    let commissionType: 'learner_referral' | 'affiliate_referral' = 'learner_referral'
    let notes = `Commission for ${membershipPackage.name} purchase`

    // Determine commission type based on link type and membership type
    // Note: referrals table uses 'link_type' not 'referral_type'
    if (referral.link_type === 'dcs' && membershipPackage.member_type === 'affiliate') {
      commissionType = 'affiliate_referral'
      notes = `Commission for affiliate referral purchasing ${membershipPackage.name}`
    } else if ((referral.link_type === 'learner' || referral.link_type === 'dcs') && membershipPackage.member_type === 'learner') {
      commissionType = 'learner_referral'
      notes = `Commission for learner referral purchasing ${membershipPackage.name}`
    } else {
      console.log('ℹ️ No commission applicable for this referral/membership combination')
      return
    }

    // Create commission for the referrer
    console.log(`💰 Creating ${commissionType} commission for referrer ${referral.referrer_id}`)
    
    const commission = await createCommission(
      referral.referrer_id,
      referral.id,
      payment.id,
      commissionType,
      notes
    )

    if (commission) {
      console.log('✅ Commission created successfully:', commission)

      if (referrerEmail) {
        await invokeEmailEvents({
          type: 'commission',
          to: referrerEmail,
          amount: (commission as any)?.commission_amount,
          currency: (commission as any)?.commission_currency || 'USD',
          source: notes,
          date: new Date().toISOString(),
        })
      }

      // Special handling for affiliate referrals - create additional $2 commission (in USD)
      if (commissionType === 'affiliate_referral') {
        console.log('💰 Creating additional $2 USD commission for affiliate referral')
        
        // Create a separate commission for the $2 affiliate upgrade fee (always in USD)
        const { error: affiliateCommissionError } = await supabase
          .from('commissions')
          .insert({
            affiliate_id: referral.referrer_id,
            referral_id: referral.id,
            payment_id: payment.id,
            commission_type: 'affiliate_referral',
            commission_amount: 2.00,
            commission_currency: 'USD', // Always USD
            commission_rate: 0,
            base_amount: 2.00,
            base_currency: 'USD', // Always USD
            status: 'available',
            notes: '$2 USD bonus for affiliate referral upgrade'
          }) as any

        if (affiliateCommissionError) {
          console.error('❌ Failed to create $2 affiliate commission:', affiliateCommissionError)
        } else {
          console.log('✅ $2 USD affiliate commission created successfully')

          if (referrerEmail) {
            await invokeEmailEvents({
              type: 'commission',
              to: referrerEmail,
              amount: 2.0,
              currency: 'USD',
              source: '$2 USD bonus for affiliate referral upgrade',
              date: new Date().toISOString(),
            })
          }
        }
      }

      // DCS Link Bonus: If referral was made via DCS link (link_type === 'dcs'), 
      // add extra $2 commission for the Digital Cashflow System bonus
      if (referral.link_type === 'dcs' && commissionType === 'learner_referral') {
        console.log('💰 Creating $2 USD DCS bonus commission (referral via DCS link)')
        
        const { error: dcsCommissionError } = await supabase
          .from('commissions')
          .insert({
            affiliate_id: referral.referrer_id,
            referral_id: referral.id,
            payment_id: payment.id,
            commission_type: 'dcs_addon',
            commission_amount: 2.00,
            commission_currency: 'USD',
            commission_rate: 0,
            base_amount: 2.00,
            base_currency: 'USD',
            status: 'available',
            notes: '$2 USD DCS bonus - referral made via Digital Cashflow link'
          }) as any

        if (dcsCommissionError) {
          console.error('❌ Failed to create $2 DCS commission:', dcsCommissionError)
        } else {
          console.log('✅ $2 USD DCS commission created successfully')

          if (referrerEmail) {
            await invokeEmailEvents({
              type: 'commission',
              to: referrerEmail,
              amount: 2.0,
              currency: 'USD',
              source: '$2 USD DCS bonus - referral made via Digital Cashflow link',
              date: new Date().toISOString(),
            })
          }
        }
      }

      // Mark referral as completed
      const referralCompleted = await completeReferral(referral.id)
      if (referralCompleted) {
        console.log('✅ Referral marked as completed')
      } else {
        console.error('❌ Failed to mark referral as completed')
      }
    } else {
      console.error('❌ Failed to create commission')
    }

  } catch (commissionError) {
    console.error('❌ Error processing referral commissions:', commissionError)
    // Don't fail the payment verification if commission processing fails
  }
}

// Helper function to send welcome email
async function sendWelcomeEmail(emailData: WelcomeEmailData): Promise<boolean> {
  try {
    console.log('📧 Sending welcome email to:', emailData.email)
    
    // Generate email content for magic link flow
    const htmlContent = generateWelcomeEmailHTML(emailData)
    const textContent = generateWelcomeEmailText(emailData)
    
    console.log('📧 Email HTML content generated (length):', htmlContent.length)
    console.log('📧 Email text content generated (length):', textContent.length)
    
    // TODO: Integrate with actual email service
    // Example with a hypothetical email service:
    /*
    const emailService = new EmailService(process.env.EMAIL_API_KEY)
    await emailService.send({
      to: emailData.email,
      subject: `Welcome to DigiafrIQ - Check Your Email for Login Link!`,
      html: htmlContent,
      text: textContent
    })
    */
    
    console.log('✅ Welcome email prepared successfully (email service integration needed)')
    return true
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error)
    return false
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

  // Get customer email and name from verification data
  const customerEmail = verificationData.data?.customer?.email
  const customerName = verificationData.data?.customer?.first_name 
    ? `${verificationData.data.customer.first_name} ${verificationData.data.customer.last_name || ''}`.trim()
    : verificationData.data?.customer?.email?.split('@')[0] || 'User'

  console.log('👤 Customer info:', { email: customerEmail, name: customerName })

  // Get referral data from payment metadata
  const referralCode = verificationData.data?.metadata?.referral_code
  const referralType = verificationData.data?.metadata?.referral_type as 'learner' | 'affiliate' | undefined

  console.log('🔗 Referral info:', { referralCode, referralType })

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

    if (!userId && customerEmail) {
      console.log('🔍 No user_id in payment, checking if account exists for email:', customerEmail)
      
      const accountExists = await checkExistingAccount(customerEmail)
      
      if (accountExists) {
        console.log('✅ Account exists, sending magic link for membership upgrade')
        
        const magicLinkSuccess = await sendMagicLinkToExistingUser(
          customerEmail,
          membershipPackage.member_type,
          referralCode,
          referralType
        )
        
        if (!magicLinkSuccess) {
          console.error('❌ Failed to send magic link to existing user')
          return NextResponse.json({
            success: false,
            message: 'Failed to send login link to existing account'
          }, { status: 500 })
        }
        
        console.log('✅ Magic link sent to existing user')
        magicLinkSent = true
      } else {
        console.log('🆕 Creating new account with magic link after payment')
        
        const accountData: AccountCreationData = {
          email: customerEmail,
          fullName: customerName,
          membershipType: membershipPackage.member_type,
          referralCode,
          referralType
        }
        
        const createdAccount = await createAccountAfterPayment(accountData)
        
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
          magicLinkSent: createdAccount.magicLinkSent
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
    
    // Also check payment_type column for addon_upgrade
    const isAddonUpgrade = payment.payment_type === 'addon_upgrade' || 
                           metadata.is_addon_upgrade === true || 
                           metadata.is_addon_upgrade === 'true'
    const hasDCSAddon = metadata.has_digital_cashflow_addon === true || 
                        metadata.has_digital_cashflow_addon === 'true'

    console.log('🔍 Addon detection:', { 
      isAddonUpgrade, 
      hasDCSAddon, 
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

    // Update user role based on membership type (for existing users)
    if (membershipPackage.member_type === 'affiliate') {
      console.log('👑 Affiliate membership detected, updating user role...')
      
      const { error: roleUpdateError } = await supabase
        .from('profiles')
        .update({ role: 'affiliate' })
        .eq('id', userId) as any

      if (roleUpdateError) {
        console.error('❌ DATABASE ERROR: Failed to update user role:', roleUpdateError)
        console.error('❌ Full role update error:', JSON.stringify(roleUpdateError, null, 2))
      } else {
        console.log('✅ User role updated to affiliate successfully')
      }
    } else {
      console.log('🎓 Learner membership detected, no role update needed')
    }

    // Send welcome email if account was created
    if (accountCreated && customerEmail) {
      console.log('📧 Sending welcome email explaining magic link process')
      
      const emailData: WelcomeEmailData = {
        fullName: customerName,
        email: customerEmail,
        membershipType: membershipPackage.member_type,
        magicLinkSent: true
      }
      
      const emailSent = await sendWelcomeEmail(emailData)
      if (emailSent) {
        console.log('✅ Welcome email sent successfully')
      } else {
        console.error('❌ Failed to send welcome email (non-critical)')
      }
    }

    // Process referral commissions
    await processReferralCommissions(payment, verificationData)

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
