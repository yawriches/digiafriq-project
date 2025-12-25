"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DollarSign, 
  BarChart3, 
  FileText, 
 
  Shield, 
  UserPlus,
  Link as LinkIcon,
  Share2,
  CreditCard,
  TrendingUp,
  Star,
  CheckCircle,
  AlertTriangle,
  Quote,
  ChevronDown,
  Target,
  Award,
  Zap,
  Globe
} from "lucide-react"

const benefits = [
  {
    icon: DollarSign,
    title: "High Commissions",
    description: "Earn 100 Cedis for every successful learner referral with no caps or limits",
    highlight: "100 Cedis per sale"
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description: "Track your clicks, conversions, and earnings with detailed analytics",
    highlight: "Live tracking"
  },
  {
    icon: FileText,
    title: "Marketing Support",
    description: "Access professional graphics, copy, and proven promotional strategies",
    highlight: "Ready-made materials"
  },
  {
    icon: Globe,
    title: "Growing Community",
    description: "Join a network of successful affiliates across 20+ African countries",
    highlight: "15,000+ members"
  },
  {
    icon: Shield,
    title: "Trusted Payouts",
    description: "Secure, reliable payments with transparent tracking and no hidden fees",
    highlight: "Weekly payments"
  },
  {
    icon: Zap,
    title: "Lifetime Access",
    description: "One-time setup fee gives you permanent affiliate status with no renewals",
    highlight: "No recurring fees"
  }
]

const steps = [
  {
    step: "01",
    title: "Sign Up",
    description: "Pay a one-time setup fee of 70 Cedis and get approved within 24-48 hours",
    icon: UserPlus,
    details: "Quick approval process with dedicated onboarding support"
  },
  {
    step: "02",
    title: "Get Your Link",
    description: "Access your unique referral link and professional affiliate dashboard",
    icon: LinkIcon,
    details: "Personalized tracking links and comprehensive analytics tools"
  },
  {
    step: "03",
    title: "Promote",
    description: "Share DigiAfriq courses using our ready-made marketing materials",
    icon: Share2,
    details: "Professional graphics, email templates, and social media content"
  },
  {
    step: "04",
    title: "Earn",
    description: "Receive 100 Cedis for every successful learner who purchases through your link",
    icon: DollarSign,
    details: "Transparent commission structure with real-time tracking"
  },
  {
    step: "05",
    title: "Get Paid",
    description: "Track and withdraw earnings securely with weekly payout processing",
    icon: CreditCard,
    details: "Multiple payment options with detailed earning reports"
  }
]

const earningsExamples = [
  { referrals: 5, earnings: 500, timeframe: "month" },
  { referrals: 10, earnings: 1000, timeframe: "month" },
  { referrals: 20, earnings: 2000, timeframe: "month" }
]

const testimonials = [
  {
    name: "Kwame Asante",
    location: "Accra, Ghana",
    role: "Digital Marketing Affiliate",
    quote: "I&apos;ve earned over 3,000 Cedis in my first 3 months. The marketing materials are professional and the support team is amazing.",
    earnings: "3,000+ Cedis earned"
  },
  {
    name: "Fatima Ibrahim",
    location: "Lagos, Nigeria",
    role: "Part-time Affiliate",
    quote: "As a working professional, I love that I can promote DigiAfriq in my spare time. The dashboard makes tracking so easy.",
    earnings: "1,500+ Cedis earned"
  },
  {
    name: "David Mwangi",
    location: "Nairobi, Kenya",
    role: "Full-time Affiliate",
    quote: "DigiAfriq changed my life. I started as a learner, became an affiliate, and now this is my main income source.",
    earnings: "5,000+ Cedis earned"
  }
]

