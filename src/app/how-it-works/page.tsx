"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  UserPlus, 
  BookOpen, 
  Trophy, 
  Users, 
  Link as LinkIcon, 
  Share2, 
  DollarSign, 
  CreditCard,
  CheckCircle,
  AlertTriangle,
  HeadphonesIcon,
  FileText,
  MessageCircle,
  ArrowRight,
  GraduationCap,
  Target,
  TrendingUp,
  Shield
} from "lucide-react"

const learnerSteps = [
  {
    step: "01",
    title: "Sign Up",
    description: "Create your account and pay 100 Cedis yearly for unlimited access",
    icon: UserPlus,
    details: "Quick registration process with secure payment options"
  },
  {
    step: "02", 
    title: "Access Courses",
    description: "Unlock all courses instantly across digital marketing, web development, and more",
    icon: BookOpen,
    details: "50+ high-quality courses available immediately"
  },
  {
    step: "03",
    title: "Learn & Apply",
    description: "Build real skills with hands-on projects and practical assignments",
    icon: Trophy,
    details: "Learn at your own pace with lifetime access"
  },
  {
    step: "04",
    title: "Join Affiliate Program (Optional)",
    description: "Become an affiliate to earn while helping others learn",
    icon: Users,
    details: "Optional opportunity to monetize your learning journey"
  }
]

const affiliateSteps = [
  {
    step: "01",
    title: "Become a Learner",
    description: "Pay one-time setup fee of 70 Cedis and get approved as an affiliate",
    icon: GraduationCap,
    details: "Must be an active learner to promote authentic experiences"
  },
  {
    step: "02",
    title: "Get Your Dashboard",
    description: "Receive unique affiliate link and access to real-time tracking dashboard",
    icon: LinkIcon,
    details: "Professional tools to monitor your referrals and earnings"
  },
  {
    step: "03",
    title: "Share & Promote",
    description: "Use provided marketing materials to share DigiAfriq with your network",
    icon: Share2,
    details: "Professional graphics, copy, and promotional content provided"
  },
  {
    step: "04",
    title: "Earn Commissions",
    description: "Receive 100 Cedis for every successful course sale you refer",
    icon: DollarSign,
    details: "Transparent commission structure with no hidden fees"
  },
  {
    step: "05",
    title: "Get Paid",
    description: "Weekly payouts directly to your account with full earnings tracking",
    icon: CreditCard,
    details: "Reliable payment system with detailed reporting"
  }
]

const earningsExamples = [
  { sales: 5, earnings: 500, timeframe: "month" },
  { sales: 10, earnings: 1000, timeframe: "month" },
  { sales: 20, earnings: 2000, timeframe: "month" }
]

