import { useState, useEffect } from 'react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string | null
  published_at: string
  views: number
  tags: any[]
  author: string
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

export const useBlogPosts = (limit: number = 3) => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/blog?limit=${limit}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts')
        }

        const data: BlogResponse = await response.json()
        setPosts(data.posts)
      } catch (err) {
        console.error('Error fetching blog posts:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch blog posts')
        // Do not fallback to hardcoded posts to avoid broken links/404s
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [limit])

  return { posts, loading, error }
}
