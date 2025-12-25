"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { 
  BookOpen, 
  Play,
  Clock,
  Star,
  Search,
  Users,
  MoreVertical,
  Loader2,
  RotateCcw
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLearnerData } from '@/lib/hooks/useLearnerData'
import Image from 'next/image'

const MyCoursesPage = () => {
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { recentCourses, loading, error } = useLearnerData()

  // Transform backend data to match the expected format
  const courses = recentCourses.map((enrollment: any) => {
    const course = enrollment.courses
    const progress = Math.round(enrollment.progress_percentage || 0)
    const isCompleted = enrollment.completed_at !== null
    const isStarted = progress > 0
    
    let status = 'not-started'
    if (isCompleted) {
      status = 'completed'
    } else if (isStarted) {
      status = 'in-progress'
    }

    return {
      id: course?.id || enrollment.course_id,
      enrollmentId: enrollment.id,
      title: course?.title || 'Untitled Course',
      instructor: course?.instructor || 'TBA',
      thumbnail: course?.thumbnail_url || '/api/placeholder/300/200',
      progress: progress,
      totalLessons: course?.total_lessons || 0,
      completedLessons: Math.round((progress / 100) * (course?.total_lessons || 0)),
      duration: course?.estimated_duration ? `${Math.floor(course.estimated_duration / 60)}h ${course.estimated_duration % 60}m` : 'TBA',
      rating: 4.5, // Default rating since we don't have this in backend yet
      enrolledDate: new Date(enrollment.enrolled_at).toLocaleDateString(),
      lastAccessed: enrollment.last_accessed_lesson_id ? 'Recently' : 'Not accessed',
      status: status,
      category: course?.category || 'General',
      difficulty: 'Intermediate', // Default since we don't have this field
      nextLesson: isCompleted ? null : 'Continue where you left off',
      certificateEarned: isCompleted
    }
  })

  const filterOptions = [
    { value: 'all', label: 'All Courses', count: courses.length },
    { value: 'in-progress', label: 'In Progress', count: courses.filter(c => c.status === 'in-progress').length },
    { value: 'completed', label: 'Completed', count: courses.filter(c => c.status === 'completed').length },
    { value: 'not-started', label: 'Not Started', count: courses.filter(c => c.status === 'not-started').length }
  ]

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading courses: {error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-600 hover:bg-red-700"
        >
          Retry
        </Button>
      </div>
    )
  }

  const filteredCourses = courses.filter(course => {
    const matchesFilter = filterStatus === 'all' || course.status === filterStatus
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'in-progress':
        return 'text-blue-600 bg-blue-100'
      case 'not-started':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in-progress':
        return 'In Progress'
      case 'not-started':
        return 'Not Started'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
        </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter Buttons - Grid layout for mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-center ${
                  filterStatus === option.value
                    ? 'bg-[#ed874a] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="block sm:inline">{option.label}</span>
                <span className="text-[10px] sm:text-xs opacity-80 ml-0 sm:ml-1">({option.count})</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="w-full h-48 bg-gray-200 rounded-t-lg relative overflow-hidden">
                {course.thumbnail && course.thumbnail !== '/api/placeholder/300/200' ? (
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="absolute top-2 right-2">
                <Button variant="ghost" size="sm" className="bg-white/80 hover:bg-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                  {getStatusText(course.status)}
                </span>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">by {course.instructor}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {course.duration}
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {course.completedLessons}/{course.totalLessons}
                </div>
                <div className="flex items-center">
                  <Star className="w-3 h-3 mr-1 text-yellow-500" />
                  {course.rating}
                </div>
              </div>
              
              {course.status !== 'not-started' && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#ed874a] h-2 rounded-full" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {course.nextLesson && course.status !== 'completed' && (
                <p className="text-xs text-gray-500 mb-3">
                  Next: {course.nextLesson}
                </p>
              )}
              
              <div className="flex gap-2">
                {course.status === 'completed' ? (
                  <Button size="sm" className="flex-1 border-[#ed874a] text-[#ed874a] hover:bg-[#ed874a] hover:text-white" variant="outline" asChild>
                    <Link href={`/dashboard/learner/courses/${course.id}`}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Start Over
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1 bg-[#ed874a] hover:bg-[#d76f32]" asChild>
                    <Link href={`/dashboard/learner/courses/${course.id}`}>
                      <Play className="w-4 h-4 mr-2" />
                      {course.status === 'not-started' ? 'Start Course' : 'Continue'}
                    </Link>
                  </Button>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Enrolled: {course.enrolledDate}</span>
                  <span>Last: {course.lastAccessed}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No courses enrolled yet</h3>
            <p className="text-gray-600 mb-4">Start your learning journey by browsing our course catalog</p>
            <Button className="bg-[#ed874a] hover:bg-[#d76f32]" asChild>
              <Link href="/dashboard/learner/browse">
                Browse Courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export default MyCoursesPage
