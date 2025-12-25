'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Crown, 
  CheckCircle, 
  Clock, 
  Users, 
  BookOpen, 
  Zap, 
  Target, 
  DollarSign, 
  RefreshCw, 
  TrendingDown, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  MessageCircle,
  Play,
  Loader2
} from 'lucide-react'

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
}

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 }
}

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Animated section component
function AnimatedSection({ 
  children, 
  variants = fadeIn, 
  className = "" 
}: { 
  children: React.ReactNode
  variants?: any
  className?: string 
}) {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function DCSSalesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [membership, setMembership] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [countdownHours, setCountdownHours] = useState(23)
  const [countdownMinutes, setCountdownMinutes] = useState(59)
  const [countdownRemainingSeconds, setCountdownRemainingSeconds] = useState(59)

  // Fetch membership data
  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const response = await fetch('/api/memberships')
        if (response.ok) {
          const apiResponse = await response.json()
          // Extract packages array from response object
          const data = apiResponse.packages || []
          
          // Check if data is an array before using find
          if (Array.isArray(data)) {
            // Get the first active membership (DCS program)
            const dcsMembership = data.find((m: any) => m.is_active && m.name.toLowerCase().includes('dcs'))
            if (dcsMembership) {
              setMembership(dcsMembership)
            } else {
              // Fallback to any active membership if no DCS found
              const anyActiveMembership = data.find((m: any) => m.is_active)
              if (anyActiveMembership) {
                setMembership(anyActiveMembership)
              } else {
                // If no active memberships, use fallback
                setMembership({
                  id: 'dcs-fallback',
                  name: 'Digital Cashflow System',
                  price: 18,
                  currency: 'USD',
                  is_active: true
                })
              }
            }
          } else {
            console.error('Packages data is not an array:', data)
            // Set fallback membership data
            setMembership({
              id: 'dcs-fallback',
              name: 'Digital Cashflow System',
              price: 18,
              currency: 'USD',
              is_active: true
            })
          }
        } else {
          // API request failed, set fallback
          setMembership({
            id: 'dcs-fallback',
            name: 'Digital Cashflow System',
            price: 18,
            currency: 'USD',
            is_active: true
          })
        }
      } catch (error) {
        console.error('Error fetching membership:', error)
        // Set fallback membership data on error
        setMembership({
          id: 'dcs-fallback',
          name: 'Digital Cashflow System',
          price: 18,
          currency: 'USD',
          is_active: true
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMembership()
  }, [])

  // 24-hour countdown timer
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
    // Navigate to specific checkout URL with UUID
    router.push('/checkout/guest/6681bee3-653e-4f97-8000-f22bffc0733e')
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

  // New DCS Affiliate Sales Page Structure
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050816] to-black text-white">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black">
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent"></div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="text-center">
            <AnimatedSection variants={staggerContainer}>
              {/* Main Headline */}
              <motion.h1 
                variants={fadeInUp}
                className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight"
              >
                Earn Up To 80% Affiliate Commission
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">+ Recurring Yearly Income</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p 
                variants={fadeInUp}
                className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
              >
                The Digital Cashflow System (DCS) is the only way to become a Digiafriq affiliate — with full training, tools, and bonuses included.
              </motion.p>

              {/* Video Section */}
              <motion.div variants={fadeInUp} className="mb-12 max-w-4xl mx-auto">
                <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-white/10 backdrop-blur-sm">
                  <div className="aspect-video">
                    <iframe
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/jVZQQhF5k8U"
                      title="How to Earn 80% Commissions with Digital Cashflow System"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
                <motion.p 
                  variants={fadeInUp}
                  className="text-center text-gray-300 mt-4 text-lg"
                >
                  Watch how everyday affiliates are earning 80% commissions + recurring income through DCS
                </motion.p>
              </motion.div>

              {/* CTA Button */}
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-orange-500/25 cursor-pointer"
                  onClick={handleGetStarted}
                >
                  <Crown className="w-5 h-5" />
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="text-gray-400 text-sm mt-4"
                >
                  <span className="text-orange-400 font-semibold">Up to 80% Commissions • Recurring Income • Full Training Included</span>
                </motion.p>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CLARITY SECTION */}
      <section className="py-16 md:py-20 bg-black border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              What Is the Digital Cashflow System?
            </motion.h2>
          </AnimatedSection>

          <AnimatedSection variants={fadeIn} className="max-w-4xl mx-auto">
            <motion.div 
              variants={fadeInUp}
              className="bg-gradient-to-br from-orange-900/20 to-black border border-orange-500/30 rounded-3xl p-10"
            >
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                The Digital Cashflow System is a complete affiliate setup that allows you to:
              </p>
              
              <div className="space-y-6 mb-8">
                {[
                  "Promote Digiafriq Learner Memberships",
                  "Earn up to 80% commission per sale",
                  "Earn 20% recurring commissions when your referrals renew yearly",
                  "Get training that shows you how to actually make sales, not just share links"
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-start gap-4"
                  >
                    <CheckCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                    <p className="text-gray-300 text-lg">{item}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                variants={fadeInUp}
                className="p-6 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl border border-orange-500/30"
              >
                <p className="text-xl text-orange-200 font-bold text-center">
                  This is not just an affiliate link.<br />
                  It's a system built for long-term cashflow.
                </p>
              </motion.div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black to-[#050816] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              DCS Is For You If:
            </motion.h2>
          </AnimatedSection>

          <AnimatedSection variants={staggerContainer} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "You're tired of promoting products that pay 5–15% commissions",
                icon: <TrendingDown className="w-6 h-6" />
              },
              {
                title: "You want higher payouts per sale, not more stress",
                icon: <DollarSign className="w-6 h-6" />
              },
              {
                title: "You want recurring income, not income that resets every month",
                icon: <RefreshCw className="w-6 h-6" />
              },
              {
                title: "You want a ready-made platform instead of starting from scratch",
                icon: <Crown className="w-6 h-6" />
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-orange-900/20 to-black border border-orange-500/30 rounded-2xl p-6 flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-orange-400">
                  {item.icon}
                </div>
                <p className="text-gray-300 text-lg">{item.title}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* WHY THIS IS DIFFERENT */}
      <section className="py-16 md:py-20 bg-black border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Why Affiliates Are Upgrading to DCS
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-gray-300 text-lg max-w-2xl mx-auto"
            >
              This is why many affiliates are switching.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection variants={fadeIn} className="max-w-5xl mx-auto">
            <motion.div 
              variants={fadeInUp}
              className="bg-gradient-to-br from-gray-900/50 to-black border border-white/10 rounded-3xl overflow-hidden"
            >
              {/* Table Header */}
              <div className="grid grid-cols-2 bg-gradient-to-r from-gray-800/50 to-black border-b border-white/10">
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-red-400">Typical Affiliate Programs</h3>
                </div>
                <div className="p-6 text-center bg-gradient-to-r from-orange-900/30 to-transparent">
                  <h3 className="text-xl font-bold text-orange-400">DCS Elite Affiliate</h3>
                </div>
              </div>

              {/* Table Rows */}
              {[
                { feature: "Commissions", typical: "10–50%", dcs: "Up to 80%" },
                { feature: "Payouts", typical: "One-time payouts", dcs: "Yearly recurring income" },
                { feature: "Training", typical: "No real training", dcs: "Step-by-step system" },
                { feature: "Offers", typical: "Saturated offers", dcs: "Premium learning platform" },
                { feature: "Starting Point", typical: "Start from zero", dcs: "Done-for-you infrastructure" }
              ].map((row, index) => (
                <div key={index} className="grid grid-cols-2 border-b border-white/5 last:border-b-0">
                  <div className="p-6 flex items-center justify-center">
                    <span className="text-gray-300">{row.feature}</span>
                    <span className="ml-4 text-red-400 font-semibold">{row.typical}</span>
                  </div>
                  <div className="p-6 flex items-center justify-center bg-gradient-to-r from-orange-900/10 to-transparent">
                    <span className="text-gray-300">{row.feature}</span>
                    <span className="ml-4 text-orange-400 font-semibold">{row.dcs}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* SCREENSHOTS SECTION */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black to-[#050816] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              See The DCS Dashboard In Action
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-gray-300 text-lg max-w-2xl mx-auto"
            >
              Real screenshots from our affiliate dashboard showing exactly what you get
            </motion.p>
          </AnimatedSection>

          <AnimatedSection variants={staggerContainer} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Commission Tracking",
                description: "Real-time dashboard showing your earnings, clicks, and conversion rates",
                image: "/api/placeholder/400/300"
              },
              {
                title: "Marketing Materials",
                description: "Access to high-converting landing pages, email templates, and social media creatives",
                image: "/api/placeholder/400/300"
              },
              {
                title: "Training Portal",
                description: "Step-by-step video training and resources to help you succeed",
                image: "/api/placeholder/400/300"
              }
            ].map((screenshot, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-orange-900/20 to-black border border-orange-500/30 rounded-2xl overflow-hidden"
              >
                <div className="aspect-video bg-gray-800/50 relative">
                  <img 
                    src={screenshot.image} 
                    alt={screenshot.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{screenshot.title}</h3>
                  <p className="text-gray-300 text-sm">{screenshot.description}</p>
                </div>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* THE OFFER */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black to-[#050816] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              What You Get With DCS Elite Access
            </motion.h2>
          </AnimatedSection>

          <AnimatedSection variants={staggerContainer} className="max-w-4xl mx-auto">
            {[
              "✅ Official Digiafriq Affiliate Access",
              "✅ 1-Year Digiafriq Learner Membership",
              "✅ Lifetime DCS Affiliate Training",
              "✅ Marketing Materials (pages, templates, creatives)",
              "✅ Affiliate Dashboard & Commission Tracking",
              "✅ Community & Ongoing Support"
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-gradient-to-r from-orange-900/20 to-black border border-orange-500/30 rounded-2xl p-6 mb-4 flex items-center gap-4"
              >
                <CheckCircle className="w-6 h-6 text-orange-400 flex-shrink-0" />
                <p className="text-gray-300 text-lg">{item}</p>
              </motion.div>
            ))}

            <motion.div
              variants={fadeInUp}
              className="text-center mt-8 p-6 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl border border-orange-500/30"
            >
              <p className="text-xl text-orange-200 font-bold">
                Everything you need to start and scale — in one system.
              </p>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* COMMISSION STRUCTURE */}
      <section className="py-16 md:py-20 bg-black border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              How You Earn in 3 Easy Steps
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-gray-300 text-lg max-w-2xl mx-auto"
            >
              Start earning high commissions with this simple system
            </motion.p>
          </AnimatedSection>

          <AnimatedSection variants={staggerContainer} className="max-w-4xl mx-auto">
            <motion.div 
              variants={fadeInUp}
              className="bg-gradient-to-br from-orange-900/30 to-black border border-orange-500/30 rounded-3xl p-10"
            >
              <div className="space-y-8">
                {/* Step 1 */}
                <motion.div
                  variants={fadeInUp}
                  className="flex items-start gap-6 p-6 bg-gradient-to-r from-orange-500/10 to-transparent rounded-2xl border border-orange-500/20"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">Purchase the Digital Cashflow System</h3>
                    <p className="text-gray-300 text-lg">Get instant access to elite affiliate training, marketing materials, and your Digiafriq Learner Membership</p>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  variants={fadeInUp}
                  className="flex items-start gap-6 p-6 bg-gradient-to-r from-orange-500/10 to-transparent rounded-2xl border border-orange-500/20"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">Promote Digiafriq Learner Membership or DCS</h3>
                    <p className="text-gray-300 text-lg">Use our proven marketing materials and training to attract customers to high-value learning products</p>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  variants={fadeInUp}
                  className="flex items-start gap-6 p-6 bg-gradient-to-r from-orange-500/10 to-transparent rounded-2xl border border-orange-500/20"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">Earn 80% + Potential 20% Recurring</h3>
                    <p className="text-gray-300 text-lg">Get up to 80% commission on initial sales plus 20% recurring when your referrals renew yearly</p>
                  </div>
                </motion.div>
              </div>

              <motion.div
                variants={fadeInUp}
                className="text-center mt-10 p-6 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl border border-orange-500/30"
              >
                <p className="text-xl text-orange-200 font-bold mb-4">
                  That's it! Three steps to building your affiliate empire
                </p>
                <div className="flex justify-center gap-8 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">No inventory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">No shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">Just pure profit</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* TRAINING OVERVIEW */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black to-[#050816] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              What You'll Learn Inside DCS
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-gray-300 text-lg max-w-2xl mx-auto"
            >
              No fluff. No theory overload. Just what works.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Free Traffic Strategies",
                description: "How to get buyers from social media and content without ads",
                icon: <Target className="w-6 h-6" />
              },
              {
                title: "Paid Ads Foundations",
                description: "Simple ad strategies that convert when you're ready to scale",
                icon: <Zap className="w-6 h-6" />
              },
              {
                title: "High-Ticket Affiliate Psychology",
                description: "How to position yourself so buyers trust you",
                icon: <Crown className="w-6 h-6" />
              },
              {
                title: "Recurring Income Systems",
                description: "Build an audience that buys again and again",
                icon: <RefreshCw className="w-6 h-6" />
              },
              {
                title: "Scaling & Automation",
                description: "Move from side income to consistent daily earnings",
                icon: <TrendingUp className="w-6 h-6" />
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-orange-900/20 to-black border border-orange-500/30 rounded-2xl p-6 text-center"
              >
                <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-400">
                  {item.icon}
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* TOOLS & SUPPORT */}
      <section className="py-16 md:py-20 bg-black border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              You're Not Doing This Alone
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-gray-300 text-lg max-w-2xl mx-auto"
            >
              This is a real system, not just access.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection variants={staggerContainer} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Affiliate Dashboard",
                description: "Track clicks, sales, and commissions in real time",
                icon: <BarChart3 className="w-6 h-6" />
              },
              {
                title: "Marketing Assets",
                description: "High-converting landing pages, email swipes, and social templates",
                icon: <FileText className="w-6 h-6" />
              },
              {
                title: "Community Access",
                description: "Connect with other affiliates, ask questions, and grow together",
                icon: <Users className="w-6 h-6" />
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/30 rounded-2xl p-6 text-center"
              >
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
                  {item.icon}
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black to-[#050816] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              What Affiliates Are Saying
            </motion.h2>
          </AnimatedSection>

          <AnimatedSection variants={staggerContainer} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote: "I stopped promoting low-paying offers and finally started earning commissions that make sense.",
                author: "Current DCS Affiliate"
              },
              {
                quote: "The training helped me understand affiliate marketing properly, not just posting links.",
                author: "Current DCS Affiliate"
              },
              {
                quote: "Recurring commissions changed how I think about online income.",
                author: "Current DCS Affiliate"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-orange-900/20 to-black border border-orange-500/30 rounded-2xl p-6"
              >
                <div className="flex items-start mb-4">
                  <MessageCircle className="w-6 h-6 text-orange-400 mr-3 flex-shrink-0" />
                  <p className="text-gray-300 italic">"{testimonial.quote}"</p>
                </div>
                <p className="text-gray-400 text-sm text-right">— {testimonial.author}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* SCARCITY */}
      <section className="py-16 md:py-20 bg-black border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center mb-12">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Founding Access Closing Soon
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-gray-300 text-lg max-w-2xl mx-auto"
            >
              This commission structure is currently available for a limited time.
              Entry terms may change once founding access closes.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection variants={fadeIn} className="max-w-4xl mx-auto">
            <motion.div 
              variants={fadeInUp}
              className="bg-gradient-to-br from-red-900/30 to-black border border-red-500/30 rounded-3xl p-10 text-center"
            >
              <div className="flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-red-400 mr-3" />
                <span className="text-red-400 font-bold text-xl">⏳ Time Remaining:</span>
              </div>
              
              <div className="flex justify-center gap-4 mb-8">
                <div className="text-center">
                  <div className="text-5xl font-black text-red-400">
                    {String(countdownHours).padStart(2, '0')}
                  </div>
                  <p className="text-gray-400 text-sm">Hours</p>
                </div>
                <div className="text-3xl text-red-400 flex items-center">:</div>
                <div className="text-center">
                  <div className="text-5xl font-black text-red-400">
                    {String(countdownMinutes).padStart(2, '0')}
                  </div>
                  <p className="text-gray-400 text-sm">Minutes</p>
                </div>
                <div className="text-3xl text-red-400 flex items-center">:</div>
                <div className="text-center">
                  <div className="text-5xl font-black text-red-400">
                    {String(countdownRemainingSeconds).padStart(2, '0')}
                  </div>
                  <p className="text-gray-400 text-sm">Seconds</p>
                </div>
              </div>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-red-200 font-bold"
              >
                Don't miss this opportunity to lock in elite affiliate terms.
              </motion.p>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-black via-[#050816] to-black">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection variants={fadeIn} className="text-center">
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-black text-white mb-6"
            >
              Secure Your Elite Affiliate Access
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
            >
              Up to 80% Commissions • Recurring Income • Full Training Included
            </motion.p>

            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black py-6 px-12 rounded-full text-xl transition-all duration-300 shadow-lg hover:shadow-orange-500/25 cursor-pointer"
              onClick={handleGetStarted}
            >
              <Crown className="w-6 h-6" />
              👉 Get Started Now
              <ArrowRight className="w-6 h-6" />
            </motion.div>

            <motion.p 
              variants={fadeInUp}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-gray-400 text-sm mt-6"
            >
              <span className="text-orange-400 font-semibold">24-hour founding access window • No hidden fees • Instant access</span>
            </motion.p>
          </AnimatedSection>
        </div>
      </section>
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
