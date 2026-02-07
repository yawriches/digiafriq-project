import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
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
    const { data, error } = await supabaseAdmin.functions.invoke('email-events', {
      body: payload,
    })

    if (error) {
      console.error('❌ email-events invoke error (signup):', {
        message: (error as any)?.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        context: (error as any)?.context,
        payload,
      })
      return false
    }

    console.log('✅ email-events invoked (signup):', { payload, data })
    return true
  } catch (e) {
    console.error('❌ email-events invoke exception (signup):', {
      error: e instanceof Error ? e.message : String(e),
      payload,
    })
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, password, phoneNumber, country } = await request.json()

    if (!email || !fullName || !password || !phoneNumber || !country) {
      return NextResponse.json(
        { success: false, message: 'Email, fullName, password, phone number and country are required' },
        { status: 400 }
      )
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (createError || !created?.user) {
      return NextResponse.json(
        { success: false, message: createError?.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    const userId = created.user.id

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        phone: phoneNumber, // Fixed: use 'phone' instead of 'phone_number'
        country: country,
        role: 'learner', // Fixed: use 'learner' instead of 'member'
        active_role: 'learner', // Start as learner
        available_roles: ['learner', 'affiliate'], // Can access both
        affiliate_unlocked: false, // Will be unlocked after affiliate course
        password_set: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      // non-fatal: auth user exists, but profile may already exist
      console.error('Profile create error:', profileError)
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
    const loginUrl = `${appUrl}/login`

    // Fire-and-forget: email via Edge Function (uses Edge secrets)
    await invokeEmailEvents({
      type: 'signup',
      to: email,
      name: fullName,
      loginUrl,
    })

    return NextResponse.json({ success: true, email })
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
