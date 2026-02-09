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

function toUSD(amount: number, currency: string): number {
  const cur = currency?.toUpperCase() || 'USD'
  if (cur === 'USD') return amount
  if (cur in RATES) return amount / RATES[cur]
  return amount
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    // Fetch commissions with affiliate profile info
    let query = supabaseAdmin
      .from('commissions')
      .select('*', { count: 'exact' })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    query = query.order('created_at', { ascending: false })

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: commissions, error, count } = await query

    if (error) {
      console.error('Commissions fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get affiliate names
    const affiliateIds = [...new Set((commissions || []).map((c: any) => c.affiliate_id).filter(Boolean))]
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', affiliateIds.length > 0 ? affiliateIds : ['00000000-0000-0000-0000-000000000000'])

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    // Filter by search (affiliate name/email) - done in-memory after fetching profiles
    let enriched = (commissions || []).map((c: any) => {
      const profile = profileMap.get(c.affiliate_id)
      return {
        ...c,
        affiliate_name: profile?.full_name || 'Unknown',
        affiliate_email: profile?.email || '',
        commission_amount_usd: toUSD(c.commission_amount || c.amount || 0, c.commission_currency || 'USD'),
        base_amount_usd: toUSD(c.base_amount || 0, c.base_currency || 'USD'),
      }
    })

    if (search) {
      const s = search.toLowerCase()
      enriched = enriched.filter((c: any) =>
        c.affiliate_name?.toLowerCase().includes(s) ||
        c.affiliate_email?.toLowerCase().includes(s) ||
        c.affiliate_id?.toLowerCase().includes(s)
      )
    }

    // Fetch aggregate stats (all commissions, not just current page)
    const { data: allCommissions } = await supabaseAdmin
      .from('commissions')
      .select('commission_amount, commission_currency, status, amount')

    const stats = {
      totalAmount: 0,
      approvedAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      totalCount: (allCommissions || []).length,
      approvedCount: 0,
      pendingCount: 0,
      paidCount: 0,
    }

    ;(allCommissions || []).forEach((c: any) => {
      const usd = toUSD(c.commission_amount || c.amount || 0, c.commission_currency || 'USD')
      stats.totalAmount += usd
      if (c.status === 'approved' || c.status === 'available') {
        stats.approvedAmount += usd
        stats.approvedCount++
      } else if (c.status === 'pending') {
        stats.pendingAmount += usd
        stats.pendingCount++
      } else if (c.status === 'paid') {
        stats.paidAmount += usd
        stats.paidCount++
      }
    })

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      commissions: enriched,
      stats,
      count: count || 0,
      page,
      limit,
      totalPages,
    })

  } catch (error: any) {
    console.error('Commissions API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { commission_id, action } = body

    if (!commission_id || !action) {
      return NextResponse.json({ error: 'commission_id and action are required' }, { status: 400 })
    }

    let newStatus = ''
    if (action === 'approve') newStatus = 'available'
    else if (action === 'reject') newStatus = 'cancelled'
    else if (action === 'mark_paid') newStatus = 'paid'
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updates: any = { status: newStatus }
    if (newStatus === 'paid') {
      updates.paid_at = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('commissions')
      .update(updates)
      .eq('id', commission_id)

    if (error) {
      console.error('Commission update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Commissions PUT error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
