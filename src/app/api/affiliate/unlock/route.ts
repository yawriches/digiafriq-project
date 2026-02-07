import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has an active membership
    const { data: userMembership, error: membershipError } = await supabase
      .from('user_memberships')
      .select(`
        *,
        membership_packages!inner(
          id,
          name,
          member_type
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !userMembership) {
      return NextResponse.json(
        { error: 'Active membership required to unlock affiliate features' },
        { status: 400 }
      )
    }

    // Check if user has completed the affiliate course
    const { data: courseEnrollment, error: courseError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses!inner(
          id,
          title,
          category
        )
      `)
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .or('courses.title.ilike.%affiliate%,courses.category.ilike.%affiliate%')
      .single()

    if (courseError || !courseEnrollment) {
      return NextResponse.json(
        { error: 'Complete the affiliate course to unlock affiliate features' },
        { status: 400 }
      )
    }

    // Check if affiliate features are already unlocked
    const { data: profile } = await supabase
      .from('profiles')
      .select('affiliate_unlocked')
      .eq('id', user.id)
      .single()

    // For now, check if user has affiliate role until field is added
    const { data: roleProfile } = await supabase
      .from('profiles')
      .select('role, active_role')
      .eq('id', user.id)
      .single()

    if ((roleProfile as any)?.role === 'affiliate' || (roleProfile as any)?.active_role === 'affiliate') {
      return NextResponse.json(
        { message: 'Affiliate features already unlocked' },
        { status: 200 }
      )
    }

    // Unlock affiliate features (using existing role system)
    const updateQuery = supabase
      .from('profiles')
      .update({ 
        active_role: 'affiliate',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    const { error: updateError } = await (updateQuery as any)

    if (updateError) {
      console.error('Error unlocking affiliate features:', updateError)
      return NextResponse.json(
        { error: 'Failed to unlock affiliate features' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Affiliate features unlocked successfully!',
      unlockedAt: new Date().toISOString(),
      courseCompleted: (courseEnrollment as any)?.courses?.title || 'Affiliate Course'
    })

  } catch (error) {
    console.error('Affiliate unlock error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check affiliate status (using existing role system)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, active_role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check affiliate course completion
    const { data: courseEnrollment, error: courseError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses!inner(
          id,
          title,
          category
        )
      `)
      .eq('user_id', user.id)
      .or('courses.title.ilike.%affiliate%,courses.category.ilike.%affiliate%')
      .single()

    const isAffiliateUnlocked = (profile as any)?.role === 'affiliate' || (profile as any)?.active_role === 'affiliate'

    return NextResponse.json({
      affiliate_unlocked: isAffiliateUnlocked || false,
      affiliate_course: courseEnrollment ? {
        id: (courseEnrollment as any).courses.id,
        title: (courseEnrollment as any).courses.title,
        completed: (courseEnrollment as any).completed_at !== null,
        progress: (courseEnrollment as any).progress_percentage || 0
      } : null
    })

  } catch (error) {
    console.error('Affiliate status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
