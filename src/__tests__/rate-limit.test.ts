import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS, type RateLimitConfig } from '@/lib/utils/rate-limit'

describe('rateLimit', () => {
  const config: RateLimitConfig = { limit: 3, windowSeconds: 60 }

  it('allows first request', () => {
    const result = rateLimit('test-allow-first', config)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('tracks remaining requests correctly', () => {
    const key = 'test-remaining-' + Date.now()
    const r1 = rateLimit(key, config)
    expect(r1.remaining).toBe(2)
    const r2 = rateLimit(key, config)
    expect(r2.remaining).toBe(1)
    const r3 = rateLimit(key, config)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests exceeding the limit', () => {
    const key = 'test-block-' + Date.now()
    rateLimit(key, config)
    rateLimit(key, config)
    rateLimit(key, config)
    const r4 = rateLimit(key, config)
    expect(r4.success).toBe(false)
    expect(r4.remaining).toBe(0)
  })

  it('returns correct limit value', () => {
    const result = rateLimit('test-limit-val-' + Date.now(), config)
    expect(result.limit).toBe(3)
  })

  it('resets after window expires', () => {
    const key = 'test-reset-' + Date.now()
    // Use a very short window
    const shortConfig: RateLimitConfig = { limit: 1, windowSeconds: 0.001 }
    const r1 = rateLimit(key, shortConfig)
    expect(r1.success).toBe(true)

    // Wait for window to expire
    const start = Date.now()
    while (Date.now() - start < 5) {} // busy wait 5ms

    const r2 = rateLimit(key, shortConfig)
    expect(r2.success).toBe(true)
  })

  it('treats different identifiers independently', () => {
    const ts = Date.now()
    const r1 = rateLimit('user-A-' + ts, { limit: 1, windowSeconds: 60 })
    expect(r1.success).toBe(true)

    const r2 = rateLimit('user-B-' + ts, { limit: 1, windowSeconds: 60 })
    expect(r2.success).toBe(true)
  })
})

describe('getRateLimitIdentifier', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getRateLimitIdentifier(req, 'test')).toBe('test:1.2.3.4')
  })

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.8.7.6' },
    })
    expect(getRateLimitIdentifier(req, 'test')).toBe('test:9.8.7.6')
  })

  it('falls back to unknown when no IP headers', () => {
    const req = new Request('http://localhost')
    expect(getRateLimitIdentifier(req, 'test')).toBe('test:unknown')
  })

  it('uses prefix correctly', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.1.1.1' },
    })
    expect(getRateLimitIdentifier(req, 'signup')).toBe('signup:1.1.1.1')
  })
})

describe('RATE_LIMITS presets', () => {
  it('has auth preset', () => {
    expect(RATE_LIMITS.auth.limit).toBe(10)
    expect(RATE_LIMITS.auth.windowSeconds).toBe(60)
  })

  it('has paymentInit preset', () => {
    expect(RATE_LIMITS.paymentInit.limit).toBe(5)
    expect(RATE_LIMITS.paymentInit.windowSeconds).toBe(60)
  })

  it('has paymentVerify preset', () => {
    expect(RATE_LIMITS.paymentVerify.limit).toBe(15)
  })
})
