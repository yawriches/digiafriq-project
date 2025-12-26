import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')
    const page = parseInt(searchParams.get('page') || '1')
    const slug = searchParams.get('slug')
    const offset = (page - 1) * limit

    // Single post by slug
    if (slug) {
      // Fetch base post
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .single()

      if (postError || !post) {
        console.error('Error fetching blog post by slug:', postError)
        return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
      }

      // Tags
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

      const tags = (postTags || []).map((pt: any) => (pt.blog_tags as any)?.name).filter(Boolean)

      // Author
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', post.author_id)
        .single()

      const single = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        featured_image: post.featured_image,
        published_at: post.published_at,
        views: post.views,
        tags,
        author: authorProfile?.full_name || authorProfile?.email || 'DigiAfriq Team'
      }

      return NextResponse.json({ post: single })
    }

    // Listing: fetch published posts
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching blog posts:', error)
      return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
    }

    // Map author and basic fields
    const postsWithAuthors = await Promise.all(
      (posts || []).map(async (post) => {
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', post.author_id)
          .single()

        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          featured_image: post.featured_image,
          published_at: post.published_at,
          views: post.views,
          tags: [],
          author: authorProfile?.full_name || authorProfile?.email || 'DigiAfriq Team'
        }
      })
    )

    return NextResponse.json({
      posts: postsWithAuthors,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in public blog API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
