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

    // Fetch all data in parallel
    const [profilesResult, affiliateProfilesResult, commissionsResult, paymentsResult] = await Promise.all([
      // Get all users who are affiliates (from profiles table - the source of truth)
      supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role, active_role, available_roles, status, affiliate_onboarding_completed, created_at'),
      // Get affiliate_profiles if they exist (optional enrichment)
      supabaseAdmin
        .from('affiliate_profiles')
        .select('id, total_earnings, active_referrals, lifetime_referrals, available_balance, affiliate_level, status, commission_rate, referral_code, created_at'),
      // Get all commissions to calculate earnings per affiliate
      supabaseAdmin
        .from('commissions')
        .select('affiliate_id, commission_amount, status'),
      // Get completed payments to calculate sales per affiliate
      supabaseAdmin
        .from('payments')
        .select('amount, currency, payment_type, metadata, status')
        .eq('status', 'completed')
    ])

    if (profilesResult.error) {
      console.error('Profiles fetch error:', profilesResult.error)
    }
    if (affiliateProfilesResult.error) {
      console.error('Affiliate profiles fetch error:', affiliateProfilesResult.error)
    }
    if (commissionsResult.error) {
      console.error('Commissions fetch error:', commissionsResult.error)
    }
    if (paymentsResult.error) {
      console.error('Payments fetch error:', paymentsResult.error)
    }

    const allProfiles = profilesResult.data || []
    const affiliateProfilesData = affiliateProfilesResult.data || []
    const commissions = commissionsResult.data || []
    const payments = paymentsResult.data || []

    // Identify all affiliates from profiles table - only those who completed onboarding
    const affiliateUsers = allProfiles.filter((p: any) =>
      p.affiliate_onboarding_completed === true &&
      (
        p.role === 'affiliate' ||
        p.active_role === 'affiliate' ||
        p.available_roles?.includes('affiliate')
      )
    )

    if (affiliateUsers.length === 0) {
      return NextResponse.json({ data: [], stats: { totalAffiliates: 0, totalRevenue: 0, totalReferrals: 0, activeAffiliates: 0 } })
    }

    // Build maps for enrichment
    const apMap = new Map<string, any>()
    affiliateProfilesData.forEach((ap: any) => apMap.set(ap.id, ap))

    // Calculate earnings per affiliate from commissions
    const commissionEarningsMap = new Map<string, number>()
    const referralCountMap = new Map<string, number>()
    commissions.forEach((c: any) => {
      if (c.affiliate_id) {
        const current = commissionEarningsMap.get(c.affiliate_id) || 0
        commissionEarningsMap.set(c.affiliate_id, current + (parseFloat(c.commission_amount) || 0))
        const count = referralCountMap.get(c.affiliate_id) || 0
        referralCountMap.set(c.affiliate_id, count + 1)
      }
    })

    // Build a map of referral_code -> user_id from affiliate_profiles
    const codeToUserMap = new Map<string, string>()
    affiliateProfilesData.forEach((ap: any) => {
      if (ap.referral_code) codeToUserMap.set(ap.referral_code, ap.id)
    })

    // Calculate sales per affiliate from payments (via metadata.referral_code)
    const salesCountMap = new Map<string, number>()
    const salesAmountMap = new Map<string, number>()
    payments.forEach((p: any) => {
      const refCode = p.metadata?.referral_code
      if (refCode && codeToUserMap.has(refCode)) {
        const affiliateId = codeToUserMap.get(refCode)!
        salesCountMap.set(affiliateId, (salesCountMap.get(affiliateId) || 0) + 1)
        salesAmountMap.set(affiliateId, (salesAmountMap.get(affiliateId) || 0) + (parseFloat(p.amount) || 0))
      }
    })

    // Build leaderboard entries
    const unsorted = affiliateUsers.map((user: any) => {
      const ap = apMap.get(user.id)
      const commissionsEarnings = commissionEarningsMap.get(user.id) || 0
      const commissionsCount = referralCountMap.get(user.id) || 0
      const salesCount = salesCountMap.get(user.id) || 0
      const salesAmount = salesAmountMap.get(user.id) || 0

      // Total revenue = sum of all payment amounts from this affiliate's referrals
      const totalRevenue = salesAmount
      const totalReferrals = ap?.lifetime_referrals || commissionsCount || salesCount

      return {
        user_id: user.id,
        name: user.full_name || user.email?.split('@')[0] || 'Unknown',
        email: user.email || '',
        level: ap?.affiliate_level || 'Starter',
        total_revenue: totalRevenue,
        total_referrals: totalReferrals,
        active_referrals: ap?.active_referrals || 0,
        total_commissions: commissionsEarnings,
        referral_code: ap?.referral_code || '',
        status: ap?.status || user.status || 'active',
        onboarding_completed: user.affiliate_onboarding_completed || false,
        created_at: ap?.created_at || user.created_at
      }
    })

    // Sort by total revenue descending, then assign ranks
    unsorted.sort((a: any, b: any) => b.total_revenue - a.total_revenue)
    const leaderboard = unsorted.map((entry: any, index: number) => ({
      ...entry,
      rank: index + 1,
      level: entry.level || getLevel(index + 1)
    }))

    // Stats
    const stats = {
      totalAffiliates: leaderboard.length,
      totalRevenue: leaderboard.reduce((sum: number, a: any) => sum + a.total_revenue, 0),
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
