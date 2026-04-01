import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Use vi.hoisted so the mock object is available when vi.mock is hoisted
// ---------------------------------------------------------------------------
const mockRedis = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  scan: vi.fn(),
}))

vi.mock("./redis", () => ({ redis: mockRedis }))

import {
  TTL,
  CacheKey,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  withCache,
} from "./cache"

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// TTL constants
// ---------------------------------------------------------------------------
describe("TTL constants", () => {
  it("PRODUCT_LIST is 5 minutes (300 seconds)", () => {
    expect(TTL.PRODUCT_LIST).toBe(5 * 60)
  })

  it("PRODUCT_DETAIL is 5 minutes (300 seconds)", () => {
    expect(TTL.PRODUCT_DETAIL).toBe(5 * 60)
  })

  it("CATEGORY_TREE is 30 minutes (1800 seconds)", () => {
    expect(TTL.CATEGORY_TREE).toBe(30 * 60)
  })

  it("CATEGORY_LIST is 30 minutes", () => {
    expect(TTL.CATEGORY_LIST).toBe(30 * 60)
  })

  it("BRAND_LIST is 30 minutes", () => {
    expect(TTL.BRAND_LIST).toBe(30 * 60)
  })

  it("PRICE is 5 minutes", () => {
    expect(TTL.PRICE).toBe(5 * 60)
  })

  it("DASHBOARD_STATS is 2 minutes (120 seconds)", () => {
    expect(TTL.DASHBOARD_STATS).toBe(2 * 60)
  })
})

