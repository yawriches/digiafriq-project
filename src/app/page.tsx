"use client"
import Squares from "../components/Squares"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Monitor, Globe, Smartphone, Star, CheckCircle, ArrowRight, Users, Award, MapPin, Clock, BookOpen, Zap, Shield, Target, ChevronDown, HelpCircle, DollarSign, Check } from "lucide-react"

const courses = [
  { title: "Digital Marketing Mastery", description: "SEO, social media, content strategy", icon: TrendingUp, duration: "8 weeks", level: "Beginner–Advanced", image: "/courses/digital-marketing.jpg" },
  { title: "Web Development Bootcamp", description: "HTML, CSS, JavaScript, React", icon: Monitor, duration: "12 weeks", level: "Beginner", image: "/courses/web-development.jpg" },
  { title: "Data Analytics & Viz", description: "Excel, Python, dashboards", icon: Globe, duration: "10 weeks", level: "Intermediate", image: "/courses/data-analytics.jpg" },
  { title: "Mobile App Development", description: "iOS and Android apps", icon: Smartphone, duration: "14 weeks", level: "Advanced", image: "/courses/mobile-development.jpg" },
]

const testimonials = [
  { name: "Kwame Asante", role: "Digital Marketer", content: "DigiAfriq transformed my career. The courses are practical and the support is amazing.", rating: 5, location: "Accra" },
  { name: "Fatima Ibrahim", role: "Web Developer", content: "I built my first professional website in 6 weeks. Now I'm freelancing full-time!", rating: 5, location: "Lagos" },
  { name: "David Mwangi", role: "Affiliate Marketer", content: "I earned over $2000 in commissions while still learning. Best investment I ever made.", rating: 5, location: "Nairobi" },
]

const steps = [
  { number: "01", title: "Join DigiAfriq", description: "Pay 100 cedis annually for full access" },
  { number: "02", title: "Learn Digital Skills", description: "Start any course at your own pace" },
  { number: "03", title: "Earn as Affiliate", description: "Keep 100% commission on each sale" },
]

const features = [
  { icon: BookOpen, title: "Unlimited Course Access", description: "Access all courses with one annual subscription of 100 cedis" },
  { icon: Clock, title: "Learn at Your Pace", description: "Self-paced learning that fits your schedule and lifestyle" },
  { icon: Users, title: "Community Support", description: "Join thousands of learners across Africa" },
  { icon: Award, title: "Practical Skills", description: "Hands-on projects that build real-world expertise" },
  { icon: Zap, title: "Earn While Learning", description: "Optional affiliate program to monetize your journey" },
  { icon: Shield, title: "Lifetime Updates", description: "Course content updated regularly with industry trends" },
]

const stats = [
  { number: "15,000+", label: "Active Learners", icon: Users },
  { number: "50+", label: "Skills & Courses", icon: BookOpen },
  { number: "20", label: "African Countries", icon: MapPin },
  { number: "95%", label: "Success Rate", icon: Target },
]

