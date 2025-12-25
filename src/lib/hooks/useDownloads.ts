"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

interface LessonFile {
  id: string
  lesson_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
  lessons: {
    title: string
    modules: {
      courses: {
        title: string
      }
    }
  }
}

interface Download {
  id: string
  name: string
  course: string
  lesson: string
  type: string
  size: string
  downloadDate: string
  category: string
  url: string
  file_type: string
}

interface DownloadsData {
  downloads: Download[]
  categories: { id: string; name: string; count: number }[]
  loading: boolean
  error: string | null
}

export const useDownloads = (): DownloadsData => {
  const { user } = useAuth()
  const [downloads, setDownloads] = useState<Download[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchDownloads = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch lessons from enrolled courses that have downloadable files
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            course_id,
            courses:course_id (
              title,
              modules (
                lessons (
                  id,
                  title,
                  file_url,
                  lesson_type
                )
              )
            )
          `)
          .eq('user_id', user.id)

        if (enrollmentsError) {
          throw new Error(`Failed to fetch downloads: ${enrollmentsError.message}`)
        }

        // Transform the data to create downloadable items
        const downloadItems: Download[] = []
        
        enrollments?.forEach((enrollment: any) => {
          const course = enrollment.courses
          if (course && course.modules) {
            course.modules.forEach((module: any) => {
              if (module.lessons) {
                module.lessons.forEach((lesson: any) => {
                  // Create downloads for lessons with files
                  if (lesson.file_url) {
                    const fileName = lesson.file_url.split('/').pop() || lesson.title
                    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'file'
                    
                    let category = 'resources'
                    let type = 'file'
                    
                    // Categorize based on file type
                    if (['pdf'].includes(fileExtension)) {
                      category = 'notes'
                      type = 'pdf'
                    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExtension)) {
                      category = 'video'
                      type = 'video'
                    } else if (['mp3', 'wav', 'aac'].includes(fileExtension)) {
                      category = 'audio'
                      type = 'audio'
                    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(fileExtension)) {
                      category = 'images'
                      type = 'image'
                    } else if (['zip', 'rar', '7z'].includes(fileExtension)) {
                      category = 'resources'
                      type = 'archive'
                    } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
                      category = 'tools'
                      type = 'spreadsheet'
                    }

                    downloadItems.push({
                      id: `${lesson.id}-file`,
                      name: fileName,
                      course: course.title,
                      lesson: lesson.title,
                      type: type,
                      size: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 9)} MB`, // Mock size for now
                      downloadDate: new Date().toLocaleDateString(),
                      category: category,
                      url: lesson.file_url,
                      file_type: fileExtension
                    })
                  }

                  // Add lesson content as downloadable text/notes if it's a text lesson
                  if (lesson.lesson_type === 'text') {
                    downloadItems.push({
                      id: `${lesson.id}-notes`,
                      name: `${lesson.title} - Notes.txt`,
                      course: course.title,
                      lesson: lesson.title,
                      type: 'text',
                      size: `${Math.floor(Math.random() * 500) + 50} KB`,
                      downloadDate: new Date().toLocaleDateString(),
                      category: 'notes',
                      url: '#', // Would be generated content
                      file_type: 'txt'
                    })
                  }
                })
              }
            })
          }
        })

        // Add certificates as downloadable items
        const { data: completedEnrollments, error: completedError } = await supabase
          .from('enrollments')
          .select(`
            id,
            completed_at,
            courses:course_id (title)
          `)
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)

        if (!completedError && completedEnrollments) {
          completedEnrollments.forEach((enrollment: any) => {
            downloadItems.push({
              id: `cert-${enrollment.id}`,
              name: `Certificate - ${enrollment.courses.title}.pdf`,
              course: enrollment.courses.title,
              lesson: 'Course Completion',
              type: 'pdf',
              size: '1.8 MB',
              downloadDate: new Date(enrollment.completed_at).toLocaleDateString(),
              category: 'certificate',
              url: `https://digiafriq.com/certificates/${enrollment.id}`,
              file_type: 'pdf'
            })
          })
        }

        setDownloads(downloadItems)

        // Generate categories from downloads
        const categoryMap = new Map<string, number>()
        downloadItems.forEach(download => {
          categoryMap.set(download.category, (categoryMap.get(download.category) || 0) + 1)
        })

        const categoriesArray = [
          { id: 'all', name: 'All Files', count: downloadItems.length },
          ...Array.from(categoryMap.entries()).map(([category, count]) => ({
            id: category,
            name: category.charAt(0).toUpperCase() + category.slice(1),
            count
          }))
        ]

        setCategories(categoriesArray)

      } catch (err: any) {
        console.error('Error fetching downloads:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDownloads()
  }, [user])

  return {
    downloads,
    categories,
    loading,
    error
  }
}
