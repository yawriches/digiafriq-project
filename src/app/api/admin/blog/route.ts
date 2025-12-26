import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // For admin routes, we'll use service role key which bypasses RLS
    // In a production app, you'd want to verify the user's admin status from the request headers/cookies
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // If an id is provided, return a single post payload
    if (id) {
      // Fetch base post
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (postError || !post) {
        console.error('Error fetching single blog post:', postError)
        return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
      }

      // Fetch tags for post
      const { data: postTags, error: tagsError } = await supabase
        .from('blog_post_tags')
        .select(`
          blog_tags (
            id,
            name,
            slug
          )
        `)
        .eq('post_id', post.id)

      if (tagsError) {
        console.error('Error fetching tags for single post:', tagsError)
      }

      const tags = (postTags || [])
        .map((pt: any) => (pt.blog_tags as any)?.name)
        .filter(Boolean)

      // Fetch author profile
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', post.author_id)
        .single()

      const postWithAuthor = {
        ...post,
        tags,
        author: authorProfile?.full_name || authorProfile?.email || 'Unknown Author'
      }

      return NextResponse.json({ post: postWithAuthor })
    }

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'published_at', 'title', 'views']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching blog posts:', error)
      return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
    }

    // Get author names and tags for each post
    const postsWithAuthorsAndTags = await Promise.all(
      (posts || []).map(async (post) => {
        // Get author profile
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', post.author_id)
          .single()

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
          tags, // Use transformed tags
          author: authorProfile?.full_name || authorProfile?.email || 'Unknown Author'
        }
      })
    )

    return NextResponse.json({
      posts: postsWithAuthorsAndTags,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in blog API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Debug: Log received data
    console.log('API received blog post data:', body)
    console.log('Content length in API:', body.content?.length || 0)
    console.log('Content preview in API:', body.content?.substring(0, 200) + '...' || 'No content')
    
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      meta_title,
      meta_description,
      status,
      published_at,
      tags,
      author_id
    } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Check if slug already exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingPost) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    // Create the blog post
    const publishAtISO = status === 'published'
      ? (published_at ? new Date(published_at).toISOString() : new Date().toISOString())
      : null

    const { data: newPost, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt,
        content,
        featured_image,
        meta_title,
        meta_description,
        status,
        published_at: publishAtISO,
        author_id: author_id || '00000000-0000-0000-0000-000000000000' // Default admin user ID
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating blog post:', postError)
      return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 })
    }

    // Debug: Log what was saved
    console.log('Saved to database:', newPost)
    console.log('Saved content length:', newPost.content?.length || 0)
    console.log('Saved content preview:', newPost.content?.substring(0, 200) + '...' || 'No content saved')

    // Handle tags
    if (tags && tags.length > 0) {
      // Create tags that don't exist
      for (const tagName of tags) {
        const { error: tagError } = await supabase
          .from('blog_tags')
          .upsert({ name: tagName }, { onConflict: 'name' })

        if (tagError) {
          console.error('Error creating tag:', tagError)
        }
      }

      // Get tag IDs
      const { data: tagData } = await supabase
        .from('blog_tags')
        .select('id, name')
        .in('name', tags)

      if (tagData) {
        // Link post to tags
        const postTagInserts = tagData.map(tag => ({
          post_id: newPost.id,
          tag_id: tag.id
        }))

        await supabase
          .from('blog_post_tags')
          .insert(postTagInserts)
      }
    }

    return NextResponse.json({ post: newPost }, { status: 201 })

  } catch (error) {
    console.error('Error in blog POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing blog ID' }, { status: 400 })
    }

    // First delete tag relationships for this post
    const { error: tagDeleteError } = await supabase
      .from('blog_post_tags')
      .delete()
      .eq('post_id', id)

    if (tagDeleteError) {
      console.error('Error deleting blog post tag relationships:', tagDeleteError)
      // Continue with post deletion even if tag cleanup fails
    }

    // Delete the blog post
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting blog post:', error)
      return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Blog post deleted successfully' })

  } catch (error) {
    console.error('Error in blog DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
