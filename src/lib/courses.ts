import { db } from './supabase/client'

// Use db (untyped) client throughout — this file heavily uses join queries
// that the hand-maintained types.ts can't express relationships for.
// TODO: Switch back to typed client once types are generated via `supabase gen types typescript`
const supabase = db

export interface CourseWithModules {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  price: number
  instructor_id: string | null
  is_published: boolean
  total_lessons: number
  estimated_duration: number | null
  category: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  modules: {
    id: string
    course_id: string
    title: string
    description: string | null
    order_index: number
    created_at: string
    updated_at: string
    lessons: {
      id: string
      module_id: string
      title: string
      description: string | null
      content: string | null
      video_url: string | null
      file_url: string | null
      lesson_type: string
      duration: number | null
      order_index: number
      is_preview: boolean
      instructor_notes: string | null
      created_at: string
      updated_at: string
    }[]
  }[]
}

export interface EnrollmentWithCourse {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed_at: string | null
  progress_percentage: number
  last_accessed_lesson_id: string | null
  courses: any
}

// Get all published courses
export async function getPublishedCourses() {
  const { data, error } = await db
    .from('courses')
    .select(`
      *,
      profiles!courses_instructor_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get course by ID with modules and lessons
export async function getCourseWithContent(courseId: string): Promise<CourseWithModules | null> {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        *,
        lessons (
          *
        )
      )
    `)
    .eq('id', courseId)
    .eq('is_published', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Sort modules and lessons by order_index
  if (data.modules) {
    data.modules.sort((a: any, b: any) => a.order_index - b.order_index)
    data.modules.forEach((module: any) => {
      if (module.lessons) {
        module.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
      }
    })
  }

  return data as CourseWithModules
}

// Get user's enrollments
export async function getUserEnrollments(): Promise<EnrollmentWithCourse[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      courses (
        *,
        profiles!courses_instructor_id_fkey (
          full_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })

  if (error) throw error
  return data as EnrollmentWithCourse[]
}

// Get user's progress for a specific course
export async function getCourseProgress(courseId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Get enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (enrollmentError) {
    if (enrollmentError.code === 'PGRST116') return null
    throw enrollmentError
  }

  // Get lesson progress
  const { data: lessonProgress, error: progressError } = await supabase
    .from('lesson_progress')
    .select(`
      *,
      lessons (
        id,
        title,
        module_id,
        modules (
          id,
          title
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('enrollment_id', enrollment.id)

  if (progressError) throw progressError

  return {
    enrollment,
    lessonProgress
  }
}

// Mark lesson as completed
export async function markLessonCompleted(lessonId: string, watchTime?: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Get lesson details to find enrollment
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      *,
      modules (
        course_id
      )
    `)
    .eq('id', lessonId)
    .single()

  if (lessonError) throw lessonError

  // Get enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', lesson.modules.course_id)
    .single()

  if (enrollmentError) throw enrollmentError

  // Update or create lesson progress
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      enrollment_id: enrollment.id,
      is_completed: true,
      watch_time: watchTime || 0,
      completed_at: new Date().toISOString()
    })
    .select()

  if (error) throw error
  return data
}

// Update lesson watch time
export async function updateLessonWatchTime(lessonId: string, watchTime: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Get lesson details to find enrollment
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      *,
      modules (
        course_id
      )
    `)
    .eq('id', lessonId)
    .single()

  if (lessonError) throw lessonError

  // Get enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', lesson.modules.course_id)
    .single()

  if (enrollmentError) throw enrollmentError

  // Update or create lesson progress
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      enrollment_id: enrollment.id,
      watch_time: watchTime
    })
    .select()

  if (error) throw error
  return data
}

// Get course statistics (for instructors/admins)
export async function getCourseStats(courseId: string) {
  const { data, error } = await supabase.rpc('get_course_stats', {
    course_id_param: courseId
  })

  if (error) throw error
  return data
}

// Search courses
export async function searchCourses(query: string, category?: string) {
  let queryBuilder = supabase
    .from('courses')
    .select(`
      *,
      profiles!courses_instructor_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq('is_published', true)

  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
  }

  if (category) {
    queryBuilder = queryBuilder.eq('category', category)
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Enroll user in a course
export async function enrollInCourse(courseId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Check if already enrolled
  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existingEnrollment) {
    return { alreadyEnrolled: true, enrollment: existingEnrollment }
  }

  // Create new enrollment
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: user.id,
      course_id: courseId,
      progress_percentage: 0
    })
    .select()
    .single()

  if (error) throw error
  return { alreadyEnrolled: false, enrollment: data }
}

// Get featured courses (you can customize this logic)
export async function getFeaturedCourses(limit = 6) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      profiles!courses_instructor_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
