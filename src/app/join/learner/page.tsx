'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Check, 
  GraduationCap, 
  BookOpen, 
  Award, 
  Users, 
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Star,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface MembershipPackage {
  id: string
  name: string
  price: number
  currency: string
  duration_months: number
  features: string[]
  is_active: boolean
}

function LearnerSalesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const referralCode = searchParams.get('ref')
  
  const [membership, setMembership] = useState<MembershipPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [referrerName, setReferrerName] = useState<string | null>(null)

  useEffect(() => {
    // Store referral code in localStorage for tracking
    if (referralCode) {
      localStorage.setItem('referral_code', referralCode)
      localStorage.setItem('referral_type', 'learner')
      fetchReferrerInfo(referralCode)
      
      // Track affiliate link click
      trackAffiliateClick(referralCode, 'learner')
    }
    fetchLearnerMembership()
  }, [referralCode])

  const trackAffiliateClick = async (code: string, linkType: string) => {
    try {
      await fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referral_code: code, link_type: linkType })
      })
      console.log('📊 Affiliate click tracked')
    } catch (error) {
      console.error('Failed to track affiliate click:', error)
    }
  }

  const fetchReferrerInfo = async (code: string) => {
    try {
      // Get referrer info from affiliate_profiles
      const { data: affiliateProfile } = await supabase
        .from('affiliate_profiles')
        .select('id')
        .eq('referral_code', code)
        .single()

      if (affiliateProfile) {
        // Get the referrer's name from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', (affiliateProfile as any).id)
          .single()

        if (profile && 'full_name' in profile && profile.full_name) {
          setReferrerName(profile.full_name.split(' ')[0]) // First name only
        }
      }
    } catch (error) {
      console.log('Could not fetch referrer info')
    }
  }

  const fetchLearnerMembership = async () => {
    try {
      // Fetch active learner membership package
      const { data, error } = await supabase
        .from('membership_packages')
        .select('*')
        .eq('member_type', 'learner')
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(1)
        .single()

      if (data) {
        setMembership(data)
      }
    } catch (error) {
      console.error('Error fetching membership:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGetStarted = () => {
    if (membership) {
      const checkoutUrl = `/checkout/guest/${membership.id}?type=learner${referralCode ? `&ref=${referralCode}` : ''}`
      router.push(checkoutUrl)
    }
  }

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      GHS: '₵',
      NGN: '₦',
    }
    return symbols[currency] || currency
  }

  const benefits = [
    {
      icon: BookOpen,
      title: 'Premium Courses',
      description: 'Access our entire library of expert-led courses on digital skills and online business'
    },
    {
      icon: GraduationCap,
      title: 'Learn at Your Pace',
      description: 'Study anytime, anywhere with lifetime access to course materials'
    },
    {
      icon: Award,
      title: 'Certificates',
      description: 'Earn recognized certificates upon completing each course'
    },
    {
      icon: Users,
      title: 'Community Access',
      description: 'Join our exclusive community of learners and entrepreneurs'
    }
  ]

  const testimonials = [
    {
      name: 'Kwame A.',
      role: 'Digital Marketer',
      content: 'DigiAfriq transformed my career. The courses are practical and the community is incredibly supportive.',
      rating: 5
    },
    {
      name: 'Amina O.',
      role: 'Freelancer',
      content: 'I started earning online within weeks of joining. The step-by-step approach makes everything easy to follow.',
      rating: 5
    },
    {
      name: 'David M.',
      role: 'Entrepreneur',
      content: 'Best investment I made for my business. The skills I learned here helped me scale my online presence.',
      rating: 5
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="py-4 px-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image
              src="/digiafriqlogo.png"
              alt="DigiAfriq"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <Button 
            onClick={handleGetStarted}
            className="bg-[#ed874a] hover:bg-orange-600 text-white"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container max-w-6xl mx-auto text-center">
          {referrerName && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>{referrerName} invited you to join!</span>
            </div>
          )}
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Start Your <span className="text-[#ed874a]">Digital Learning</span> Journey
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Join thousands of Africans learning in-demand digital skills. 
            Get access to premium courses, expert mentorship, and a supportive community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-[#ed874a] hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Join Now for {membership ? `${getCurrencySymbol(membership.currency)}${membership.price}` : 'Loading...'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="w-5 h-5 text-green-600" />
              <span>Secure Payment via Paystack</span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>5,000+ Learners</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>50+ Courses</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>Certified Programs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            What You Get as a Learner
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Everything you need to build valuable digital skills and start earning online
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-[#ed874a]" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Details */}
      {membership && (
        <section className="py-16 px-4">
          <div className="container max-w-4xl mx-auto">
            <Card className="border-2 border-[#ed874a] shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#ed874a] to-orange-500 p-6 text-white text-center">
                <h3 className="text-2xl font-bold mb-2">{membership.name}</h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-bold">{getCurrencySymbol(membership.currency)}{membership.price}</span>
                  <span className="text-orange-100">/ {membership.duration_months} months</span>
                </div>
              </div>
              <CardContent className="p-8">
                <h4 className="font-semibold text-lg text-gray-900 mb-4">What's Included:</h4>
                <ul className="space-y-3 mb-8">
                  {membership.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-[#ed874a] hover:bg-orange-600 text-white py-6 text-lg font-semibold rounded-xl"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            What Our Learners Say
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Join thousands of satisfied learners who have transformed their careers
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#ed874a] to-orange-500">
        <div className="container max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join DigiAfriq today and unlock your digital potential
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-white text-[#ed874a] hover:bg-gray-100 text-lg px-8 py-6 rounded-xl shadow-lg"
          >
            Get Started for {membership ? `${getCurrencySymbol(membership.currency)}${membership.price}` : 'Loading...'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <div className="flex items-center justify-center gap-4 mt-6 text-orange-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure Payment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="container max-w-6xl mx-auto text-center">
          <Image
            src="/digiafriqlogo.png"
            alt="DigiAfriq"
            width={100}
            height={33}
            className="mx-auto mb-4 brightness-0 invert"
          />
          <p className="text-sm">
            © {new Date().getFullYear()} DigiAfriq. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function LearnerSalesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    }>
      <LearnerSalesPageContent />
    </Suspense>
  )
}
