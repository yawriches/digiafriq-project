"use client"
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft, User, Tag, Loader2 } from 'lucide-react'

interface PublicPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string | null
  published_at: string
  views: number
  tags: string[]
  author: string
}

const formatContent = (content: string) => {
    // Simple markdown-like formatting and HTML rendering
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 text-gray-900">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-3 mt-6 text-gray-800">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mb-2 mt-4 text-gray-800">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Handle images - convert markdown image syntax to HTML
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="w-full h-auto rounded-lg my-4" />')
      // Handle existing HTML images and ensure they have proper styling
      .replace(/<img([^>]*?)>/g, '<img$1 class="w-full h-auto rounded-lg my-4" />')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(?!<[h|l])/gm, '<p class="mb-4">')
      .replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>')
  }

export default function BlogPostDetail() {
  const params = useParams()
  const router = useRouter()
  const slug = (params as any)?.slug as string

  const [post, setPost] = useState<PublicPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!slug) return
        setLoading(true)
        const res = await fetch(`/api/blog?slug=${encodeURIComponent(slug)}`)
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || 'Failed to fetch blog post')
        }
        const data = await res.json()
        setPost({ ...data.post, content: formatContent(data.post.content) })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch blog post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading post...
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Post not found</CardTitle>
            <CardDescription>{error || 'We could not find this post.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <section className="py-10 border-b border-gray-200 bg-white/60 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Button variant="outline" asChild>
            <Link href="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-md">
            {post.featured_image && (
              <div className="w-full h-64 overflow-hidden">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-3xl leading-tight">{post.title}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-4 h-4" /> admin
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                  {post.tags?.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Tag className="w-4 h-4" /> {post.tags.join(', ')}
                    </span>
                  )}
                </div>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div 
                className="text-gray-800 leading-7 prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
