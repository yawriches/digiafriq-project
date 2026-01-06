"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Star, CheckCircle, ArrowRight, BookOpen, Award, Target } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface Course {
  title: string
  description: string
  icon: any
  duration: string
  level: string
  image: string
}

interface CourseDetailsModalProps {
  course: Course | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const courseDetails: Record<string, {
  fullDescription: string
  learningOutcomes: string[]
  modules: string[]
  prerequisites: string
  students: number
  rating: number
  instructor: string
}> = {
  "Graphic Design": {
    fullDescription: "Transform your creative vision into stunning visual designs. This comprehensive course covers everything from fundamental design principles to advanced techniques used by professional designers. You'll master industry-standard tools and create a portfolio that showcases your skills.",
    learningOutcomes: [
      "Master Adobe Creative Suite (Photoshop, Illustrator, InDesign)",
      "Create professional logos, branding materials, and marketing collateral",
      "Understand color theory, typography, and composition",
      "Design for both print and digital media",
      "Build a professional portfolio to attract clients",
      "Learn client communication and project management"
    ],
    modules: [
      "Design Fundamentals & Principles",
      "Adobe Photoshop Mastery",
      "Adobe Illustrator Essentials",
      "Typography & Color Theory",
      "Logo Design & Branding",
      "Print & Digital Design",
      "Portfolio Development",
      "Freelancing & Client Management"
    ],
    prerequisites: "No prior experience required. Basic computer skills needed.",
    students: 8500,
    rating: 4.8,
    instructor: "Sarah Mensah"
  },
  "Mini Importation": {
    fullDescription: "Launch your own profitable import business with minimal capital. Learn proven strategies to source products from international suppliers, navigate customs, and sell for profit in African markets. This practical course is designed for aspiring entrepreneurs.",
    learningOutcomes: [
      "Identify profitable products and reliable suppliers",
      "Navigate international shipping and customs clearance",
      "Calculate costs, pricing, and profit margins",
      "Set up online and offline sales channels",
      "Manage inventory and cash flow effectively",
      "Scale your import business sustainably"
    ],
    modules: [
      "Introduction to Mini Importation",
      "Product Research & Selection",
      "Finding Reliable Suppliers",
      "Shipping & Logistics",
      "Customs & Documentation",
      "Pricing & Profit Calculation",
      "Sales & Marketing Strategies",
      "Business Scaling & Growth"
    ],
    prerequisites: "Basic business understanding. Small starting capital recommended.",
    students: 6200,
    rating: 4.7,
    instructor: "Kwame Osei"
  },
  "Digital Marketing": {
    fullDescription: "Master the art and science of digital marketing in today's connected world. From SEO and social media to content marketing and analytics, you'll learn how to create campaigns that drive real results and grow businesses online.",
    learningOutcomes: [
      "Develop comprehensive digital marketing strategies",
      "Master SEO and rank websites on Google",
      "Create engaging social media campaigns",
      "Run profitable Facebook and Google Ads",
      "Build email marketing funnels that convert",
      "Analyze data and optimize campaign performance"
    ],
    modules: [
      "Digital Marketing Fundamentals",
      "Search Engine Optimization (SEO)",
      "Social Media Marketing",
      "Content Marketing Strategy",
      "Facebook & Instagram Advertising",
      "Google Ads & PPC",
      "Email Marketing & Automation",
      "Analytics & Performance Tracking"
    ],
    prerequisites: "No prior experience required. Active social media presence helpful.",
    students: 12000,
    rating: 4.9,
    instructor: "Amina Hassan"
  },
  "No Code Web Development": {
    fullDescription: "Build professional, responsive websites without writing a single line of code. Using modern no-code platforms, you'll create stunning websites for clients or your own business. Perfect for entrepreneurs and aspiring web designers.",
    learningOutcomes: [
      "Build responsive websites using no-code tools",
      "Master platforms like Webflow, Wix, and WordPress",
      "Design user-friendly interfaces and experiences",
      "Integrate payment systems and forms",
      "Optimize websites for SEO and performance",
      "Launch and maintain client websites"
    ],
    modules: [
      "Introduction to No-Code Development",
      "Website Planning & Design",
      "Webflow Fundamentals",
      "WordPress Essentials",
      "Responsive Design Principles",
      "E-commerce Integration",
      "SEO & Performance Optimization",
      "Client Projects & Freelancing"
    ],
    prerequisites: "No coding experience required. Basic computer skills needed.",
    students: 9800,
    rating: 4.8,
    instructor: "David Adeyemi"
  }
}

export function CourseDetailsModal({ course, open, onOpenChange }: CourseDetailsModalProps) {
  if (!course) return null

  const details = courseDetails[course.title]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="relative w-full h-64 -mt-6 -mx-6 mb-4 overflow-hidden rounded-t-lg">
            <img 
              src={course.image} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <Badge className="mb-2 bg-white/90 text-gray-900 hover:bg-white">
                {course.level}
              </Badge>
              <DialogTitle className="text-3xl font-bold text-white mb-2">
                {course.title}
              </DialogTitle>
              <DialogDescription className="text-white/90 text-base">
                {course.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold text-gray-900">{details.rating}</span>
              </div>
              <p className="text-xs text-gray-600">Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-5 h-5 text-[#ed874a]" />
                <span className="font-bold text-gray-900">{details.students.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-600">Students</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-5 h-5 text-[#ed874a]" />
                <span className="font-bold text-gray-900">{course.duration}</span>
              </div>
              <p className="text-xs text-gray-600">Duration</p>
            </div>
          </div>

          {/* Full Description */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#ed874a]" />
              About This Course
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {details.fullDescription}
            </p>
          </div>

          {/* Learning Outcomes */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#ed874a]" />
              What You'll Learn
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {details.learningOutcomes.map((outcome, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-2"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{outcome}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Course Modules */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#ed874a]" />
              Course Modules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {details.modules.map((module, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#ed874a] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{module}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites & Instructor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-br from-[#fef3e8] to-white rounded-lg border border-[#ed874a]/20">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Prerequisites</h4>
              <p className="text-sm text-gray-700">{details.prerequisites}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Instructor</h4>
              <p className="text-sm text-gray-700">{details.instructor}</p>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
