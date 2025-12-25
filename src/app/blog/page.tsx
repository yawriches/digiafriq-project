"use client"
import { motion } from "framer-motion"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Search, 
  Calendar, 
 
  ArrowRight, 
  BookOpen, 
  Lightbulb,
  Star,
  Send
} from "lucide-react"

const categories = [
  { name: "All Posts", slug: "all", count: 24 },
  { name: "Digital Marketing", slug: "digital-marketing", count: 8 },
  { name: "Affiliate Tips", slug: "affiliate-tips", count: 6 },
  { name: "Success Stories", slug: "success-stories", count: 5 },
  { name: "Learning Skills", slug: "learning-skills", count: 5 }
]

const featuredPosts = [
  {
    id: 1,
    title: "How Sarah Built a 6-Figure Digital Marketing Agency in 12 Months",
    excerpt: "From complete beginner to successful agency owner, discover the exact steps Sarah took to transform her career using DigiAfriq's digital marketing course.",
    category: "Success Stories",
    date: "2024-12-15",
    readTime: "8 min read",
    image: "/blog/sarah-success-story.jpg",
    featured: true,
    slug: "sarah-6-figure-agency-success"
  },
  {
    id: 2,
    title: "The Complete Guide to Affiliate Marketing in Africa: 2025 Edition",
    excerpt: "Everything you need to know about starting and scaling an affiliate marketing business in Africa, including legal considerations, payment methods, and proven strategies.",
    category: "Affiliate Tips",
    date: "2024-12-10",
    readTime: "12 min read",
    image: "/blog/affiliate-marketing-africa-guide.jpg",
    featured: true,
    slug: "complete-affiliate-marketing-guide-africa-2025"
  }
]

const blogPosts = [
  {
    id: 3,
    title: "5 Digital Skills Every African Professional Needs in 2025",
    excerpt: "Stay ahead of the curve with these essential digital skills that are transforming careers across Africa. Learn which skills to prioritize and how to get started.",
    category: "Learning Skills",
    date: "2024-12-08",
    readTime: "6 min read",
    image: "/blog/digital-skills-2025.jpg",
    slug: "5-digital-skills-african-professionals-2025"
  },
  {
    id: 4,
    title: "From Student to Affiliate: How to Transition Successfully",
    excerpt: "A step-by-step guide for DigiAfriq learners who want to become successful affiliates. Learn the mindset shifts and practical steps needed for success.",
    category: "Affiliate Tips",
    date: "2024-12-05",
    readTime: "7 min read",
    image: "/blog/student-to-affiliate-transition.jpg",
    slug: "student-to-affiliate-transition-guide"
  },
  {
    id: 5,
    title: "The Psychology of Online Learning: How to Stay Motivated",
    excerpt: "Discover proven psychological techniques to maintain motivation, overcome procrastination, and successfully complete your online courses.",
    category: "Learning Skills",
    date: "2024-12-03",
    readTime: "5 min read",
    image: "/blog/psychology-online-learning.jpg",
    slug: "psychology-online-learning-motivation"
  },
  {
    id: 6,
    title: "Building Trust as an Affiliate: Ethical Marketing Strategies",
    excerpt: "Learn how to build genuine trust with your audience through ethical marketing practices that create long-term success and sustainable income.",
    category: "Affiliate Tips",
    date: "2024-11-30",
    readTime: "9 min read",
    image: "/blog/ethical-affiliate-marketing.jpg",
    slug: "building-trust-ethical-affiliate-marketing"
  },
  {
    id: 7,
    title: "Case Study: How John Earned $5,000 in His First 6 Months",
    excerpt: "Follow John's journey from skeptical beginner to successful affiliate marketer. See the exact strategies, challenges, and breakthroughs that led to his success.",
    category: "Success Stories",
    date: "2024-11-28",
    readTime: "10 min read",
    image: "/blog/john-case-study-5000.jpg",
    slug: "john-case-study-5000-six-months"
  },
  {
    id: 8,
    title: "Social Media Marketing Trends for African Businesses",
    excerpt: "Stay ahead of the competition with the latest social media marketing trends specifically relevant to African markets and consumer behavior.",
    category: "Digital Marketing",
    date: "2024-11-25",
    readTime: "8 min read",
    image: "/blog/social-media-trends-africa.jpg",
    slug: "social-media-marketing-trends-african-businesses"
  },
  {
    id: 9,
    title: "The Art of Content Creation: From Beginner to Pro",
    excerpt: "Master the fundamentals of content creation with this comprehensive guide covering strategy, tools, and techniques used by successful creators.",
    category: "Digital Marketing",
    date: "2024-11-22",
    readTime: "11 min read",
    image: "/blog/content-creation-beginner-pro.jpg",
    slug: "art-of-content-creation-beginner-to-pro"
  }
]

