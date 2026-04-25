/**
 * Generic cache helpers built on top of Upstash Redis.
 *
 * All functions degrade gracefully: if Redis is unavailable the
 * operation is skipped and the caller falls through to the DB.
 *
 * Key convention: "nexadepo:{entity}:{identifier}"
 *   e.g. "nexadepo:products:list:page1-limit20-active"
 *        "nexadepo:categories:tree"
 *        "nexadepo:brands:list:page1-limit20"
 *        "nexadepo:price:{productId}"
 */

import { redis } from "./redis"

// ---------------------------------------------------------------------------
// TTL constants (seconds)
// ---------------------------------------------------------------------------
export const TTL = {
  PRODUCT_LIST: 5 * 60,      // 5 minutes
  PRODUCT_DETAIL: 5 * 60,    // 5 minutes
  CATEGORY_TREE: 30 * 60,    // 30 minutes
  CATEGORY_LIST: 30 * 60,    // 30 minutes
  BRAND_LIST: 30 * 60,       // 30 minutes
  PRICE: 5 * 60,             // 5 minutes
  DASHBOARD_STATS: 2 * 60,   // 2 minutes
} as const

// ---------------------------------------------------------------------------
// Cache key builders
// ---------------------------------------------------------------------------
export const CacheKey = {
  productList: (params: string) => `nexadepo:products:list:${params}`,
  productDetail: (id: string) => `nexadepo:products:detail:${id}`,
  categoryTree: () => `nexadepo:categories:tree`,
  categoryList: (params: string) => `nexadepo:categories:list:${params}`,
  brandList: (params: string) => `nexadepo:brands:list:${params}`,
  price: (productId: string) => `nexadepo:price:${productId}`,
  dashboardStats: () => `nexadepo:dashboard:stats`,
} as const

// ---------------------------------------------------------------------------
// Core primitives
// ---------------------------------------------------------------------------

/**
 * Get a cached value. Returns null on miss, Redis unavailability, or error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    const raw = await redis.get(key)
    if (raw === null || raw === undefined) {
      console.debug(`[cache] MISS ${key}`)
      return null
    }
    console.debug(`[cache] HIT  ${key}`)
    // Upstash returns parsed JSON for objects, string for strings
    return typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T)
  } catch (err) {
    console.debug(`[cache] GET error for key "${key}":`, (err as Error).message)
    return null
  }
}

/**
 * Store a value in the cache with an expiry (seconds).
 * Silently swallows errors so the caller is never affected.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds })
    console.debug(`[cache] SET  ${key} (TTL ${ttlSeconds}s)`)
  } catch (err) {
    console.error(`[cache] SET error for key "${key}":`, (err as Error).message)
  }
}

/**
 * Delete one or more exact cache keys.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (!redis || keys.length === 0) return
  try {
    await redis.del(...keys)
    console.debug(`[cache] DEL  ${keys.join(", ")}`)
  } catch (err) {
    console.error(`[cache] DEL error:`, (err as Error).message)
  }
}

/**
 * Delete all keys matching a glob pattern.
 * Uses Upstash SCAN-compatible command.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redis) return
  try {
    let cursor = "0"
    let totalDeleted = 0
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 })
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
        totalDeleted += keys.length
      }
    } while (cursor !== "0")
    console.debug(`[cache] DEL* ${pattern} — removed ${totalDeleted} key(s)`)
  } catch (err) {
    console.error(`[cache] DEL* error for pattern "${pattern}":`, (err as Error).message)
  }
}

/**
 * Cache-aside helper: try cache first, on miss call loader and store result.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  const value = await loader()
  // Fire-and-forget — don't block the response
  cacheSet(key, value, ttlSeconds).catch(() => undefined)
  return value
}

// ---------------------------------------------------------------------------
// Domain-specific invalidation helpers
// ---------------------------------------------------------------------------

/** Wipe all product list cache entries. Call after any product mutation. */
export async function invalidateProductCache(productId?: string): Promise<void> {
  await Promise.all([
    cacheDelPattern("nexadepo:products:list:*"),
    productId ? cacheDel(CacheKey.productDetail(productId)) : Promise.resolve(),
    productId ? cacheDel(CacheKey.price(productId)) : Promise.resolve(),
    cacheDel(CacheKey.dashboardStats()),
  ])
}

/** Wipe all category cache entries. Call after any category mutation. */
export async function invalidateCategoryCache(): Promise<void> {
  await Promise.all([
    cacheDel(CacheKey.categoryTree()),
    cacheDelPattern("nexadepo:categories:list:*"),
    cacheDel(CacheKey.dashboardStats()),
  ])
}

/** Wipe all brand cache entries. Call after any brand mutation. */
export async function invalidateBrandCache(): Promise<void> {
  await Promise.all([
    cacheDelPattern("nexadepo:brands:list:*"),
    cacheDel(CacheKey.dashboardStats()),
  ])
}

/** Wipe margin/price caches. Call after any ProfitMargin mutation. */
export async function invalidatePriceCache(productId?: string): Promise<void> {
  if (productId) {
    await cacheDel(CacheKey.price(productId))
  } else {
    await cacheDelPattern("nexadepo:price:*")
  }
}
