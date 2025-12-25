import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role client for admin operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all contests
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (error: any) {
    console.error('Error fetching contests:', error)
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}

// POST - Create a new contest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const contestData = {
      name: body.name,
      description: body.description || '',
      campaign: body.campaign || 'DigiAfriq Campaign',
      start_date: body.start_date,
      end_date: body.end_date,
      status: body.status || 'running',
      prize_amount: body.prize_amount || 0,
      prize_description: body.prize_description || '',
      target_referrals: body.target_referrals || 0,
      winner_criteria: body.winner_criteria || 'All target satisfied',
      max_participants: body.max_participants || null,
      rules: body.rules || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('contests')
      .insert(contestData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (error: any) {
    console.error('Error creating contest:', error)
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}

// PUT - Update a contest
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ data: null, error: 'Contest ID is required' }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('contests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (error: any) {
    console.error('Error updating contest:', error)
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a contest
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ data: null, error: 'Contest ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('contests')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error: any) {
    console.error('Error deleting contest:', error)
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}
