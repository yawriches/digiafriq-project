"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  BookOpen, 
  Trash2,
  ExternalLink,
  GripVertical
} from 'lucide-react'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  price: number
  is_published: boolean
  instructor: string | null
  level: string | null
  created_at: string
}

interface Program {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  is_active: boolean
  courses: Course[]
}

export default function ProgramCoursesPage() {
  const router = useRouter()
  const params = useParams()
  const programId = params.id as string
  
  const [program, setProgram] = useState<Program | null>(null)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCourses, setShowAddCourses] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (programId) {
      fetchProgram()
      fetchAvailableCourses()
    }
  }, [programId])

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/admin/programs/${programId}`)
      const data = await response.json()
      
      if (response.ok) {
        setProgram(data.program)
      } else {
        toast.error(data.error || 'Failed to fetch program')
      }
    } catch (error) {
      console.error('Error fetching program:', error)
      toast.error('Failed to fetch program')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      const data = await response.json()
      
      if (response.ok) {
        setAvailableCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const addCoursesToProgram = async () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course')
      return
    }

    setSaving(true)
    try {
      // Update each selected course to belong to this program
      for (const courseId of selectedCourses) {
        await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program_id: programId })
        })
      }

      toast.success('Courses added to program!')
      setShowAddCourses(false)
      setSelectedCourses([])
      fetchProgram()
    } catch (error) {
      console.error('Error adding courses:', error)
      toast.error('Failed to add courses')
    } finally {
      setSaving(false)
    }
  }

  const removeCourseFromProgram = async (courseId: string) => {
    if (!confirm('Remove this course from the program?')) return

    try {
      await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: null })
      })

      toast.success('Course removed from program')
      fetchProgram()
    } catch (error) {
      console.error('Error removing course:', error)
      toast.error('Failed to remove course')
    }
  }

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  // Filter out courses already in this program
  const coursesNotInProgram = availableCourses.filter(
    course => !program?.courses?.some(pc => pc.id === course.id)
  )

  if (loading) {
    return (
      <AdminDashboardLayout title="Program Courses">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  if (!program) {
    return (
      <AdminDashboardLayout title="Program Not Found">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Program not found</p>
          <Button onClick={() => router.push('/dashboard/admin/programs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Programs
          </Button>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title={program.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/admin/programs')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{program.title}</h1>
              <p className="text-sm text-gray-500">{program.description || 'No description'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowAddCourses(true)}
              className="bg-[#ed874a] hover:bg-[#d76f32]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Courses
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push(`/dashboard/admin/courses/create?program_id=${programId}`)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
          </div>
        </div>

        {/* Add Courses Modal */}
        {showAddCourses && (
          <Card className="border-[#ed874a]/30">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Add Courses to Program</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAddCourses(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {coursesNotInProgram.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No available courses to add. Create a new course first.
                </p>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                    {coursesNotInProgram.map(course => (
                      <div 
                        key={course.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCourses.includes(course.id)
                            ? 'border-[#ed874a] bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleCourseSelection(course.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.id)}
                          onChange={() => {}}
                          className="w-4 h-4 text-[#ed874a]"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{course.title}</p>
                          <p className="text-sm text-gray-500 truncate">{course.description}</p>
                        </div>
                        <Badge variant={course.is_published ? 'default' : 'secondary'}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={addCoursesToProgram}
                      disabled={saving || selectedCourses.length === 0}
                      className="bg-[#ed874a] hover:bg-[#d76f32]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>Add {selectedCourses.length} Course{selectedCourses.length !== 1 ? 's' : ''}</>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddCourses(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Courses List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Courses in this Program ({program.courses?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!program.courses || program.courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">No courses in this program yet</p>
                <Button 
                  onClick={() => setShowAddCourses(true)}
                  className="bg-[#ed874a] hover:bg-[#d76f32]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Courses
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {program.courses.map((course, index) => (
                  <div 
                    key={course.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="text-gray-400">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{course.title}</h4>
                      <p className="text-sm text-gray-500">
                        {course.instructor || 'No instructor'} • {course.level || 'All levels'}
                      </p>
                    </div>
                    <Badge variant={course.is_published ? 'default' : 'secondary'}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/admin/courses/${course.id}/edit`)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCourseFromProgram(course.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}
