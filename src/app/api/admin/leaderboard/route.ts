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

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all affiliate profiles ordered by earnings
    const { data: affiliateProfiles, error: apError } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('id, total_earnings, total_referrals, active_referrals, lifetime_referrals, available_balance, affiliate_level, status, commission_rate, referral_code, created_at')
      .order('total_earnings', { ascending: false })

    if (apError) {
      console.error('Affiliate profiles fetch error:', apError)
      return NextResponse.json({ error: apError.message }, { status: 500 })
    }

    if (!affiliateProfiles || affiliateProfiles.length === 0) {
      return NextResponse.json({ data: [], stats: { totalAffiliates: 0, totalEarnings: 0, totalReferrals: 0, activeAffiliates: 0 } })
    }

    // Fetch matching profiles for names/emails
    const profileIds = affiliateProfiles.map((ap: any) => ap.id)
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, affiliate_onboarding_completed')
      .in('id', profileIds)

    const profileMap = new Map<string, any>()
    if (profiles) {
      profiles.forEach((p: any) => profileMap.set(p.id, p))
    }

    // Build leaderboard entries
    let rank = 0
    const leaderboard = affiliateProfiles.map((ap: any) => {
      const profile = profileMap.get(ap.id)
      rank++
      return {
        rank,
        user_id: ap.id,
        name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
        email: profile?.email || '',
        level: ap.affiliate_level || getLevel(rank),
        total_earnings: ap.total_earnings || 0,
        total_referrals: ap.lifetime_referrals || ap.total_referrals || 0,
        active_referrals: ap.active_referrals || 0,
        available_balance: ap.available_balance || 0,
        commission_rate: ap.commission_rate || 0,
        referral_code: ap.referral_code || '',
        status: ap.status || 'active',
        onboarding_completed: profile?.affiliate_onboarding_completed || false,
        created_at: ap.created_at
      }
    })

    // Stats
    const stats = {
      totalAffiliates: leaderboard.length,
      totalEarnings: leaderboard.reduce((sum: number, a: any) => sum + a.total_earnings, 0),
      totalReferrals: leaderboard.reduce((sum: number, a: any) => sum + a.total_referrals, 0),
      activeAffiliates: leaderboard.filter((a: any) => a.status === 'active').length
    }

    return NextResponse.json({ data: leaderboard, stats })

  } catch (error: any) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, total_earnings, commission_rate, status, affiliate_level } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (total_earnings !== undefined) updates.total_earnings = total_earnings
    if (commission_rate !== undefined) updates.commission_rate = commission_rate
    if (status !== undefined) updates.status = status
    if (affiliate_level !== undefined) updates.affiliate_level = affiliate_level

    const { error } = await supabaseAdmin
      .from('affiliate_profiles')
      .update(updates)
      .eq('id', user_id)

    if (error) {
      console.error('Update affiliate error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Leaderboard PUT error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

function getLevel(rank: number): string {
  if (rank >= 1 && rank <= 3) return 'Legends'
  if (rank >= 4 && rank <= 6) return 'Champions'
  if (rank >= 7 && rank <= 10) return 'Elites'
  if (rank >= 11 && rank <= 15) return 'Rising Stars'
  if (rank >= 16 && rank <= 20) return 'Dream Chasers'
  return 'Starter'
}
