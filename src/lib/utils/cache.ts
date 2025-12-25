/**
 * Simple in-memory cache for API responses
 * Reduces redundant database queries and improves performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if cache has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set data in cache with optional TTL (time to live in milliseconds)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const timestamp = Date.now()
    const expiresAt = timestamp + (ttl || this.defaultTTL)

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt
    })
  }

  /**
   * Check if a key exists and hasn't expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Invalidate (delete) a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    return {
      totalEntries: entries.length,
      validEntries: entries.filter(([_, entry]) => now <= entry.expiresAt).length,
      expiredEntries: entries.filter(([_, entry]) => now > entry.expiresAt).length
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const keys = Array.from(this.cache.keys())
    
    keys.forEach(key => {
      const entry = this.cache.get(key)
      if (entry && now > entry.expiresAt) {
        this.cache.delete(key)
      }
    })
  }
}

// Export singleton instance
export const cache = new SimpleCache()

// Run cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Decorator function to cache async function results
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args)
    
    // Check cache first
    const cached = cache.get(key)
    if (cached !== null) {
      console.log(`✅ Cache hit: ${key}`)
      return cached
    }

    // Cache miss - fetch data
    console.log(`❌ Cache miss: ${key}`)
    const result = await fn(...args)
    
    // Store in cache
    cache.set(key, result, ttl)
    
    return result
  }) as T
}
