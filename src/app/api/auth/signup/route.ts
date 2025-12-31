import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { sendEmail } from '@/../lib/email'

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

function generateTempPassword(): string {
  const randomBytes = crypto.randomBytes(12)
  const base = randomBytes.toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)

  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'
  const numbers = '23456789'
  const special = '!@#$%'

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

  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json()

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, message: 'Email and fullName are required' },
        { status: 400 }
      )
    }

    const tempPassword = generateTempPassword()

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        has_temp_password: true,
        temp_password_issued_at: new Date().toISOString(),
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
        role: 'learner',
        active_role: 'learner',
        available_roles: ['learner'],
        password_set: false,
        temp_password_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      // non-fatal: auth user exists, but profile may already exist
      console.error('Profile create error:', profileError)
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
    const loginUrl = `${appUrl}/login`

    await sendEmail({
      to: email,
      subject: 'Welcome to DigiafrIQ — Your Temporary Password',
      template: 'signup.html',
      placeholders: {
        name: fullName,
        email,
        temporaryPassword: tempPassword,
        loginUrl,
        year: new Date().getFullYear(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
