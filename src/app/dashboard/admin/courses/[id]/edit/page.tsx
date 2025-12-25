"use client"
import React, { useState, useEffect } from 'react'
import { 
  Loader2,
  ArrowLeft,
  Save
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import CourseFormTabs from '@/components/admin/CourseFormTabs'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'

interface Module {
  id?: string
  title: string
  description: string
  order_index: number
  lessons: Lesson[]
}

interface Lesson {
  id?: string
  title: string
  description: string
  type: string
  content_url: string
  video_url: string
  instructor_notes: string
  duration: string
  order_index: number
}

interface CourseForm {
  id: string
  title: string
  description: string
  price: number
  instructor: string
  thumbnail_url: string | null
  status: string
  category: string
  level: string
  duration: string
  modules: Module[]
}

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CourseForm | null>(null)

  useEffect(() => {
    if (courseId) {
      loadCourse()
    }
  }, [courseId])

  const loadCourse = async () => {
    try {
      setLoading(true)
      
      // Fetch course
      const { data: course, error: courseError } = await (supabase as any)
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      // Fetch modules with lessons
      const { data: modules, error: modulesError } = await (supabase as any)
        .from('modules')
        .select('*, lessons(*)')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (modulesError) throw modulesError

      // Format modules
      const formattedModules = (modules || []).map((mod: any) => ({
        id: mod.id,
        title: mod.title || '',
        description: mod.description || '',
        order_index: mod.order_index || 0,
        lessons: (mod.lessons || [])
          .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
          .map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title || '',
            description: lesson.description || '',
            type: lesson.lesson_type || 'video',
            content_url: lesson.content || '',
            video_url: lesson.video_url || '',
            instructor_notes: lesson.instructor_notes || '',
            duration: lesson.duration ? String(lesson.duration) : '',
            order_index: lesson.order_index || 0
          }))
      }))

      setForm({
        id: course.id,
        title: course.title || '',
        description: course.description || '',
        price: course.price || 0,
        instructor: course.instructor || '',
        thumbnail_url: course.thumbnail_url,
        status: course.is_published ? 'published' : 'draft',
        category: course.category || 'marketing',
        level: course.level || 'Beginner',
        duration: course.duration || '',
        modules: formattedModules
      })
    } catch (err: any) {
      console.error('Error loading course:', err)
      setError(err.message || 'Failed to load course')
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.title.trim()) {
      setError('Course title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Update course
      const { error: courseError } = await (supabase as any)
        .from('courses')
        .update({
          title: form.title,
          description: form.description,
          price: form.price,
          instructor: form.instructor,
          thumbnail_url: form.thumbnail_url,
          is_published: form.status === 'published',
          category: form.category,
          level: form.level,
          duration: form.duration
        })
        .eq('id', form.id)

      if (courseError) throw courseError

      // Delete existing modules and lessons (will cascade)
      await (supabase as any)
        .from('modules')
        .delete()
        .eq('course_id', form.id)

      // Recreate modules and lessons
      for (let i = 0; i < form.modules.length; i++) {
        const mod = form.modules[i]
        const { data: moduleData, error: moduleError } = await (supabase as any)
          .from('modules')
          .insert({
            course_id: form.id,
            title: mod.title,
            description: mod.description,
            order_index: i
          })
          .select()
          .single()

        if (moduleError) {
          console.error('Module insert error:', moduleError)
          throw new Error(moduleError.message || JSON.stringify(moduleError))
        }

        // Create lessons for this module
        for (let j = 0; j < mod.lessons.length; j++) {
          const lesson = mod.lessons[j]
          const { error: lessonError } = await (supabase as any)
            .from('lessons')
            .insert({
              module_id: moduleData.id,
              title: lesson.title,
              description: lesson.description,
              lesson_type: lesson.type || 'video',
              content: lesson.content_url,
              video_url: lesson.video_url,
              instructor_notes: lesson.instructor_notes,
              duration: lesson.duration ? parseInt(lesson.duration) || null : null,
              order_index: j
            })

          if (lessonError) {
            console.error('Lesson insert error:', lessonError)
            throw new Error(lessonError.message || JSON.stringify(lessonError))
          }
        }
      }

      toast.success('Course updated successfully!')
      router.push('/dashboard/admin/courses')
    } catch (err: any) {
      setError(err.message || 'Failed to update course')
      console.error('Error updating course:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Edit Course">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <span className="ml-3 text-gray-600">Loading course...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  if (!form) {
    return (
      <AdminDashboardLayout title="Edit Course">
        <div className="text-center py-12">
          <p className="text-gray-600">Course not found</p>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/admin/courses')}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title="Edit Course">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/admin/courses')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
              <p className="text-gray-600">Update course details and content</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#ed874a] hover:bg-[#d76f32]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Course
              </>
            )}
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <CourseFormTabs form={form} setForm={setForm} error={error} />
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}