export default function Home() {
  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#fef3e8] via-white to-[#fef3e8] overflow-hidden">
      {/* Animated Background Elements - Applied to entire page */}
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
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center py-12 lg:py-0 z-10">
        {/* Hero Content */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Main Heading with Gradient */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight"
              >
                <span className="text-gray-900">Build Skills That</span>
                <br />
                <span className="bg-gradient-to-r from-[#ed874a] via-[#d76f32] to-[#ed874a] bg-clip-text text-transparent">
                  Create Income
                </span>
                <br />
              </motion.h1>

              {/* Description with Animation */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl"
              >
                Master in-demand digital skills and unlock an opportunity to earn through Digiafriq's affiliate system.
              </motion.p>

              {/* CTA Buttons with Enhanced Hover */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Button
                  size="lg"
                  className="group relative bg-gradient-to-r from-[#ed874a] to-[#d76f32] hover:from-[#d76f32] hover:to-[#ed874a] text-white px-8 py-6 rounded-xl font-semibold text-base shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                  asChild
                >
                  <Link href="#pricing" className="relative z-10 flex items-center justify-center">
                    <span>Start Learning Now</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-[#d76f32] to-[#d76f32]"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="group border-2 border-[#ed874a] text-[#ed874a] hover:bg-[#fef3e8] px-8 py-6 rounded-xl font-semibold text-base transition-all duration-300 hover:border-[#d76f32] hover:shadow-lg"
                  asChild
                >
                  <Link href="/join/dcs-affiliate" className="flex items-center justify-center">
                    <span>Join as affiliate</span>
                    <Users className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Right: Brain Image with Floating Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex justify-center lg:justify-end"
            >
              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative w-full max-w-2xl"
              >
                {/* Glow Effect Behind Image */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#ed874a]/20 to-[#d76f32]/20 rounded-full blur-3xl scale-110" />
                
                {/* Main Image */}
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  src="/herosectionimage.png" 
                  alt="Geometric brain illustration representing digital learning"
                  className="relative w-full h-auto drop-shadow-2xl"
                />
                
                {/* Floating Decorative Elements */}
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-[#ed874a] to-[#d76f32] rounded-2xl opacity-20 blur-xl"
                />
                <motion.div
                  animate={{
                    y: [0, 15, 0],
                    rotate: [0, -5, 0]
                  }}
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

      {/* Stats Section */}
      <section className="py-16 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Join Our Growing Community
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Thousands of learners across Africa are already building their digital skills and earning through our platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Stats Cards */}
            <div className="text-center p-6 bg-transparent rounded-lg border border-gray-200">
              <div className="text-4xl font-bold text-gray-900 mb-2">15,000+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Active Learners</div>
            </div>

            <div className="text-center p-6 bg-transparent rounded-lg border border-gray-200">
              <div className="text-4xl font-bold text-gray-900 mb-2">1000+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Affiliates</div>
            </div>

            <div className="text-center p-6 bg-transparent rounded-lg border border-gray-200">
              <div className="text-4xl font-bold text-gray-900 mb-2">20+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">African Countries</div>
            </div>
          </div>

          {/* World Map */}
          <div className="max-w-4xl mx-auto">
            <img 
              src="/world-map-with-pins.png" 
              alt="DigiAfriq Global Reach - World Map with Location Pins"
              className="w-full h-auto" 
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Why Choose DigiAfriq?
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              We provide practical digital skills training designed specifically for the African market, with flexible learning options and real earning opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Features */}
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#ed874a] rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Unlimited Course Access</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Get lifetime access to all our courses with regular updates and new content added continuously.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#ed874a] rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Learn at Your Own Pace</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Study whenever and wherever you want with our flexible learning platform designed for busy schedules.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#ed874a] rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Earn While You Learn</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Join our affiliate program and start earning commissions while building your digital skills.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/whychooseus.png" 
                  alt="Why Choose DigiAfriq - Students learning digital skills"
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#ed874a]/20 rounded-full blur-2xl"></div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#ed874a]/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="py-20 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Master In-Demand Skills
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our comprehensive library of practical courses designed for the African digital economy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-md overflow-hidden bg-transparent border border-gray-200">
                  {/* Course Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-3 right-3">
                      <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <course.icon className="w-5 h-5 text-[#ed874a]" />
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold mb-2">{course.title}</CardTitle>
                    <CardDescription className="text-gray-600 mb-3">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.duration}
                      </span>
                      <span className="bg-[#ed874a]/10 text-[#ed874a] px-2 py-1 rounded-full text-xs">
                        {course.level}
                      </span>
                    </div>
                    
                    {/* View Details Button */}
                    <Button 
                      className="w-full bg-[#ed874a] hover:bg-[#d76f32] text-white font-medium"
                      asChild
                    >
                      <Link href={`/courses/${course.title.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button
              size="lg"
              className="bg-[#ed874a] text-white hover:bg-[#d76f32] px-8 py-3"
              asChild
            >
              <Link href="/courses">
                Explore All Courses
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Choose Your Plan
            </h2>
            <p className="text-base text-gray-600">
              Select the package that best fits your goals. Both plans include lifetime access and regular updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Learner Package */}
            <Card className="relative overflow-hidden transition-all bg-transparent border border-gray-200 p-6 hover:shadow-lg">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ed874a] to-[#ed874a]/50" />

              <CardHeader className="p-0 space-y-2">
                <CardTitle className="text-2xl font-bold">Learner Package</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Perfect for individuals looking to build digital skills
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 mt-6 space-y-6">
                {/* Price Section */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">100</span>
                    <span className="text-muted-foreground">cedis/year</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Lifetime access to all courses
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">Access to all courses</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">Learn at your own pace</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">Community support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">In-Demand Digital Skills</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">Continuous Growth</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-0 mt-6">
                <Button className="w-full py-6 text-lg bg-[#ed874a] hover:bg-[#ed874a]/90 text-white" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Digital Cashflow System Package */}
            <Card className="relative overflow-hidden transition-all bg-transparent border border-gray-200 p-6 hover:shadow-lg ring-2 ring-[#ed874a]">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ed874a] to-[#ed874a]/50" />
              
              {/* Popular Badge */}
              <div className="absolute top-2 right-6 z-20">
                <span className="bg-[#ed874a] text-white px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-lg">
                  Popular
                </span>
              </div>

              <CardHeader className="p-0 space-y-2">
                <CardTitle className="text-2xl font-bold">Digital Cashflow System</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Learn and earn with our complete affiliate system
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 mt-6 space-y-6">
                {/* Price Section */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">180</span>
                    <span className="text-muted-foreground">cedis/year</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Everything in Learner Package + affiliate features
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">Everything in Learner Package</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">Affiliate dashboard access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">Earn 80% commission on learner package</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">20% yearly recurring commission eligibility</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">Marketing materials provided</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-700">Real-time earnings tracking</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-0 mt-6">
                <Button className="w-full py-6 text-lg bg-[#ed874a] hover:bg-[#ed874a]/90 text-white" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Affiliate Program Section */}
      <section className="py-20 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Partner With DigiAfriq
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join our thriving affiliate community and turn your network into a sustainable income stream. Earn generous commissions while helping others transform their careers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Partner Image with Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="/partner.jpg" 
                  alt="DigiAfriq Affiliate Partners - Success and Growth"
                  className="w-full h-auto object-cover"
                />
                {/* Overlay with Stats */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
                  <div className="p-8 w-full">
                    <div className="grid grid-cols-3 gap-4 text-white">
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">1000+</div>
                        <div className="text-sm opacity-90">Active Partners</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">80%</div>
                        <div className="text-sm opacity-90">commission</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">95%</div>
                        <div className="text-sm opacity-90">Success Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating Decorative Elements */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 w-16 h-16 bg-[#ed874a]/20 rounded-2xl blur-xl"
              />
              <motion.div
                animate={{
                  y: [0, 20, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-6 -left-6 w-20 h-20 bg-[#d76f32]/20 rounded-full blur-xl"
              />
            </motion.div>

            {/* Right Column - Benefits & CTA */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#ed874a] to-[#d76f32] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Generous Commissions</h3>
                    <p className="text-gray-600 leading-relaxed">Earn 100 cedis for every successful referral. Keep 80% of your commissions with no hidden fees or deductions.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#ed874a] to-[#d76f32] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Marketing Resources</h3>
                    <p className="text-gray-600 leading-relaxed">Get access to professional marketing materials, social media content, and proven strategies to maximize your success.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#ed874a] to-[#d76f32] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Analytics</h3>
                    <p className="text-gray-600 leading-relaxed">Monitor your referrals, track your earnings, and get paid promptly with our transparent affiliate dashboard.</p>
                  </div>
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center"
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-[#ed874a] to-[#d76f32] hover:from-[#d76f32] hover:to-[#ed874a] text-white font-bold py-4 px-8 shadow-lg transform hover:scale-105 transition-all duration-300"
                  asChild
                >
                  <Link href="/join/dcs-affiliate">
                    Become a Partner
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Success Stories from Africa
            </h2>
            <p className="text-lg text-gray-600">
              Real results from real people across the continent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full shadow-lg border-0 bg-transparent border border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        {testimonial.location}
                      </div>
                    </div>
                    <CardDescription className="text-gray-700 text-base italic leading-relaxed mb-4">
                      &ldquo;{testimonial.content}&rdquo;
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-[#ed874a]/10 rounded-full flex items-center justify-center mr-3">
                        <span className="font-semibold text-[#ed874a]">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              See some of the questions people are asking.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Illustration */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center lg:justify-start"
            >
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-[#ed874a]/10 to-[#d76f32]/10 rounded-full flex items-center justify-center">
                  <div className="w-60 h-60 bg-[#ed874a] rounded-full flex items-center justify-center relative overflow-hidden">
                    <span className="text-white text-8xl font-bold">?</span>
                    {/* Decorative elements */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/20 rounded-full"></div>
                    <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-white/20 rounded-full"></div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute top-8 right-8 w-8 h-8 bg-[#ed874a]/20 rounded-lg rotate-12"></div>
                <div className="absolute bottom-12 left-4 w-6 h-6 bg-[#d76f32]/30 rounded-full"></div>
                <div className="absolute top-1/2 -left-8 w-4 h-4 bg-[#ed874a]/40 rounded-full"></div>
              </div>
            </motion.div>

            {/* Right Column - FAQ Items */}
            <div className="space-y-4">
              {[
                {
                  question: "What is Digiafriq?",
                  answer: "Digiafriq is an online learning platform built to help Africans learn in-demand digital skills and, if they choose, earn income through our affiliate and reseller opportunities."
                },
                {
                  question: "Who is Digiafriq for?",
                  answer: "Digiafriq is for beginners, students, professionals, entrepreneurs, and anyone who wants to learn practical digital skills and explore online income opportunities. No prior experience is required."
                },
                {
                  question: "How does learning work on Digiafriq?",
                  answer: "Once you join Digiafriq, you get instant access to a growing library of quality courses. You can learn at your own pace, on any device, anytime."
                },
                {
                  question: "Can I earn money on Digiafriq?",
                  answer: "Yes. Digiafriq offers an optional affiliate and reseller program that allows members to earn commissions by promoting Digiafriq products. Learning comes first — earning is an added opportunity."
                },
                {
                  question: "Do you issue certificates after course completion?",
                  answer: "No. At the moment, Digiafriq does not issue certificates. Our focus is on practical skills, real knowledge, and hands-on learning that you can apply immediately."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <details className="group bg-gray-50 rounded-lg border border-gray-200 hover:border-[#ed874a]/30 transition-colors">
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#ed874a] transition-colors">
                        {faq.question}
                      </h3>
                      <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-[#ed874a] transition-all duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </details>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 mb-6">Still have questions? We&apos;re here to help!</p>
            <Button
              size="lg"
              variant="outline"
              className="border-[#ed874a] text-[#ed874a] hover:bg-[#ed874a] hover:text-white px-8 py-3"
              asChild
            >
              <Link href="/contact">
                <HelpCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Latest Blog Section */}
      <section id="blog" className="py-20 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Latest from Our Blog
            </h2>
            <p className="text-lg text-gray-600">
              Stay updated with the latest insights, tips, and success stories from the digital world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                date: "16 Sep 2025",
                title: "Make money as International Students",
                excerpt: "Studying abroad is exciting—but it can also be expensive. Between tuition, accommodation, food, and...",
                image: "/blog/international-students.jpg",
                slug: "make-money-as-international-students"
              },
              {
                date: "16 Jun 2025",
                title: "The UMM Super Win Challenge is HERE! 🎯 💖",
                excerpt: "Are you ready to turn your hustle into massive wins? 💰 This is your chance to show up, sell hard,...",
                image: "/blog/umm-super-win-challenge.jpg",
                slug: "umm-super-win-challenge"
              },
              {
                date: "12 Dec 2024",
                title: "Introducing the BIG FISH CHALLENGE: Your Path to...",
                excerpt: "Big Fish Challenge: Transform Your Success Story body { font-family: Ari...",
                image: "/blog/big-fish-challenge.jpg",
                slug: "big-fish-challenge"
              }
            ].map((post, index) => (
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
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                        <div className="flex items-center text-sm text-[#ed874a] font-medium">
                          <Clock className="w-3 h-3 mr-1" />
                          {post.date}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-[#ed874a] transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
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
            ))}
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
              className="bg-[#ed874a] hover:bg-[#d76f32] text-white px-8 py-3"
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
    </div>
  )
}