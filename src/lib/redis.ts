/**
 * Redis client singleton — Upstash REST API only.
 *
 * Uses UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (HTTP-based).
 * Falls back to no-op when not configured.
 */

import { Redis } from "@upstash/redis"

 
type RedisClient = Redis

declare global {
   
  var __redis: RedisClient | null | undefined
}

function createRedisClient(): RedisClient | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) {
    console.warn("[redis] Upstash env not set — cache disabled")
    return null
  }

  try {
    return new Redis({ url, token })
  } catch {
    console.warn("[redis] Redis init failed — cache disabled")
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
