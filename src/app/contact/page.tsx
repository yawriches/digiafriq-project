"use client"
import { motion } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageCircle, 
  Users, 
  Globe, 
  Headphones, 
  FileText, 
  HelpCircle, 
  ExternalLink, 
  ChevronRight, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  CheckCircle 
} from 'lucide-react'

// const quickLinks = [
//   {
//     title: "Visit our FAQ",
//     description: "Find answers to common questions about courses and affiliate program",
//     href: "/faq",
//     icon: HelpCircle,
//     color: "blue"
//   },
//   {
//     title: "Join our Affiliate Network",
//     description: "Start earning 100 Cedis for every learner you refer",
//     href: "/affiliate",
//     icon: Users,
//     color: "orange"
//   },
//   {
//     title: "Explore Our Courses",
//     description: "Discover 50+ digital skills courses for your career growth",
//     href: "/courses",
//     icon: Globe,
//     color: "green"
//   }
// ]

const socialLinks = [
  { name: "Facebook", href: "#", icon: Facebook, color: "#1877F2" },
  { name: "Instagram", href: "#", icon: Instagram, color: "#E4405F" },
  { name: "LinkedIn", href: "#", icon: Linkedin, color: "#0A66C2" },
  { name: "YouTube", href: "#", icon: Youtube, color: "#FF0000" }
]

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    details: "admin@digiafriq.com",
    description: "We typically respond within 24 hours"
  },
  {
    icon: MapPin,
    title: "Visit Us",
    details: "Kumasi, Ghana",
    description: "Serving learners across Africa"
  }
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitted(true)
    setIsSubmitting(false)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({ name: "", email: "", subject: "", message: "" })
    }, 3000)
  }

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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#ed874a]/10 rounded-full mb-8">
              <MessageCircle className="w-10 h-10 text-[#ed874a]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Get in Touch with Us
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We&apos;d love to hear from you. Whether you&apos;re a learner, affiliate, or partner, reach out anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                    <Send className="w-6 h-6 text-[#ed874a] mr-3" />
                    Send us a Message
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Fill out the form below and we&apos;ll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Name *
                          </label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Your full name"
                            className="border-gray-300 focus:border-[#ed874a] focus:ring-[#ed874a]"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="your.email@example.com"
                            className="border-gray-300 focus:border-[#ed874a] focus:ring-[#ed874a]"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                          Subject *
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="What&apos;s this about?"
                          className="border-gray-300 focus:border-[#ed874a] focus:ring-[#ed874a]"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                          Message *
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Tell us more about your inquiry..."
                          className="border-gray-300 focus:border-[#ed874a] focus:ring-[#ed874a] resize-none"
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-[#ed874a] to-[#d76f32] hover:from-[#d76f32] hover:to-[#ed874a] text-white font-semibold py-3 text-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Thank you!
                      </h3>
                      <p className="text-gray-600">
                        We&apos;ve received your message and will get back to you shortly.
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information & Quick Links */}
            <div className="space-y-8">
              {/* Direct Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Direct Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {contactInfo.map((info, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-[#ed874a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <info.icon className="w-6 h-6 text-[#ed874a]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                          <p className="text-[#ed874a] font-medium mb-1">{info.details}</p>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              

              {/* Social Media Links */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Follow Us
                    </CardTitle>
                    <CardDescription>
                      Stay connected on social media
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4">
                      {socialLinks.map((social) => (
                        <a
                          key={social.name}
                          href={social.href}
                          className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:border-[#ed874a]/30 hover:bg-[#ed874a]/5 transition-all duration-200 group"
                          aria-label={social.name}
                        >
                          <social.icon 
                            className="w-6 h-6 text-gray-600 group-hover:text-[#ed874a] transition-colors" 
                          />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
