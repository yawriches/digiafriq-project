"use client"
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { cache } from '@/lib/utils/cache'

interface Course {
  id: string
  title: string
  description: string
  thumbnail_url: string
  price: number
  instructor_id: string
  instructor: string
  is_published: boolean
  total_lessons: number
  estimated_duration: number
  duration: string
  category: string
  level: string
  tags: string[]
  created_at: string
  updated_at: string
  modules?: Array<{
    id: string
    title: string
    description?: string
    lessons?: Array<{
      id: string
      title: string
      duration?: string
    }>
  }>
}

interface EnrolledCourse {
  course_id: string
}

interface BrowseCoursesData {
  courses: Course[]
  enrolledCourseIds: string[]
  categories: { id: string; name: string; count: number }[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export const useBrowseCourses = (): BrowseCoursesData => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCoursesData = useCallback(async (skipCache = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching courses...')
      const startTime = Date.now()

      // Check cache first (unless explicitly skipped)
      const cacheKey = 'published_courses'
      const enrollmentsCacheKey = user ? `enrollments_${user.id}` : null

      let coursesData: Course[] = []
      let enrolledIds: string[] = []

      if (!skipCache) {
        const cachedCourses = cache.get<Course[]>(cacheKey)
        const cachedEnrollments = enrollmentsCacheKey ? cache.get<string[]>(enrollmentsCacheKey) : null

        if (cachedCourses) {
          console.log('✅ Using cached courses')
          coursesData = cachedCourses
        }

        if (cachedEnrollments && enrollmentsCacheKey) {
          console.log('✅ Using cached enrollments')
          enrolledIds = cachedEnrollments
        }
      }

      // Fetch only what's not cached
      const promises: any[] = []
      
      if (coursesData.length === 0) {
        promises.push(
          supabase
            .from('courses')
            .select(`
              id, title, description, thumbnail_url, price, instructor_id, instructor, 
              is_published, total_lessons, estimated_duration, duration, category, level, tags, 
              created_at, updated_at,
              modules (
                id,
                title,
                description,
                lessons (
                  id,
                  title,
                  duration
                )
              )
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .then(result => {
              // Calculate actual lesson count from modules/lessons
              if (result.data) {
                result.data = result.data.map((course: any) => {
                  const lessonCount = course.modules?.reduce((sum: number, mod: any) => 
                    sum + (mod.lessons?.length || 0), 0) as number || 0
                  return {
                    ...course,
                    total_lessons: lessonCount > 0 ? lessonCount : course.total_lessons
                    // Keep modules data for CoursePreviewModal
                  }
                })
              }
              return result
            })
        )
      } else {
        promises.push(Promise.resolve({ data: coursesData, error: null }))
      }

      if (enrolledIds.length === 0 && user) {
        promises.push(
          supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', user.id)
            .then(result => result)
        )
      } else {
        promises.push(Promise.resolve({ data: enrolledIds.map(id => ({ course_id: id })), error: null }))
      }

      // Wait for both queries to complete in parallel
      const [coursesResult, enrollmentsResult] = await Promise.all(promises)

      const elapsed = Date.now() - startTime
      console.log(`✅ Courses fetched in ${elapsed}ms`)

      if (coursesResult.error) {
        throw new Error(`Failed to fetch courses: ${coursesResult.error.message}`)
      }

      coursesData = coursesResult.data || []
      setCourses(coursesData)
      
      // Cache courses for 5 minutes
      cache.set(cacheKey, coursesData, 5 * 60 * 1000)

      // Process enrollments
      if (enrollmentsResult.error) {
        console.warn('Failed to fetch enrollments:', enrollmentsResult.error.message)
      } else {
        enrolledIds = enrollmentsResult.data?.map((e: EnrolledCourse) => e.course_id) || []
        setEnrolledCourseIds(enrolledIds)
        
        // Cache enrollments for 2 minutes
        if (enrollmentsCacheKey) {
          cache.set(enrollmentsCacheKey, enrolledIds, 2 * 60 * 1000)
        }
      }

      // Generate categories from courses
      const categoryMap = new Map<string, number>()
      coursesData.forEach((course: Course) => {
        const category = course.category || 'General'
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
      })

      const categoriesArray = [
        { id: 'all', name: 'All Courses', count: coursesData.length },
        ...Array.from(categoryMap.entries()).map(([category, count]) => ({
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
          count
        }))
      ]

      setCategories(categoriesArray)

    } catch (err: any) {
      console.error('❌ Error fetching courses data:', err)
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      await fetchCoursesData()
    }

    fetchData()
  }, [fetchCoursesData])

  return {
    courses,
    enrolledCourseIds,
    categories,
    loading,
    error,
    refresh: fetchCoursesData
  }
}
