import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { referral_code, link_type } = await request.json()

    if (!referral_code || !link_type) {
      return NextResponse.json(
        { success: false, message: 'Missing referral_code or link_type' },
        { status: 400 }
      )
    }

    console.log('📊 Tracking affiliate link click:', { referral_code, link_type })

    // Get visitor info from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const visitorIp = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Simple device detection
    let visitorDevice = 'desktop'
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      visitorDevice = 'mobile'
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      visitorDevice = 'tablet'
    }

    // Get affiliate ID from referral code
    const { data: affiliateProfile, error: affiliateError } = await supabase
      .from('affiliate_profiles')
      .select('id')
      .eq('referral_code', referral_code)
      .single()

    if (affiliateError || !affiliateProfile) {
      console.log('⚠️ Invalid referral code:', referral_code)
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 404 }
      )
    }

    // Insert link click record
    const { data: linkClick, error: insertError } = await supabase
      .from('affiliate_links')
      .insert({
        affiliate_id: affiliateProfile.id,
        link_type: link_type,
        visitor_ip: visitorIp,
        visitor_device: visitorDevice,
        clicked_at: new Date().toISOString(),
        converted: false
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('❌ Error tracking link click:', insertError)
      return NextResponse.json(
        { success: false, message: 'Failed to track click' },
        { status: 500 }
      )
    }

    console.log('✅ Link click tracked:', linkClick?.id)

    return NextResponse.json({
      success: true,
      message: 'Click tracked',
      click_id: linkClick?.id
    })

  } catch (error) {
    console.error('❌ Track click error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