const supportResources = [
  {
    title: "Marketing Materials",
    description: "Professional graphics, banners, and copy for your promotions",
    icon: FileText
  },
  {
    title: "Community Access",
    description: "Join our active community of learners and successful affiliates",
    icon: MessageCircle
  },
  {
    title: "Customer Support",
    description: "Dedicated support team to help you succeed every step of the way",
    icon: HeadphonesIcon
  }
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-[#ed874a]/5 to-[#d76f32]/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              How DigiAfriq Works
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              DigiAfriq empowers Africans with practical digital skills through comprehensive online courses. 
              Our platform also offers an optional affiliate program for learners who want to earn while helping others succeed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* For Learners Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ed874a]/10 rounded-full mb-6">
              <BookOpen className="w-8 h-8 text-[#ed874a]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              For Learners – How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start your digital transformation journey with unlimited access to all our courses
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {learnerSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ed874a] to-[#d76f32]"></div>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-[#ed874a]/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                      <step.icon className="w-8 h-8 text-[#ed874a]" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#ed874a] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{step.step}</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-semibold mb-2">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-gray-600 mb-4 leading-relaxed">
                      {step.description}
                    </CardDescription>
                    <p className="text-sm text-gray-500 italic">
                      {step.details}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Affiliates Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ed874a]/10 rounded-full mb-6">
              <Target className="w-8 h-8 text-[#ed874a]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              For Affiliates – How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Turn your learning journey into earning opportunities by helping others discover DigiAfriq
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {affiliateSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ed874a] to-[#d76f32]"></div>
                  <CardHeader className="text-center pb-4">
                    <div className="w-14 h-14 bg-[#ed874a]/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                      <step.icon className="w-6 h-6 text-[#ed874a]" />
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#ed874a] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{step.step}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg font-semibold mb-2">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-gray-600 mb-3 leading-relaxed text-sm">
                      {step.description}
                    </CardDescription>
                    <p className="text-xs text-gray-500 italic">
                      {step.details}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Example Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ed874a]/10 rounded-full mb-6">
              <TrendingUp className="w-8 h-8 text-[#ed874a]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Earnings Example
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See the potential earnings based on successful referrals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {earningsExamples.map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center border-2 border-[#ed874a]/20 hover:border-[#ed874a]/40 transition-colors duration-300">
                  <CardHeader className="pb-4">
                    <div className="text-3xl font-bold text-[#ed874a] mb-2">
                      {example.sales} sales
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {example.earnings} Cedis
                    </div>
                    <CardDescription className="text-gray-600">
                      per {example.timeframe}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Important Disclaimer</h3>
                <p className="text-yellow-700 text-sm leading-relaxed">
                  These figures are for illustration purposes only. Your actual earnings depend on the number of successful referrals you generate. 
                  Past performance does not guarantee future results. Success requires effort, dedication, and effective promotion.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What You&apos;re Promoting Section */}
      <section className="py-20 bg-gradient-to-r from-[#ed874a]/5 to-[#d76f32]/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ed874a]/10 rounded-full mb-6">
              <Shield className="w-8 h-8 text-[#ed874a]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              What You&apos;re Promoting
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Real Educational Value
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">50+ comprehensive digital skills courses</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Practical, hands-on learning experiences</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Lifetime access and regular updates</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Community support and mentorship</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-[#ed874a]/10 rounded-lg p-6">
                    <h4 className="font-semibold text-[#ed874a] mb-3 text-lg">
                      Important Note
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>Commissions are earned from real course sales, not recruitment.</strong> 
                      You&apos;re promoting genuine educational content that provides real value to learners across Africa.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Support & Resources Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Support & Resources
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide everything you need to succeed as a DigiAfriq affiliate
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {supportResources.map((resource, index) => (
              <motion.div
                key={resource.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-[#ed874a]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <resource.icon className="w-8 h-8 text-[#ed874a]" />
                    </div>
                    <CardTitle className="text-xl font-semibold">{resource.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {resource.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-20 bg-gradient-to-r from-[#ed874a] to-[#d76f32]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Choose your path and begin your journey with DigiAfriq today
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Button
                  size="lg"
                  className="w-full bg-white text-[#ed874a] hover:bg-gray-50 font-semibold py-4 px-8 text-lg"
                  asChild
                >
                  <Link href="/signup">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Start Learning
                  </Link>
                </Button>
                <p className="text-white/80 text-sm mt-2">100 Cedis/year • All courses included</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white text-white hover:bg-white hover:text-[#ed874a] font-semibold py-4 px-8 text-lg"
                  asChild
                >
                  <Link href="/affiliate">
                    <Users className="w-5 h-5 mr-2" />
                    Join Affiliate Program
                  </Link>
                </Button>
                <p className="text-white/80 text-sm mt-2">70 Cedis setup • Earn 100 Cedis per sale</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Transparency & Compliance Footer */}
      <section className="py-8 bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-gray-400 text-sm leading-relaxed max-w-4xl mx-auto">
              <strong className="text-gray-300">Transparency & Compliance:</strong> DigiAfriq is an educational platform focused on providing real digital skills training. 
              Affiliate commissions are earned exclusively from genuine course sales, not from recruitment or investment activities. 
              This is not a multi-level marketing (MLM) scheme or investment opportunity. All earnings are based on actual course purchases by real students.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
