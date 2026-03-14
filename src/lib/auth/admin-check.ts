/**
 * Standardized admin authorization check for API routes.
 * Single source of truth — replaces inconsistent admin checks across routes.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

export interface AdminCheckResult {
  isAdmin: boolean
  userId: string | null
  error: NextResponse | null
}

/**
 * Verify that the request is from an authenticated admin user.
 * Returns the userId if admin, or an error response if not.
 */
export async function verifyAdmin(request: NextRequest): Promise<AdminCheckResult> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return {
      isAdmin: false,
      userId: null,
      error: NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  
  if (authError || !user) {
    return {
      isAdmin: false,
      userId: null,
      error: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    }
  }

  // Single consistent admin check: use the 'role' field from profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      isAdmin: false,
      userId: user.id,
      error: NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      ),
    }
  }

  const isAdmin = profile.role === 'admin'
  
  if (!isAdmin) {
    return {
      isAdmin: false,
      userId: user.id,
      error: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    }
  }

  return {
    isAdmin: true,
    userId: user.id,
    error: null,
  }
}
