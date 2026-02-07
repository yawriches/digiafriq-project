"use client"
import React from 'react'
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle,
  RotateCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import AffiliatePromoSection from '@/components/dashboard/AffiliatePromoSection'
import { useLearnerData } from '@/lib/hooks/useLearnerData'
import { LearnerDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'

export const dynamic = 'force-dynamic'

const LearnerDashboard = () => {
  const { stats, recentCourses, profile, loading, error, refresh } = useLearnerData()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const statsCards = [
    {
      title: "Number of Programs",
      value: stats.totalPrograms.toString(),
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100"
    },
    {
      title: "Completed Courses", 
      value: stats.totalCompleted.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50", 
      iconBg: "bg-green-100"
    },
    {
      title: "In Progress",
      value: stats.totalInProgress.toString(),
      icon: PlayCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100"
    }
  ]

  if (loading) {
    return <LearnerDashboardSkeleton />
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading dashboard: {error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Dashboard</h1>
          <p className="text-gray-600">Track your progress and continue your learning journey</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RotateCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Affiliate Promotion Section */}
      <AffiliatePromoSection />

      {/* Continue Learning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Continue Learning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {recentCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No courses enrolled yet</p>
              <Link href="/dashboard/learner/browse">
                <Button className="mt-4 bg-[#ed874a] hover:bg-[#d76f32]">
                  Browse Courses
                </Button>
              </Link>
            </div>
          ) : (
            recentCourses.map((enrollment, index) => {
              const course = (enrollment as any).courses
              return (
                <div key={enrollment.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                  <div className="flex flex-col md:flex-row">
                    {/* Course Image */}
                    <div className="md:w-48 h-32 md:h-auto relative flex-shrink-0">
                      <Image
                        src={course?.thumbnail_url || '/api/placeholder/300/200'}
                        alt={course?.title || 'Course'}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="bg-[#ed874a] text-white text-xs px-2 py-1 rounded-full font-medium">
                          {course?.category || 'Course'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Course Content */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-gray-900 mb-1">{course?.title || 'Untitled Course'}</h4>
                          <p className="text-sm text-gray-600 mb-2">Instructor: {course?.instructor || 'TBA'}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <span className="flex items-center">
                              <PlayCircle className="w-4 h-4 mr-1" />
                              {course?.estimated_duration ? `${Math.floor(course.estimated_duration / 60)}h ${course.estimated_duration % 60}m` : 'TBA'}
                            </span>
                            <span>{Math.round(enrollment.progress_percentage || 0)}% complete</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#ed874a] h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${enrollment.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                  
                      {/* Action Button */}
                      <Button className="w-full md:w-auto bg-[#ed874a] hover:bg-[#d76f32]" asChild>
                        <Link href={`/dashboard/learner/courses/${course?.id || (enrollment as any).course_id}`}>
                          {enrollment.progress_percentage > 0 ? 'Continue Learning' : 'Start Course'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default LearnerDashboard
