"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Users, Star, CheckCircle, ArrowRight, BookOpen, Target, Award, Play, Download, Calendar, TrendingUp, Globe, Monitor } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

const courseData = {
  "graphic-design": {
    title: "Graphic Design",
    description: "Master visual communication and design principles",
    fullDescription: "Learn the fundamentals of graphic design including color theory, typography, layout design, and visual hierarchy. This comprehensive course covers industry-standard tools like Adobe Photoshop, Illustrator, and InDesign.",
    image: "/graphicdesigning.png",
    icon: Star,
    duration: "8 weeks",
    level: "Beginner–Advanced",
    price: "100",
    currency: "cedis",
    instructor: "Sarah Johnson",
    rating: 4.8,
    students: 2340,
    language: "English",
    certificate: "Yes",
    whatYouLearn: [
      "Master color theory and typography",
      "Create professional logos and branding",
      "Design marketing materials and social media graphics",
      "Use Adobe Creative Suite proficiently",
      "Build a professional portfolio",
      "Understand design principles and visual hierarchy"
    ],
    modules: [
      {
        title: "Introduction to Graphic Design",
        lessons: 8,
        duration: "2 weeks",
        topics: ["Design Principles", "Color Theory", "Typography Basics", "Visual Hierarchy"]
      },
      {
        title: "Adobe Photoshop Mastery",
        lessons: 12,
        duration: "3 weeks", 
        topics: ["Photo Editing", "Layer Management", "Digital Painting", "Photo Manipulation"]
      },
      {
        title: "Adobe Illustrator & Vector Design",
        lessons: 10,
        duration: "2 weeks",
        topics: ["Vector Basics", "Logo Design", "Illustration", "Pattern Design"]
      },
      {
        title: "Brand Identity & Portfolio",
        lessons: 6,
        duration: "1 week",
        topics: ["Brand Guidelines", "Portfolio Creation", "Client Projects", "Freelancing Tips"]
      }
    ],
    requirements: [
      "No prior design experience needed",
      "Computer with internet access",
      "Adobe Creative Suite (free trial available)"
    ]
  },
  "mini-importation": {
    title: "Mini Importation",
    description: "Learn import/export business strategies",
    fullDescription: "Master the art of mini importation and build a profitable international trade business. Learn how to source products from China, UAE, and other countries, navigate customs, and sell for maximum profit.",
    image: "/miniimportation.png",
    icon: Globe,
    duration: "6 weeks",
    level: "Beginner",
    price: "100",
    currency: "cedis",
    instructor: "Michael Chen",
    rating: 4.7,
    students: 1850,
    language: "English",
    certificate: "Yes",
    whatYouLearn: [
      "Identify profitable products for importation",
      "Source products from international suppliers",
      "Navigate customs and shipping procedures",
      "Price products for maximum profit",
      "Build a successful importation business",
      "Market and sell imported products effectively"
    ],
    modules: [
      {
        title: "Introduction to Mini Importation",
        lessons: 6,
        duration: "1 week",
        topics: ["Business Basics", "Market Research", "Product Selection", "Profit Calculation"]
      },
      {
        title: "Sourcing Products Internationally",
        lessons: 10,
        duration: "2 weeks",
        topics: ["Alibaba & AliExpress", "Supplier Verification", "Negotiation", "Quality Control"]
      },
      {
        title: "Shipping & Customs",
        lessons: 8,
        duration: "2 weeks",
        topics: ["Shipping Methods", "Customs Clearance", "Documentation", "Cost Management"]
      },
      {
        title: "Sales & Marketing",
        lessons: 6,
        duration: "1 week",
        topics: ["Online Marketing", "Social Media Sales", "Customer Service", "Business Scaling"]
      }
    ],
    requirements: [
      "Basic business understanding",
      "Computer or smartphone with internet",
      "Initial capital for products (varies)"
    ]
  },
  "digital-marketing": {
    title: "Digital Marketing",
    description: "SEO, social media, content strategy",
    fullDescription: "Become a digital marketing expert with our comprehensive course covering SEO, social media marketing, content strategy, email marketing, and paid advertising. Learn to create effective marketing campaigns that drive results.",
    image: "/digitalmarketing.png",
    icon: TrendingUp,
    duration: "8 weeks",
    level: "Beginner–Advanced",
    price: "100",
    currency: "cedis",
    instructor: "Emma Williams",
    rating: 4.9,
    students: 3200,
    language: "English",
    certificate: "Yes",
    whatYouLearn: [
      "Master SEO and rank websites on Google",
      "Create effective social media strategies",
      "Design compelling content marketing campaigns",
      "Run profitable paid advertising campaigns",
      "Build email marketing automation",
      "Analyze marketing data and optimize campaigns"
    ],
    modules: [
      {
        title: "Digital Marketing Fundamentals",
        lessons: 8,
        duration: "2 weeks",
        topics: ["Marketing Basics", "Consumer Behavior", "Market Research", "Strategy Planning"]
      },
      {
        title: "Search Engine Optimization (SEO)",
        lessons: 12,
        duration: "3 weeks",
        topics: ["Keyword Research", "On-Page SEO", "Link Building", "Technical SEO"]
      },
      {
        title: "Social Media Marketing",
        lessons: 10,
        duration: "2 weeks",
        topics: ["Facebook Marketing", "Instagram Strategy", "LinkedIn Marketing", "Content Creation"]
      },
      {
        title: "Paid Advertising & Analytics",
        lessons: 8,
        duration: "1 week",
        topics: ["Google Ads", "Facebook Ads", "Google Analytics", "ROI Optimization"]
      }
    ],
    requirements: [
      "Basic computer skills",
      "Understanding of social media",
      "Analytical mindset"
    ]
  },
  "no-code-web-development": {
    title: "No Code Web Development",
    description: "Build websites without coding",
    fullDescription: "Create professional websites and web applications without writing a single line of code. Learn to use powerful no-code tools like Webflow, Bubble, and WordPress to build anything from simple landing pages to complex web apps.",
    image: "/nocodeweb.png",
    icon: Monitor,
    duration: "10 weeks",
    level: "Beginner",
    price: "100",
    currency: "cedis",
    instructor: "David Kim",
    rating: 4.6,
    students: 2100,
    language: "English",
    certificate: "Yes",
    whatYouLearn: [
      "Build responsive websites without coding",
      "Create complex web applications using Bubble",
      "Design professional sites with Webflow",
      "Master WordPress for business websites",
      "Integrate payment systems and databases",
      "Launch and maintain no-code projects"
    ],
    modules: [
      {
        title: "No-Code Fundamentals",
        lessons: 8,
        duration: "2 weeks",
        topics: ["No-Code Principles", "Tool Selection", "Project Planning", "Design Basics"]
      },
      {
        title: "Webflow Mastery",
        lessons: 12,
        duration: "3 weeks",
        topics: ["Webflow Basics", "Responsive Design", "CMS Integration", "E-commerce"]
      },
      {
        title: "Bubble App Development",
        lessons: 14,
        duration: "3 weeks",
        topics: ["Bubble Basics", "Database Design", "Workflow Logic", "API Integration"]
      },
      {
        title: "WordPress & Advanced Topics",
        lessons: 10,
        duration: "2 weeks",
        topics: ["WordPress Mastery", "Plugin Development", "Payment Integration", "SEO Optimization"]
      }
    ],
    requirements: [
      "Basic computer skills",
      "Creative thinking",
      "Problem-solving mindset"
    ]
  }
}

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = courseData[params.slug as keyof typeof courseData]

  if (!course) {
    notFound()
  }

  const IconComponent = course.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef3e8] via-white to-[#fef3e8]">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Content */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-[#ed874a]/10 text-[#ed874a]">
                  {course.level}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{course.rating}</span>
                  <span className="text-sm text-gray-500">({course.students.toLocaleString()} students)</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                {course.title}
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                {course.fullDescription}
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5 text-[#ed874a]" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-5 h-5 text-[#ed874a]" />
                  <span>{course.students.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-5 h-5 text-[#ed874a]" />
                  <span>{course.language}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Award className="w-5 h-5 text-[#ed874a]" />
                  <span>Certificate</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-[#ed874a] hover:bg-[#d76f32] text-white px-8 py-6 text-lg font-semibold"
                  asChild
                >
                  <Link href="/signup">
                    Enroll Now - {course.price} {course.currency}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-[#ed874a] text-[#ed874a] hover:bg-[#fef3e8] px-8 py-6 text-lg font-semibold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Preview Course
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#ed874a]/20 rounded-full blur-2xl" />
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#ed874a]/10 rounded-full blur-3xl" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* What You'll Learn */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Target className="w-6 h-6 text-[#ed874a]" />
                    What You'll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {course.whatYouLearn.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[#ed874a] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Course Modules */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <BookOpen className="w-6 h-6 text-[#ed874a]" />
                    Course Content
                  </CardTitle>
                  <CardDescription>
                    {course.modules.reduce((acc, module) => acc + module.lessons, 0)} lessons • {course.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.modules.map((module, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{module.title}</h3>
                        <Badge variant="outline">{module.duration}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {module.lessons} lessons
                      </p>
                      <div className="space-y-2">
                        {module.topics.map((topic, topicIndex) => (
                          <div key={topicIndex} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-1 h-1 bg-[#ed874a] rounded-full" />
                            {topic}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-[#ed874a] rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Info Card */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm sticky top-6">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {course.price} {course.currency}
                    </div>
                    <p className="text-sm text-gray-600">One-time payment</p>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#ed874a]" />
                      <div>
                        <div className="font-medium">Duration</div>
                        <div className="text-sm text-gray-600">{course.duration}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-[#ed874a]" />
                      <div>
                        <div className="font-medium">Students</div>
                        <div className="text-sm text-gray-600">{course.students.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-[#ed874a]" />
                      <div>
                        <div className="font-medium">Certificate</div>
                        <div className="text-sm text-gray-600">Yes, upon completion</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-[#ed874a]" />
                      <div>
                        <div className="font-medium">Language</div>
                        <div className="text-sm text-gray-600">{course.language}</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-[#ed874a] hover:bg-[#d76f32] text-white py-6 text-lg font-semibold mb-3"
                    asChild
                  >
                    <Link href="/signup">
                      Enroll Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-2 border-[#ed874a] text-[#ed874a] hover:bg-[#fef3e8] py-6 text-lg font-semibold"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Syllabus
                  </Button>
                </CardContent>
              </Card>

              {/* Instructor Card */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Your Instructor</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#ed874a] to-[#d76f32] rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {course.instructor.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{course.instructor}</div>
                      <div className="text-sm text-gray-600">Industry Expert</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Experienced professional with years of industry experience and a passion for teaching.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Related Courses */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Courses</h2>
            <p className="text-lg text-gray-600">Explore more courses to expand your skills</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(courseData)
              .filter(([slug]) => slug !== params.slug)
              .slice(0, 3)
              .map(([slug, relatedCourse]) => (
                <Card key={slug} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={relatedCourse.image}
                      alt={relatedCourse.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{relatedCourse.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{relatedCourse.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{relatedCourse.duration}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/courses/${slug}`}>
                          View Details
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}
