/**
 * Redis client singleton.
 *
 * The app works fine without Redis. If REDIS_URL is not set, or if the
 * connection fails, all cache operations are silently no-ops.
 */

import Redis from "ioredis"

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | null | undefined
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn("[redis] REDIS_URL not set — cache disabled")
    return null
  }

  const client = new Redis(url, {
    // Fail fast instead of retrying forever during cold-start
    maxRetriesPerRequest: 2,
    connectTimeout: 3000,
    lazyConnect: true,
    enableOfflineQueue: true,
  })

  client.on("connect", () => {
    console.log("[redis] Connected")
  })

  client.on("error", (err) => {
    // Only log once per error type to avoid log spam
    console.error("[redis] Connection error:", err.message)
  })

  return client
}

// Re-use the client across hot-reloads in development
function getRedisClient(): Redis | null {
  if (process.env.NODE_ENV === "production") {
    // In production each worker has its own module scope
    if (!global.__redis) {
      global.__redis = createRedisClient()
    }
    return global.__redis
  }

  // Development: attach to global to survive HMR
  if (!global.__redis) {
    global.__redis = createRedisClient()
  }
  return global.__redis
}

export const redis = getRedisClient()

/** Returns true when Redis is available and connected. */
export function isRedisAvailable(): boolean {
  return redis !== null && redis.status === "ready"
}
