import { supabase } from '@/lib/supabase/client'
import { processReferral } from '@/lib/supabase/referrals'

export interface AccountCreationData {
  email: string
  fullName: string
  membershipType: 'learner' | 'affiliate'
  referralCode?: string
  referralType?: 'learner' | 'affiliate'
}

export interface CreatedAccount {
  userId: string
  email: string
  fullName: string
  membershipType: 'learner' | 'affiliate'
  magicLinkSent: boolean
}

// Create account after successful payment using magic link
export async function createAccountAfterPayment(
  accountData: AccountCreationData
): Promise<CreatedAccount | null> {
  try {
    const { email, fullName, membershipType, referralCode, referralType } = accountData
    
    console.log('Creating account with magic link for:', email)
    
    // Generate redirect URL with membership info
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://digiafriq.com')
    
    const redirectUrl = `${baseUrl}/auth/callback?type=signup&membership=${membershipType}&ref=${referralCode || ''}&refType=${referralType || ''}`
    
    console.log('Magic link redirect URL:', redirectUrl)
    
    // Create user account with Supabase Auth using magic link
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: Math.random().toString(36), // Temporary password, won't be used
      options: {
        data: {
          full_name: fullName,
          membership_type: membershipType,
          account_type: 'auto_created',
          referral_code: referralCode,
          referral_type: referralType
        },
        emailRedirectTo: redirectUrl
      }
    })
    
    if (authError) {
      console.error('Error creating auth user:', authError)
      return null
    }
    
    if (!authData.user) {
      console.error('No user returned from auth signup')
      return null
    }
    
    const userId = authData.user.id
    console.log('User created successfully:', userId)
    
    // Create/update profile
    const { error: profileError } = await (supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        active_role: membershipType,
        available_roles: [membershipType],
        account_type: 'auto_created',
        created_via: 'referral_payment'
      }) as any)
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Don't return null here, profile creation is not critical
    } else {
      console.log('Profile created successfully')
    }
    
    // Store referral data for processing after magic link confirmation
    if (referralCode && referralType) {
      console.log('Storing referral data for later processing:', { referralCode, referralType, userId })
      
      // Store in a temporary table or user metadata for processing after confirmation
      const { error: metadataError } = await (supabase
        .from('profiles')
        .update({
          pending_referral_code: referralCode,
          pending_referral_type: referralType
        })
        .eq('id', userId) as any)
      
      if (metadataError) {
        console.error('Error storing referral metadata:', metadataError)
      } else {
        console.log('Referral metadata stored successfully')
      }
    }
    
    // Send magic link (Supabase handles this automatically)
    console.log('Magic link will be sent by Supabase to:', email)
    
    return {
      userId,
      email,
      fullName,
      membershipType,
      magicLinkSent: true
    }
    
  } catch (error) {
    console.error('Error in createAccountAfterPayment:', error)
    return null
  }
}

// Check if email already has an account
export async function checkExistingAccount(email: string): Promise<boolean> {
  try {
    // Use Supabase auth admin to check if user exists
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Error checking existing users:', error)
      return false
    }
    
    return data.users.some(user => user.email === email)
  } catch (error) {
    console.error('Error in checkExistingAccount:', error)
    return false
  }
}

// Send magic link to existing user
export async function sendMagicLinkToExistingUser(
  email: string,
  membershipType: 'learner' | 'affiliate',
  referralCode?: string,
  referralType?: 'learner' | 'affiliate'
): Promise<boolean> {
  try {
    console.log('Sending magic link to existing user:', email)
    
    // Generate redirect URL with membership info
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://digiafriq.com')
    
    const redirectUrl = `${baseUrl}/auth/callback?type=existing&membership=${membershipType}&ref=${referralCode || ''}&refType=${referralType || ''}`
    
    // Send magic link to existing user
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          membership_type: membershipType,
          referral_code: referralCode,
          referral_type: referralType,
          login_type: 'existing_user_upgrade'
        }
      }
    })
    
    if (error) {
      console.error('Error sending magic link to existing user:', error)
      return false
    }
    
    console.log('Magic link sent successfully to existing user')
    return true
    
  } catch (error) {
    console.error('Error in sendMagicLinkToExistingUser:', error)
    return false
  }
}

// Process referral after magic link confirmation
export async function processStoredReferral(userId: string): Promise<boolean> {
  try {
    console.log('Processing stored referral for user:', userId)
    
    // Get stored referral data from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('pending_referral_code, pending_referral_type')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile) {
      console.log('No stored referral data found for user')
      return true // Not an error, just no referral to process
    }
    
    const { pending_referral_code, pending_referral_type } = profile
    
    if (pending_referral_code && pending_referral_type) {
      console.log('Processing referral:', { pending_referral_code, pending_referral_type })
      
      try {
        await processReferral(userId, pending_referral_code, pending_referral_type)
        console.log('Referral processed successfully')
        
        // Clear pending referral data
        const { error: clearError } = await (supabase
          .from('profiles')
          .update({
            pending_referral_code: null,
            pending_referral_type: null
          })
          .eq('id', userId) as any)
        
        if (clearError) {
          console.error('Error clearing referral metadata:', clearError)
        } else {
          console.log('Referral metadata cleared')
        }
        
        return true
      } catch (referralError) {
        console.error('Error processing stored referral:', referralError)
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error('Error in processStoredReferral:', error)
    return false
  }
}
