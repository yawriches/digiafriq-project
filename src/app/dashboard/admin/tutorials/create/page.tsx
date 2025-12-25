"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import TutorialFormTabs from '@/components/admin/TutorialFormTabs'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Lesson {
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
  title: string
  description: string
  order_index: number
  lessons: Lesson[]
}

interface TutorialForm {
  title: string
  description: string
  instructor: string
  thumbnail_url: string | null
  is_published: boolean
  is_featured: boolean
  category: string
  level: string
  duration: string
  modules: Module[]
}

export default function CreateTutorialPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState<TutorialForm>({
    title: '',
    description: '',
    instructor: '',
    thumbnail_url: null,
    is_published: false,
    is_featured: false,
    category: 'getting-started',
    level: 'Beginner',
    duration: '',
    modules: []
  })

  const handleSave = async () => {
    if (!form.title || !form.description) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Create tutorial
      const { data: tutorial, error: tutorialError } = await supabase
        .from('tutorials')
        .insert({
          title: form.title,
          description: form.description,
          instructor: form.instructor,
          thumbnail_url: form.thumbnail_url,
          is_published: form.is_published,
          is_featured: form.is_featured,
          category: form.category,
          level: form.level,
          duration: form.duration,
          views: 0,
          rating: 0
        })
        .select()
        .single()

      if (tutorialError) throw tutorialError

      // Create modules and lessons
      for (const mod of form.modules) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('tutorial_modules')
          .insert({
            tutorial_id: tutorial.id,
            title: mod.title,
            description: mod.description,
            order_index: mod.order_index
          })
          .select()
          .single()

        if (moduleError) throw moduleError

        // Create lessons for this module
        for (const lesson of mod.lessons) {
          const { error: lessonError } = await supabase
            .from('tutorial_lessons')
            .insert({
              module_id: moduleData.id,
              title: lesson.title,
              description: lesson.description,
              type: lesson.type,
              content_url: lesson.content_url,
              video_url: lesson.video_url,
              instructor_notes: lesson.instructor_notes,
              duration: lesson.duration,
              order_index: lesson.order_index
            })

          if (lessonError) throw lessonError
        }
      }

      toast.success('Tutorial created successfully!')
      router.push('/dashboard/admin/tutorials')
    } catch (err: any) {
      setError(err.message || 'Failed to create tutorial')
      console.error('Error creating tutorial:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminDashboardLayout title="Create Tutorial">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/admin/tutorials')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Tutorial</h1>
              <p className="text-gray-600">Add a new tutorial for affiliates</p>
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
                Save Tutorial
              </>
            )}
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <TutorialFormTabs form={form} setForm={setForm} error={error} />
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}
