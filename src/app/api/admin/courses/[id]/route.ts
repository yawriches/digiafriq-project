import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch a single course
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

    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Course not found', details: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({ course })
  } catch (error: any) {
    console.error('Course fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

// PUT - Update a course
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

    // Build update object with only provided fields
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = body.price
    if (body.instructor !== undefined) updateData.instructor = body.instructor
    if (body.thumbnail_url !== undefined) updateData.thumbnail_url = body.thumbnail_url
    if (body.is_published !== undefined) updateData.is_published = body.is_published
    if (body.category !== undefined) updateData.category = body.category
    if (body.level !== undefined) updateData.level = body.level
    if (body.duration !== undefined) updateData.duration = body.duration
    if (body.program_id !== undefined) updateData.program_id = body.program_id

    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating course:', error)
      return NextResponse.json(
        { error: 'Failed to update course', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ course, message: 'Course updated successfully' })
  } catch (error: any) {
    console.error('Course update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a course
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

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting course:', error)
      return NextResponse.json(
        { error: 'Failed to delete course', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error: any) {
    console.error('Course delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}
