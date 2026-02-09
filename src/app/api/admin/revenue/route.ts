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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('available_roles, active_role, role')
      .eq('id', user.id)
      .single()

    const isAdmin = adminProfile?.available_roles?.includes('admin') ||
                    adminProfile?.active_role === 'admin' ||
                    adminProfile?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all completed payments
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('id, amount, currency, base_amount, base_currency, payment_type, metadata, created_at, status')
      .eq('status', 'completed')
      .order('created_at', { ascending: true })

    if (paymentsError) {
      console.error('Payments fetch error:', paymentsError)
      return NextResponse.json({ error: paymentsError.message }, { status: 500 })
    }

    const allPayments = payments || []

    // Classify payments
    let totalRevenue = 0
    let affiliateRevenue = 0
    let directRevenue = 0

    // Monthly data for charts (last 12 months)
    const now = new Date()
    const monthlyData: Record<string, { total: number; affiliate: number; direct: number; month: string }> = {}

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      monthlyData[key] = { total: 0, affiliate: 0, direct: 0, month: monthLabel }
    }

    allPayments.forEach((p: any) => {
      let usdAmount: number
      if (p.base_amount && p.base_currency?.toUpperCase() === 'USD') {
        usdAmount = p.base_amount
      } else {
        usdAmount = toUSD(p.amount, p.currency)
      }

      totalRevenue += usdAmount

      const isAffiliate = p.payment_type === 'referral_membership' ||
                          p.metadata?.is_referral_signup === true ||
                          p.metadata?.referral_code

      if (isAffiliate) {
        affiliateRevenue += usdAmount
      } else {
        directRevenue += usdAmount
      }

      // Monthly aggregation
      const date = new Date(p.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyData[key]) {
        monthlyData[key].total += usdAmount
        if (isAffiliate) {
          monthlyData[key].affiliate += usdAmount
        } else {
          monthlyData[key].direct += usdAmount
        }
      }
    })

    // Daily data for last 30 days
    const dailyData: Record<string, { total: number; affiliate: number; direct: number; day: string }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dailyData[key] = { total: 0, affiliate: 0, direct: 0, day: dayLabel }
    }

    allPayments.forEach((p: any) => {
      let usdAmount: number
      if (p.base_amount && p.base_currency?.toUpperCase() === 'USD') {
        usdAmount = p.base_amount
      } else {
        usdAmount = toUSD(p.amount, p.currency)
      }

      const key = new Date(p.created_at).toISOString().slice(0, 10)
      if (dailyData[key]) {
        const isAffiliate = p.payment_type === 'referral_membership' ||
                            p.metadata?.is_referral_signup === true ||
                            p.metadata?.referral_code

        dailyData[key].total += usdAmount
        if (isAffiliate) {
          dailyData[key].affiliate += usdAmount
        } else {
          dailyData[key].direct += usdAmount
        }
      }
    })

    // This month vs last month comparison
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    let thisMonthRevenue = 0
    let lastMonthRevenue = 0

    allPayments.forEach((p: any) => {
      let usdAmount: number
      if (p.base_amount && p.base_currency?.toUpperCase() === 'USD') {
        usdAmount = p.base_amount
      } else {
        usdAmount = toUSD(p.amount, p.currency)
      }

      const date = new Date(p.created_at)
      if (date >= thisMonth) {
        thisMonthRevenue += usdAmount
      } else if (date >= lastMonth && date <= lastMonthEnd) {
        lastMonthRevenue += usdAmount
      }
    })

    const monthOverMonthChange = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0

    return NextResponse.json({
      stats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        affiliateRevenue: Math.round(affiliateRevenue * 100) / 100,
        directRevenue: Math.round(directRevenue * 100) / 100,
        totalPayments: allPayments.length,
        affiliatePayments: allPayments.filter((p: any) =>
          p.payment_type === 'referral_membership' ||
          p.metadata?.is_referral_signup === true ||
          p.metadata?.referral_code
        ).length,
        directPayments: allPayments.filter((p: any) =>
          p.payment_type !== 'referral_membership' &&
          p.metadata?.is_referral_signup !== true &&
          !p.metadata?.referral_code
        ).length,
        thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
        lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
        monthOverMonthChange: Math.round(monthOverMonthChange * 10) / 10,
      },
      monthlyChart: Object.values(monthlyData),
      dailyChart: Object.values(dailyData),
    })

  } catch (error: any) {
    console.error('Revenue API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
