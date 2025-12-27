"use client"
import { useCallback } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { useSWR, supabaseFetcher, swrDefaults } from '@/lib/hooks/swr'

interface CourseProgress {
  id: string
  title: string
  progress_percentage: number
  enrolled_at: string
  last_accessed_lesson_id?: string
  completed_at?: string
  courses: {
    title: string
    description: string
    thumbnail_url: string
    instructor_id: string
    estimated_duration: number
    category: string
  }
}

interface LearnerStats {
  totalEnrolled: number
  totalCompleted: number
  totalInProgress: number
  totalWatchTime: number
}

interface LearnerDashboardData {
  stats: LearnerStats
  recentCourses: CourseProgress[]
  profile: any
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export const useLearnerData = (): LearnerDashboardData => {
  const { user, profile } = useAuth()
  const key = user?.id ? ['learner-dashboard', user.id] : null

  const fetcher = useCallback(async () => {
    if (!user || !profile) {
      return {
        stats: {
          totalEnrolled: 0,
          totalCompleted: 0,
          totalInProgress: 0,
          totalWatchTime: 0,
        },
        recentCourses: [] as CourseProgress[],
      }
    }

    return supabaseFetcher(String(key), async () => {
      const { data: enrollments, error: enrollmentsError } = await (supabase as any)
        .from('enrollments')
        .select('*, courses(title, description, thumbnail_url, category)')
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false })
        .limit(20)

      if (enrollmentsError) {
        console.warn('Failed to fetch enrollments, using fallback data:', enrollmentsError.message)
        return {
          stats: {
            totalEnrolled: 0,
            totalCompleted: 0,
            totalInProgress: 0,
            totalWatchTime: 0,
          },
          recentCourses: [] as CourseProgress[],
        }
      }

      const totalEnrolled = enrollments?.length || 0
      const totalCompleted = enrollments?.filter((e: any) => e.completed_at).length || 0
      const totalInProgress = totalEnrolled - totalCompleted

      const totalWatchTime = enrollments?.reduce((total: number, enrollment: any) => {
        const progress = enrollment.progress_percentage || 0
        return total + (progress * 0.3)
      }, 0) || 0

      return {
        stats: {
          totalEnrolled,
          totalCompleted,
          totalInProgress,
          totalWatchTime: Math.round(totalWatchTime),
        },
        recentCourses: (enrollments || []) as CourseProgress[],
      }
    })
  }, [key, user, profile])

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR(key, fetcher, {
    ...swrDefaults,
    revalidateOnFocus: true,
  })

  return {
    stats: data?.stats ?? {
      totalEnrolled: 0,
      totalCompleted: 0,
      totalInProgress: 0,
      totalWatchTime: 0,
    },
    recentCourses: data?.recentCourses ?? [],
    profile,
    loading: !data && isLoading,
    error: error ? (error as any).message ?? String(error) : null,
    refresh: async () => {
      await mutate()
    }
  }
}
