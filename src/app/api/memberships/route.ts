import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberType = searchParams.get('member_type')
    
    let query = supabase
      .from('membership_packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    // Filter by member_type if provided (this is a string field, not UUID)
    if (memberType) {
      query = query.eq('member_type', memberType)
    }

    const { data: packages, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch membership packages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      packages: packages || [],
      count: packages?.length || 0
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
