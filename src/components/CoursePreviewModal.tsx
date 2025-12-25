"use client"
import React from 'react'
import { 
  X, 
  Play, 
  Clock, 
  BookOpen, 
  Users, 
  Star, 
  Award,
  CheckCircle,
  Globe,
  Smartphone,
  Trophy,
  FileText,
  Video,
  Download,
  Infinity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface CoursePreviewModalProps {
  course: {
    id: string
    title: string
    instructor: string
    thumbnail: string
    rating: number
    studentsCount: number
    duration: string
    lessonsCount: number
    level: string
    category: string
    tags: string[]
    description: string
    price: number
    enrolled?: boolean
    modules?: Array<{
      id: string
      title: string
      description?: string
      lessons?: Array<{
        id: string
        title: string
        duration?: string
      }>
    }>
    instructorAvatar?: string
  }
  isOpen: boolean
  onClose: () => void
  onEnroll?: () => void
}

export default function CoursePreviewModal({ course, isOpen, onClose, onEnroll }: CoursePreviewModalProps) {
  if (!isOpen) return null

  // Debug logging to check if modules data is available
  console.log('CoursePreviewModal - course data:', course)
  console.log('CoursePreviewModal - modules:', course.modules)
  console.log('CoursePreviewModal - modules count:', course.modules?.length || 0)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Hero Section */}
          <div className="relative h-64 bg-gradient-to-r from-gray-900 to-gray-800">
            {course.thumbnail && course.thumbnail !== '/api/placeholder/300/200' ? (
              <div className="relative w-full h-full">
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  className="object-cover opacity-40"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-white opacity-30" />
              </div>
            )}
            
            {/* Course Info Overlay */}
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-8">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-[#ed874a] text-white text-xs px-3 py-1 rounded-full font-medium">
                      {course.category.toUpperCase()}
                    </span>
                    <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {course.level}
                    </span>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-white mb-3">{course.title}</h1>
                  
                  <p className="text-gray-200 text-lg mb-3 line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center gap-6 text-white mb-3">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 mr-1 fill-yellow-400" />
                      <span className="font-bold mr-1">{course.rating}</span>
                      <span className="text-gray-300">Rating</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-1" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-1" />
                      <span>{course.lessonsCount} lessons</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-200">
                    <span>Created by</span>
                    <span className="text-[#ed874a] font-medium">
                      {course.instructor}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* What You'll Learn - Modules */}
              {course.modules && course.modules.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#ed874a] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    What you'll learn
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.modules.map((module, index) => (
                      <div key={module.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-100 hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#ed874a] to-[#d76f32] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1 text-lg leading-tight">{module.title}</h3>
                          {module.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">{module.description}</p>
                          )}
                          {module.lessons && module.lessons.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-[#ed874a] font-medium">
                              <BookOpen className="w-3 h-3" />
                              {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{course.description}</p>
              </div>

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag: string, index: number) => (
                      <span key={index} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                {/* Price Card */}
                <div className="border border-gray-200 rounded-lg p-6 shadow-lg">
                  <div className="text-center mb-6">
                    {course.price > 0 ? (
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        ${course.price}
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-green-600 mb-1">$0</div>
                    )}
                  </div>

                  {course.enrolled ? (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 mb-3"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Go to Course
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-[#ed874a] hover:bg-[#d76f32] mb-3"
                      size="lg"
                      onClick={onEnroll}
                    >
                      {course.price > 0 ? 'Buy Now' : 'Enroll Now'}
                    </Button>
                  )}
                </div>

                {/* Instructor */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Instructor</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ed874a] to-[#d76f32] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {course.instructorAvatar ? (
                        <img 
                          src={course.instructorAvatar} 
                          alt={course.instructor}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        course.instructor.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{course.instructor}</h4>
                      <p className="text-sm text-gray-600">Course Instructor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
