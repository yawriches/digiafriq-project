"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Globe,
  Calendar,
  User,
  Tag,
  Eye,
  Clock,
  Share2,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  featuredImage: string | null
  tags: string[]
  slug: string
  views: number
  metaTitle: string
  metaDescription: string
}

const BlogPostPreview = () => {
  const router = useRouter()
  const params = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBlogPost = async () => {
      try {
        // Mock data - replace with actual API call
        const mockPost: BlogPost = {
          id: params.id as string,
          title: 'Make money as International Students',
          excerpt: 'Studying abroad is exciting—but it can also be expensive. Between tuition, accommodation, food, and other living expenses, international students often find themselves looking for ways to supplement their income.',
          content: `# Make Money as International Students

Studying abroad is an exciting journey, but it can also be financially challenging. Between tuition fees, accommodation costs, food expenses, and other living costs, international students often find themselves looking for ways to supplement their income.

## Legal Ways to Earn Money

### 1. On-Campus Jobs
Most countries allow international students to work on-campus without additional permits. These jobs include:
- Library assistant
- Campus tour guide
- Research assistant
- Cafeteria staff
- Student services support

### 2. Part-Time Work (Where Permitted)
Many countries allow international students to work part-time with restrictions:
- Usually limited to 20 hours per week during studies
- Full-time during holidays and breaks
- Requires proper work permits in some countries
- Common jobs: retail, hospitality, tutoring

### 3. Freelancing and Online Work
Digital opportunities that can be done from anywhere:
- **Content writing**: Blog posts, articles, copywriting
- **Graphic design**: Logos, social media graphics, web design
- **Tutoring online**: Language teaching, academic subjects
- **Social media management**: Managing accounts for small businesses
- **Web development**: Building websites, apps, maintenance

### 4. Gig Economy
Flexible work opportunities:
- Food delivery (where permitted)
- Ride-sharing (check visa restrictions)
- Task-based work through apps
- Event assistance and promotion

## Financial Management Tips

### Budgeting Strategies
1. **Track your expenses**: Use apps or spreadsheets to monitor spending
2. **Create a monthly budget**: Allocate funds for essentials first
3. **Find student discounts**: Many businesses offer student rates
4. **Cook at home**: Eating out can be expensive
5. **Share accommodation**: Split costs with roommates

### Building an Emergency Fund
- Save at least 10% of any income
- Keep 3-6 months of expenses saved
- Use high-yield savings accounts
- Consider part-time work during breaks

## Tips for Success

1. **Know Your Visa Restrictions**: Always check what work is permitted on your student visa
2. **Time Management**: Balance work with studies effectively - your education comes first
3. **Build Skills**: Use work opportunities to gain valuable experience for your resume
4. **Network**: Connect with other students, professors, and professionals in your field
5. **Save Wisely**: Develop good financial habits that will serve you long-term
6. **Seek Support**: Use university career services and financial aid offices

## Common Mistakes to Avoid

- Working more hours than permitted by your visa
- Neglecting studies for work commitments
- Not reporting income for tax purposes
- Taking jobs that don't align with your career goals
- Spending money as soon as you earn it

## Resources and Support

### University Resources
- Career counseling services
- Financial aid offices
- International student services
- Job placement programs

### Online Platforms
- University job boards
- Freelancing websites
- Student-specific job platforms
- Professional networking sites

Remember, the primary purpose of your student visa is education, so always prioritize your studies while exploring these income opportunities. The skills and experience you gain from working can be just as valuable as the money you earn.

**Disclaimer**: Always consult with your university's international student services and check your specific visa requirements before starting any work. Regulations vary by country and visa type.`,
          author: 'Admin User',
          status: 'published',
          publishedAt: '2025-09-16T10:00:00Z',
          createdAt: '2025-09-15T08:00:00Z',
          updatedAt: '2025-09-16T10:00:00Z',
          featuredImage: '/blog/international-students.jpg',
          tags: ['Students', 'Money', 'International', 'Education', 'Finance'],
          slug: 'make-money-as-international-students',
          views: 1250,
          metaTitle: 'How International Students Can Make Money While Studying Abroad',
          metaDescription: 'Discover legal and practical ways for international students to earn money while studying abroad. Tips for balancing work and studies effectively.'
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setPost(mockPost)
      } catch (error) {
        console.error('Error loading blog post:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadBlogPost()
    }
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatContent = (content: string) => {
    // Simple markdown-like formatting for preview
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 text-gray-900">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-3 mt-6 text-gray-800">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mb-2 mt-4 text-gray-800">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(?!<[h|l])/gm, '<p class="mb-4">')
      .replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>')
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Loading Preview...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#ed874a] mx-auto mb-4" />
            <p className="text-gray-600">Loading blog post preview...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    )
  }

  if (!post) {
    return (
      <AdminDashboardLayout title="Post Not Found">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Blog post not found</p>
          <Button onClick={() => router.push('/dashboard/admin/blog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout 
      title="Blog Post Preview"
      headerAction={
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/admin/blog')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/admin/blog/${post.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Post
          </Button>
          {post.status === 'published' && (
            <Button 
              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
              className="bg-[#ed874a] hover:bg-[#d76f32] text-white"
            >
              <Globe className="w-4 h-4 mr-2" />
              View Live
            </Button>
          )}
        </div>
      }
    >
      <div className="max-w-4xl mx-auto">
        {/* Post Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge className={getStatusColor(post.status)}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </Badge>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.views.toLocaleString()} views
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.status === 'published' && post.publishedAt 
                    ? `Published ${new Date(post.publishedAt).toLocaleDateString()}`
                    : `Created ${new Date(post.createdAt).toLocaleDateString()}`
                  }
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>By admin</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{Math.ceil(post.content.length / 1000)} min read</span>
              </div>
            </div>

            {post.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-gray-500" />
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {post.excerpt && (
              <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-[#ed874a] pl-4 italic">
                {post.excerpt}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Featured Image */}
        {post.featuredImage && (
          <Card className="mb-6">
            <CardContent className="p-0">
              <img 
                src={post.featuredImage} 
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Post Content */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: formatContent(post.content) 
              }}
            />
          </CardContent>
        </Card>

        {/* SEO Preview */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-blue-600 mb-1 hover:underline cursor-pointer">
                {post.metaTitle || post.title}
              </h3>
              <p className="text-sm text-green-700 mb-2">
                https://digiafriq.com/blog/{post.slug}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {post.metaDescription || post.excerpt || `${post.content.substring(0, 160)}...`}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This is how your post will appear in search engine results.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}

export default BlogPostPreview
