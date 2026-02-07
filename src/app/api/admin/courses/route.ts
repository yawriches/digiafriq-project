import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST - Create a new course
export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error - missing database credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await request.json()
    console.log('Received course data:', JSON.stringify(body, null, 2))
    
    const { title, description, price, instructor, thumbnail_url, is_published, category, level, duration, modules } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Course title is required' },
        { status: 400 }
      )
    }

    console.log('Creating course:', { title, category, is_published })

    // Build course data - only include fields that exist in the database
    // Base fields from initial schema
    const courseData: any = {
      title,
      description: description || '',
      price: price || 0,
      thumbnail_url: thumbnail_url || null,
      is_published: is_published || false,
      category: category || 'marketing'
    }

    // Optional fields that may have been added via migrations
    if (instructor) courseData.instructor = instructor
    if (level) courseData.level = level

    console.log('Inserting course data:', courseData)

    // Create the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (courseError) {
      console.error('Error creating course:', courseError)
      console.error('Course error details:', JSON.stringify(courseError, null, 2))
      return NextResponse.json(
        { error: 'Failed to create course', details: courseError.message, code: courseError.code },
        { status: 500 }
      )
    }

    console.log('Course created:', course.id)

    // Create modules and lessons if provided
    if (modules && modules.length > 0) {
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i]
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .insert({
            course_id: course.id,
            title: mod.title,
            description: mod.description || '',
            order_index: i
          })
          .select()
          .single()

        if (moduleError) {
          console.error('Error creating module:', moduleError)
          continue
        }

        // Create lessons for this module
        if (mod.lessons && mod.lessons.length > 0) {
          for (let j = 0; j < mod.lessons.length; j++) {
            const lesson = mod.lessons[j]
            const { error: lessonError } = await supabase
              .from('lessons')
              .insert({
                module_id: moduleData.id,
                title: lesson.title,
                description: lesson.description || '',
                type: lesson.type || 'video',
                content_url: lesson.content_url || '',
                video_url: lesson.video_url || '',
                instructor_notes: lesson.instructor_notes || '',
                duration: lesson.duration || '',
                order_index: j
              })

            if (lessonError) {
              console.error('Error creating lesson:', lessonError)
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      course, 
      message: 'Course created successfully' 
    })

  } catch (error: any) {
    console.error('Course creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

// GET - Fetch all courses for admin
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

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch courses', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ courses: courses || [] })
  } catch (error: any) {
    console.error('Courses API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}
