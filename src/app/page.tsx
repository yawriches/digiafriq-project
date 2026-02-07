"use client"
import { motion } from "framer-motion"

// Add shimmer animation
const shimmerAnimation = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 3s ease-in-out infinite;
  }
`
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Users, BookOpen, ChevronDown, Lightbulb, Wrench, TrendingUp, Quote, Coins, Network, Clock } from "lucide-react"
import { useState } from "react"
import { useBlogPosts } from "@/lib/hooks/useBlogPosts"

const platformFeatures = [
  { 
    icon: BookOpen, 
    title: "Learning Vault", 
    description: "Structured AI skill training focused on practical use cases and monetization." 
  },
  { 
    icon: Wrench, 
    title: "Tools & Resources", 
    description: "Templates, prompts, frameworks, and workflows to accelerate execution." 
  },
  { 
    icon: Users, 
    title: "Community & Support", 
    description: "A growing network of learners, builders, and earners supporting each other." 
  },
  { 
    icon: TrendingUp, 
    title: "Growth Pathways", 
    description: "Optional advanced programs and systems for those ready to scale further." 
  },
]

const processSteps = [
  { 
    number: "01", 
    title: "Join a Digiafriq Program", 
    description: "Begin with the AI Cashflow System as your foundation." 
  },
  { 
    number: "02", 
    title: "Learn Practical AI Skills", 
    description: "Follow structured lessons designed for real-world application." 
  },
  { 
    number: "03", 
    title: "Apply & Monetize", 
    description: "Use your skills to create services, products, or income opportunities." 
  },
  { 
    number: "04", 
    title: "Grow Within the Platform", 
    description: "Access advanced tools, systems, and optional growth programs." 
  },
]

const testimonials = [
  { 
    name: "Kwame A.", 
    content: "Digiafriq gave me structure and clarity. I finally understood how to use AI skills practically." 
  },
  { 
    name: "Fatima S.", 
    content: "The platform feels serious and well thought out. Not hype, just real systems." 
  },
  { 
    name: "Nana K.", 
    content: "I started with the AI Cashflow System and now understand how to build income around skills." 
  },
]

const faqs = [
  {
    question: "What is Digiafriq?",
    answer: "Digiafriq is an AI skills and monetization platform focused on practical learning and sustainable income pathways."
  },
  {
    question: "Where do I start?",
    answer: "Most members begin with the AI Cashflow System, which serves as the platform's recommended entry point."
  },
  {
    question: "Is Digiafriq only for beginners?",
    answer: "No. The platform supports beginners through to advanced learners, depending on the programs accessed."
  },
  {
    question: "Is there a separate membership fee?",
    answer: "Access to Digiafriq's core system is included when you join a qualifying program."
  },
]

const beliefs = [
  "Skills matter more than hype",
  "Systems matter more than shortcuts",
  "Long-term income beats quick wins"
]

const platformPillars = [
  "Skill development",
  "Monetization frameworks",
  "Community accountability",
  "Scalable systems"
]

const whatIsDigiafriqFeatures = [
  {
    icon: Lightbulb,
    title: "Skill Development",
    description: "Acquire in-demand AI skills to enhance your capabilities."
  },
  {
    icon: Coins,
    title: "Monetization Frameworks", 
    description: "Learn proven strategies to generate income from your AI expertise."
  },
  {
    icon: Users,
    title: "Community Accountability",
    description: "Engage in a supportive community that fosters accountability."
  },
  {
    icon: Network,
    title: "Scalable Systems",
    description: "Access frameworks that facilitate sustainable business growth."
  }
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { posts: blogPosts, loading: blogLoading } = useBlogPosts(3)

  return (
    <div className="min-h-screen relative bg-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#ed874a]/20 to-[#d76f32]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-[#ed874a]/20 to-[#d76f32]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#ed874a]/10 to-[#d76f32]/10 rounded-full blur-3xl"
        />
      </div>

      {/* 1. Hero Section (Authority First) */}
      <section className="relative min-h-[90vh] flex items-center py-4 lg:py-8 z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight"
              >
                <span className="text-gray-900">Learn AI Skills.</span>
                <br />
                <span className="bg-gradient-to-r from-[#ed874a] via-[#d76f32] to-[#ed874a] bg-clip-text text-transparent">
                  Monetize Them.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl"
              >
                Digiafriq helps Africans learn AI skills and turn them into real income. Simple, credible, and instantly understandable.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="pt-4"
              >
                <Button
                  size="lg"
                  className="group relative bg-gradient-to-r from-[#ed874a] to-[#d76f32] hover:from-[#d76f32] hover:to-[#ed874a] text-white px-8 py-6 rounded-xl font-semibold text-base shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  asChild
                >
                  <Link href="/signup" className="flex items-center justify-center">
                    <span>Start Learning</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>

              {/* Supporting line */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="text-sm text-gray-500"
              >
                Practical skills • Real-world application • Sustainable income
              </motion.p>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex justify-center lg:justify-end"
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full max-w-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#ed874a]/20 to-[#d76f32]/20 rounded-full blur-3xl scale-110" />
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  src="/herosectionimage.png" 
                  alt="AI Skills and Monetization Platform"
                  className="relative w-full h-auto drop-shadow-2xl"
                />
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-[#ed874a] to-[#d76f32] rounded-2xl opacity-20 blur-xl"
                />
                <motion.div
                  animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-[#ed874a] to-[#d76f32] rounded-full opacity-20 blur-xl"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 cursor-pointer group"
          >
            <span className="text-xs font-medium text-gray-500 group-hover:text-[#ed874a] transition-colors">Scroll to explore</span>
            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#ed874a] transition-colors" />
          </motion.div>
        </motion.div>
      </section>

      {/* 2. What Digiafriq Is (Clarity & Positioning) */}
      <section className="py-20 relative z-10">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          {/* Background Africa Map */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <img 
              src="/africa-map.png" 
              alt="Africa Map Background" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center relative z-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              What Is Digiafriq?
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-12 max-w-3xl mx-auto">
              Digiafriq is a <span className="font-semibold text-gray-900">skill-to-income</span> platform that empowers individuals to learn practical AI applications and monetize those skills ethically and sustainably.
            </p>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {whatIsDigiafriqFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-[#ed874a]/20 to-[#d76f32]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-[#ed874a]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
            
            <p className="text-base text-gray-500 font-medium">
              Designed with the African market in mind.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. Start With the AI Cashflow System - SPOTLIGHT */}
      <section id="ai-cashflow-program" className="py-24 relative z-10 bg-gradient-to-br from-[#fef3e8] via-white to-[#fef8f0]">
        {/* Spotlight Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-[#ed874a]/30 to-[#d76f32]/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-tr from-[#ed874a]/25 to-[#d76f32]/25 rounded-full blur-3xl"
          />
        </div>

        {/* Spotlight Badge - Premium Design */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#ed874a] via-[#d76f32] to-[#ed874a] text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl border border-white/20 backdrop-blur-sm relative overflow-hidden">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
            
            {/* Premium icon */}
            <div className="relative z-10">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            
            {/* Text */}
            <span className="relative z-10 tracking-wider uppercase">
              SPOTLIGHT PROGRAM
            </span>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </motion.div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Start With the <br />
                AI Cashflow Program
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                The AI Cashflow Program is Digiafriq's flagship entry program. It is designed to help new members understand how AI skills can be applied and monetized in practical ways.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                It serves as the recommended starting point for anyone entering the Digiafriq ecosystem and unlocks access to the platform's core tools, resources, and community.
              </p>
              
              <Button
                size="lg"
                className="group relative bg-gradient-to-r from-[#ed874a] to-[#d76f32] hover:from-[#d76f32] hover:to-[#ed874a] text-white px-10 py-5 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 border-2 border-white/50"
                asChild
              >
                <Link href="/ai-cashflow-system" className="flex items-center">
                  Learn About the AI Cashflow Program
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>

            {/* Right: Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-lg">
                {/* Monitor with Chart */}
                <div className="relative">
                  <img 
                    src="/ai-cashflow-monitor.png" 
                    alt="AI Cashflow System Monitor showing growth chart"
                    className="w-full h-auto"
                  />
                  
                  {/* Floating Elements */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-8 -right-4 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200"
                  >
                    <span className="text-xl font-bold text-[#ed874a]">AI</span>
                  </motion.div>
                  
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200"
                  >
                    <span className="text-lg font-bold text-green-600">$</span>
                  </motion.div>
                  
                  <motion.div
                    animate={{ rotate: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-4 -right-8 w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center border-2 border-gray-200"
                  >
                    <Wrench className="w-5 h-5 text-[#ed874a]" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      
      
      {/* 6. How Digiafriq Works (Process Clarity) */}
      <section id="how-it-works" className="py-20 relative z-10">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              From Learning to Earning
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A clear pathway from skill acquisition to income generation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg h-full">
                  <div className="text-4xl font-bold bg-gradient-to-r from-[#ed874a] to-[#d76f32] bg-clip-text text-transparent mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#ed874a] to-[#d76f32]" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Community & Social Proof (Trust Layer) */}
      <section className="py-20 relative z-10 bg-gradient-to-br from-slate-50 via-white to-orange-50">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              A Growing Community Across Africa
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
                  <CardContent className="pt-6">
                    <Quote className="w-8 h-8 text-[#ed874a]/30 mb-4" />
                    <p className="text-gray-700 leading-relaxed mb-6 italic">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      — {testimonial.name}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      
      {/* 9. FAQ (Confidence & Transparency) */}
      <section id="faq" className="py-20 relative z-10 bg-gradient-to-br from-slate-50 via-white to-orange-50">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div 
                  className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} 
                    />
                  </div>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Latest Blog Section */}
      <section id="blog" className="py-20 relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Latest from Our Blog
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Stay updated with the latest insights, tips, and success stories from the digital world.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <Card className="h-full border-0 shadow-md overflow-hidden bg-white">
                    <div className="h-48 bg-gray-200"></div>
                    <CardHeader className="pb-4">
                      <div className="h-6 bg-gray-200 rounded mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : (
              blogPosts.map((post, index) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-md overflow-hidden bg-white">
                    {/* Blog Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={post.featured_image || '/blog/default-blog.jpg'} 
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute top-4 left-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                          <div className="flex items-center text-sm text-[#ed874a] font-medium">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(post.published_at).toLocaleDateString('en-US', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-[#ed874a] transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardContent className="text-gray-600 text-base leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </CardContent>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <Button 
                        variant="ghost" 
                        className="text-[#ed874a] hover:text-[#d76f32] hover:bg-[#ed874a]/5 p-0 h-auto font-medium"
                        asChild
                      >
                        <Link href={`/blog/${post.slug}`} className="flex items-center">
                          Read More
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* View All Blogs CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#ed874a] to-[#d76f32] hover:from-[#d76f32] hover:to-[#ed874a] text-white px-8 py-3"
              asChild
            >
              <Link href="/blog">
                View All Blog Posts
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 relative z-10">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 mb-2">
              Digiafriq
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Africa&apos;s AI Skills & Monetization Platform
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-600">
              <Link href="/about" className="hover:text-[#ed874a] transition-colors">About</Link>
              <Link href="/contact" className="hover:text-[#ed874a] transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-[#ed874a] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#ed874a] transition-colors">Terms</Link>
            </div>
            <p className="text-xs text-gray-400 mt-6">
              © {new Date().getFullYear()} Digiafriq. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
