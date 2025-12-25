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
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useMembershipDetails } from '@/lib/hooks/useMembershipDetails'

const AffiliateUpgradePage = () => {
  const router = useRouter()
  const { hasDCS, loading: dcsLoading } = useMembershipDetails()
  const [learnerPackageId, setLearnerPackageId] = useState<string | null>(null)
  const [dcsAddonPrice, setDcsAddonPrice] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // Redirect if user already has DCS
  useEffect(() => {
    if (!dcsLoading && hasDCS) {
      router.push('/dashboard/affiliate')
    }
  }, [hasDCS, dcsLoading, router])

  // Fetch the learner package with DCS addon
  useEffect(() => {
    const fetchLearnerPackage = async () => {
      try {
        const response = await fetch('/api/memberships?member_type=learner')
        if (response.ok) {
          const data = await response.json()
          // Find the learner package with DCS addon enabled
          const learnerPackage = data.packages?.find((pkg: any) => 
            pkg.member_type === 'learner' && 
            pkg.has_digital_cashflow === true
          )
          if (learnerPackage) {
            setLearnerPackageId(learnerPackage.id)
            setDcsAddonPrice(learnerPackage.digital_cashflow_price || 0)
          }
        }
      } catch (error) {
        console.error('Failed to fetch learner package:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLearnerPackage()
  }, [])

  const handleUpgradeClick = () => {
    if (learnerPackageId) {
      // Go directly to checkout for the DCS addon upgrade
      router.push(`/checkout/${learnerPackageId}?addon=digital-cashflow&upgrade=true`)
    } else {
      // Fallback to membership page if package not found
      router.push('/dashboard/learner/membership')
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

  if (loading || dcsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#ed874a] mx-auto mb-4" />
          <p className="text-gray-600">Loading membership options...</p>
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
      title: "Choose Your Plan",
      description: "Select the affiliate plan that suits your goals and pay the one-time setup fee"
    },
    {
      number: 2,
      title: "Get Your Materials",
      description: "Access your affiliate dashboard and download marketing materials"
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
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Upgrade to Affiliate Membership
            </h1>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Ready to start earning? View our membership options to upgrade to affiliate and start earning commissions for referrals.
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

      {/* Direct CTA - No pricing section needed */}
      <Card className="bg-gradient-to-r from-[#ed874a] to-[#d76f32] text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-lg mb-6 opacity-90">
            View our membership options to upgrade to affiliate and start earning commissions for every successful referral.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleUpgradeClick}
              size="lg" 
              className="bg-white text-[#ed874a] hover:bg-gray-100 px-8"
            >
              Upgrade for ${dcsAddonPrice}
            </Button>
            <p className="text-sm opacity-75">
              One-time payment • Start earning immediately
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
