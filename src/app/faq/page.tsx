"use client"
import { motion } from "framer-motion"
import { 
  ChevronDown, 
  HelpCircle, 
  BookOpen, 
  Users, 
  CreditCard, 
  Shield,
  Lightbulb,
  GraduationCap,
  Target,
  Lock
} from "lucide-react"

const generalQuestions = [
  {
    question: "What is DigiAfriq?",
    answer: "DigiAfriq is a comprehensive digital learning platform designed specifically for Africans. We provide practical courses in digital marketing, web development, data analytics, and mobile app development. Additionally, we offer an optional affiliate program that allows learners to earn income by helping others discover our educational content."
  },
  {
    question: "How do I get started?",
    answer: "Getting started is simple! Create your account on our platform, choose between our Learner Plan (100 Cedis/year) or Affiliate Plan (70 Cedis one-time setup), and begin your journey. Learners get immediate access to all courses, while affiliates receive their unique referral links and marketing materials."
  }
]

const learnerQuestions = [
  {
    question: "How much does it cost to access courses?",
    answer: "Our Learner Plan costs 100 Cedis per year, giving you unlimited access to all courses on our platform. This includes over 50 comprehensive courses, mobile app access, community support, and certificates of completion."
  },
  {
    question: "Do I need to pay for each course separately?",
    answer: "No! Your yearly Learner Plan gives you complete access to our entire course library. Whether you want to take one course or all 50+, your annual subscription covers everything with no additional fees."
  },
  {
    question: "Will I get a certificate after completing a course?",
    answer: "Yes, you'll receive a certificate of completion for every course you finish. These certificates can be downloaded and shared on your professional profiles like LinkedIn to showcase your new skills to potential employers."
  },
  {
    question: "Are courses self-paced?",
    answer: "Absolutely! All our courses are designed for self-paced learning. You can study anytime, anywhere, and progress through the material at a speed that works for your schedule. Your access never expires during your subscription period."
  },
  {
    question: "Can I access courses on mobile devices?",
    answer: "Yes! Our platform is fully optimized for mobile learning. You can access all courses, track your progress, and even download content for offline viewing through our mobile-friendly interface."
  }
]

const affiliateQuestions = [
  {
    question: "How does the affiliate program work?",
    answer: "Our affiliate program allows you to earn 100 Cedis for every person who purchases a Learner Plan through your unique referral link. You'll receive professional marketing materials, a real-time dashboard to track your referrals, and weekly payouts for verified sales."
  },
  {
    question: "Do I need to recruit other affiliates?",
    answer: "No, absolutely not! This is not a multi-level marketing scheme. You earn commissions exclusively from real course sales to actual students. There's no recruitment involved - you simply share the value of our educational content with others."
  },
  {
    question: "Is there a fee to join the affiliate program?",
    answer: "Yes, there's a one-time setup fee of 70 Cedis to join the affiliate program. This covers your onboarding, access to professional marketing materials, affiliate dashboard, and ongoing support resources."
  },
  {
    question: "When and how do affiliates get paid?",
    answer: "Affiliate payments are processed weekly after sales verification. You can track your earnings in real-time through your affiliate dashboard, and payments are sent directly to your preferred account. There's no minimum payout threshold."
  },
  {
    question: "What marketing materials do you provide?",
    answer: "Affiliates receive a comprehensive marketing toolkit including professional graphics, banners, email templates, social media content, and proven copy that converts. All materials are regularly updated and optimized for better performance."
  }
]

const paymentQuestions = [
  {
    question: "What payment methods do you accept?",
    answer: "We accept various payment methods through our secure payment processor Paystack, including mobile money (MTN Mobile Money, Vodafone Cash, AirtelTigo Money), bank cards (Visa, Mastercard), and direct bank transfers. All payments are processed securely."
  },
  {
    question: "Is my payment information safe?",
    answer: "Yes, your payment security is our top priority. DigiAfriq uses trusted, industry-standard payment processors and never stores your card details on our servers. All transactions are encrypted and processed through secure, PCI-compliant systems."
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer: "We offer a satisfaction guarantee. If you're not happy with your learning experience within the first 30 days, contact our support team to discuss your concerns. We're committed to ensuring you get value from our platform."
  },
  {
    question: "Do prices include taxes?",
    answer: "Yes, all prices displayed are inclusive of any applicable taxes. There are no hidden fees or additional charges beyond the stated subscription or setup fees."
  }
]

interface FAQSectionProps {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  questions: Array<{question: string; answer: string}>
  delay?: number
}

function FAQSection({ title, icon: Icon, questions, delay = 0 }: FAQSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="mb-12"
    >
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-[#ed874a]/10 rounded-full flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#ed874a]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      
      <div className="space-y-4">
        {questions.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: delay + (index * 0.1) }}
          >
            <details className="group bg-white rounded-lg border border-gray-200 hover:border-[#ed874a]/30 transition-colors shadow-sm">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#ed874a] transition-colors pr-4">
                  {faq.question}
                </h3>
                <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-[#ed874a] transition-all duration-200 group-open:rotate-180 flex-shrink-0" />
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
    </motion.div>
  )
}

export default function FAQPage() {
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ed874a]/10 rounded-full mb-6">
              <HelpCircle className="w-8 h-8 text-[#ed874a]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Find quick answers to the most common questions about DigiAfriq, our courses, and the affiliate program.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* General Questions */}
          <FAQSection
            title="General Questions"
            icon={Lightbulb}
            questions={generalQuestions}
            delay={0}
          />

          {/* Learner Questions */}
          <FAQSection
            title="Learner Questions"
            icon={GraduationCap}
            questions={learnerQuestions}
            delay={0.1}
          />

          {/* Affiliate Questions */}
          <FAQSection
            title="Affiliate Questions"
            icon={Target}
            questions={affiliateQuestions}
            delay={0.2}
          />

          {/* Payments & Security */}
          <FAQSection
            title="Payments & Security"
            icon={Lock}
            questions={paymentQuestions}
            delay={0.3}
          />
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="py-16 bg-gradient-to-r from-[#ed874a] to-[#d76f32]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Still Have Questions?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Our support team is here to help you succeed. Get in touch and we&apos;ll respond promptly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-[#ed874a] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Contact Support
              </motion.a>
              <motion.a
                href="/how-it-works"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#ed874a] transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                How It Works
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Compliance & Transparency Footer */}
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
              DigiAfriq is an educational platform focused on providing real digital skills training. 
              Affiliate earnings come from real course sales only, not from recruitment or investment activities. 
              This is not a multi-level marketing (MLM) scheme or investment opportunity.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
