import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch all programs with their courses
export async function GET(request: NextRequest) {
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

    // Fetch all programs
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('*')
      .order('display_order', { ascending: true })

    if (programsError) {
      console.error('Error fetching programs:', programsError)
      return NextResponse.json(
        { error: 'Failed to fetch programs', details: programsError.message },
        { status: 500 }
      )
    }

    // Fetch all courses that have a program_id
    const { data: allCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description, thumbnail_url, price, is_published, created_at, program_id')
      .not('program_id', 'is', null)

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
    }

    // Group courses by program_id
    const coursesByProgram: Record<string, any[]> = {}
    for (const course of (allCourses || [])) {
      if (course.program_id) {
        if (!coursesByProgram[course.program_id]) {
          coursesByProgram[course.program_id] = []
        }
        coursesByProgram[course.program_id].push(course)
      }
    }

    // Attach courses to each program
    const programsWithCourses = (programs || []).map(program => ({
      ...program,
      courses: coursesByProgram[program.id] || []
    }))

    return NextResponse.json({ programs: programsWithCourses })
  } catch (error: any) {
    console.error('Programs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

// POST - Create a new program
export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { title, description, thumbnail_url, is_active, display_order } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Program title is required' },
        { status: 400 }
      )
    }

    const { data: program, error } = await supabase
      .from('programs')
      .insert({
        title,
        description: description || '',
        thumbnail_url: thumbnail_url || null,
        is_active: is_active !== false,
        display_order: display_order || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating program:', error)
      return NextResponse.json(
        { error: 'Failed to create program', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ program, message: 'Program created successfully' })
  } catch (error: any) {
    console.error('Program creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}
