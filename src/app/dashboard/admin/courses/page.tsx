"use client"
import React, { Suspense, useState, useEffect } from 'react'
import { Loader2, BookOpen, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  price: number
  is_published: boolean
  instructor: string | null
  category: string | null
  created_at: string
}

const CoursesManagement = () => {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/courses')
      const data = await response.json()
      
      if (response.ok) {
        setCourses(data.courses || [])
      } else {
        toast.error(data.error || 'Failed to fetch courses')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const togglePublish = async (course: Course) => {
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !course.is_published })
      })

      if (response.ok) {
        toast.success(course.is_published ? 'Course unpublished' : 'Course published')
        fetchCourses()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update course')
      }
    } catch (error) {
      console.error('Error toggling course:', error)
      toast.error('Failed to update course')
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Course deleted')
        fetchCourses()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete course')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course')
    }
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    }>
      <AdminDashboardLayout title="Courses">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-[#ed874a]" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Courses</h1>
                <p className="text-sm text-gray-500">Manage all courses</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/dashboard/admin/courses/create')}
              className="bg-[#ed874a] hover:bg-[#d76f32]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </div>

          {/* Courses List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
              <span className="ml-3 text-gray-600">Loading courses...</span>
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-500 mb-4">Create your first course to get started</p>
                <Button 
                  onClick={() => router.push('/dashboard/admin/courses/create')}
                  className="bg-[#ed874a] hover:bg-[#d76f32]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          {course.thumbnail_url ? (
                            <img 
                              src={course.thumbnail_url} 
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {course.title}
                            </h3>
                            <Badge variant={course.is_published ? 'default' : 'secondary'}>
                              {course.is_published ? 'Published' : 'Draft'}
                            </Badge>
                            {course.category && (
                              <Badge variant="outline">{course.category}</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-1 mb-2">
                            {course.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{course.instructor || 'No instructor'}</span>
                            <span>${course.price || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublish(course)}
                          title={course.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {course.is_published ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/admin/courses/${course.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCourse(course.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminDashboardLayout>
    </Suspense>
  )
}

export default CoursesManagement
