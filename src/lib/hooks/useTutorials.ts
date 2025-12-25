"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Tutorial {
  id: string
  title: string
  description: string
  instructor: string
  thumbnail_url: string | null
  duration: string
  category: string
  level: string
  difficulty: string // alias for level for backward compatibility
  views: number
  rating: number
  is_featured: boolean
  is_published: boolean
  created_at: string
  modules_count?: number
  lessons_count?: number
}

interface TutorialsData {
  tutorials: Tutorial[]
  featuredTutorial: Tutorial | null
  loading: boolean
  error: string | null
}

export const useTutorials = (): TutorialsData => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [featuredTutorial, setFeaturedTutorial] = useState<Tutorial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch only published tutorials for affiliates
        const { data: tutorialsData, error: tutorialsError } = await supabase
          .from('tutorials')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })

        if (tutorialsError) {
          console.warn('Failed to fetch tutorials:', tutorialsError.message)
          throw tutorialsError
        }

        // Map level to difficulty for backward compatibility
        const mappedTutorials = (tutorialsData || []).map((t: any) => ({
          ...t,
          difficulty: t.level || 'Beginner'
        }))

        setTutorials(mappedTutorials)
        
        // Find featured tutorial (first published and featured)
        const featured = mappedTutorials.find((t: Tutorial) => t.is_featured)
        setFeaturedTutorial(featured || null)

      } catch (err: any) {
        console.error('Error fetching tutorials:', err)
        setError(err.message || 'Failed to load tutorials')
        setTutorials([])
        setFeaturedTutorial(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTutorials()
  }, [])

  return {
    tutorials,
    featuredTutorial,
    loading,
    error
  }
}
