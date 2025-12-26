"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/supabase/auth'
import { supabase, uploadImage } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Create untyped supabase client for blog operations
const untypedSupabase = supabase as any
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  Upload, 
  X, 
  Plus,
  Calendar,
  Globe,
  FileText,
  Tag,
  Image as ImageIcon,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'

interface BlogPostForm {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  status: 'draft' | 'published' | 'archived'
  featured_image: string
  tags: string[]
  published_at: string
  meta_title: string
  meta_description: string
  created_at: string
  updated_at: string
}

const EditBlogPost = () => {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  
  // Debug logging
  console.log('Edit page params:', params)
  console.log('Raw params.id:', params.id)
  console.log('Type of params.id:', typeof params.id)
  
  const rawId = Array.isArray((params as any)?.id) ? (params as any).id[0] : (params as any)?.id
  const postId = rawId as string
  const isValidUuid = (v: any) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v)
  
  console.log('Final postId being used:', postId)
  
  const fetchedRef = useRef(false)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [formData, setFormData] = useState<BlogPostForm>({
    id: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft',
    featured_image: '',
    tags: [],
    published_at: '',
    meta_title: '',
    meta_description: '',
    created_at: '',
    updated_at: ''
  })

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        console.log('Fetching blog post with ID:', postId)
        // Use query parameter to fetch single post to avoid dynamic API param issues
        const response = await fetch(`/api/admin/blog?id=${postId}`)
        
        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error Response:', errorText)
          throw new Error(`Failed to fetch blog post: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log('Fetched blog post data:', data)
        setFormData(data.post)
      } catch (error) {
        console.error('Error fetching blog post:', error)
        alert('Failed to load blog post: ' + (error instanceof Error ? error.message : 'Unknown error'))
        router.push('/dashboard/admin/blog')
      } finally {
        setLoading(false)
      }
    }

    // Guard: only fetch when we have a valid UUID and avoid duplicate fetches in Strict Mode
    if (isValidUuid(postId) && !fetchedRef.current) {
      fetchedRef.current = true
      fetchPost()
    }
  }, [postId, router])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
      meta_title: title
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true)
    try {
      const postData = {
        ...formData,
        status,
        published_at: status === 'published' ? (formData.published_at || new Date().toISOString()) : null,
        author_id: user?.id
      }

      // Update the blog post directly with Supabase
      const { error: updateError } = await untypedSupabase
        .from('blog_posts')
        .update({
          title: postData.title,
          slug: postData.slug,
          excerpt: postData.excerpt,
          content: postData.content,
          status: postData.status,
          featured_image: postData.featured_image,
          meta_title: postData.meta_title,
          meta_description: postData.meta_description,
          published_at: postData.published_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (updateError) throw updateError

      // Handle tags - remove existing relationships first
      await untypedSupabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', postId)

      if (postData.tags && postData.tags.length > 0) {
        // Create tags that don't exist
        for (const tagName of postData.tags) {
          const { error: tagError } = await untypedSupabase
            .from('blog_tags')
            .upsert({ name: tagName }, { onConflict: 'name' })

          if (tagError) {
            console.error('Error creating tag:', tagError)
          }
        }

        // Get tag IDs
        const { data: tagData } = await untypedSupabase
          .from('blog_tags')
          .select('id, name')
          .in('name', postData.tags)

        if (tagData) {
          // Link post to tags
          const postTagInserts = tagData.map((tag: any) => ({
            post_id: postId,
            tag_id: tag.id
          }))

          await untypedSupabase
            .from('blog_post_tags')
            .insert(postTagInserts)
        }
      }

      toast.success(`Blog post ${status} successfully`)
      router.push('/dashboard/admin/blog')
    } catch (error) {
      console.error('Error updating blog post:', error)
      toast.error('Failed to update blog post')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        setSaving(true)
        const imageUrl = await uploadImage(file, 'blog-images')
        setFormData(prev => ({ ...prev, featured_image: imageUrl }))
        toast.success('Image uploaded successfully')
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error('Failed to upload image')
      } finally {
        setSaving(false)
      }
    }
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#ed874a] mx-auto mb-4" />
            <p className="text-gray-600">Loading blog post...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout 
      title={`Edit: ${formData.title}`}
      headerAction={
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/admin/blog')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={saving || !formData.title.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave('published')}
            disabled={saving || !formData.title.trim() || !formData.content.trim()}
            className="bg-[#ed874a] hover:bg-[#d76f32] text-white"
          >
            <Globe className="w-4 h-4 mr-2" />
            {saving ? 'Updating...' : 'Update & Publish'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Post Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter blog post title..."
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  placeholder="url-slug-for-post"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL: /blog/{formData.slug || 'your-post-slug'}
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description of the blog post..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.excerpt.length}/160 characters
                </p>
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your blog post content here..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={20}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports Markdown formatting
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="SEO title for search engines..."
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.meta_title.length}/60 characters
                </p>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="SEO description for search engines..."
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.meta_description.length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Post Info */}
          <Card>
            <CardHeader>
              <CardTitle>Post Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{formData.created_at ? new Date(formData.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span>{formData.updated_at ? new Date(formData.updated_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              {formData.published_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Published:</span>
                  <span>{new Date(formData.published_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Publish Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'draft' | 'published' | 'archived') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="publishedAt">Publish Date</Label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Featured Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.featured_image ? (
                <div className="space-y-3">
                  <div className="relative">
                    <img 
                      src={formData.featured_image} 
                      alt="Featured" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Image URL"
                    value={formData.featured_image}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-3">Upload featured image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                  <div className="text-center text-sm text-gray-500">or</div>
                  <Input
                    placeholder="Enter image URL"
                    value={formData.featured_image}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button 
                  variant="outline" 
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-red-500" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!formData.title.trim()}
                onClick={() => window.open(`/blog/${formData.slug}`, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Post
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminDashboardLayout>
  )
}

export default EditBlogPost
