/**
 * In-memory rate limiter for API routes.
 * Uses a sliding window approach with automatic cleanup.
 * 
 * For production at scale (50K+ users), consider replacing with
 * @upstash/ratelimit + Redis for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 60 seconds
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function startCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key)
      }
    }
  }, 60_000)
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given identifier (e.g., IP address or user ID).
 * Returns whether the request should be allowed.
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup()

  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = identifier

  const existing = rateLimitStore.get(key)

  if (!existing || now > existing.resetAt) {
    // New window
    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    rateLimitStore.set(key, entry)
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: entry.resetAt,
    }
  }

  // Existing window
  existing.count++
  
  if (existing.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: existing.resetAt,
    }
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  }
}

/**
 * Get a rate limit identifier from a Next.js request.
 * Uses X-Forwarded-For header (common behind proxies/Vercel) or falls back to a generic key.
 */
export function getRateLimitIdentifier(request: Request, prefix: string = ''): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'
  return `${prefix}:${ip}`
}

// Preset configurations for common routes
export const RATE_LIMITS = {
  /** Auth routes: 10 requests per minute */
  auth: { limit: 10, windowSeconds: 60 } as RateLimitConfig,
  /** Payment init: 5 requests per minute */
  paymentInit: { limit: 5, windowSeconds: 60 } as RateLimitConfig,
  /** Payment verify: 15 requests per minute */
  paymentVerify: { limit: 15, windowSeconds: 60 } as RateLimitConfig,
  /** Admin routes: 60 requests per minute */
  admin: { limit: 60, windowSeconds: 60 } as RateLimitConfig,
  /** General API: 30 requests per minute */
  general: { limit: 30, windowSeconds: 60 } as RateLimitConfig,
} as const
