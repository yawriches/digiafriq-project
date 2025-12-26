"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Tag,
  MoreHorizontal,
  FileText,
  Clock,
  Globe,
  Archive
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_at: string
  updated_at: string
  featured_image: string | null
  tags: string[]
  slug: string
  views: number
}

interface BlogResponse {
  posts: BlogPost[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const BlogManagement = () => {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<string>('desc')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Fetch posts from Supabase
  const fetchPosts = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })

      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      }

      // Apply sorting
      const validSortFields = ['created_at', 'updated_at', 'published_at', 'title', 'views']
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
      query = query.order(sortField, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const offset = (page - 1) * 10
      query = query.range(offset, offset + 10 - 1)

      const { data: posts, error, count } = await query

      if (error) throw error

      // Get author names and tags for each post
      const postsWithAuthorsAndTags = await Promise.all(
        (posts || []).map(async (post) => {
          // Get tags for this post
          const { data: postTags } = await supabase
            .from('blog_post_tags')
            .select(`
              blog_tags (
                id,
                name,
                slug
              )
            `)
            .eq('post_id', post.id)

          // Transform tags to string array
          const tags = postTags?.map((pt: any) => (pt.blog_tags as any)?.name).filter(Boolean) || []

          return {
            ...post,
            tags,
            author: 'admin' // Always show as admin
          }
        })
      )
      
      setPosts(postsWithAuthorsAndTags)
      setPagination({
        page,
        limit: 10,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / 10)
      })
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      toast.error('Failed to fetch blog posts')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [page, statusFilter, sortBy, sortOrder])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1)
      else fetchPosts()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return

    try {
      // First delete tag relationships for this post
      const { error: tagDeleteError } = await supabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', postId)

      if (tagDeleteError) {
        console.error('Error deleting blog post tag relationships:', tagDeleteError)
      }

      // Delete the blog post
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      // Refresh the posts list
      fetchPosts()
      toast.success('Blog post deleted successfully')
    } catch (error) {
      console.error('Error deleting blog post:', error)
      toast.error('Failed to delete blog post')
    }
  }

  const filteredPosts = posts // API already handles filtering

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

  const handleStatusChange = async (postId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null
        })
        .eq('id', postId)

      if (error) throw error

      // Refresh the posts list
      fetchPosts()
      toast.success(`Blog post ${newStatus} successfully`)
    } catch (error) {
      console.error('Error updating blog post status:', error)
      toast.error('Failed to update blog post status')
    }
  }

  // Calculate stats from posts
  const stats = {
    total: pagination.total,
    published: posts.filter(p => p.status === 'published').length,
    drafts: posts.filter(p => p.status === 'draft').length,
    archived: posts.filter(p => p.status === 'archived').length,
    totalViews: posts.reduce((sum, post) => sum + post.views, 0)
  }

  return (
    <AdminDashboardLayout 
      title="Blog Management"
      headerAction={
        <Button 
          onClick={() => router.push('/dashboard/admin/blog/new')}
          className="bg-[#ed874a] hover:bg-[#d76f32] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-[#ed874a]" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                </div>
                <Globe className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.drafts}</p>
                </div>
                <Edit className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Archived</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
                </div>
                <Archive className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Newest</SelectItem>
                    <SelectItem value="updated_at">Recently Updated</SelectItem>
                    <SelectItem value="published_at">Recently Published</SelectItem>
                    <SelectItem value="views">Most Views</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blog Posts List */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Posts ({filteredPosts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ed874a] mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No blog posts found</p>
                <Button 
                  onClick={() => router.push('/dashboard/admin/blog/new')}
                  className="mt-4 bg-[#ed874a] hover:bg-[#d76f32] text-white"
                >
                  Create Your First Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-[#ed874a] cursor-pointer">
                            {post.title}
                          </h3>
                          <Badge className={getStatusColor(post.status)}>
                            {post.status}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            admin
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.status === 'published' && post.published_at 
                              ? `Published ${new Date(post.published_at).toLocaleDateString()}`
                              : `Created ${new Date(post.created_at).toLocaleDateString()}`
                            }
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views} views
                          </div>
                          {post.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {post.tags.slice(0, 2).join(', ')}
                              {post.tags.length > 2 && ` +${post.tags.length - 2}`}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/blog/${post.slug}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/admin/blog/${post.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'published')}>
                              <Globe className="w-4 h-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'draft')}>
                              <Edit className="w-4 h-4 mr-2" />
                              Move to Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'archived')}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(post.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}

export default BlogManagement