// ---------------------------------------------------------------------------
// CacheKey builders
// ---------------------------------------------------------------------------
describe("CacheKey builders", () => {
  it("productList uses correct prefix", () => {
    expect(CacheKey.productList("page1")).toBe("nexadepo:products:list:page1")
  })

  it("productDetail uses correct prefix", () => {
    expect(CacheKey.productDetail("abc-123")).toBe("nexadepo:products:detail:abc-123")
  })

  it("categoryTree returns a fixed key", () => {
    expect(CacheKey.categoryTree()).toBe("nexadepo:categories:tree")
    // Calling twice produces the same value
    expect(CacheKey.categoryTree()).toBe(CacheKey.categoryTree())
  })

  it("categoryList uses correct prefix", () => {
    expect(CacheKey.categoryList("all")).toBe("nexadepo:categories:list:all")
  })

  it("brandList uses correct prefix", () => {
    expect(CacheKey.brandList("active")).toBe("nexadepo:brands:list:active")
  })

  it("price uses correct prefix", () => {
    expect(CacheKey.price("prod-1")).toBe("nexadepo:price:prod-1")
  })

  it("dashboardStats returns a fixed key", () => {
    expect(CacheKey.dashboardStats()).toBe("nexadepo:dashboard:stats")
  })

  it("all keys start with nexadepo: namespace", () => {
    const keys = [
      CacheKey.productList("x"),
      CacheKey.productDetail("x"),
      CacheKey.categoryTree(),
      CacheKey.categoryList("x"),
      CacheKey.brandList("x"),
      CacheKey.price("x"),
      CacheKey.dashboardStats(),
    ]
    for (const key of keys) {
      expect(key.startsWith("nexadepo:"), `key "${key}" should start with nexadepo:`).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// cacheGet
// ---------------------------------------------------------------------------
describe("cacheGet", () => {
  it("returns parsed value on cache HIT", async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ id: 1, name: "Test" }))
    const result = await cacheGet<{ id: number; name: string }>("some-key")
    expect(result).toEqual({ id: 1, name: "Test" })
    expect(mockRedis.get).toHaveBeenCalledWith("some-key")
  })

  it("returns null on cache MISS", async () => {
    mockRedis.get.mockResolvedValue(null)
    const result = await cacheGet("missing-key")
    expect(result).toBeNull()
  })

  it("returns null when Redis throws", async () => {
    mockRedis.get.mockRejectedValue(new Error("Redis connection refused"))
    const result = await cacheGet("bad-key")
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// cacheSet
// ---------------------------------------------------------------------------
describe("cacheSet", () => {
  it("calls redis.set with JSON-serialised value and EX flag", async () => {
    mockRedis.set.mockResolvedValue("OK")
    await cacheSet("my-key", { foo: "bar" }, 300)
    expect(mockRedis.set).toHaveBeenCalledWith("my-key", JSON.stringify({ foo: "bar" }), "EX", 300)
  })

  it("does not throw when Redis fails", async () => {
    mockRedis.set.mockRejectedValue(new Error("Redis down"))
    await expect(cacheSet("key", "value", 60)).resolves.toBeUndefined()
  })

  it("serialises arrays correctly", async () => {
    mockRedis.set.mockResolvedValue("OK")
    const arr = [1, 2, 3]
    await cacheSet("arr-key", arr, 60)
    expect(mockRedis.set).toHaveBeenCalledWith("arr-key", JSON.stringify(arr), "EX", 60)
  })
})

// ---------------------------------------------------------------------------
// cacheDel
// ---------------------------------------------------------------------------
describe("cacheDel", () => {
  it("calls redis.del with provided keys", async () => {
    mockRedis.del.mockResolvedValue(2)
    await cacheDel("key1", "key2")
    expect(mockRedis.del).toHaveBeenCalledWith("key1", "key2")
  })

  it("does nothing when no keys provided", async () => {
    await cacheDel()
    expect(mockRedis.del).not.toHaveBeenCalled()
  })

  it("does not throw when Redis fails", async () => {
    mockRedis.del.mockRejectedValue(new Error("Redis down"))
    await expect(cacheDel("key")).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// cacheDelPattern
// ---------------------------------------------------------------------------
describe("cacheDelPattern", () => {
  it("uses SCAN and deletes matched keys", async () => {
    // SCAN returns cursor "0" on the second call to signal end of iteration
    mockRedis.scan
      .mockResolvedValueOnce(["42", ["nexadepo:products:list:1", "nexadepo:products:list:2"]])
      .mockResolvedValueOnce(["0", []])
    mockRedis.del.mockResolvedValue(2)

    await cacheDelPattern("nexadepo:products:list:*")

    expect(mockRedis.scan).toHaveBeenCalledWith("0", "MATCH", "nexadepo:products:list:*", "COUNT", 100)
    expect(mockRedis.del).toHaveBeenCalledWith(
      "nexadepo:products:list:1",
      "nexadepo:products:list:2"
    )
  })

  it("handles patterns with no matches gracefully", async () => {
    mockRedis.scan.mockResolvedValue(["0", []])
    await expect(cacheDelPattern("nexadepo:no:match:*")).resolves.toBeUndefined()
    expect(mockRedis.del).not.toHaveBeenCalled()
  })

  it("does not throw when Redis fails", async () => {
    mockRedis.scan.mockRejectedValue(new Error("Redis error"))
    await expect(cacheDelPattern("any:*")).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// withCache
// ---------------------------------------------------------------------------
describe("withCache", () => {
  it("returns cached value without calling loader on HIT", async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify("cached-value"))
    const loader = vi.fn().mockResolvedValue("fresh-value")

    const result = await withCache("hit-key", 300, loader)

    expect(result).toBe("cached-value")
    expect(loader).not.toHaveBeenCalled()
  })

  it("calls loader and returns result on MISS, then writes to cache", async () => {
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue("OK")
    const loader = vi.fn().mockResolvedValue({ data: "fresh" })

    const result = await withCache("miss-key", 300, loader)

    expect(result).toEqual({ data: "fresh" })
    expect(loader).toHaveBeenCalledTimes(1)
    // Allow the fire-and-forget cacheSet to flush
    await new Promise((r) => setTimeout(r, 0))
    expect(mockRedis.set).toHaveBeenCalledWith(
      "miss-key",
      JSON.stringify({ data: "fresh" }),
      "EX",
      300
    )
  })

  it("still returns loader result even if cacheSet fails", async () => {
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockRejectedValue(new Error("Redis write failed"))
    const loader = vi.fn().mockResolvedValue("value")

    const result = await withCache("fail-set-key", 60, loader)
    expect(result).toBe("value")
  })
})
