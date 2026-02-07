import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch all active programs for learners
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

    // Fetch active programs
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id, title, description, thumbnail_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (programsError) {
      console.error('Error fetching programs:', programsError)
      return NextResponse.json(
        { error: 'Failed to fetch programs', details: programsError.message },
        { status: 500 }
      )
    }

    // Fetch published courses that belong to programs
    const { data: allCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description, thumbnail_url, price, is_published, instructor, level, program_id')
      .eq('is_published', true)
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
      courses: coursesByProgram[program.id] || [],
      courseCount: (coursesByProgram[program.id] || []).length
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
