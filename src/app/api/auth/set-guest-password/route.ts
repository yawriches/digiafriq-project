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
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'No account found with this email' },
        { status: 404 }
      )
    }

    // Check if user has paid
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('payment_status, password_set')
      .eq('id', existingUser.id)
      .single()

    if (profile?.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, message: 'Payment required before setting password' },
        { status: 403 }
      )
    }

    if (profile?.password_set) {
      return NextResponse.json(
        { success: false, message: 'Password already set. Please log in.' },
        { status: 400 }
      )
    }

    // Update user password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        user_metadata: {
          ...existingUser.user_metadata,
          password_set: true,
          first_login: false
        }
      }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to set password' },
        { status: 500 }
      )
    }

    // Update profile to mark password as set
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        password_set: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingUser.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Don't fail the request, password is already set
    }

    console.log('✅ Password set successfully for:', email)

    return NextResponse.json({
      success: true,
      message: 'Password set successfully'
    })

  } catch (error) {
    console.error('Error setting password:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while setting password' },
      { status: 500 }
    )
  }
}
