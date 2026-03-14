"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, 
  Target, 
  Lightbulb, 
  Users, 
  TrendingUp,
  CheckCircle2,
  Zap,
  Shield,
  Globe
} from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ed874a] mb-4">
              About Digiafriq
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Empowering Africa Through
              <span className="block text-[#ed874a]">AI Skills & Income</span>
            </h1>
            <p className="text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Digiafriq is a skill-to-income platform that empowers individuals across Africa to learn practical AI applications and monetize those skills ethically and sustainably.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-xl p-8 border border-gray-100"
            >
              <div className="w-12 h-12 bg-[#ed874a]/10 rounded-xl flex items-center justify-center mb-5">
                <Target className="w-6 h-6 text-[#ed874a]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                To democratize access to AI education and income opportunities across Africa by providing structured learning programs, proven monetization frameworks, and a supportive community that transforms knowledge into sustainable livelihoods.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-xl p-8 border border-gray-100"
            >
              <div className="w-12 h-12 bg-[#ed874a]/10 rounded-xl flex items-center justify-center mb-5">
                <Lightbulb className="w-6 h-6 text-[#ed874a]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                To become Africa&apos;s leading platform for AI skills development and income generation, creating a future where every African has the opportunity to leverage artificial intelligence for personal and professional growth.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ed874a] mb-3">
              Meet the Founder
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Leadership & Vision
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
              {/* Founder Image */}
              <div className="lg:col-span-2 relative h-80 lg:h-auto">
                <img
                  src="/RichesAdusei.jpg"
                  alt="Riches Adusei - Founder & CEO"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-white/10" />
              </div>

              {/* Founder Info */}
              <div className="lg:col-span-3 p-8 lg:p-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Riches Adusei
                </h3>
                <p className="text-sm text-[#ed874a] font-semibold mb-6">
                  Founder & CEO
                </p>
                <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                  <p>
                    Riches Adusei founded Digiafriq with a clear vision: to bridge the gap between AI education and real income opportunities for Africans. With a deep understanding of both technology and the unique challenges facing African professionals, Riches created a platform that goes beyond traditional learning.
                  </p>
                  <p>
                    His approach combines structured AI skills training with proven monetization frameworks, ensuring that every learner can immediately apply their knowledge to generate sustainable income.
                  </p>
                  <p>
                    Riches believes that AI is not just the future, it&apos;s the present opportunity for Africa to leapfrog traditional development barriers and create wealth through digital skills.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Core Principles
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Practical over theoretical",
                      "Income-focused learning",
                      "Community-driven growth",
                      "Ethical AI application"
                    ].map((principle, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#ed874a] shrink-0" />
                        <span className="text-xs text-gray-700">{principle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ed874a] mb-3">
              What We Offer
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Complete System for Success
            </h2>
            <p className="text-[15px] text-gray-600 max-w-xl mx-auto">
              Everything you need to learn AI skills and turn them into sustainable income.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: "Practical Training",
                description: "Hands-on AI programs designed for real-world application, not just theory."
              },
              {
                icon: TrendingUp,
                title: "Monetization Frameworks",
                description: "Proven strategies and templates to turn your AI skills into income."
              },
              {
                icon: Users,
                title: "Community Support",
                description: "Join a network of ambitious learners building real businesses with AI."
              },
              {
                icon: Shield,
                title: "Trusted Platform",
                description: "No hype, no empty promises. Just proven systems that deliver results."
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-[#ed874a]/30 hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 bg-[#ed874a]/10 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#ed874a]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ed874a] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#d76f32] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
              Ready to Start Your
              <span className="block text-[#ed874a]">AI Income Journey?</span>
            </h2>
            <p className="text-[15px] text-gray-300 max-w-lg mx-auto leading-relaxed">
              Join thousands of Africans already building their future with practical AI skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                className="group bg-white text-gray-900 hover:bg-gray-100 px-7 py-5 rounded-full font-semibold text-sm shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                asChild
              >
                <Link href="/signup" className="flex items-center justify-center">
                  Get Started Now
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/40 bg-white/5 text-white hover:bg-white/15 hover:border-white/60 px-7 py-5 rounded-full font-semibold text-sm backdrop-blur-sm transition-all duration-300"
                asChild
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
