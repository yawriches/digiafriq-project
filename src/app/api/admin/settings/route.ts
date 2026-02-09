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

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('available_roles, active_role, role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.available_roles?.includes('admin') ||
                  profile?.active_role === 'admin' ||
                  profile?.role === 'admin'
  return isAdmin ? user : null
}

// Settings are stored in a simple key-value table called platform_settings
// If the table doesn't exist, we fall back to defaults
const DEFAULTS: Record<string, string> = {
  site_name: 'DigiAfriq',
  site_url: 'https://digiafriq.com',
  support_email: 'support@digiafriq.com',
  default_commission_rate: '80',
  affiliate_referral_rate: '10',
  minimum_payout: '50',
  default_currency: 'USD',
  email_notifications: 'true',
  sms_notifications: 'false',
  maintenance_mode: 'false',
  membership_auto_renew: 'true',
  allow_guest_checkout: 'true',
  max_login_attempts: '5',
  session_timeout_hours: '24',
  paystack_live_mode: 'false',
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to fetch from platform_settings table
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .select('key, value')

    if (error) {
      // Table might not exist — return defaults
      console.warn('platform_settings table not found, using defaults:', error.message)
      return NextResponse.json({ settings: DEFAULTS, source: 'defaults' })
    }

    // Merge fetched settings with defaults
    const settings = { ...DEFAULTS }
    ;(data || []).forEach((row: any) => {
      settings[row.key] = row.value
    })

    return NextResponse.json({ settings, source: 'database' })
  } catch (error: any) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'settings object is required' }, { status: 400 })
    }

    // Try to upsert each setting
    const entries = Object.entries(settings)
    let savedCount = 0
    let tableExists = true

    for (const [key, value] of entries) {
      const { error } = await supabaseAdmin
        .from('platform_settings')
        .upsert(
          { key, value: String(value), updated_at: new Date().toISOString(), updated_by: user.id },
          { onConflict: 'key' }
        )

      if (error) {
        if (error.message?.includes('relation') || error.code === '42P01') {
          tableExists = false
          break
        }
        console.error(`Error saving setting ${key}:`, error)
      } else {
        savedCount++
      }
    }

    if (!tableExists) {
      return NextResponse.json({
        success: false,
        message: 'platform_settings table does not exist. Please run the migration first.',
        savedCount: 0,
      })
    }

    return NextResponse.json({ success: true, savedCount })
  } catch (error: any) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
