/**
 * Redis client singleton — Upstash REST API only.
 *
 * Uses UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (HTTP-based).
 * Falls back to no-op when not configured.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RedisClient = any

declare global {
  // eslint-disable-next-line no-var
  var __redis: RedisClient | null | undefined
}

function createRedisClient(): RedisClient | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.warn("[redis] Upstash env not set — cache disabled")
    return null
  }

  // Dynamic require to avoid bundling issues during build
  try {
    const { Redis } = require("@upstash/redis")
    console.log("[redis] Using Upstash REST API")
    return new Redis({ url, token })
  } catch {
    console.warn("[redis] @upstash/redis not available — cache disabled")
    return null
  }
}

function getRedisClient(): RedisClient | null {
  if (!global.__redis) {
    global.__redis = createRedisClient()
  }
  return global.__redis
}

export const redis = getRedisClient()

/** Returns true when Redis is available. */
export function isRedisAvailable(): boolean {
  return redis !== null
}
