"use client"
import React, { useState, useEffect } from 'react'
import { 
  Users, 
  DollarSign,
  CheckCircle,
  ArrowRight,
  Target,
  BarChart3,
  Award,
  Zap,
  Loader2,
  BookOpen,
  Lock,
  Unlock,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useMembershipDetails } from '@/lib/hooks/useMembershipDetails'
import { useLearnerData } from '@/lib/hooks/useLearnerData'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

const AffiliateUpgradePage = () => {
  const router = useRouter()
  const { hasDCS, loading: membershipLoading } = useMembershipDetails()
  const { recentCourses, loading: coursesLoading } = useLearnerData()
  const [loading, setLoading] = useState(true)
  const [affiliateCourse, setAffiliateCourse] = useState<any>(null)
  const [isAffiliateUnlocked, setIsAffiliateUnlocked] = useState(false)

  useEffect(() => {
    checkAffiliateStatus()
  }, [hasDCS, recentCourses])

  const checkAffiliateStatus = async () => {
    try {
      setLoading(true)
      
      // Check affiliate status using API
      const response = await fetch('/api/affiliate/unlock')
      if (response.ok) {
        const data = await response.json()
        
        if (data.affiliate_unlocked) {
          setIsAffiliateUnlocked(true)
          router.push('/dashboard/affiliate')
          return
        }

        // Set affiliate course info if available
        if (data.affiliate_course) {
          const courseData = recentCourses.find((enrollment: any) => 
            enrollment.course_id === data.affiliate_course.id
          )
          if (courseData) {
            setAffiliateCourse(courseData)
            
            // Auto-unlock if course is completed
            if (data.affiliate_course.completed) {
              await unlockAffiliateFeatures()
            }
          }
        }
      }

      // Fallback: Find the affiliate course locally
      const affiliateCourse = recentCourses.find((enrollment: any) => {
        const course = enrollment.courses
        return course?.title?.toLowerCase().includes('affiliate') || 
               course?.category?.toLowerCase().includes('affiliate')
      })

      if (affiliateCourse) {
        setAffiliateCourse(affiliateCourse)
      }
    } catch (error) {
      console.error('Error checking affiliate status:', error)
    } finally {
      setLoading(false)
    }
  }

  const unlockAffiliateFeatures = async () => {
    try {
      const response = await fetch('/api/affiliate/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlock affiliate features')
      }

      setIsAffiliateUnlocked(true)
      toast.success(`🎉 ${data.message} Redirecting to your dashboard...`)
      
      setTimeout(() => {
        router.push('/dashboard/affiliate')
      }, 2000)
    } catch (error: any) {
      console.error('Error unlocking affiliate features:', error)
      toast.error(error.message || 'Failed to unlock affiliate features. Please contact support.')
    }
  }

  const handleUnlockClick = async () => {
    if (!affiliateCourse) {
      router.push('/dashboard/learner/courses')
      return
    }

    if (affiliateCourse.completed_at !== null) {
      // Course is completed, unlock affiliate features
      await unlockAffiliateFeatures()
    } else {
      // Course not completed, redirect to course
      router.push(`/dashboard/learner/courses/${affiliateCourse.course_id}`)
    }
  }

  const benefits = [
    {
      icon: DollarSign,
      title: "Earn Commission",
      description: "Get 100 Cedis for every successful referral who enrolls in courses"
    },
    {
      icon: BarChart3,
      title: "Real-Time Dashboard",
      description: "Track your earnings, referrals, and performance with detailed analytics"
    },
    {
      icon: Target,
      title: "Marketing Materials",
      description: "Access professional banners, social media content, and promotional tools"
    },
    {
      icon: Users,
      title: "Growing Community",
      description: "Join a network of successful affiliates and learn from the best"
    },
    {
      icon: Zap,
      title: "Quick Payouts",
      description: "Receive your commissions weekly via mobile money or bank transfer"
    },
    {
      icon: Award,
      title: "Exclusive Bonuses",
      description: "Unlock special rewards and bonuses as you reach milestones"
    }
  ]

  if (loading || membershipLoading || coursesLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#ed874a] mx-auto mb-4" />
          <p className="text-gray-600">Checking your affiliate status...</p>
        </div>
      </div>
    )
  }

  const successStories = [
    {
      name: "Sarah K.",
      earnings: "2,450 Cedis",
      referrals: 25,
      timeframe: "3 months",
      quote: "Becoming an affiliate was the best decision I made. The extra income helps me pursue more courses!"
    },
    {
      name: "Michael A.",
      earnings: "1,890 Cedis",
      referrals: 19,
      timeframe: "2 months",
      quote: "The marketing materials make it so easy to share. My friends love the courses I recommend."
    },
    {
      name: "Grace M.",
      earnings: "3,200 Cedis",
      referrals: 32,
      timeframe: "4 months",
      quote: "I started small but now I'm earning more than I expected. The community support is amazing!"
    }
  ]

  const steps = [
    {
      number: 1,
      title: "Complete Affiliate Course",
      description: "Finish the affiliate marketing training to unlock premium features"
    },
    {
      number: 2,
      title: "Unlock Your Dashboard",
      description: "Get instant access to your affiliate dashboard and marketing tools"
    },
    {
      number: 3,
      title: "Start Sharing",
      description: "Share courses with your network using your unique referral links"
    },
    {
      number: 4,
      title: "Earn Commissions",
      description: "Get paid weekly for every successful referral who enrolls"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="mb-8 bg-gradient-to-r from-[#ed874a]/10 to-[#d76f32]/10 border-[#ed874a]/20">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#ed874a] rounded-full flex items-center justify-center mx-auto mb-4">
              {affiliateCourse?.completed_at !== null ? (
                <Unlock className="w-8 h-8 text-white" />
              ) : (
                <Lock className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {affiliateCourse?.completed_at !== null 
                ? "🎉 Unlock Your Affiliate Features!" 
                : "Complete Affiliate Course to Unlock Features"
              }
            </h1>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              {affiliateCourse?.completed_at !== null 
                ? "Congratulations! You've completed the affiliate course. Unlock your affiliate dashboard and start earning commissions."
                : "Complete the affiliate training course to unlock premium affiliate features and start earning commissions."
              }
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>No MLM or recruitment required</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>Promote real educational value</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>Weekly payouts guaranteed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Status Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Your Affiliate Course Status</CardTitle>
        </CardHeader>
        <CardContent>
          {affiliateCourse ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-[#ed874a] rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {affiliateCourse.courses?.title || 'Affiliate Marketing Course'}
              </h3>
              <div className="flex items-center justify-center mb-4">
                {affiliateCourse.completed_at !== null ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-600 font-medium">Completed</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-500 rounded-full mr-2" />
                    <span className="text-blue-600 font-medium">
                      In Progress ({Math.round(affiliateCourse.progress_percentage || 0)}%)
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {affiliateCourse.completed_at !== null 
                  ? "Great job! You can now unlock your affiliate features."
                  : "Complete this course to unlock premium affiliate features and start earning commissions."
                }
              </p>
            </div>
          ) : (
            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <BookOpen className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Affiliate Course Not Found</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enroll in the affiliate marketing course to unlock premium features.
              </p>
              <Button 
                onClick={() => router.push('/dashboard/learner/courses')}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Browse Courses
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Why Become an Affiliate?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-4">
                <div className="w-12 h-12 bg-[#ed874a]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-[#ed874a]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-[#ed874a] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">{step.number}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-gray-400 mx-auto mt-4 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Stories */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Success Stories</CardTitle>
          <p className="text-center text-gray-600">See what other learners-turned-affiliates are achieving</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#ed874a] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{story.name.charAt(0)}</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">{story.name}</h4>
                    <p className="text-sm text-gray-600">{story.timeframe}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#ed874a]">{story.earnings}</p>
                    <p className="text-xs text-gray-600">Total Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{story.referrals}</p>
                    <p className="text-xs text-gray-600">Referrals</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic">&quot;{story.quote}&quot;</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Direct CTA - Course Completion Based */}
      <Card className="bg-gradient-to-r from-[#ed874a] to-[#d76f32] text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {affiliateCourse?.completed_at !== null 
              ? "🎉 Unlock Your Affiliate Dashboard!" 
              : "Complete Your Training to Start Earning"
            }
          </h2>
          <p className="text-lg mb-6 opacity-90">
            {affiliateCourse?.completed_at !== null 
              ? "You've earned it! Unlock your affiliate dashboard and start earning commissions today."
              : "Complete the affiliate course to unlock premium features and start your earning journey."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleUnlockClick}
              size="lg" 
              className="bg-white text-[#ed874a] hover:bg-gray-100 px-8"
            >
              {affiliateCourse?.completed_at !== null 
                ? "🚀 Unlock Affiliate Features"
                : affiliateCourse 
                  ? "📚 Continue Course"
                  : "🔍 Find Affiliate Course"
              }
            </Button>
            <p className="text-sm opacity-75">
              {affiliateCourse?.completed_at !== null 
                ? "No additional cost • Start earning immediately"
                : "Free with membership • Complete at your own pace"
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          <strong>Important:</strong> DigiAfriq is an educational platform focused on real course sales, not recruitment. 
          Commissions are earned only when referred users purchase and complete courses. This is not a multi-level marketing (MLM) scheme.
        </p>
      </div>
    </div>
  )
}

export default AffiliateUpgradePage
