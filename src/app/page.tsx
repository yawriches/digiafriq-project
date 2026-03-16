"use client"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Users,
  BookOpen,
  ChevronDown,
  Lightbulb,
  TrendingUp,
  Coins,
  Clock,
  CheckCircle2,
  Star,
  GraduationCap,
  Zap,
  Shield,
} from "lucide-react"
import { useState } from "react"
import { useBlogPosts } from "@/lib/hooks/useBlogPosts"

const stats = [
  { value: "2,500+", label: "Active Learners" },
  { value: "15+", label: "AI Programs" },
  { value: "12", label: "African Countries" },
]

const whyChooseUs = [
  {
    icon: GraduationCap,
    title: "Structured Learning Paths",
    description: "Step-by-step programs designed for real-world application, not just theory.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80",
  },
  {
    icon: Coins,
    title: "Monetization Built-In",
    description: "Every skill you learn comes with a clear pathway to generate income.",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
  },
  {
    icon: Users,
    title: "Community-Driven Growth",
    description: "Join a network of ambitious Africans building real businesses with AI.",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80",
  },
  {
    icon: Shield,
    title: "Trusted & Credible",
    description: "No hype. No empty promises. Just proven systems that deliver results.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  },
]

const processSteps = [
  {
    number: "01",
    title: "Join a Program",
    description: "Begin with the AI Cashflow Program as your foundation for practical AI skills.",
    icon: BookOpen,
  },
  {
    number: "02",
    title: "Learn & Practice",
    description: "Follow structured lessons with hands-on projects designed for real-world application.",
    icon: Lightbulb,
  },
  {
    number: "03",
    title: "Apply & Earn",
    description: "Use your new skills to create services, products, or income opportunities immediately.",
    icon: Zap,
  },
  {
    number: "04",
    title: "Scale & Grow",
    description: "Access advanced tools, systems, and growth programs to scale your income.",
    icon: TrendingUp,
  },
]

const testimonials = [
  {
    name: "Kwame Asante",
    role: "Digital Marketer, Ghana",
    content: "Digiafriq gave me structure and clarity. Within 3 months, I was earning from AI-powered services I never knew I could offer.",
    avatar: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&q=80",
    rating: 5,
  },
  {
    name: "Fatima Suleiman",
    role: "Content Creator, Nigeria",
    content: "The platform feels serious and well thought out. Not hype, just real systems that actually work. My income has tripled.",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&q=80",
    rating: 5,
  },
  {
    name: "Nana Kweku",
    role: "Freelancer, Kenya",
    content: "I started with the AI Cashflow Program and now run a full AI consulting practice. Digiafriq changed my career trajectory.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    rating: 5,
  },
]

const faqs = [
  {
    question: "What is Digiafriq?",
    answer: "Digiafriq is an AI skills and monetization platform focused on practical learning and sustainable income pathways. We help individuals across Africa learn high-demand AI skills and turn them into real income streams.",
  },
  {
    question: "Where do I start?",
    answer: "Most members begin with the AI Cashflow Program, which serves as the platform's recommended entry point. It covers foundational AI skills and provides clear monetization frameworks.",
  },
  {
    question: "Is Digiafriq only for beginners?",
    answer: "No. The platform supports beginners through to advanced learners with different programs and resources for each level. Whether you're just starting or looking to scale, there's a pathway for you.",
  },
  {
    question: "Are the AI tools free?",
    answer: "We use free tools in our courses so beginners can get started instantly. As you scale, you can upgrade to paid tools for enhanced capabilities.",
  },
  {
    question: "Is there a separate membership fee?",
    answer: "Access to Digiafriq's core system is included when you join a qualifying program. There are no hidden fees or surprise charges.",
  },
  {
    question: "How quickly can I start earning?",
    answer: "Many of our members start applying their skills within the first few weeks. The timeline depends on your commitment and the program you choose, but our systems are designed for practical, immediate application.",
  },
  {
    question: "Do I need prior tech experience?",
    answer: "Not at all. Our programs are designed for complete beginners. We guide you step by step through everything you need to know, from basic concepts to advanced monetization strategies.",
  },
]

const spotlightFeatures = [
  "Practical AI skill training modules",
  "Monetization frameworks & templates",
  "Access to community & support",
  "Tools, prompts & workflow resources",
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { posts: blogPosts, loading: blogLoading } = useBlogPosts(3)

  return (
    <div className="min-h-screen bg-white">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO SECTION — Premium, centered, Starlink-inspired */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=85"
            alt="Technology network"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
        </div>

        {/* Centered Content */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[#ed874a] text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-6"
          >
            AI Skills &middot; Real Income &middot; Africa
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold leading-[1.15] tracking-tight text-white"
          >
            Master AI Skills.
            <br />
            <span className="text-[#ed874a]">Build Real Income.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-5 text-[15px] sm:text-base text-gray-300 leading-relaxed max-w-xl mx-auto"
          >
            Structured programs that help thousands of Africans learn practical AI
            skills and turn them into sustainable income streams.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 px-7 py-5 rounded-full font-semibold text-sm shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              asChild
            >
              <Link href="/signup" className="flex items-center">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/5 text-white hover:bg-white/15 hover:border-white/60 px-7 py-5 rounded-full font-semibold text-sm backdrop-blur-sm transition-all duration-300"
              asChild
            >
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </motion.div>

        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ABOUT / WHAT IS DIGIAFRIQ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 relative z-10 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left: Image Grid */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80"
                      alt="Professional woman working with AI"
                      className="w-full h-44 object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&q=80"
                      alt="Team collaboration"
                      className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-6">
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80"
                      alt="Workshop session"
                      className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80"
                      alt="Digital workspace"
                      className="w-full h-44 object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ed874a]">
                About Digiafriq
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
                The Platform That Turns
                <span className="text-[#ed874a]"> AI Skills </span>
                Into Income
              </h2>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Digiafriq empowers individuals across Africa to learn practical AI applications and monetize those skills ethically and sustainably. Structured learning, proven monetization frameworks, and a powerful community.
              </p>
              <div className="space-y-3 pt-1">
                {[
                  "Practical, hands-on AI training programs",
                  "Proven monetization strategies & frameworks",
                  "Tools, templates & resources for immediate application",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#ed874a] mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3">
                <Button
                  className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-5 rounded-full font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5"
                  asChild
                >
                  <Link href="/about" className="flex items-center">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* WHY CHOOSE DIGIAFRIQ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 relative z-10 bg-white">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ed874a] mb-3">
              Why Digiafriq
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Everything You Need to Succeed
            </h2>
            <p className="text-[15px] text-gray-600 max-w-xl mx-auto">
              We don&apos;t just teach AI skills. We give you the complete system to turn knowledge into income.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyChooseUs.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-400 overflow-hidden h-full">
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-[#ed874a]" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-[#ed874a] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AI CASHFLOW PROGRAM SPOTLIGHT */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="ai-cashflow-program" className="py-20 relative z-10 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#ed874a]/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d76f32]/8 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ed874a]">
                Flagship Program
              </p>

              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                Start With the
                <span className="block text-[#ed874a]">AI Cashflow Program</span>
              </h2>

              <p className="text-[15px] text-gray-400 leading-relaxed">
                The AI Cashflow Program is Digiafriq&apos;s flagship entry point — designed to help you learn how AI skills can be applied and monetized in practical ways.
              </p>

              <div className="space-y-2.5">
                {spotlightFeatures.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.2 + i * 0.08 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#ed874a] shrink-0" />
                    <span className="text-sm text-gray-400">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  className="group bg-[#ed874a] hover:bg-[#d76f32] text-white px-6 py-5 rounded-full font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5"
                  asChild
                >
                  <Link href="/ai-cashflow-system" className="flex items-center">
                    Explore the Program
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Right: Program Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                <img
                  src="/ai-cashflow-monitor.png"
                  alt="AI Cashflow Program Dashboard"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 relative z-10 bg-white">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ed874a] mb-3">
              How It Works
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              From Learning to Earning
            </h2>
            <p className="text-[15px] text-gray-600 max-w-xl mx-auto">
              A clear, proven pathway from skill acquisition to sustainable income.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="hidden lg:block absolute top-12 left-[14%] right-[14%] h-px bg-gray-200" />

            {processSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="relative z-10 w-12 h-12 mx-auto mb-5 bg-[#ed874a] rounded-xl flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-white" />
                </div>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-[#ed874a]/20 hover:shadow-md transition-all duration-300 h-full">
                  <span className="text-xs font-semibold text-[#ed874a] mb-1.5 block">Step {step.number}</span>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TESTIMONIALS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 relative z-10 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ed874a] mb-3">
              Testimonials
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Trusted by Learners Across Africa
            </h2>
            <p className="text-[15px] text-gray-600 max-w-xl mx-auto">
              Real stories from real people building real income with AI skills.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#ed874a] text-[#ed874a]" />
                    ))}
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-5 flex-1">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FAQ SECTION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 relative z-10 bg-white">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            {/* Left: Heading & Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ed874a]">
                FAQ
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
                Questions?
                <span className="block text-[#ed874a]">We&apos;ve Got Answers.</span>
              </h2>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Everything you need to know about Digiafriq. Can&apos;t find what you&apos;re looking for? Reach out to our support team.
              </p>
              <div className="relative rounded-xl overflow-hidden hidden lg:block">
                <img
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80"
                  alt="Support team"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <Button
                    variant="outline"
                    className="bg-white/90 backdrop-blur-sm border-white/50 text-gray-900 hover:bg-white text-sm px-5 py-2 rounded-full"
                    asChild
                  >
                    <Link href="/contact">Contact Support</Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Right: FAQ Accordion */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`bg-gray-50 rounded-lg border transition-all duration-300 overflow-hidden cursor-pointer ${
                    openFaq === index ? "border-[#ed874a]/30 shadow-sm" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between p-4">
                    <h3 className="text-sm font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      openFaq === index ? "bg-[#ed874a] text-white rotate-180" : "bg-gray-200 text-gray-500"
                    }`}>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-4 pb-4">
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BLOG SECTION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="blog" className="py-20 relative z-10 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ed874a] mb-3">
              Our Blog
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Latest Insights & Resources
            </h2>
            <p className="text-[15px] text-gray-600 max-w-xl mx-auto">
              Expert insights, tutorials, and success stories from the AI and digital skills world.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
                    <div className="h-44 bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-5 bg-gray-200 rounded" />
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded" />
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              blogPosts.map((post, index) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/blog/${post.slug}`} className="block group">
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:border-[#ed874a]/20 transition-all duration-300 h-full">
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={post.featured_image || '/blog/default-blog.jpg'}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/90 backdrop-blur-sm text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(post.published_at).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#ed874a] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-xs leading-relaxed line-clamp-3 mb-3">
                          {post.excerpt}
                        </p>
                        <span className="inline-flex items-center text-[#ed874a] font-medium text-xs group-hover:gap-1.5 transition-all">
                          Read Article
                          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:border-[#ed874a] hover:text-[#ed874a] px-6 py-4 rounded-full font-semibold text-sm transition-all duration-300"
              asChild
            >
              <Link href="/blog" className="flex items-center">
                View All Articles
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FINAL CTA SECTION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 relative z-10 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1920&q=80"
            alt="Community"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
              Ready to Turn AI Skills
              <span className="block text-[#ed874a]">Into Real Income?</span>
            </h2>
            <p className="text-[15px] text-gray-300 max-w-lg mx-auto leading-relaxed">
              Join thousands of ambitious Africans already building their future with Digiafriq.
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
                <Link href="/contact">Talk to Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
