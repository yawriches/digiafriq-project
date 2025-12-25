'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Sparkles,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { motion, useScroll, useTransform, useInView, Variants, Variant } from 'framer-motion'

const YOUTUBE_VIDEO_ID = 'ENmFgRFWgf8'

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
  }
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
  }
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
  }
}

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
  }
}

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
  }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

interface MembershipPackage {
  id: string
  name: string
  price: number
  currency: string
  duration_months: number
  features: string[]
  is_active: boolean
  has_digital_cashflow?: boolean
  digital_cashflow_price?: number
}

// AnimatedSection component for scroll-triggered animations
function AnimatedSection({ children, variants, className = "" }: { 
  children: React.ReactNode; 
  variants?: any; 
  className?: string;
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants || fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function DCSSalesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const referralCode = searchParams.get('ref')
  const [membership, setMembership] = useState<MembershipPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [referrerName, setReferrerName] = useState<string | null>(null)
  
  // Countdown state
  const [countdownHours, setCountdownHours] = useState(1)
  const [countdownMinutes, setCountdownMinutes] = useState(0)
  const [countdownRemainingSeconds, setCountdownRemainingSeconds] = useState(0)
  
  // FAQ state
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({})

  // Toggle FAQ item function
  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Fetch membership data and handle referral code
  useEffect(() => {
    // Store referral code in localStorage for tracking
    if (referralCode) {
      localStorage.setItem('referral_code', referralCode)
      localStorage.setItem('referral_type', 'dcs')
      fetchReferrerInfo(referralCode)
      
      // Track affiliate link click
      trackAffiliateClick(referralCode, 'dcs')
    }
    
    async function fetchMembership() {
      try {
        const { data, error } = await supabase
          .from('membership_packages')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true })
          .limit(1)

        if (error) {
          console.error('Error fetching membership:', error)
        } else {
          setMembership(data?.[0] || null)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembership()
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

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const diff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setCountdownHours(hours)
      setCountdownMinutes(minutes)
      setCountdownRemainingSeconds(seconds)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleGetStarted = () => {
    if (membership) {
      // Navigate to guest checkout with membership ID and referral parameters
      const checkoutUrl = `/checkout/guest/${membership.id}?type=dcs${referralCode ? `&ref=${referralCode}` : ''}`
      router.push(checkoutUrl)
    } else {
      // Fallback to membership selection
      router.push('/dashboard/learner/membership')
    }
  }

  const totalPrice = membership?.price || 18
  const currencySymbol = membership?.currency === 'GHS' ? '₵' : '$'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  // Premium layout is now the main DCS sales page
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050816] to-black text-white">
      {/* Premium Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(237,135,74,0.35),_transparent_55%)]" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20 flex flex-col items-center text-center">
          <div className="w-full flex flex-col items-center">
            <AnimatedSection variants={fadeIn} className="w-full flex flex-col items-center">
              
              <motion.p 
                variants={fadeInUp}
                className="text-sm md:text-base font-semibold tracking-[0.2em] text-[#ed874a] mb-3 text-center"
              >
                STOP SCROLLING.
              </motion.p>

              <motion.h1 
                variants={fadeInUp}
                className="text-2xl md:text-4xl font-extrabold leading-tight mb-4 text-center max-w-2xl mx-auto"
              >
                This Is How Ordinary People Are Quietly Building Digital Income Online Without Creating Products
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-[11px] md:text-xs tracking-[0.25em] uppercase text-[#ed874a] mb-2"
              >
                🎥 WATCH THIS FIRST (DO NOT SKIP)
              </motion.p>
              <motion.p 
                variants={fadeInUp}
                className="text-sm md:text-base text-gray-200 mb-4 max-w-2xl mx-auto"
              >
                In this short video, you'll see how the Digital Cashflow System works and why more people are quietly getting in early.
              </motion.p>

              <motion.p 
                variants={fadeInUp}
                className="mt-4 text-xs md:text-sm text-gray-300 max-w-2xl mx-auto mb-6"
              >
                ⚠️ Warning: If you finish this video, you won't be able to say "I didn't know."
              </motion.p>
            </AnimatedSection>

            {/* Video directly under hero copy */}
            <AnimatedSection variants={scaleIn} className="relative w-full mt-6 max-w-3xl mx-auto">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl border border-white/10 bg-black/70 shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden"
              >
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?controls=0&rel=0&modestbranding=1&disablekb=1`}
                    title="Digital Cashflow System Overview"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </motion.div>
            </AnimatedSection>

            {/* Smartphone & belief block under video */}
            <AnimatedSection variants={fadeInUp} className="mt-6 max-w-3xl mx-auto">
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl bg-white/5 border border-white/20 px-6 py-5 text-center shadow-[0_18px_45px_rgba(0,0,0,0.65)] backdrop-blur-md"
              >
                <p className="text-sm md:text-base text-red-400">
                  If you have a smartphone, internet access, and the desire to change your financial situation, this is for you.
                </p>
                <p className="mt-2 text-sm md:text-base text-gray-300 italic">
                  Most people won't take this seriously.
                  <br />
                  That's exactly why it works.
                </p>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Problem / Pain Strip - Premium */}
      <section className="py-8 md:py-12 border-b border-white/10 bg-black/80">
        <div className="max-w-4xl mx-auto px-4 text-white">
          <AnimatedSection variants={slideInLeft} className="max-w-3xl mx-auto rounded-3xl bg-white/5 border border-white/15 px-6 md:px-8 py-8 md:py-10 shadow-[0_22px_55px_rgba(0,0,0,0.55)] backdrop-blur-sm text-left">
            <motion.h2 
              variants={fadeInUp}
              className="text-xl md:text-2xl font-semibold mb-4"
            >
              Right now, you are either:
            </motion.h2>

            <motion.ul 
              variants={staggerContainer}
              className="space-y-2 text-sm md:text-base text-gray-200 mb-6"
            >
              {[
                "Tired of struggling financially",
                "Frustrated by side hustles that don't work", 
                "Overwhelmed by online business noise",
                "Watching others win while you hesitate"
              ].map((item, index) => (
                <motion.li 
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  • {item}
                </motion.li>
              ))}
            </motion.ul>

            <motion.div 
              variants={fadeIn}
              className="h-px w-full bg-white/15 my-4"
            />

            <motion.p 
              variants={fadeInUp}
              className="mt-2 text-sm md:text-base text-gray-100 font-semibold"
            >
              Most people fail online because they never follow a real system.
              <br />
              They guess.
              <br />
              They jump.
              <br />
              They quit.
            </motion.p>

            <motion.p 
              variants={fadeInUp}
              className="text-sm md:text-base text-gray-200 font-semibold mb-2 mt-6"
            >
              The truth most people won't tell you:
            </motion.p>
            <motion.p 
              variants={fadeInUp}
              className="text-sm md:text-base text-gray-300 mb-2"
            >
              Trying random strategies online is expensive.
            </motion.p>
            <motion.p 
              variants={fadeInUp}
              className="text-sm md:text-base text-gray-300"
            >
              Guessing keeps people broke.
            </motion.p>
          </AnimatedSection>
        </div>
      </section>

      {/* Modules & Outcomes */}
      <section className="py-14 md:py-16 bg-gradient-to-r from-[#ed874a] via-orange-500 to-[#ed874a] border-y border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-white">
          <AnimatedSection variants={fadeIn} className="max-w-3xl mx-auto text-center">
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-semibold mb-6"
            >
              The Digital Cashflow System Is Not Motivation.
              <br className="hidden md:block" /> It Is a System.
            </motion.h2>

            <motion.p 
              variants={fadeInUp}
              className="text-sm md:text-base text-orange-50/95 mb-6 max-w-2xl mx-auto leading-relaxed"
            >
              The Digital Cashflow System (DCS) is a plug-and-play affiliate business framework designed for beginners who want clarity, direction, and execution.
            </motion.p>

            <motion.p 
              variants={fadeInUp}
              className="text-sm md:text-base text-orange-50/95 mb-4 max-w-2xl mx-auto font-medium"
            >
              You are shown:
            </motion.p>

            <motion.div 
              variants={staggerContainer}
              className="max-w-2xl mx-auto text-left text-sm md:text-base text-orange-50/90 space-y-2 mb-8"
            >
              {[
                "What profitable digital products to promote",
                "How to promote them step by step",
                "How to attract buyers without confusion",
                "How to build consistency instead of luck"
              ].map((item, index) => (
                <motion.p 
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  • {item}
                </motion.p>
              ))}
            </motion.div>

            <motion.div 
              variants={scaleIn}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="bg-white/10 rounded-3xl px-6 py-6 mb-8 backdrop-blur-sm border border-white/20"
            >
              <motion.p 
                variants={fadeInUp}
                className="text-sm md:text-base text-orange-50 leading-relaxed mb-4"
              >
                No product creation.
                <br />
                No technical overwhelm.
                <br />
                No endless trial and error.
              </motion.p>

              <motion.p 
                variants={fadeInUp}
                className="text-sm md:text-base text-white font-semibold leading-relaxed"
              >
                You follow instructions.
                <br />
                Results follow action.
              </motion.p>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Compact social proof */}
      <section className="py-14 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-5 md:grid-cols-3"
          >
            {[
              "/Screenshot 2025-12-19 225126.png",
              "/Screenshot 2025-12-19 225135.png", 
              "/Screenshot 2025-12-19 225147.png"
            ].map((src, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  boxShadow: "0 20px 40px rgba(237,135,74,0.3)"
                }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl bg-gradient-to-b from-[#1f2933] to-black p-4 border border-white/10 flex flex-col gap-3"
              >
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black/60">
                  <Image
                    src={src}
                    alt={`Student testimonial screenshot ${index + 1}`}
                    width={500}
                    height={320}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Premium pricing strip */}
      <section className="py-14 md:py-16 bg-gradient-to-r from-[#111827] via-black to-[#111827] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 space-y-10">
          <AnimatedSection variants={fadeIn} className="text-center">
            <motion.h2 
              variants={fadeInUp}
              animate={{ 
                textShadow: ["0 0 20px rgba(237,135,74,0.5)", "0 0 30px rgba(237,135,74,0.8)", "0 0 20px rgba(237,135,74,0.5)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xl md:text-2xl font-semibold mb-4"
            >
              🔥 YES! GIVE ME ACCESS TO DCS NOW 🔥
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-sm md:text-base text-gray-200 mb-3"
            >
              ⏳ LIMITED-TIME OFFER ENDS IN:
            </motion.p>
            <motion.div 
              variants={scaleIn}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-[#ed874a] tabular-nums"
            >
              <motion.span
                animate={{ 
                  color: ["#ed874a", "#ff6b35", "#ed874a"],
                  textShadow: ["0 0 10px rgba(237,135,74,0.8)", "0 0 20px rgba(255,107,53,1)", "0 0 10px rgba(237,135,74,0.8)"]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {countdownHours.toString().padStart(2, '0')}
              </motion.span>
              <span>:</span>
              <motion.span
                animate={{ 
                  color: ["#ed874a", "#ff6b35", "#ed874a"],
                  textShadow: ["0 0 10px rgba(237,135,74,0.8)", "0 0 20px rgba(255,107,53,1)", "0 0 10px rgba(237,135,74,0.8)"]
                }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              >
                {countdownMinutes.toString().padStart(2, '0')}
              </motion.span>
              <span>:</span>
              <motion.span
                animate={{ 
                  color: ["#ed874a", "#ff6b35", "#ed874a"],
                  textShadow: ["0 0 10px rgba(237,135,74,0.8)", "0 0 20px rgba(255,107,53,1)", "0 0 10px rgba(237,135,74,0.8)"]
                }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              >
                {countdownRemainingSeconds.toString().padStart(2, '0')}
              </motion.span>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-[#ed874a] hover:bg-orange-600 text-white px-10 py-6 rounded-full text-base md:text-lg font-semibold shadow-[0_18px_45px_rgba(237,135,74,0.55)] inline-flex items-center justify-center gap-2 mb-4"
              >
                🔥 GIVE ME ACCESS NOW 🔥
              </Button>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              className="grid gap-2 text-xs md:text-sm text-gray-200 max-w-md mx-auto"
            >
              {[
                "Instant access after payment",
                "Works worldwide",
                "Beginner-friendly — no experience needed",
                "Secure checkout"
              ].map((item, index) => (
                <motion.p 
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  ✔ {item}
                </motion.p>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Why Waiting Section */}
      <section className="py-14 md:py-16 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="max-w-3xl mx-auto rounded-3xl bg-white/5 border border-white/15 px-6 md:px-8 py-8 md:py-10 shadow-[0_22px_55px_rgba(0,0,0,0.55)] backdrop-blur-sm text-left text-white">
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-center">
              Why Waiting Is the Most Expensive Decision You Can Make
            </h3>
            
            <div className="space-y-4 text-sm md:text-base text-gray-200 mb-6">
              <p>• Every day you wait, someone else joins and starts earning</p>
              <p>• The price increases when the timer hits zero</p>
              <p>• Your current financial situation won't change without action</p>
              <p>• This system works, but only if you work it</p>
            </div>

            <div className="h-px w-full bg-white/15 my-6" />

            <p className="text-sm md:text-base text-gray-100 font-semibold mb-4">
              The cost of waiting:
            </p>
            <div className="grid gap-2 text-sm md:text-base text-gray-200">
              <p>• Lost time you could have been building skills</p>
              <p>• Higher price when you finally decide to join</p>
              <p>• Continued financial stress and uncertainty</p>
              <p>• Watching others succeed while you hesitate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Display */}
      <section className="py-14 md:py-16 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="max-w-4xl mx-auto">
            <motion.h3 
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-center mb-8 text-white"
            >
              Here's Exactly What You Get Inside DCS
            </motion.h3>
            
            <motion.div 
              variants={staggerContainer}
              className="grid gap-4 md:gap-6"
            >
              {[
                {
                  icon: "📚",
                  title: "Foundation & Digital Mindset",
                  description: "Understand how online income really works and why most beginners fail."
                },
                {
                  icon: "📚",
                  title: "Affiliate Business Setup",
                  description: "Plug into high-profit digital products without creating anything."
                },
                {
                  icon: "📚",
                  title: "Traffic & Attention Systems",
                  description: "Learn practical ways to attract interested buyers online."
                },
                {
                  icon: "📚",
                  title: "Sales & Conversion Frameworks",
                  description: "Turn attention into commissions using proven principles."
                },
                {
                  icon: "📚",
                  title: "Scaling & Consistency",
                  description: "Build income momentum instead of one-time wins."
                }
              ].map((module, index) => (
                <motion.div
                  key={index}
                  variants={slideInLeft}
                  whileHover={{ 
                    x: 10,
                    borderColor: "rgba(251, 146, 60, 0.5)",
                    boxShadow: "0 10px 30px rgba(251, 146, 60, 0.2)"
                  }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl bg-gradient-to-r from-[#1f2933] to-black p-6 border border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ duration: 0.2 }}
                      className="text-3xl"
                    >
                      {module.icon}
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="text-lg md:text-xl font-semibold text-white mb-2">
                        {module.title}
                      </h4>
                      <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              variants={scaleIn}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="mt-8 text-center"
            >
              <div className="inline-block rounded-full bg-orange-500/10 border border-orange-400/30 px-6 py-3">
                <p className="text-orange-200 font-semibold text-lg">
                  This is a complete digital business system, not scattered lessons.
                </p>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonials */}
      <AnimatedSection variants={fadeIn} className="max-w-4xl mx-auto mt-12">
        <motion.h3 
          variants={fadeInUp}
          className="text-2xl md:text-3xl font-bold text-center mb-8 text-white"
        >
          What Our Members Are Saying
        </motion.h3>
        
        <motion.div 
          variants={staggerContainer}
          className="grid gap-6 md:grid-cols-2"
        >
          {[
            {
              initials: "JD",
              name: "James D.",
              bgColor: "bg-orange-500/20",
              borderColor: "border-orange-400/30",
              textColor: "text-orange-300",
              testimonial: "This finally gave me direction. I was lost trying so many things online, but DCS showed me exactly what to do step by step."
            },
            {
              initials: "SM",
              name: "Sarah M.",
              bgColor: "bg-blue-500/20",
              borderColor: "border-blue-400/30",
              textColor: "text-blue-300",
              testimonial: "I stopped consuming and started executing. The system is so clear that I finally took action instead of just watching more videos."
            },
            {
              initials: "AK",
              name: "Alex K.",
              bgColor: "bg-green-500/20",
              borderColor: "border-green-400/30",
              textColor: "text-green-300",
              testimonial: "Simple, clear, and practical. No fluff, no confusion - just exactly what I needed to start my affiliate journey."
            },
            {
              initials: "MR",
              name: "Maria R.",
              bgColor: "bg-purple-500/20",
              borderColor: "border-purple-400/30",
              textColor: "text-purple-300",
              testimonial: "I wish I didn't overthink it. I hesitated for weeks, but once I joined, I realized how straightforward this actually is."
            }
          ].map((testimonial, index) => (
            <motion.div
              key={index}
              variants={index % 2 === 0 ? slideInLeft : slideInRight}
              whileHover={{ 
                y: -5,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                borderColor: "rgba(251, 146, 60, 0.5)"
              }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl bg-gradient-to-r from-[#1f2933] to-black p-6 border border-white/10"
            >
              <div className="flex items-start gap-4">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`w-12 h-12 rounded-full ${testimonial.bgColor} ${testimonial.borderColor} border flex items-center justify-center flex-shrink-0`}
                >
                  <span className={`${testimonial.textColor} font-bold text-lg`}>
                    {testimonial.initials}
                  </span>
                </motion.div>
                <div className="flex-1">
                  <motion.div 
                    variants={fadeInUp}
                    className="flex items-center gap-2 mb-2"
                  >
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex text-yellow-400 text-sm"
                    >
                      ⭐⭐⭐⭐⭐
                    </motion.div>
                  </motion.div>
                  <motion.p 
                    variants={fadeInUp}
                    className="text-gray-300 text-sm leading-relaxed"
                  >
                    "{testimonial.testimonial}"
                  </motion.p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection variants={fadeIn} className="max-w-3xl mx-auto mt-20">
        <motion.h3 
          variants={fadeInUp}
          className="text-2xl md:text-3xl font-bold text-center mb-8 text-white"
        >
          Frequently Asked Questions
        </motion.h3>
        
        <motion.div 
          variants={staggerContainer}
          className="space-y-4"
        >
          {[
            {
              id: 'faq1',
              question: 'Do I need experience?',
              answer: 'No. This is built for complete beginners. We assume you\'re starting from zero and provide step-by-step guidance for everything you need to know.'
            },
            {
              id: 'faq2',
              question: 'Do I need to create a product?',
              answer: 'No. You promote digital products already created by professionals. We show you how to find high-converting products and earn commissions without creating anything yourself.'
            },
            {
              id: 'faq3',
              question: 'How long does it take to see results?',
              answer: 'Results depend on how fast you take action. The system provides the steps, but your timeline depends on your consistency and effort. Some members see results in weeks, others take months - the system works if you work it.'
            },
            {
              id: 'faq4',
              question: 'Is this available worldwide?',
              answer: 'Yes. Anyone with internet access can join. The strategies work globally, and we have members from multiple countries successfully implementing the system.'
            },
            {
              id: 'faq5',
              question: 'Is this another hype program?',
              answer: 'No. This is a structured system. No action = no results. We provide proven frameworks and clear steps, but success requires your implementation. No magic buttons, just proven strategies that work when you do.'
            }
          ].map((faq, index) => (
              <motion.div
                key={faq.id}
                variants={fadeInUp}
                whileHover={{ 
                  borderColor: "rgba(251, 146, 60, 0.3)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl bg-gradient-to-r from-[#1f2933] to-black border border-white/10 overflow-hidden"
              >
                <motion.button
                  onClick={() => toggleItem(faq.id)}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  transition={{ duration: 0.2 }}
                  className="w-full px-6 py-4 text-left flex items-center justify-between transition-colors"
                >
                  <h4 className="text-white font-semibold text-base md:text-lg">
                    {faq.question}
                  </h4>
                  <motion.svg
                    className={`w-5 h-5 text-orange-400 transform transition-transform duration-300 ${openItems[faq.id] ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </motion.button>
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: openItems[faq.id] ? 'auto' : 0,
                    opacity: openItems[faq.id] ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4">
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
        </motion.div>
      </AnimatedSection>

      {/* Additional screenshots section */}
      <section className="py-14 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h3 
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-white mb-4"
            >
              See What Our Members Are Achieving
            </motion.h3>
            <motion.p 
              variants={fadeInUp}
              className="text-gray-300 text-base max-w-2xl mx-auto"
            >
              Real results from real people who started exactly where you are right now
            </motion.p>
          </AnimatedSection>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-6 md:grid-cols-3"
          >
            {[
              "/Screenshot 2025-12-19 225126.png",
              "/Screenshot 2025-12-19 225135.png", 
              "/Screenshot 2025-12-19 225147.png"
            ].map((src, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  boxShadow: "0 20px 40px rgba(237,135,74,0.3)"
                }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl bg-gradient-to-b from-[#1f2933] to-black p-4 border border-white/10 flex flex-col gap-3"
              >
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black/60">
                  <Image
                    src={src}
                    alt={`Member success screenshot ${index + 1}`}
                    width={500}
                    height={320}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <motion.div 
                  variants={fadeInUp}
                  className="text-center"
                >
                  <p className="text-orange-400 font-semibold text-sm">
                    Member Success Story #{index + 1}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Results may vary • Individual effort required
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          <AnimatedSection variants={fadeIn} className="text-center mt-12">
            <motion.div
              variants={scaleIn}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="inline-block rounded-full bg-orange-500/10 border border-orange-400/30 px-6 py-3"
            >
              <p className="text-orange-200 font-semibold">
                These could be your results sooner than you think
              </p>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final psychological section */}
      <AnimatedSection variants={fadeIn} className="max-w-4xl mx-auto">
        <motion.div 
          variants={scaleIn}
          animate={{ 
            boxShadow: ["0 0 30px rgba(239,68,68,0.3)", "0 0 50px rgba(239,68,68,0.5)", "0 0 30px rgba(239,68,68,0.3)"]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="rounded-3xl bg-gradient-to-r from-red-900/20 via-orange-900/20 to-red-900/20 border border-red-500/30 px-8 py-10 mb-8 backdrop-blur-sm"
        >
          <div className="text-center space-y-6">
            <motion.div 
              variants={fadeInUp}
              animate={{ 
                scale: [1, 1.05, 1],
                borderColor: ["rgba(239,68,68,0.5)", "rgba(251,146,60,0.8)", "rgba(239,68,68,0.5)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-400/30"
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-red-300 text-sm font-medium"
              >
                ⚠️ CRITICAL DECISION POINT
              </motion.span>
            </motion.div>
            
            <motion.h3 
              variants={fadeInUp}
              animate={{ 
                textShadow: ["0 0 20px rgba(255,255,255,0.5)", "0 0 30px rgba(255,255,255,0.8)", "0 0 20px rgba(255,255,255,0.5)"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-2xl md:text-3xl font-bold text-white"
            >
              You've Reached Your Moment of Truth
            </motion.h3>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-gray-200 max-w-2xl mx-auto"
            >
              In 60 seconds, you'll make one of two choices that will define your next 6 months
            </motion.p>
            
            <motion.div 
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-8"
            >
              {/* Path 1: Stay Stuck */}
              <motion.div
                variants={slideInLeft}
                whileHover={{ 
                  scale: 1.02,
                  borderColor: "rgba(239,68,68,0.6)",
                  boxShadow: "0 20px 40px rgba(239,68,68,0.3)"
                }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl bg-black/40 border border-red-500/20 p-6"
              >
                <motion.div 
                  animate={{ x: [-2, 2, -2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-red-300 text-2xl mb-3"
                >
                  ❌ PATH OF REGRET
                </motion.div>
                <h4 className="text-white font-semibold mb-3">Close This Page & Stay Stuck</h4>
                <motion.ul 
                  variants={staggerContainer}
                  className="text-gray-300 text-sm space-y-2 text-left"
                >
                  {[
                    "Tomorrow looks exactly like today",
                    "Same financial stress, same frustration",
                    "Watch others succeed while you hesitate",
                    "Keep asking 'what if' for months",
                    "This opportunity disappears forever"
                  ].map((item, index) => (
                    <motion.li 
                      key={index}
                      variants={fadeInUp}
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      • {item}
                    </motion.li>
                  ))}
                </motion.ul>
                <motion.div 
                  variants={fadeInUp}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-4 text-red-300 text-sm font-medium"
                >
                  The price increases when you leave
                </motion.div>
              </motion.div>
              
              {/* Path 2: Take Action */}
              <motion.div
                variants={slideInRight}
                whileHover={{ 
                  scale: 1.02,
                  borderColor: "rgba(34,197,94,0.6)",
                  boxShadow: "0 20px 40px rgba(34,197,94,0.3)"
                }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl bg-gradient-to-b from-green-900/20 to-transparent border border-green-500/30 p-6 relative overflow-hidden"
              >
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-0 right-0 text-green-400 text-6xl opacity-20"
                >
                  ✓
                </motion.div>
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-green-300 text-2xl mb-3"
                >
                  ✅ PATH OF FREEDOM
                </motion.div>
                <h4 className="text-white font-semibold mb-3">Join DCS & Transform Your Life</h4>
                <motion.ul 
                  variants={staggerContainer}
                  className="text-gray-300 text-sm space-y-2 text-left"
                >
                  {[
                    "Step-by-step system starting today",
                    "Finally understand how online income works",
                    "Join thousands already making progress",
                    "Build skills that pay you for life",
                    "Lock in $18 price before it's gone"
                  ].map((item, index) => (
                    <motion.li 
                      key={index}
                      variants={fadeInUp}
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      • {item}
                    </motion.li>
                  ))}
                </motion.ul>
                <motion.div 
                  variants={fadeInUp}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="mt-4 text-green-300 text-sm font-medium"
                >
                  Your future self will thank you
                </motion.div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              className="mt-8 space-y-4"
            >
              <motion.p 
                animate={{ 
                  textShadow: ["0 0 10px rgba(251,146,60,0.5)", "0 0 20px rgba(251,146,60,0.8)", "0 0 10px rgba(251,146,60,0.5)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-orange-200 text-lg font-semibold"
              >
                The universe doesn't reward intention. It rewards ACTION.
              </motion.p>
              <motion.p 
                variants={fadeInUp}
                className="text-gray-300 text-sm max-w-2xl mx-auto"
              >
                Every successful person in DCS was once exactly where you are right now - 
                scrolling, reading, deciding. The only difference? They clicked the button.
              </motion.p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          variants={fadeInUp}
          className="text-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-[#ed874a] hover:bg-orange-600 text-white px-10 py-6 rounded-full text-base md:text-lg font-semibold shadow-[0_18px_45px_rgba(237,135,74,0.55)] inline-flex items-center justify-center gap-2"
            >
              Start you DCS Journey Now
            </Button>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            className="grid gap-1 text-xs md:text-sm text-gray-200 max-w-md mx-auto mt-4"
          >
            {[
              "Price increases when timer ends",
              "This offer will not repeat",
              "Action-takers only",
              "Your move"
            ].map((item, index) => (
              <motion.p 
                key={index}
                variants={fadeInUp}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                ✔ {item}
              </motion.p>
            ))}
          </motion.div>
          <motion.p 
            variants={fadeInUp}
            animate={{ 
              scale: [1, 1.02, 1],
              textShadow: ["0 0 10px rgba(251,146,60,0.5)", "0 0 15px rgba(251,146,60,0.8)", "0 0 10px rgba(251,146,60,0.5)"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-sm md:text-base text-gray-100 mt-2"
          >
            🎁 Bonus stack worth $200 included today only
          </motion.p>
        </motion.div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10 bg-black/95 text-gray-400">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/digiafriqlogo.png"
              alt="DigiAfriq"
              width={90}
              height={30}
              className="brightness-0 invert"
            />
            <span className="text-xs md:text-sm">
              © {new Date().getFullYear()} DigiAfriq. All rights reserved.
            </span>
          </div>
          <p className="text-[11px] md:text-xs text-gray-500 max-w-md md:text-right">
            The Digital Cashflow System is a skill-based program. Results depend on your effort, implementation, and consistency.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function DCSSalesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    }>
      <DCSSalesPageContent />
    </Suspense>
  )
}
