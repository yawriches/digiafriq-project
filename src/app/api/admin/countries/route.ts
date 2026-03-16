import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdmin } from '@/lib/auth/admin-check'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get all countries (ordered by display_order)
    const { data: countries, error } = await supabase
      .from('countries')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching countries:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ countries }, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/admin/countries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authCheck = await verifyAdmin(request)
    if (!authCheck.isAdmin || authCheck.error) {
      return authCheck.error!
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    const { name, code, is_active, is_default, display_order } = body

    if (!name) {
      return NextResponse.json({ error: 'Country name is required' }, { status: 400 })
    }

    // Insert new country
    const { data: country, error } = await supabase
      .from('countries')
      .insert({
        name,
        code: code || null,
        is_active: is_active !== undefined ? is_active : true,
        is_default: is_default || false,
        display_order: display_order || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating country:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ country }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/countries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const authCheck = await verifyAdmin(request)
    if (!authCheck.isAdmin || authCheck.error) {
      return authCheck.error!
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    const { id, name, code, is_active, is_default, display_order } = body

    if (!id) {
      return NextResponse.json({ error: 'Country ID is required' }, { status: 400 })
    }

    // Update country
    const { data: country, error } = await supabase
      .from('countries')
      .update({
        name,
        code,
        is_active,
        is_default,
        display_order
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating country:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ country }, { status: 200 })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/countries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const authCheck = await verifyAdmin(request)
    if (!authCheck.isAdmin || authCheck.error) {
      return authCheck.error!
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Country ID is required' }, { status: 400 })
    }

    // Delete country
    const { error } = await supabase
      .from('countries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting country:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/countries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
