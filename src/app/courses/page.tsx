"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Star, ArrowRight, Users, BookOpen } from "lucide-react"
import Link from "next/link"
import { CourseDetailsModal } from "@/components/CourseDetailsModal"
import { useState } from "react"

const courses = [
  { 
    title: "Graphic Design", 
    description: "Master visual communication and design principles", 
    icon: Star, 
    duration: "8 weeks", 
    level: "Beginner–Advanced", 
    image: "/graphicdesigning.png",
    slug: "graphic-design",
    students: 2340,
    rating: 4.8
  },
  { 
    title: "Mini Importation", 
    description: "Learn import/export business strategies", 
    icon: BookOpen, 
    duration: "6 weeks", 
    level: "Beginner", 
    image: "/miniimportation.png",
    slug: "mini-importation",
    students: 1850,
    rating: 4.7
  },
  { 
    title: "Digital Marketing", 
    description: "SEO, social media, content strategy", 
    icon: Star, 
    duration: "8 weeks", 
    level: "Beginner–Advanced", 
    image: "/digitalmarketing.png",
    slug: "digital-marketing",
    students: 3200,
    rating: 4.9
  },
  { 
    title: "No Code Web Development", 
    description: "Build websites without coding", 
    icon: BookOpen, 
    duration: "10 weeks", 
    level: "Beginner", 
    image: "/nocodeweb.png",
    slug: "no-code-web-development",
    students: 2100,
    rating: 4.6
  },
]

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewDetails = (course: typeof courses[0]) => {
    setSelectedCourse(course)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef3e8] via-white to-[#fef3e8]">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              <span className="text-gray-900">Our</span>
              <br />
              <span className="bg-gradient-to-r from-[#ed874a] via-[#d76f32] to-[#ed874a] bg-clip-text text-transparent">
                Premium Courses
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Unlock your potential with our comprehensive courses designed for the African digital economy. 
              Learn practical skills that create real income opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                size="lg"
                className="bg-[#ed874a] hover:bg-[#d76f32] text-white px-8 py-6 text-lg font-semibold"
                asChild
              >
                <Link href="#courses">
                  Browse Courses
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#ed874a] text-[#ed874a] hover:bg-[#fef3e8] px-8 py-6 text-lg font-semibold"
                asChild
              >
                <Link href="/signup">
                  Get All Access - 100 cedis/year
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Courses Grid */}
      <section id="courses" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Choose Your Learning Path
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each course is designed to give you practical skills that you can immediately apply to start earning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm group">
                  {/* Course Image */}
                  <div className="relative h-64 overflow-hidden rounded-t-lg">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/90 text-gray-900 hover:bg-white">
                        {course.level}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className="flex items-center gap-2 text-white">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{course.rating}</span>
                        <span className="text-sm opacity-90">({course.students.toLocaleString()})</span>
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold mb-2">{course.title}</CardTitle>
                    <CardDescription className="text-gray-600 text-base leading-relaxed">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.duration}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {course.students.toLocaleString()} students
                      </span>
                    </div>
                    
                    <Button 
                      className="w-full bg-[#ed874a] hover:bg-[#d76f32] text-white font-medium py-3"
                      onClick={() => handleViewDetails(course)}
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Card className="max-w-2xl mx-auto border-0 shadow-lg bg-gradient-to-br from-[#ed874a] to-[#d76f32] text-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Get All Courses for One Price</h3>
                <p className="text-white/90 mb-6">
                  Access all our premium courses with a single annual subscription. 
                  Learn at your own pace and unlock your earning potential.
                </p>
                <div className="text-4xl font-bold mb-6">100 Cedis/Year</div>
                <Button
                  size="lg"
                  className="bg-white text-[#ed874a] hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                  asChild
                >
                  <Link href="/signup">
                    Get All Access Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of learners across Africa who are already building their digital skills and creating new income opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[#ed874a] hover:bg-[#d76f32] text-white px-8 py-4 text-lg font-semibold"
              asChild
            >
              <Link href="/signup">
                Start Learning Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#ed874a] text-[#ed874a] hover:bg-[#fef3e8] px-8 py-4 text-lg font-semibold"
              asChild
            >
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Course Details Modal */}
      <CourseDetailsModal 
        course={selectedCourse}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  )
}
