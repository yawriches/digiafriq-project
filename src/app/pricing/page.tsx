"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Check, 
  X, 
  BookOpen, 
  Users, 
  Star, 
  Shield, 
  TrendingUp,
  BarChart3,
  FileText,
  MessageCircle,
  Clock,
  Zap,
  ChevronDown,
  HelpCircle,
  Award,
  Target
} from "lucide-react"

const learnerFeatures = [
  "Unlimited access to all DigiAfriq courses",
  "50+ comprehensive digital skills courses",
  "Yearly renewal for continuous learning",
  "Skill-building for personal and professional growth",
  "Mobile app access for learning on-the-go",
  "Community support and forums",
  "Certificates of completion",
  "Option to upgrade to Affiliate at any time"
]

const affiliateFeatures = [
  "100 Cedis commission per successful referral",
  "Real-time dashboard for tracking sales and payouts",
  "Access to professional marketing materials",
  "Community and support resources",
  "Weekly payout processing",
  "Lifetime affiliate access (no renewal needed)",
  "Dedicated affiliate support team",
  "Performance analytics and insights"
]

const comparisonData = [
  {
    feature: "Course Access",
    learner: true,
    affiliate: false,
    description: "Full access to all courses and learning materials"
  },
  {
    feature: "Affiliate Dashboard",
    learner: false,
    affiliate: true,
    description: "Real-time tracking of referrals and earnings"
  },
  {
    feature: "Commissions on Referrals",
    learner: false,
    affiliate: "100 Cedis each",
    description: "Earn money for each successful course sale"
  },
  {
    feature: "Marketing Support",
    learner: false,
    affiliate: true,
    description: "Professional graphics, copy, and promotional materials"
  },
  {
    feature: "Community Access",
    learner: true,
    affiliate: true,
    description: "Access to learner and affiliate communities"
  },
  {
    feature: "Renewal Required",
    learner: "Yearly",
    affiliate: "One-time",
    description: "Payment frequency for continued access"
  }
]

const faqData = [
  {
    question: "Can I be both a Learner and an Affiliate?",
    answer: "Yes! Learners can upgrade to become affiliates at any time. In fact, we encourage learners to become affiliates as they can share their authentic learning experience with others."
  },
  {
    question: "Do I need to recruit other affiliates to earn?",
    answer: "No, absolutely not. Commissions are earned exclusively from real course sales to actual students. This is not a multi-level marketing scheme - you earn only from direct course referrals."
  },
  {
    question: "When do affiliates get paid?",
    answer: "Affiliate payouts are processed weekly after verification of course sales. You can track your earnings in real-time through your affiliate dashboard."
  },
  {
    question: "What's included in the marketing materials?",
    answer: "Affiliates receive professional graphics, banners, email templates, social media content, and proven copy that converts. All materials are regularly updated and optimized."
  },
  {
    question: "Is there a minimum payout threshold?",
    answer: "No minimum payout threshold. You'll receive your commissions weekly regardless of the amount, making it easy to start earning immediately."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, learners can cancel their yearly subscription at any time. Affiliates have lifetime access with no recurring fees after the one-time setup."
  }
]

export default function PricingPage() {
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
              Choose the Plan That&apos;s Right for You
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Whether you want to learn new skills or earn income by referring others, DigiAfriq has a plan for you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Learner Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-2 border-gray-200 hover:border-[#ed874a]/30 transition-colors duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <CardHeader className="text-center pb-8 pt-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">Learner Plan</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-blue-600">100</span>
                    <span className="text-xl text-gray-600 ml-1">Cedis</span>
                    <div className="text-sm text-gray-500 mt-1">per year</div>
                  </div>
                  <CardDescription className="text-gray-600">
                    Perfect for individuals ready to master digital skills
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    {learnerFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg"
                    asChild
                  >
                    <Link href="/signup">
                      Start Learning
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Affiliate Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full border-2 border-[#ed874a] hover:border-[#ed874a] transition-colors duration-300 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ed874a] to-[#d76f32]"></div>
                <CardHeader className="text-center pb-8 pt-8">
                  <div className="w-16 h-16 bg-[#ed874a]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-[#ed874a]" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">Affiliate Plan</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#ed874a]">70</span>
                    <span className="text-xl text-gray-600 ml-1">Cedis</span>
                    <div className="text-sm text-gray-500 mt-1">one-time setup fee</div>
                  </div>
                  <CardDescription className="text-gray-600">
                    Earn while helping others discover digital skills
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    {affiliateFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-gradient-to-r from-[#ed874a] to-[#d76f32] hover:from-[#d76f32] hover:to-[#ed874a] text-white font-semibold py-3 text-lg"
                    asChild
                  >
                    <Link href="/affiliate">
                      Join as Affiliate
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Compare Plans Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Compare Plans
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See exactly what&apos;s included in each plan to make the best choice for your goals
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-6 font-semibold text-gray-900">Features</th>
                      <th className="text-center p-6 font-semibold text-blue-600">
                        <div className="flex items-center justify-center space-x-2">
                          <BookOpen className="w-5 h-5" />
                          <span>Learner Plan</span>
                        </div>
                      </th>
                      <th className="text-center p-6 font-semibold text-[#ed874a]">
                        <div className="flex items-center justify-center space-x-2">
                          <Users className="w-5 h-5" />
                          <span>Affiliate Plan</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, index) => (
                      <tr key={index} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="p-6">
                          <div>
                            <div className="font-medium text-gray-900 mb-1">{row.feature}</div>
                            <div className="text-sm text-gray-500">{row.description}</div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          {row.learner === true ? (
                            <Check className="w-6 h-6 text-green-500 mx-auto" />
                          ) : row.learner === false ? (
                            <X className="w-6 h-6 text-gray-300 mx-auto" />
                          ) : (
                            <span className="text-gray-700 font-medium">{row.learner}</span>
                          )}
                        </td>
                        <td className="p-6 text-center">
                          {row.affiliate === true ? (
                            <Check className="w-6 h-6 text-green-500 mx-auto" />
                          ) : row.affiliate === false ? (
                            <X className="w-6 h-6 text-gray-300 mx-auto" />
                          ) : (
                            <span className="text-gray-700 font-medium">{row.affiliate}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ed874a]/10 rounded-full mb-6">
              <HelpCircle className="w-8 h-8 text-[#ed874a]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Get answers to common questions about our pricing and plans
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
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
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands of Africans who are already transforming their lives through digital skills
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
                    Start Learning Today
                  </Link>
                </Button>
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
                    <Target className="w-5 h-5 mr-2" />
                    Become an Affiliate
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Compliance Footer */}
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
              <span className="text-[#ed874a] font-semibold">Trust & Transparency</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-4xl mx-auto">
              DigiAfriq is an educational platform focused on providing real digital skills training. 
              Earnings for affiliates come from verified course sales only, not from recruitment or investment activities. 
              This is not a multi-level marketing (MLM) scheme or investment opportunity. All affiliate commissions are based on actual course purchases by genuine students.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