const faqs = [
  {
    question: "Do I earn by recruiting other affiliates?",
    answer: "No, absolutely not. You only earn commissions from real learner sign-ups who purchase courses. This is not a multi-level marketing scheme - your earnings come exclusively from direct course sales."
  },
  {
    question: "When do I get paid?",
    answer: "Payouts are processed weekly after verification of course sales. You can track your earnings in real-time through your affiliate dashboard and withdraw funds once they&apos;re confirmed."
  },
  {
    question: "Can I be both a Learner and an Affiliate?",
    answer: "Yes! In fact, we encourage it. You can start as a learner to experience our courses firsthand, then upgrade to become an affiliate. This authentic experience makes you a more effective promoter."
  }
]

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-[#ed874a] to-[#d76f32] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-8">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Earn While You Share Knowledge
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join the DigiAfriq Affiliate Program and earn 100 Cedis for every learner you refer.
            </p>
            <Button
              size="lg"
              className="bg-white text-[#ed874a] hover:bg-gray-50 font-bold py-4 px-10 text-lg shadow-xl"
              asChild
            >
              <Link href="/signup?type=affiliate">
                Join the Affiliate Program
                <Award className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <p className="text-white/80 text-sm mt-4">
              One-time setup fee • Lifetime access • Weekly payouts
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Join DigiAfriq Affiliates?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Become part of Africa&apos;s fastest-growing digital education affiliate network
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-[#ed874a]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#ed874a]/20 transition-colors">
                      <benefit.icon className="w-8 h-8 text-[#ed874a]" />
                    </div>
                    <CardTitle className="text-xl font-semibold mb-2">{benefit.title}</CardTitle>
                    <div className="inline-block bg-[#ed874a]/10 text-[#ed874a] px-3 py-1 rounded-full text-sm font-medium mb-3">
                      {benefit.highlight}
                    </div>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in 5 simple steps and begin earning within days
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, index) => (
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
              Your Earning Potential
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what you could earn based on successful referrals
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
                <Card className="text-center border-2 border-[#ed874a]/20 hover:border-[#ed874a]/40 transition-colors duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#ed874a] to-[#d76f32]"></div>
                  <CardHeader className="pb-4 pt-8">
                    <div className="text-4xl font-bold text-[#ed874a] mb-2">
                      {example.referrals}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">successful referrals</div>
                    <div className="text-3xl font-bold text-gray-900">
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
                <h3 className="font-semibold text-yellow-800 mb-2">Earnings Disclaimer</h3>
                <p className="text-yellow-700 text-sm leading-relaxed">
                  These figures are for illustration purposes only. Your actual earnings depend on the number of learners you successfully refer. 
                  Results may vary based on your marketing efforts, audience, and market conditions. Success requires dedication and consistent effort.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Success Stories from Our Affiliates
            </h2>
            <p className="text-lg text-gray-600">
              Real results from real people across Africa
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full shadow-lg border-0 relative">
                  <div className="absolute top-4 right-4">
                    <Quote className="w-8 h-8 text-[#ed874a]/20" />
                  </div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {testimonial.earnings}
                      </div>
                    </div>
                    <CardDescription className="text-gray-700 text-base italic leading-relaxed mb-4">
                      &quot;{testimonial.quote}&quot;
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
                        <div className="text-xs text-gray-500">{testimonial.location}</div>
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
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
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
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#ed874a] to-[#d76f32]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start Earning Today
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Turn your network into an income stream while helping others gain valuable digital skills.
            </p>

            <Button
              size="lg"
              className="bg-white text-[#ed874a] hover:bg-gray-50 font-bold py-4 px-10 text-lg shadow-xl mb-6"
              asChild
            >
              <Link href="/signup?type=affiliate">
                Join the Affiliate Program
                <Award className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-white/80 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>One-time 70 Cedis setup</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>100 Cedis per referral</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Weekly payouts</span>
              </div>
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
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-[#ed874a]" />
              <span className="text-[#ed874a] font-semibold">Transparency & Compliance</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-4xl mx-auto">
              Affiliate earnings come only from verified course sales to real students. DigiAfriq is an educational platform 
              focused on providing genuine digital skills training, not a multi-level marketing (MLM) scheme or investment opportunity. 
              All commissions are based on actual course purchases by legitimate learners.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
