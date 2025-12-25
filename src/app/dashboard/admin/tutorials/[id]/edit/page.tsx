"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import TutorialFormTabs from '@/components/admin/TutorialFormTabs'
import { supabase } from '@/lib/supabase/client'
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

interface TutorialForm {
  id: string
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

export default function EditTutorialPage() {
  const router = useRouter()
  const params = useParams()
  const tutorialId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<TutorialForm | null>(null)

  useEffect(() => {
    if (tutorialId) {
      loadTutorial()
    }
  }, [tutorialId])

  const loadTutorial = async () => {
    try {
      setLoading(true)

      // Fetch tutorial
      const { data: tutorial, error: tutorialError } = await supabase
        .from('tutorials')
        .select('*')
        .eq('id', tutorialId)
        .single()

      if (tutorialError) throw tutorialError

      // Fetch modules
      const { data: modules, error: modulesError } = await supabase
        .from('tutorial_modules')
        .select('*')
        .eq('tutorial_id', tutorialId)
        .order('order_index')

      if (modulesError) throw modulesError

      // Fetch lessons for each module
      const modulesWithLessons = await Promise.all(
        (modules || []).map(async (mod: any) => {
          const { data: lessons, error: lessonsError } = await supabase
            .from('tutorial_lessons')
            .select('*')
            .eq('module_id', mod.id)
            .order('order_index')

          if (lessonsError) throw lessonsError

          return {
            ...mod,
            lessons: lessons || []
          }
        })
      )

      setForm({
        id: tutorial.id,
        title: tutorial.title || '',
        description: tutorial.description || '',
        instructor: tutorial.instructor || '',
        thumbnail_url: tutorial.thumbnail_url,
        is_published: tutorial.is_published || false,
        is_featured: tutorial.is_featured || false,
        category: tutorial.category || 'getting-started',
        level: tutorial.level || 'Beginner',
        duration: tutorial.duration || '',
        modules: modulesWithLessons
      })
    } catch (err: any) {
      console.error('Error loading tutorial:', err)
      setError(err.message || 'Failed to load tutorial')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form) return

    if (!form.title || !form.description) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Update tutorial
      const { error: tutorialError } = await supabase
        .from('tutorials')
        .update({
          title: form.title,
          description: form.description,
          instructor: form.instructor,
          thumbnail_url: form.thumbnail_url,
          is_published: form.is_published,
          is_featured: form.is_featured,
          category: form.category,
          level: form.level,
          duration: form.duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', tutorialId)

      if (tutorialError) throw tutorialError

      // Delete existing modules and lessons (cascade will handle lessons)
      const { error: deleteError } = await supabase
        .from('tutorial_modules')
        .delete()
        .eq('tutorial_id', tutorialId)

      if (deleteError) throw deleteError

      // Recreate modules and lessons
      for (const mod of form.modules) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('tutorial_modules')
          .insert({
            tutorial_id: tutorialId,
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

      toast.success('Tutorial updated successfully!')
      router.push('/dashboard/admin/tutorials')
    } catch (err: any) {
      setError(err.message || 'Failed to update tutorial')
      console.error('Error updating tutorial:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Edit Tutorial">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <span className="ml-3 text-gray-600">Loading tutorial...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  if (!form) {
    return (
      <AdminDashboardLayout title="Edit Tutorial">
        <div className="text-center py-12">
          <p className="text-gray-600">Tutorial not found</p>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/admin/tutorials')}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tutorials
          </Button>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title="Edit Tutorial">
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Tutorial</h1>
              <p className="text-gray-600">Update tutorial details and content</p>
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
                Update Tutorial
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
