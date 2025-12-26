import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Fetch published blog post by slug
    const { data: post, error } = await supabase
      .from('blog_posts_with_tags')
      .select('*')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    // Get author name
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', post.author_id)
      .single()

    // Increment view count
    await supabase
      .from('blog_posts')
      .update({ views: (post.views || 0) + 1 })
      .eq('id', post.id)

    const postWithAuthor = {
      ...post,
      author: authorProfile?.full_name || authorProfile?.email || 'DigiAfriq Team',
      views: (post.views || 0) + 1
    }

    return NextResponse.json({ post: postWithAuthor })

  } catch (error) {
    console.error('Error in blog slug API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