interface BlogCardProps {
  post: typeof blogPosts[0]
  featured?: boolean
}

function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={featured ? "lg:col-span-2" : ""}
    >
      <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <div className={`relative overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-gray-400" />
          </div>
          <div className="absolute top-4 left-4">
            <span className="bg-[#ed874a] text-white px-3 py-1 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>
          {featured && (
            <div className="absolute top-4 right-4">
              <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </span>
            </div>
          )}
        </div>
        
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
          <CardTitle className={`group-hover:text-[#ed874a] transition-colors ${featured ? 'text-2xl' : 'text-xl'} leading-tight`}>
            <Link href={`/blog/${post.slug}`}>
              {post.title}
            </Link>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className={`text-gray-600 leading-relaxed mb-6 ${featured ? 'text-base' : 'text-sm'}`}>
            {post.excerpt}
          </CardDescription>
          <Button 
            variant="ghost" 
            className="text-[#ed874a] hover:text-[#d76f32] hover:bg-[#ed874a]/10 p-0 h-auto font-semibold"
            asChild
          >
            <Link href={`/blog/${post.slug}`} className="flex items-center">
              Read More
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-[#ed874a]/5 to-[#d76f32]/5 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ed874a' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ed874a]/10 rounded-full mb-6">
              <BookOpen className="w-8 h-8 text-[#ed874a]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              DigiAfriq Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Insights, tips, and success stories to help you grow your skills and income.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Categories */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative max-w-md"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search blog posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 border-gray-300 focus:border-[#ed874a] focus:ring-[#ed874a]"
              />
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              {categories.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.slug
                      ? 'bg-[#ed874a] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Articles</h2>
            <p className="text-lg text-gray-600">Don&apos;t miss these popular and trending posts</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {featuredPosts.map((post) => (
              <BlogCard key={post.id} post={post} featured={true} />
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Posts</h2>
            <p className="text-lg text-gray-600">Stay updated with our latest insights and tips</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <BlogCard post={post} />
              </motion.div>
            ))}
          </div>

          {/* Load More Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              variant="outline"
              className="border-[#ed874a] text-[#ed874a] hover:bg-[#ed874a] hover:text-white px-8 py-3"
            >
              Load More Posts
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-r from-[#ed874a] to-[#d76f32]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Stay Updated
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Get the latest insights and tips from DigiAfriq straight to your inbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 bg-white border-0 text-gray-900 placeholder:text-gray-500"
              />
              <Button 
                size="lg"
                className="bg-white text-[#ed874a] hover:bg-gray-50 font-semibold px-8"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-white/80 text-sm mt-4">
              Join 15,000+ subscribers. No spam, unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-8 bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Lightbulb className="w-5 h-5 text-[#ed874a]" />
              <span className="text-[#ed874a] font-semibold">Educational Content</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-4xl mx-auto">
              The DigiAfriq Blog is designed to educate and inspire learners and affiliates. 
              We share only practical, ethical, and transparent strategies that create real value and sustainable success.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
