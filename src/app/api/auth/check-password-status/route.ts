import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { exists: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (!existingUser) {
      return NextResponse.json({
        exists: false,
        message: 'No account found with this email'
      })
    }

    // Get profile to check payment and password status
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', existingUser.id)
      .single()

    // Check password_set from user metadata or profile
    const passwordSet = profile?.password_set || existingUser.user_metadata?.password_set || false
    const paymentStatus = profile?.payment_status || 'unpaid'

    return NextResponse.json({
      exists: true,
      passwordSet,
      paymentStatus,
      profile: profile ? {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        country: profile.country
      } : null
    })

  } catch (error) {
    console.error('Error checking password status:', error)
    return NextResponse.json(
      { exists: false, message: 'An error occurred' },
      { status: 500 }
    )
  }
}
