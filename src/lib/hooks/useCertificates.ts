"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

interface Certificate {
  id: string
  enrollment_id: string
  course_id: string
  issued_at: string
  certificate_url?: string
  grade?: string
  score?: number
  enrollment: {
    enrolled_at: string
    completed_at: string
    progress_percentage: number
    courses: {
      title: string
      instructor_id: string
      estimated_duration: number
      category: string
      tags: string[]
    }
  }
}

interface CertificatesData {
  certificates: Certificate[]
  loading: boolean
  error: string | null
}

export const useCertificates = (): CertificatesData => {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchCertificates = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch completed enrollments that should have certificates
        // For now, we'll get completed courses and generate certificate data
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            id,
            course_id,
            enrolled_at,
            completed_at,
            progress_percentage,
            courses:course_id (
              title,
              instructor_id,
              estimated_duration,
              category,
              tags
            )
          `)
          .eq('user_id', user.id)
          .not('completed_at', 'is', null) // Only completed courses
          .order('completed_at', { ascending: false })

        if (enrollmentsError) {
          throw new Error(`Failed to fetch certificates: ${enrollmentsError.message}`)
        }

        // Transform enrollments into certificate format
        const certificatesData = enrollments?.map((enrollment: any) => {
          const course = enrollment.courses
          const completedDate = new Date(enrollment.completed_at)
          const issuedDate = new Date(completedDate.getTime() + 24 * 60 * 60 * 1000) // Issued next day
          
          // Calculate grade based on progress percentage
          let grade = 'B'
          if (enrollment.progress_percentage >= 95) grade = 'A+'
          else if (enrollment.progress_percentage >= 90) grade = 'A'
          else if (enrollment.progress_percentage >= 85) grade = 'B+'
          else if (enrollment.progress_percentage >= 80) grade = 'B'
          else grade = 'C'

          return {
            id: `cert-${enrollment.id}`,
            enrollment_id: enrollment.id,
            course_id: enrollment.course_id,
            issued_at: issuedDate.toISOString(),
            certificate_url: `https://digiafriq.com/certificates/${enrollment.id}`,
            grade: grade,
            score: Math.round(enrollment.progress_percentage),
            enrollment: {
              enrolled_at: enrollment.enrolled_at,
              completed_at: enrollment.completed_at,
              progress_percentage: enrollment.progress_percentage,
              courses: course
            }
          }
        }) || []

        setCertificates(certificatesData)

      } catch (err: any) {
        console.error('Error fetching certificates:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [user])

  return {
    certificates,
    loading,
    error
  }
}
