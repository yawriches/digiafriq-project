import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Lock, 
  Unlock, 
  ArrowRight,
  Loader2
} from 'lucide-react'
import { useAffiliateStatus } from '@/lib/hooks/useAffiliateStatus'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AffiliateStatusCardProps {
  className?: string
}

const AffiliateStatusCard: React.FC<AffiliateStatusCardProps> = ({ className = '' }) => {
  const router = useRouter()
  const { affiliate_unlocked, affiliate_course, loading, error, unlockFeatures } = useAffiliateStatus()

  const handleUnlockClick = async () => {
    if (affiliate_course?.completed) {
      const result = await unlockFeatures()
      if (result.success) {
        toast.success(`🎉 ${result.message}`)
        setTimeout(() => {
          router.push('/dashboard/affiliate')
        }, 2000)
      } else {
        toast.error(result.error)
      }
    } else if (affiliate_course) {
      router.push(`/dashboard/learner/courses/${affiliate_course.id}`)
    } else {
      router.push('/dashboard/learner/courses')
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#ed874a]" />
            <span className="ml-2 text-gray-600">Checking affiliate status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-red-600">
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (affiliate_unlocked) {
    return (
      <Card className={`bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
            <Unlock className="w-5 h-5" />
            Affiliate Features Unlocked
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">You have access to all affiliate features</span>
            </div>
            <Button 
              onClick={() => router.push('/dashboard/affiliate')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Go to Affiliate Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-orange-800 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Unlock Affiliate Features
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {affiliate_course ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {affiliate_course.title}
                  </span>
                </div>
                <Badge variant={affiliate_course.completed ? "default" : "secondary"}>
                  {affiliate_course.completed ? "Completed" : `${Math.round(affiliate_course.progress)}%`}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-600">
                {affiliate_course.completed 
                  ? "🎉 Course completed! You can now unlock affiliate features."
                  : "Complete this course to unlock premium affiliate features."
                }
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2 text-orange-600">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Enroll in the affiliate course to get started</span>
            </div>
          )}
          
          <Button 
            onClick={handleUnlockClick}
            className="w-full bg-[#ed874a] hover:bg-[#d76f32] text-white"
          >
            {affiliate_course?.completed 
              ? "🚀 Unlock Affiliate Features"
              : affiliate_course 
                ? "📚 Continue Course"
                : "🔍 Find Affiliate Course"
            }
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AffiliateStatusCard
