import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test if blog_posts table exists and has data
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(5)

    console.log('Blog posts query result:', { posts, error: postsError })

    // Test if the view exists
    const { data: viewPosts, error: viewError } = await supabase
      .from('blog_posts_with_tags')
      .select('*')
      .limit(5)

    console.log('Blog posts view query result:', { viewPosts, error: viewError })

    return NextResponse.json({
      message: 'Database test completed',
      blog_posts: {
        data: posts,
        error: postsError,
        count: posts?.length || 0
      },
      blog_posts_view: {
        data: viewPosts,
        error: viewError,
        count: viewPosts?.length || 0
      }
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
