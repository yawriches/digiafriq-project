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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const country = searchParams.get('country') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    // Build query using service role (bypasses RLS)
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (country && country !== 'all') {
      query = query.eq('country', country)
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Users fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      hasPrevious: page > 1
    })

  } catch (error: any) {
    console.error('Users API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, action, status, role } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Verify target user exists
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'update_status' && status) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', user_id)

      if (error) {
        console.error('Update status error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (action === 'update_role' && role) {
      const updates: any = {
        role,
        active_role: role,
        updated_at: new Date().toISOString()
      }

      // If changing to affiliate, add to available_roles
      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('available_roles')
        .eq('id', user_id)
        .single()

      if (currentProfile) {
        const availableRoles = currentProfile.available_roles || []
        if (!availableRoles.includes(role)) {
          updates.available_roles = [...availableRoles, role]
        }
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', user_id)

      if (error) {
        console.error('Update role error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Users PUT error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
