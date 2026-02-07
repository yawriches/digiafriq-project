"use client"
import React, { useState, useEffect } from 'react'
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
import { useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get category from URL params (for AI Cashflow Program integration)
  const categoryFromUrl = searchParams.get('category')
  const validCategories = ['marketing', 'design', 'development', 'business', 'skills', 'monetization']
  const initialCategory = categoryFromUrl && validCategories.includes(categoryFromUrl) 
    ? categoryFromUrl 
    : 'marketing'
  
  const [form, setForm] = useState<CourseForm>({
    title: '',
    description: '',
    price: 0,
    instructor: '',
    thumbnail_url: null,
    status: 'draft',
    category: initialCategory,
    level: 'Beginner',
    duration: '',
    modules: []
  })
  
  // Update category if URL param changes
  useEffect(() => {
    if (categoryFromUrl && validCategories.includes(categoryFromUrl)) {
      setForm(prev => ({ ...prev, category: categoryFromUrl }))
    }
  }, [categoryFromUrl])

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Course title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Use API endpoint to create course (bypasses RLS with service role)
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: form.price,
          instructor: form.instructor,
          thumbnail_url: form.thumbnail_url,
          is_published: form.status === 'published',
          category: form.category,
          level: form.level,
          duration: form.duration,
          modules: form.modules
        })
      })

      const data = await response.json()
      console.log('API response:', response.status, data)

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Failed to create course'
        throw new Error(errorMsg)
      }

      toast.success('Course created successfully!')
      router.push('/dashboard/admin/courses')
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create course'
      setError(errorMsg)
      console.error('Error creating course:', err)
      toast.error(errorMsg)
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
