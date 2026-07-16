/**
 * Login brute-force protection — sliding-window rate limiter on Upstash Redis.
 *
 * 5 attempts per 15 minutes per (IP + dealerCode) identifier.
 *
 * Implementation uses a Redis sorted set + pipeline (ZREMRANGEBYSCORE → ZADD
 * → PEXPIRE → ZCARD → ZRANGE) so the window truly slides and the count is
 * race-safe. Requires @upstash/redis (already a dependency). When Upstash env
 * is not configured it fails open (allow), matching src/lib/redis.ts.
 */

import { redis, isRedisAvailable } from "./redis"
import type { Redis } from "@upstash/redis"

const LOGIN_MAX = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: Date
}

/**
 * Apply the login rate limit for a composite identifier.
 *
 * Callers should build the identifier from IP + dealerCode, e.g.
 * `checkLoginRate(\`${ip}:${dealerCode}\`)`. One identifier keeps the window
 * scoped per IP+account rather than globally per IP.
 *
 * When Upstash is unavailable this fails open (success) so the auth flow
 * stays functional — protection relies on UPSTASH_REDIS_REST_* being set.
 */
export async function checkLoginRate(
  identifier: string
): Promise<RateLimitResult> {
  if (!isRedisAvailable()) {
    return {
      success: true,
      remaining: LOGIN_MAX,
      resetAt: new Date(Date.now() + WINDOW_MS),
    }
  }

  const key = `ratelimit:login:${identifier}`
  const now = Date.now()
  // Unique member: score collisions within the same ms still insert separately.
  const member = `${now}:${Math.random().toString(36).slice(2, 10)}`

  try {
    // Pipeline = single round-trip to Upstash REST. Order matters:
    // 1. drop entries older than the window
    // 2. record this attempt
    // 3. refresh TTL so the key expires after the window
    // 4. count remaining members
    // 5. fetch the oldest member's score → reset time
    const pipe = (redis as Redis).pipeline()
    pipe.zremrangebyscore(key, "-inf", now - WINDOW_MS)
    pipe.zadd(key, { score: now, member })
    pipe.pexpire(key, WINDOW_MS)
    pipe.zcard(key)
    pipe.zrange(key, 0, 0, { withScores: true })

    const res = (await pipe.exec()) as unknown[]
    const count = Number(res[3] ?? 0)
    const oldest = res[4] as [string, number] | []

    const success = count <= LOGIN_MAX
    const remaining = Math.max(0, LOGIN_MAX - count)
    const oldestScore =
      Array.isArray(oldest) && oldest.length >= 2 ? Number(oldest[1]) : null
    const resetAt = new Date(
      oldestScore !== null ? oldestScore + WINDOW_MS : now + WINDOW_MS
    )

    return { success, remaining, resetAt }
  } catch (err) {
    // Never block auth on limiter failure — log and allow.
    console.error("[rate-limit] limiter error, failing open:", err)
    return {
      success: true,
      remaining: LOGIN_MAX,
      resetAt: new Date(Date.now() + WINDOW_MS),
    }
  }
}

/**
 * Extract a client IP from a request-like object.
 *
 * Prefers the first IP in `x-forwarded-for` (the original client behind any
 * proxy chain), then falls back to `x-real-ip`. Returns "unknown" when no IP
 * header is present so the identifier stays stable rather than undefined.
 */
export function getClientIp(req: unknown): string {
  const headers =
    (req as { headers?: Record<string, string | string[] | undefined> })
      ?.headers ?? undefined

  const forwarded = headers?.["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim()
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim()
  }

  const real = headers?.["x-real-ip"]
  if (typeof real === "string" && real.length > 0) {
    return real.trim()
  }

  return "unknown"
}
