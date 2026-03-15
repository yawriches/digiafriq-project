"use client"
import React from 'react'
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle,
  RotateCw,
  ArrowRight,
  Clock
} from 'lucide-react'
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
    try { await refresh() } finally { setIsRefreshing(false) }
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const statsCards = [
    {
      title: "Total Programs",
      value: stats.totalPrograms.toString(),
      icon: BookOpen,
      accent: "bg-blue-50 text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "Completed", 
      value: stats.totalCompleted.toString(),
      icon: CheckCircle,
      accent: "bg-emerald-50 text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      title: "In Progress",
      value: stats.totalInProgress.toString(),
      icon: PlayCircle,
      accent: "bg-amber-50 text-amber-600",
      iconBg: "bg-amber-100",
    }
  ]

  if (loading) return <LearnerDashboardSkeleton />

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <p className="text-red-600 text-sm">Error loading dashboard: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-3 bg-red-600 hover:bg-red-700 text-sm h-9">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1200px]">
      {/* Welcome Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here is an overview of your learning progress.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RotateCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.accent.split(' ')[1]}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Affiliate Promotion */}
      <AffiliatePromoSection />

      {/* Continue Learning */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Continue Learning</h2>
          {recentCourses.length > 0 && (
            <Link href="/dashboard/learner/courses" className="text-xs font-medium text-[#ed874a] hover:text-[#d76f32] flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {recentCourses.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No courses enrolled yet</p>
              <p className="text-xs text-gray-500 mt-1">Start your learning journey today</p>
              <Link href="/dashboard/learner/courses">
                <Button className="mt-4 bg-[#ed874a] hover:bg-[#d76f32] text-sm h-9 rounded-lg">
                  Browse Courses
                </Button>
              </Link>
            </div>
          ) : (
            recentCourses.map((enrollment) => {
              const course = (enrollment as any).courses
              const progress = Math.round(enrollment.progress_percentage || 0)
              return (
                <div key={enrollment.id} className="p-4 lg:p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Thumbnail */}
                    <div className="sm:w-40 h-24 sm:h-24 relative rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      <Image
                        src={course?.thumbnail_url || '/api/placeholder/300/200'}
                        alt={course?.title || 'Course'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{course?.title || 'Untitled Course'}</h3>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            {course?.instructor && <span>{course.instructor}</span>}
                            {course?.estimated_duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {Math.floor(course.estimated_duration / 60)}h {course.estimated_duration % 60}m
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#ed874a] shrink-0">{progress}%</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3 mb-3">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div 
                            className="bg-[#ed874a] h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                  
                      <Button className="bg-[#ed874a] hover:bg-[#d76f32] text-xs h-8 rounded-lg px-4" asChild>
                        <Link href={`/dashboard/learner/courses/${course?.id || (enrollment as any).course_id}`}>
                          {progress > 0 ? 'Continue' : 'Start Course'}
                          <ArrowRight className="w-3 h-3 ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default LearnerDashboard
