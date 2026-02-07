import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    if (!payload?.type || !payload?.to) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: type, to' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin.functions.invoke('email-events', {
      body: payload,
    })

    if (error) {
      console.error('❌ email-events invoke error (api/email/send):', {
        message: (error as any)?.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        payload,
      })
      return NextResponse.json(
        { ok: false, error: (error as any)?.message || 'Failed to send email' },
        { status: 500 }
      )
    }

    console.log('✅ email-events invoked (api/email/send):', { type: payload.type, to: payload.to })
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error('❌ api/email/send exception:', err)
    return NextResponse.json(
      { ok: false, error: err?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
