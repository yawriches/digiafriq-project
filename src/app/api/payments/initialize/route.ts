import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/utils/rate-limit'

// In-memory idempotency store: tracks recent payment init requests
const recentInits = new Map<string, number>()
const IDEMPOTENCY_WINDOW_MS = 10_000 // 10 seconds

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of recentInits) {
    if (now - timestamp > IDEMPOTENCY_WINDOW_MS) {
      recentInits.delete(key)
    }
  }
}, 30_000)

export async function POST(request: NextRequest) {
  const rlResult = rateLimit(getRateLimitIdentifier(request, 'pay-init'), RATE_LIMITS.paymentInit)
  if (!rlResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    console.log('🚀 API Route - Payment initialization started');
    
    const body = await request.json()
    const authHeader = request.headers.get('authorization')

    // Idempotency check: prevent duplicate payment inits within 10 seconds
    const idempotencyKey = `${body.membership_package_id || 'unknown'}_${body.user_id || 'anon'}_${body.amount || 0}`
    const lastInit = recentInits.get(idempotencyKey)
    if (lastInit && Date.now() - lastInit < IDEMPOTENCY_WINDOW_MS) {
      console.log('⚠️ Duplicate payment init blocked:', idempotencyKey)
      return NextResponse.json(
        { error: 'Payment is already being processed. Please wait.' },
        { status: 409 }
      )
    }
    recentInits.set(idempotencyKey, Date.now())

    console.log('📥 API Route - Received request:', { 
      body, 
      hasAuth: !!authHeader,
      authHeaderLength: authHeader?.length || 0
    })

    if (!authHeader) {
      console.error('❌ API Route - No authorization header');
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      )
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔧 API Route - Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseAnonKey: !!supabaseAnonKey,
      supabaseUrl: supabaseUrl?.substring(0, 20) + '...'
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ API Route - Missing environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Forward the request to Supabase Edge Function
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/initialize-payment`
    console.log('🌐 API Route - Forwarding to:', edgeFunctionUrl)
    
    try {
      console.log('📤 API Route - Sending request to edge function...');
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify(body)
      })

      console.log('📥 API Route - Edge function response received:', response.status);
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ API Route - Failed to parse response:', parseError);
        const responseText = await response.text();
        console.log('📄 API Route - Raw response:', responseText);
        return NextResponse.json(
          { error: 'Invalid response from payment service' },
          { status: 500 }
        )
      }

      console.log('📊 API Route - Edge function response:', { 
        status: response.status, 
        success: data?.authorization_url ? 'YES' : 'NO',
        hasError: !!data.error,
        dataKeys: Object.keys(data)
      });

      if (!response.ok) {
        console.error('❌ API Route - Edge function error:', data);
        return NextResponse.json(
          { error: data.error || 'Payment initialization failed', details: data.details },
          { status: response.status }
        )
      }

      console.log('✅ API Route - Payment initialized successfully');
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error('❌ API Route - Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to connect to payment service' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ API Route - Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
