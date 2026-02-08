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
    // Verify the requesting user is an admin
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requestingUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if requesting user is admin
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('available_roles')
      .eq('id', requestingUser.id)
      .single()

    if (!adminProfile?.available_roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { email, password, firstName, lastName, roles } = await request.json()

    if (!email || !password || !firstName || !lastName || !roles?.length) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Create the user in Supabase Auth using admin API
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    })

    if (createError) {
      console.error('Auth create error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create the user profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        active_role: roles[0],
        available_roles: roles,
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile create error:', profileError)
      // User was created in auth but profile failed - still report success with warning
      return NextResponse.json({ 
        success: true, 
        warning: 'User created but profile setup had an issue: ' + profileError.message,
        userId: authData.user.id 
      })
    }

    // If affiliate role is selected, create affiliate profile
    if (roles.includes('affiliate')) {
      const { error: affiliateError } = await supabaseAdmin
        .from('affiliate_profiles')
        .insert({
          user_id: authData.user.id,
          unique_affiliate_code: `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.random().toString(36).substr(2, 5)}`,
          status: 'active',
          created_at: new Date().toISOString()
        })

      if (affiliateError) {
        console.error('Affiliate profile create error:', affiliateError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      userId: authData.user.id,
      message: `User ${email} created successfully` 
    })

  } catch (error: any) {
    console.error('Add user error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
