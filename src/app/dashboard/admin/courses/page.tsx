"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { 
  BookOpen, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  DollarSign
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  description: string
  price: number
  instructor: string
  thumbnail_url: string | null
  status: string
  is_published: boolean
  category: string
  level: string
  duration: string
  created_at: string
}

const CoursesManagement = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [searchTerm, statusFilter, categoryFilter, courses])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const mappedData = (data || []).map((course: any) => ({
        ...course,
        status: course.is_published ? 'published' : 'draft'
      }))
      
      setCourses(mappedData)
    } catch (error: any) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter)
    }

    setFilteredCourses(filtered)
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error
      
      setCourses(courses.filter(c => c.id !== courseId))
      toast.success('Course deleted successfully')
    } catch (error: any) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course')
    }
  }

  const handleToggleStatus = async (courseId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    const isPublished = newStatus === 'published'

    try {
      const { error } = await (supabase as any)
        .from('courses')
        .update({ is_published: isPublished })
        .eq('id', courseId)

      if (error) throw error
      
      setCourses(courses.map(c => c.id === courseId ? { ...c, status: newStatus, is_published: isPublished } : c))
      toast.success(`Course ${isPublished ? 'published' : 'unpublished'} successfully`)
    } catch (error: any) {
      console.error('Error updating course status:', error)
      toast.error('Failed to update course status')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-blue-100 text-blue-700'
      case 'Intermediate': return 'bg-purple-100 text-purple-700'
      case 'Advanced': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    }>
      <AdminDashboardLayout title="Course Management">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.status === 'published').length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Draft</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.status === 'draft').length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${courses.reduce((sum, c) => sum + (c.price || 0), 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="marketing">Marketing</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="business">Business</option>
              </select>
              <Link href="/dashboard/admin/courses/create">
                <Button className="bg-[#ed874a] hover:bg-[#d76f32]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
            <span className="ml-3 text-gray-600">Loading courses...</span>
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
              <p className="text-lg mb-2 text-gray-900">No courses found</p>
              <p className="text-sm text-gray-600 mb-4">Try adjusting your search or filters</p>
              <Link href="/dashboard/admin/courses/create">
                <Button className="bg-[#ed874a] hover:bg-[#d76f32]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover rounded-t-lg" />
                  ) : (
                    <BookOpen className="w-16 h-16 text-gray-400" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(course.status)}`}>
                      {course.status}
                    </span>
                    {course.level && (
                      <span className={`px-2 py-1 text-xs rounded-full ${getLevelBadgeColor(course.level)}`}>
                        {course.level}
                      </span>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-[#ed874a]">${course.price}</span>
                    <span className="text-sm text-gray-500">{course.category}</span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t">
                    <Link href={`/dashboard/admin/courses/${course.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(course.id, course.status)}
                      className={course.status === 'published' ? 'text-yellow-600' : 'text-green-600'}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteCourseId(course.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteCourseId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Course</h2>
              <p className="mb-6 text-gray-600">Are you sure you want to delete this course? This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteCourseId(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await handleDeleteCourse(deleteCourseId)
                    setDeleteCourseId(null)
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </AdminDashboardLayout>
    </Suspense>
  )
}

export default CoursesManagement
