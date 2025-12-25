"use client"
import React, { useState } from 'react'
import { 
  BookOpen, 
  Play,
  Clock,
  Star,
  Users,
  Search,
  ShoppingCart,
  Heart,
  Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBrowseCourses } from '@/lib/hooks/useBrowseCourses'
import CoursePreviewModal from '@/components/CoursePreviewModal'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { enrollInCourse } from '@/lib/courses'
import { toast } from 'sonner'

const BrowseCoursesPage = () => {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [previewCourse, setPreviewCourse] = useState<any>(null)
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)
  const { courses: backendCourses, enrolledCourseIds, categories, loading, error, refresh } = useBrowseCourses()

  const handleEnroll = async (courseId: string, courseTitle: string) => {
    try {
      setEnrollingCourseId(courseId)
      const result = await enrollInCourse(courseId)
      
      if (result.alreadyEnrolled) {
        toast.info('You are already enrolled in this course')
        router.push(`/dashboard/learner/courses/${courseId}`)
      } else {
        toast.success(`Successfully enrolled in "${courseTitle}"!`)
        refresh() // Refresh the courses list to update enrollment status
        router.push(`/dashboard/learner/courses/${courseId}`)
      }
    } catch (error: any) {
      console.error('Enrollment error:', error)
      toast.error(error.message || 'Failed to enroll in course')
    } finally {
      setEnrollingCourseId(null)
    }
  }

  // Transform backend data to match the expected format
  const courses = backendCourses.map((course: any) => {
    const isEnrolled = enrolledCourseIds.includes(course.id)
    const isNew = new Date(course.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // New if created within 30 days
    
    // Use duration text field, or calculate from estimated_duration if available
    let durationDisplay = course.duration || 'TBA'
    if (!course.duration && course.estimated_duration) {
      const hours = Math.floor(course.estimated_duration / 60)
      const mins = course.estimated_duration % 60
      durationDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }
    
    return {
      id: course.id,
      title: course.title,
      instructor: course.instructor || 'DigiAfriq Team',
      thumbnail: course.thumbnail_url || '/api/placeholder/300/200',
      rating: 4.5, // Default rating since we don't have ratings in backend yet
      studentsCount: Math.floor(Math.random() * 3000) + 100, // Mock student count for now
      duration: durationDisplay,
      lessonsCount: course.total_lessons || 0,
      level: course.level || 'Beginner',
      category: course.category?.toLowerCase().replace(/\s+/g, '-') || 'general',
      tags: course.tags || [],
      description: course.description || 'No description available',
      isBestseller: Math.random() > 0.7, // Random bestseller status for now
      isNew: isNew,
      enrolled: isEnrolled,
      price: course.price || 0,
      modules: course.modules || [], // Pass through modules from backend
      instructorAvatar: course.instructor_avatar || null // Add instructor avatar from backend
    }
  })

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
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.tags && course.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    return matchesCategory && matchesSearch
  })

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.studentsCount - a.studentsCount
      case 'rating':
        return b.rating - a.rating
      case 'newest':
        return b.isNew ? 1 : -1
      default:
        return 0
    }
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'text-green-600 bg-green-100'
      case 'Intermediate':
        return 'text-yellow-600 bg-yellow-100'
      case 'Advanced':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Browse Courses</h1>
        </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search courses, instructors, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select 
              className="border border-gray-200 rounded-md px-3 py-2 text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-[#ed874a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCourses.map(course => (
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
              <div className="absolute top-2 left-2 flex gap-2">
                {course.isBestseller && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    Bestseller
                  </span>
                )}
                {course.isNew && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    New
                  </span>
                )}
              </div>
              <div className="absolute top-2 right-2">
                <Button variant="ghost" size="sm" className="bg-white/80 hover:bg-white">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                  {course.level}
                </span>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
              <p className="text-sm text-gray-600 mb-2">by {course.instructor}</p>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {course.duration}
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {course.lessonsCount} lessons
                </div>
              </div>
              
              <div className="flex items-center mb-3">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-sm font-medium">{course.rating}</span>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {course.tags && course.tags.slice(0, 3).map((tag: string, index: number) => (
                  <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                {course.enrolled ? (
                  <Button size="sm" className="flex-1 bg-[#ed874a] hover:bg-[#d76f32]" asChild>
                    <Link href={`/dashboard/learner/courses/${course.id}`}>
                      <Play className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-[#ed874a] hover:bg-[#d76f32]"
                      onClick={() => handleEnroll(course.id, course.title)}
                      disabled={enrollingCourseId === course.id}
                    >
                      {enrollingCourseId === course.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 mr-2" />
                      )}
                      {course.price > 0 ? `$${course.price}` : 'Enroll Now'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setPreviewCourse(course)}
                    >
                      Preview
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No courses available</h3>
            <p className="text-gray-600 mb-4">Check back later for new courses or contact support</p>
          </CardContent>
        </Card>
      ) : sortedCourses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Load More */}
      {sortedCourses.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" className="px-8">
            Load More Courses
          </Button>
        </div>
      )}

      {/* Course Preview Modal */}
      {previewCourse && (
        <CoursePreviewModal
          course={previewCourse}
          isOpen={!!previewCourse}
          onClose={() => setPreviewCourse(null)}
          onEnroll={() => {
            handleEnroll(previewCourse.id, previewCourse.title)
            setPreviewCourse(null)
          }}
        />
      )}
    </div>
  )
}

export default BrowseCoursesPage
