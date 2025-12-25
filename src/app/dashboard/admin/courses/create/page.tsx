"use client"
import React, { useState } from 'react'
import { 
  Plus,
  Loader2,
  ArrowLeft,
  Save
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import CourseFormTabs from '@/components/admin/CourseFormTabs'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

interface Module {
  id?: string
  title: string
  description: string
  order_index: number
  lessons: Lesson[]
}

interface CourseForm {
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

export default function CreateCoursePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CourseForm>({
    title: '',
    description: '',
    price: 0,
    instructor: '',
    thumbnail_url: null,
    status: 'draft',
    category: 'marketing',
    level: 'Beginner',
    duration: '',
    modules: []
  })

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Course title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Create course
      const { data: course, error: courseError } = await (supabase as any)
        .from('courses')
        .insert({
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
        .select()
        .single()

      if (courseError) throw courseError

      // Create modules and lessons
      for (let i = 0; i < form.modules.length; i++) {
        const mod = form.modules[i]
        const { data: moduleData, error: moduleError } = await (supabase as any)
          .from('modules')
          .insert({
            course_id: course.id,
            title: mod.title,
            description: mod.description,
            order_index: i
          })
          .select()
          .single()

        if (moduleError) throw moduleError

        // Create lessons for this module
        for (let j = 0; j < mod.lessons.length; j++) {
          const lesson = mod.lessons[j]
          const { error: lessonError } = await (supabase as any)
            .from('lessons')
            .insert({
              module_id: moduleData.id,
              title: lesson.title,
              description: lesson.description,
              type: lesson.type || 'video',
              content_url: lesson.content_url,
              video_url: lesson.video_url,
              instructor_notes: lesson.instructor_notes,
              duration: lesson.duration,
              order_index: j
            })

          if (lessonError) throw lessonError
        }
      }

      toast.success('Course created successfully!')
      router.push('/dashboard/admin/courses')
    } catch (err: any) {
      setError(err.message || 'Failed to create course')
      console.error('Error creating course:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminDashboardLayout title="Create Course">
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
              <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
              <p className="text-gray-600">Add a new course to your catalog</p>
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
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Course
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
