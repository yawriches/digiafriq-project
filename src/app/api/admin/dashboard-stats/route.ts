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

export async function GET(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if requesting user is admin
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('available_roles, active_role, role')
      .eq('id', user.id)
      .single()

    const isAdmin = adminProfile?.available_roles?.includes('admin') || 
                    adminProfile?.active_role === 'admin' || 
                    adminProfile?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Fetch all data using service role (bypasses RLS)
    const [
      paymentsResult,
      usersResult,
      coursesResult,
      commissionsResult,
      recentPaymentsResult,
    ] = await Promise.all([
      supabaseAdmin.from('payments').select('amount, currency, payment_type, metadata').eq('status', 'completed'),
      supabaseAdmin.from('profiles').select('id, email, full_name, role, active_role, available_roles, status, created_at, affiliate_onboarding_completed'),
      supabaseAdmin.from('courses').select('id'),
      supabaseAdmin.from('commissions').select('commission_amount, commission_currency, amount'),
      supabaseAdmin.from('payments').select('id, amount, currency, status, paystack_reference, created_at, user_id').order('created_at', { ascending: false }).limit(10)
    ])

    if (paymentsResult.error) {
      console.error('Payments fetch error:', paymentsResult.error)
    }
    if (usersResult.error) {
      console.error('Users fetch error:', usersResult.error)
    }
    if (recentPaymentsResult.error) {
      console.error('Recent payments fetch error:', recentPaymentsResult.error)
    }

    const payments = paymentsResult.data || []
    const users = usersResult.data || []
    const courses = coursesResult.data || []
    const commissions = commissionsResult.data || []

    // Calculate total revenue in USD
    const RATES: Record<string, number> = { GHS: 14, NGN: 1600 }
    const totalRevenue = payments.reduce((sum: number, p: any) => {
      const currency = p.currency?.toUpperCase() || 'USD'
      let usdAmount = p.amount
      if (currency !== 'USD' && currency in RATES) {
        usdAmount = p.amount / RATES[currency]
      }
      return sum + usdAmount
    }, 0)

    // User stats
    const affiliates = users.filter((u: any) => 
      u.role === 'affiliate' || 
      u.active_role === 'affiliate' || 
      u.available_roles?.includes('affiliate')
    )
    const activeUsers = users.filter((u: any) => u.status === 'active').length
    const suspendedUsers = users.filter((u: any) => u.status === 'suspended').length
    const pendingUsers = users.filter((u: any) => u.status === 'pending').length

    // Commission totals
    const totalCommissions = commissions.reduce((sum: number, c: any) => {
      const currency = c.commission_currency?.toUpperCase() || 'USD'
      let usdAmount = c.commission_amount || c.amount || 0
      if (currency !== 'USD' && currency in RATES) {
        usdAmount = usdAmount / RATES[currency]
      }
      return sum + usdAmount
    }, 0)

    // Affiliates who completed onboarding
    const affiliatesOnboarded = users.filter((u: any) => u.affiliate_onboarding_completed === true).length

    // Split payments into affiliate sales vs direct
    const affiliateSales = payments.filter((p: any) => 
      p.payment_type === 'referral_membership' || 
      p.metadata?.is_referral_signup === true || 
      p.metadata?.referral_code
    ).length
    const directSales = payments.length - affiliateSales

    // Recent users (last 5)
    const recentUsers = users
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.active_role || u.role || 'learner',
        created_at: u.created_at
      }))

    // Build recent payments with user info
    const recentPaymentsRaw = recentPaymentsResult.data || []
    const userMap = new Map(users.map((u: any) => [u.id, u]))
    const recentPayments = recentPaymentsRaw.map((p: any) => {
      const user = userMap.get(p.user_id)
      return {
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        reference: p.paystack_reference || null,
        created_at: p.created_at,
        user: user ? { email: user.email, full_name: user.full_name } : undefined
      }
    })

    return NextResponse.json({
      stats: {
        totalUsers: users.length,
        activeUsers,
        suspendedUsers,
        pendingUsers,
        totalRevenue,
        activeCourses: courses.length,
        activeAffiliates: affiliates.length,
        totalPayments: payments.length,
        totalCommissions,
        affiliatesOnboarded,
        affiliateSales,
        directSales,
      },
      recentUsers,
      recentPayments,
    })

  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
