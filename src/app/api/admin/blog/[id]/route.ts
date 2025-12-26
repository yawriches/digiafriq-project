import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== BLOG API GET REQUEST ===')
    console.log('Raw params object:', JSON.stringify(params, null, 2))
    console.log('params.id value:', params.id)
    console.log('params.id type:', typeof params.id)
    console.log('params.id length:', params.id?.length)
    
    console.log('Proceeding with database query...')
    
    // First try to get the basic blog post from the main table
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Supabase error fetching blog post:', error)
      return NextResponse.json({ error: `Blog post not found: ${error.message}` }, { status: 404 })
    }

    if (!post) {
      console.error('No blog post found with ID:', params.id)
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    console.log('Successfully found blog post:', post.title)

    // Get tags for this post
    const { data: postTags, error: tagsError } = await supabase
      .from('blog_post_tags')
      .select(`
        blog_tags (
          id,
          name,
          slug
        )
      `)
      .eq('post_id', params.id)

    if (tagsError) {
      console.error('Error fetching tags:', tagsError)
    }

    // Transform tags to string array
    const tags = postTags?.map(pt => (pt.blog_tags as any)?.name).filter(Boolean) || []

    console.log('Fetched tags:', tags)

    // Get author name
    const { data: authorProfile, error: authorError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', post.author_id)
      .single()

    if (authorError) {
      console.error('Error fetching author profile:', authorError)
    }

    const postWithAuthor = {
      ...post,
      tags, // Use transformed tags
      author: authorProfile?.full_name || authorProfile?.email || 'Unknown Author'
    }

    console.log('=== RETURNING SUCCESS RESPONSE ===')

    return NextResponse.json({ post: postWithAuthor })

  } catch (error) {
    console.error('=== UNEXPECTED ERROR IN BLOG GET API ===', error)
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
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
      tags
    } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Check if slug already exists (excluding current post)
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .neq('id', params.id)
      .single()

    if (existingPost) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    // Update the blog post
    const { data: updatedPost, error: postError } = await supabase
      .from('blog_posts')
      .update({
        title,
        slug,
        excerpt,
        content,
        featured_image,
        meta_title,
        meta_description,
        status,
        published_at: status === 'published' ? (published_at || new Date().toISOString()) : published_at
      })
      .eq('id', params.id)
      .select()
      .single()

    if (postError) {
      console.error('Error updating blog post:', postError)
      return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
    }

    // Handle tags - remove existing relationships first
    await supabase
      .from('blog_post_tags')
      .delete()
      .eq('post_id', params.id)

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
          post_id: params.id,
          tag_id: tag.id
        }))

        await supabase
          .from('blog_post_tags')
          .insert(postTagInserts)
      }
    }

    return NextResponse.json({ post: updatedPost })

  } catch (error) {
    console.error('Error in blog PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete the blog post (cascade will handle tags)
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', params.id)

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
