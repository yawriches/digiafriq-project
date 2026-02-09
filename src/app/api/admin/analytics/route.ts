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

const RATES: Record<string, number> = {
  GHS: 14,
  NGN: 1600,
  XOF: 600,
  XAF: 600,
  EUR: 0.92,
  GBP: 0.79,
}

function toUSD(amount: number, currency: string): number {
  const cur = currency?.toUpperCase() || 'USD'
  if (cur === 'USD') return amount
  if (cur in RATES) return amount / RATES[cur]
  return amount
}

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
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all data in parallel
    const [
      profilesResult,
      paymentsResult,
      membershipsResult,
      commissionsResult,
      coursesResult,
      referralsResult,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, created_at, country, role, active_role, available_roles, status, affiliate_onboarding_completed'),
      supabaseAdmin.from('payments').select('id, amount, currency, base_amount, base_currency, payment_type, metadata, created_at, status, user_id').eq('status', 'completed').order('created_at', { ascending: true }),
      supabaseAdmin.from('user_memberships').select('user_id, created_at, is_active, membership_id'),
      supabaseAdmin.from('commissions').select('id, commission_amount, commission_currency, status, created_at'),
      supabaseAdmin.from('courses').select('id, is_published'),
      supabaseAdmin.from('referrals').select('id, created_at, status'),
    ])

    const profiles = profilesResult.data || []
    const payments = paymentsResult.data || []
    const memberships = membershipsResult.data || []
    const commissions = commissionsResult.data || []
    const courses = coursesResult.data || []
    const referrals = referralsResult.data || []

    const now = new Date()

    // ── Overview Stats ──
    const totalUsers = profiles.length
    const activeUsers = profiles.filter((p: any) => p.status === 'active').length
    const affiliates = profiles.filter((p: any) =>
      p.role === 'affiliate' || p.active_role === 'affiliate' || p.available_roles?.includes('affiliate')
    ).length
    const affiliatesOnboarded = profiles.filter((p: any) => p.affiliate_onboarding_completed === true).length
    const activeMemberships = memberships.filter((m: any) => m.is_active).length
    const totalCourses = courses.length
    const publishedCourses = courses.filter((c: any) => c.is_published).length
    const totalReferrals = referrals.length
    const successfulReferrals = referrals.filter((r: any) => r.status === 'completed' || r.status === 'converted').length

    // Revenue
    let totalRevenue = 0
    let affiliateRevenue = 0
    let directRevenue = 0
    payments.forEach((p: any) => {
      const usd = p.base_amount && p.base_currency?.toUpperCase() === 'USD'
        ? p.base_amount
        : toUSD(p.amount, p.currency)
      totalRevenue += usd
      const isAff = p.payment_type === 'referral_membership' || p.metadata?.is_referral_signup === true || p.metadata?.referral_code
      if (isAff) affiliateRevenue += usd
      else directRevenue += usd
    })

    // Commission totals
    let totalCommissionAmount = 0
    let pendingCommissions = 0
    commissions.forEach((c: any) => {
      const usd = toUSD(c.commission_amount || 0, c.commission_currency || 'USD')
      totalCommissionAmount += usd
      if (c.status === 'pending') pendingCommissions += usd
    })

    // ── User Growth (monthly, last 12 months) ──
    const userGrowth: { month: string; total: number; affiliates: number; learners: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const usersInMonth = profiles.filter((p: any) => {
        const cd = new Date(p.created_at)
        return cd >= d && cd < nextMonth
      })
      const affCount = usersInMonth.filter((p: any) =>
        p.role === 'affiliate' || p.active_role === 'affiliate' || p.available_roles?.includes('affiliate')
      ).length
      userGrowth.push({
        month: label,
        total: usersInMonth.length,
        affiliates: affCount,
        learners: usersInMonth.length - affCount,
      })
    }

    // ── Revenue Trend (monthly, last 12 months) ──
    const revenueTrend: { month: string; total: number; affiliate: number; direct: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      let mTotal = 0, mAff = 0, mDirect = 0
      payments.forEach((p: any) => {
        const pd = new Date(p.created_at)
        if (pd >= d && pd < nextMonth) {
          const usd = p.base_amount && p.base_currency?.toUpperCase() === 'USD'
            ? p.base_amount : toUSD(p.amount, p.currency)
          mTotal += usd
          const isAff = p.payment_type === 'referral_membership' || p.metadata?.is_referral_signup === true || p.metadata?.referral_code
          if (isAff) mAff += usd
          else mDirect += usd
        }
      })
      revenueTrend.push({ month: label, total: mTotal, affiliate: mAff, direct: mDirect })
    }

    // ── Payment Trend (monthly, last 12 months) ──
    const paymentTrend: { month: string; count: number; amount: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      let count = 0, amount = 0
      payments.forEach((p: any) => {
        const pd = new Date(p.created_at)
        if (pd >= d && pd < nextMonth) {
          count++
          amount += p.base_amount && p.base_currency?.toUpperCase() === 'USD'
            ? p.base_amount : toUSD(p.amount, p.currency)
        }
      })
      paymentTrend.push({ month: label, count, amount })
    }

    // ── Country Breakdown ──
    const countryMap = new Map<string, { country: string; users: number; affiliates: number; revenue: number }>()
    profiles.forEach((p: any) => {
      const country = p.country || 'Unknown'
      if (!countryMap.has(country)) {
        countryMap.set(country, { country, users: 0, affiliates: 0, revenue: 0 })
      }
      const entry = countryMap.get(country)!
      entry.users++
      const isAff = p.role === 'affiliate' || p.active_role === 'affiliate' || p.available_roles?.includes('affiliate')
      if (isAff) entry.affiliates++
    })
    // Add revenue per country (by user_id -> profile country)
    const profileCountryMap = new Map(profiles.map((p: any) => [p.id, p.country || 'Unknown']))
    payments.forEach((p: any) => {
      const country = profileCountryMap.get(p.user_id) || 'Unknown'
      const entry = countryMap.get(country)
      if (entry) {
        entry.revenue += p.base_amount && p.base_currency?.toUpperCase() === 'USD'
          ? p.base_amount : toUSD(p.amount, p.currency)
      }
    })
    const countryData = Array.from(countryMap.values())
      .sort((a, b) => b.users - a.users)
      .slice(0, 10)

    // ── Signup Heatmap (day of week x hour) ──
    const heatmap = Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      hours: Array(24).fill(0) as number[],
    }))
    profiles.forEach((p: any) => {
      const d = new Date(p.created_at)
      const dayIdx = (d.getDay() + 6) % 7
      const hour = d.getHours()
      heatmap[dayIdx].hours[hour]++
    })

    // ── Month-over-month comparisons ──
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const thisMonthUsers = profiles.filter((p: any) => new Date(p.created_at) >= thisMonthStart).length
    const lastMonthUsers = profiles.filter((p: any) => {
      const d = new Date(p.created_at)
      return d >= lastMonthStart && d <= lastMonthEnd
    }).length

    let thisMonthRevenue = 0, lastMonthRevenue = 0
    payments.forEach((p: any) => {
      const usd = p.base_amount && p.base_currency?.toUpperCase() === 'USD'
        ? p.base_amount : toUSD(p.amount, p.currency)
      const d = new Date(p.created_at)
      if (d >= thisMonthStart) thisMonthRevenue += usd
      else if (d >= lastMonthStart && d <= lastMonthEnd) lastMonthRevenue += usd
    })

    const userGrowthPct = lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : (thisMonthUsers > 0 ? 100 : 0)
    const revenueGrowthPct = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : (thisMonthRevenue > 0 ? 100 : 0)

    // ── Membership distribution ──
    const membershipCounts = new Map<string, number>()
    memberships.filter((m: any) => m.is_active).forEach((m: any) => {
      const key = m.membership_id || 'unknown'
      membershipCounts.set(key, (membershipCounts.get(key) || 0) + 1)
    })

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        affiliates,
        affiliatesOnboarded,
        activeMemberships,
        totalCourses,
        publishedCourses,
        totalReferrals,
        successfulReferrals,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        affiliateRevenue: Math.round(affiliateRevenue * 100) / 100,
        directRevenue: Math.round(directRevenue * 100) / 100,
        totalPayments: payments.length,
        totalCommissions: Math.round(totalCommissionAmount * 100) / 100,
        pendingCommissions: Math.round(pendingCommissions * 100) / 100,
        thisMonthUsers,
        lastMonthUsers,
        userGrowthPct: Math.round(userGrowthPct * 10) / 10,
        thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
        lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
        revenueGrowthPct: Math.round(revenueGrowthPct * 10) / 10,
      },
      userGrowth,
      revenueTrend,
      paymentTrend,
      countryData,
      heatmap,
    })
  } catch (error: any) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
