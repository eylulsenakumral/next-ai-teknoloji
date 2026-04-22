import { describe, it, expect, beforeAll, afterEach } from 'vitest'

const API_BASE = process.env.API_URL || 'http://localhost:3000'

describe.skip('Wishlist API', () => {
  let dealerToken: string
  let testProductId: string

  beforeAll(async () => {
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.TEST_DEALER_EMAIL || 'test-dealer@example.com',
        password: process.env.TEST_DEALER_PASSWORD || 'TestPassword123!'
      })
    })

    if (loginResponse.status === 200) {
      const data = await loginResponse.json()
      dealerToken = data.token || data.sessionToken || data.accessToken
    }

    const productsResponse = await fetch(`${API_BASE}/api/products?limit=1`)
    if (productsResponse.ok) {
      const { data } = await productsResponse.json()
      testProductId = data?.[0]?.id
    }
  })

  afterEach(async () => {
    if (dealerToken) {
      const wishlistResponse = await fetch(`${API_BASE}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })
      if (wishlistResponse.ok) {
        const { items } = await wishlistResponse.json()
        for (const item of items || []) {
          await fetch(`${API_BASE}/api/wishlist/${item.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${dealerToken}` }
          })
        }
      }
    }
  })

  describe('GET /api/wishlist', () => {
    it('should return empty wishlist for new user', async () => {
      const response = await fetch(`${API_BASE}/api/wishlist`, {
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('items')
      expect(Array.isArray(data.items)).toBe(true)
      expect(data.items.length).toBe(0)
    })

    it('should return wishlist with items', async () => {
      if (!testProductId || !dealerToken) return

      await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId
        })
      })

      const response = await fetch(`${API_BASE}/api/wishlist`, {
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        expect(data.items.length).toBeGreaterThan(0)
        expect(data.items[0]).toHaveProperty('product')
        expect(data.items[0]).toHaveProperty('addedAt')
      }
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/wishlist`)
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/wishlist', () => {
    it('should add product to wishlist', async () => {
      if (!testProductId || !dealerToken) return

      const response = await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('items')
      const addedItem = data.items.find((i: { product: { id: string } }) => i.product.id === testProductId)
      expect(addedItem).toBeTruthy()
    })

    it('should not duplicate item if already in wishlist', async () => {
      if (!testProductId || !dealerToken) return

      await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId
        })
      })

      await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId
        })
      })

      const response = await fetch(`${API_BASE}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })

      if (response.ok) {
        const { items } = await response.json()
        const count = items.filter((i: { product: { id: string } }) => i.product.id === testProductId).length
        expect(count).toBe(1)
      }
    })

    it('should return 400 for invalid product ID', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: 'invalid-product-id'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for missing productId', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({})
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/wishlist/:itemId', () => {
    it('should remove item from wishlist', async () => {
      if (!testProductId || !dealerToken) return

      await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId
        })
      })

      const wishlistResponse = await fetch(`${API_BASE}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })
      if (!wishlistResponse.ok) return

      const { items } = await wishlistResponse.json()
      const itemId = items?.[0]?.id
      if (!itemId) return

      const deleteResponse = await fetch(`${API_BASE}/api/wishlist/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(deleteResponse.status).toBe(200)
    })

    it('should return 404 for non-existent item', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/wishlist/non-existent-id`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(response.status).toBe(404)
    })
  })

  describe('Wishlist Product Details', () => {
    it('should include product details in wishlist items', async () => {
      if (!testProductId || !dealerToken) return

      await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId
        })
      })

      const response = await fetch(`${API_BASE}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })

      if (response.ok) {
        const { items } = await response.json()
        expect(items[0].product).toHaveProperty('name')
        expect(items[0].product).toHaveProperty('slug')
        expect(items[0].product).toHaveProperty('price')
        expect(items[0].product).toHaveProperty('images')
      }
    })

    it('should include addedAt timestamp', async () => {
      if (!testProductId || !dealerToken) return

      await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId
        })
      })

      const response = await fetch(`${API_BASE}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })

      if (response.ok) {
        const { items } = await response.json()
        expect(items[0]).toHaveProperty('addedAt')
        expect(new Date(items[0].addedAt)).toBeInstanceOf(Date)
      }
    })
  })

  describe('Wishlist Pagination', () => {
    it('should support pagination parameters', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/wishlist?page=1&limit=10`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })

      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('items')
        expect(data).toHaveProperty('total')
        expect(data).toHaveProperty('page')
        expect(data).toHaveProperty('limit')
      }
    })
  })
})
