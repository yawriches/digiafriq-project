"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  FolderOpen, 
  BookOpen, 
  ArrowRight, 
  Loader2,
  ChevronLeft,
  Search
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  price: number
  is_published: boolean
  instructor: string | null
  level: string | null
}

interface Program {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  courses: Course[]
  courseCount: number
}

interface ProgramsListProps {
  onCourseClick?: (course: Course) => void
}

const ProgramsList: React.FC<ProgramsListProps> = ({ onCourseClick }) => {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/programs')
      const data = await response.json()
      
      if (response.ok) {
        setPrograms(data.programs || [])
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseClick = (course: Course) => {
    if (onCourseClick) {
      onCourseClick(course)
    } else {
      router.push(`/dashboard/learner/courses/${course.id}`)
    }
  }

  // Filter programs based on search term
  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (program.description && program.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-3 text-gray-600">Loading programs...</span>
      </div>
    )
  }

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No programs available</h3>
          <p className="text-gray-500">Check back later for new learning programs</p>
        </CardContent>
      </Card>
    )
  }

  // Show courses within selected program (no search bar)
  if (selectedProgram) {
    return (
      <div className="space-y-6">
        {/* Back button and program header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedProgram(null)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Programs
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{selectedProgram.title}</h2>
            <p className="text-sm text-gray-500">{selectedProgram.courseCount} courses</p>
          </div>
        </div>

        {/* Program description */}
        {selectedProgram.description && (
          <p className="text-gray-600">{selectedProgram.description}</p>
        )}

        {/* Courses grid */}
        {selectedProgram.courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500">Courses will be added to this program soon</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedProgram.courses.map(course => (
              <Card 
                key={course.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleCourseClick(course)}
              >
                <div className="relative">
                  <div className="w-full h-40 bg-gray-200 rounded-t-lg overflow-hidden">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {course.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {course.instructor || 'TBA'}
                    </span>
                    <span className="text-gray-500">
                      {course.level || 'All levels'}
                    </span>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-[#ed874a] hover:bg-[#d76f32]"
                    size="sm"
                  >
                    View Course
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Show programs list with search
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No programs found</h3>
            <p className="text-gray-500">Try adjusting your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map(program => (
            <Card 
              key={program.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setSelectedProgram(program)}
            >
              <div className="relative">
                <div className="w-full h-40 bg-gradient-to-br from-[#ed874a] to-[#d76f32] rounded-t-lg overflow-hidden flex items-center justify-center">
                  {program.thumbnail_url ? (
                    <img 
                      src={program.thumbnail_url} 
                      alt={program.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FolderOpen className="w-16 h-16 text-white/80" />
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#ed874a] transition-colors">
                  {program.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {program.description || 'No description'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {program.courseCount} courses
                  </span>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#ed874a] transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProgramsList
