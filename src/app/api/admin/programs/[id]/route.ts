import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch a single program with its courses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { id } = await params

    // Fetch program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single()

    if (programError) {
      console.error('Error fetching program:', programError)
      return NextResponse.json(
        { error: 'Program not found', details: programError.message },
        { status: 404 }
      )
    }

    // Fetch courses separately by program_id
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description, thumbnail_url, price, is_published, instructor, level, created_at')
      .eq('program_id', id)
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
    }

    return NextResponse.json({ 
      program: {
        ...program,
        courses: courses || []
      }
    })
  } catch (error: any) {
    console.error('Program fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

// PUT - Update a program
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { id } = await params
    const body = await request.json()
    const { title, description, thumbnail_url, is_active, display_order } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url
    if (is_active !== undefined) updateData.is_active = is_active
    if (display_order !== undefined) updateData.display_order = display_order

    const { data: program, error } = await supabase
      .from('programs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating program:', error)
      return NextResponse.json(
        { error: 'Failed to update program', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ program, message: 'Program updated successfully' })
  } catch (error: any) {
    console.error('Program update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a program
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { id } = await params

    // First, unlink all courses from this program
    await supabase
      .from('courses')
      .update({ program_id: null })
      .eq('program_id', id)

    // Then delete the program
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting program:', error)
      return NextResponse.json(
        { error: 'Failed to delete program', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Program deleted successfully' })
  } catch (error: any) {
    console.error('Program delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}
