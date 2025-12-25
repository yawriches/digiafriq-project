import { supabase } from './supabase/client'
import { Database } from './supabase/types'

type Course = Database['public']['Tables']['courses']['Row']
type Module = Database['public']['Tables']['modules']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']
type Enrollment = Database['public']['Tables']['enrollments']['Row']
type LessonProgress = Database['public']['Tables']['lesson_progress']['Row']

export interface CourseWithModules extends Course {
  modules: (Module & {
    lessons: Lesson[]
  })[]
}

export interface EnrollmentWithCourse extends Enrollment {
  courses: Course
}

// Get all published courses
export async function getPublishedCourses() {
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
    data.modules.sort((a, b) => a.order_index - b.order_index)
    data.modules.forEach(module => {
      if (module.lessons) {
        module.lessons.sort((a, b) => a.order_index - b.order_index)
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
