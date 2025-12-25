"use client"
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'

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
  const pathname = usePathname()
  const [stats, setStats] = useState<LearnerStats>({
    totalEnrolled: 0,
    totalCompleted: 0,
    totalInProgress: 0,
    totalWatchTime: 0
  })
  const [recentCourses, setRecentCourses] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoized fetch function that can be called manually
  const fetchLearnerData = useCallback(async () => {
    if (!user || !profile) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Simplified query for faster loading - fetch basic enrollment data first
      const { data: enrollments, error: enrollmentsError } = await (supabase as any)
        .from('enrollments')
        .select('*, courses(title, description, thumbnail_url, category)')
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false })
        .limit(20) // Limit for performance

      if (enrollmentsError) {
        console.warn('Failed to fetch enrollments, using fallback data:', enrollmentsError.message)
        // Use fallback data instead of throwing error
        setStats({
          totalEnrolled: 0,
          totalCompleted: 0,
          totalInProgress: 0,
          totalWatchTime: 0
        })
        setRecentCourses([])
        setLoading(false)
        return
      }

      // Calculate stats with null safety
      const totalEnrolled = enrollments?.length || 0
      const totalCompleted = enrollments?.filter((e: any) => e.completed_at).length || 0
      const totalInProgress = totalEnrolled - totalCompleted
      
      // Simplified watch time calculation
      const totalWatchTime = enrollments?.reduce((total: number, enrollment: any) => {
        const progress = enrollment.progress_percentage || 0
        return total + (progress * 0.3) // Simplified calculation
      }, 0) || 0

      setStats({
        totalEnrolled,
        totalCompleted,
        totalInProgress,
        totalWatchTime: Math.round(totalWatchTime)
      })

      setRecentCourses(enrollments || [])

    } catch (err: any) {
      console.error('Error fetching learner data:', err)
      
      // Set fallback data on error
      setStats({
        totalEnrolled: 0,
        totalCompleted: 0,
        totalInProgress: 0,
        totalWatchTime: 0
      })
      setRecentCourses([])
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  // Initial fetch on mount or when user/profile changes
  useEffect(() => {
    fetchLearnerData()
  }, [fetchLearnerData])

  // Refetch when route changes
  useEffect(() => {
    fetchLearnerData()
  }, [pathname, fetchLearnerData])

  // Refetch when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 Tab became visible, refreshing learner data...')
        fetchLearnerData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchLearnerData])

  // Refetch when page is restored from bfcache (browser back/forward)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 Page restored from bfcache, refreshing learner data...')
        fetchLearnerData()
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [fetchLearnerData])

  return {
    stats,
    recentCourses,
    profile,
    loading,
    error,
    refresh: fetchLearnerData
  }
}
