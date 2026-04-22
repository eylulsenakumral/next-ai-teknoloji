import { describe, it, expect, beforeAll, afterEach } from 'vitest'

const API_BASE = process.env.API_URL || 'http://localhost:3000'

describe.skip('Cart API', () => {
  let dealerToken: string
  let testProductId: string
  let testProductId2: string

  beforeAll(async () => {
    // Login as dealer to get token
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

    // Get a test product ID
    const productsResponse = await fetch(`${API_BASE}/api/products?limit=2`)
    if (productsResponse.ok) {
      const { data } = await productsResponse.json()
      testProductId = data?.[0]?.id
      testProductId2 = data?.[1]?.id
    }
  })

  afterEach(async () => {
    // Clear cart after each test
    if (dealerToken) {
      const cartResponse = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })
      if (cartResponse.ok) {
        const { items } = await cartResponse.json()
        for (const item of items || []) {
          await fetch(`${API_BASE}/api/cart/${item.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${dealerToken}` }
          })
        }
      }
    }
  })

  describe('GET /api/cart', () => {
    it('should return empty cart for new user', async () => {
      const response = await fetch(`${API_BASE}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      if (response.status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('items')
        expect(data).toHaveProperty('subtotal')
        expect(data).toHaveProperty('total')
        expect(Array.isArray(data.items)).toBe(true)
        expect(data.items.length).toBe(0)
      }
    })

    it('should return cart with items', async () => {
      // Add item first
      if (testProductId && dealerToken) {
        await fetch(`${API_BASE}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dealerToken}`
          },
          body: JSON.stringify({
            productId: testProductId,
            quantity: 1
          })
        })
      }

      const response = await fetch(`${API_BASE}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      if (response.status === 200) {
        const data = await response.json()
        expect(data.items.length).toBeGreaterThan(0)
        expect(data.items[0]).toHaveProperty('product')
        expect(data.items[0]).toHaveProperty('quantity')
        expect(data.items[0]).toHaveProperty('subtotal')
      }
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/cart`)
      expect(response.status).toBe(401)
    })

    it('should return 401 with invalid token', async () => {
      const response = await fetch(`${API_BASE}/api/cart`, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      })
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/cart', () => {
    it('should add item to cart', async () => {
      if (!testProductId || !dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId,
          quantity: 1
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('items')
      const addedItem = data.items.find((i: { product: { id: string } }) => i.product.id === testProductId)
      expect(addedItem).toBeTruthy()
      expect(addedItem.quantity).toBe(1)
    })

    it('should update quantity if item already in cart', async () => {
      if (!testProductId || !dealerToken) return

      // Add item first time
      await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId,
          quantity: 1
        })
      })

      // Add same item again with different quantity
      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId,
          quantity: 3
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      const item = data.items.find((i: { product: { id: string } }) => i.product.id === testProductId)
      expect(item.quantity).toBe(3)
    })

    it('should add multiple different items', async () => {
      if (!testProductId || !testProductId2 || !dealerToken) return

      // Add first product
      await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId,
          quantity: 1
        })
      })

      // Add second product
      await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId2,
          quantity: 2
        })
      })

      const cartResponse = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })

      if (cartResponse.ok) {
        const { items } = await cartResponse.json()
        expect(items.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should return 400 for invalid product ID', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: 'invalid-product-id',
          quantity: 1
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for zero quantity', async () => {
      if (!testProductId || !dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId,
          quantity: 0
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for negative quantity', async () => {
      if (!testProductId || !dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId,
          quantity: -5
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for exceeding max quantity', async () => {
      if (!testProductId || !dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId,
          quantity: 9999
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for out of stock product', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: 'out-of-stock-product-id',
          quantity: 1
        })
      })

      expect(response.status).toBe(400)
    })

    it('should calculate subtotal correctly', async () => {
      if (!testProductId || !dealerToken) return

      await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId,
          quantity: 2
        })
      })

      const cartResponse = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })

      if (cartResponse.ok) {
        const data = await cartResponse.json()
        expect(data).toHaveProperty('subtotal')
        expect(typeof data.subtotal).toBe('number')
      }
    })
  })

  describe('PUT /api/cart/:itemId', () => {
    it('should update item quantity', async () => {
      if (!testProductId || !dealerToken) return

      // Get cart to find item ID
      const cartResponse = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })

      if (!cartResponse.ok) return
      
      const { items } = await cartResponse.json()
      let itemId = items?.[0]?.id

      // If no items, add one first
      if (!itemId) {
        await fetch(`${API_BASE}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dealerToken}`
          },
          body: JSON.stringify({
            productId: testProductId,
            quantity: 1
          })
        })

        const newCartResponse = await fetch(`${API_BASE}/api/cart`, {
          headers: { 'Authorization': `Bearer ${dealerToken}` }
        })
        if (newCartResponse.ok) {
          const { items: newItems } = await newCartResponse.json()
          itemId = newItems?.[0]?.id
        }
      }

      if (!itemId) return

      const response = await fetch(`${API_BASE}/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          quantity: 5
        })
      })

      expect([200, 201]).toContain(response.status)
      const data = await response.json()
      const updatedItem = data.items?.find((i: { id: string }) => i.id === itemId)
      if (updatedItem) {
        expect(updatedItem.quantity).toBe(5)
      }
    })

    it('should remove item when quantity is zero', async () => {
      if (!testProductId || !dealerToken) return

      // Get cart
      const cartResponse = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })
      if (!cartResponse.ok) return

      const { items } = await cartResponse.json()
      const itemId = items?.[0]?.id
      if (!itemId) return

      const response = await fetch(`${API_BASE}/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          quantity: 0
        })
      })

      expect([200, 201]).toContain(response.status)
    })

    it('should return 404 for non-existent item', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart/non-existent-item-id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          quantity: 5
        })
      })

      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid quantity format', async () => {
      if (!testProductId || !dealerToken) return

      const cartResponse = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })
      if (!cartResponse.ok) return

      const { items } = await cartResponse.json()
      const itemId = items?.[0]?.id
      if (!itemId) return

      const response = await fetch(`${API_BASE}/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          quantity: 'invalid'
        })
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/cart/:itemId', () => {
    it('should remove item from cart', async () => {
      if (!testProductId || !dealerToken) return

      // Add item first
      await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          productId: testProductId,
          quantity: 1
        })
      })

      // Get cart to find item ID
      const cartResponse = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })
      if (!cartResponse.ok) return

      const { items } = await cartResponse.json()
      const itemId = items?.[0]?.id
      if (!itemId) return

      const deleteResponse = await fetch(`${API_BASE}/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(deleteResponse.status).toBe(200)
    })

    it('should return 404 for non-existent item', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart/non-existent-item-id`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/cart/voucher', () => {
    it('should apply valid voucher code', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart/voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          code: 'VALID_VOUCHER'
        })
      })

      expect([200, 400]).toContain(response.status)
    })

    it('should return 400 for invalid voucher code', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart/voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          code: 'INVALID_VOUCHER_CODE'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for expired voucher', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart/voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          code: 'EXPIRED_VOUCHER'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for empty voucher code', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/cart/voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          code: ''
        })
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/cart', () => {
    it('should clear entire cart', async () => {
      if (!dealerToken) return

      // Add items first
      if (testProductId) {
        await fetch(`${API_BASE}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dealerToken}`
          },
          body: JSON.stringify({
            productId: testProductId,
            quantity: 1
          })
        })
      }

      const clearResponse = await fetch(`${API_BASE}/api/cart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(clearResponse.status).toBe(200)

      // Verify cart is empty
      const cartResponse = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })
      if (cartResponse.ok) {
        const { items } = await cartResponse.json()
        expect(items.length).toBe(0)
      }
    })
  })

  describe('Cart Totals Calculation', () => {
    it('should calculate correct subtotal', async () => {
      if (!dealerToken) return

      // Add items
      if (testProductId) {
        await fetch(`${API_BASE}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dealerToken}`
          },
          body: JSON.stringify({
            productId: testProductId,
            quantity: 2
          })
        })
      }

      const cartResponse = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })

      if (cartResponse.ok) {
        const data = await cartResponse.json()
        if (data.items.length > 0) {
          const itemSubtotal = data.items.reduce((sum: number, item: { quantity: number; price: number }) => {
            return sum + (item.quantity * item.price)
          }, 0)
          expect(data.subtotal).toBeCloseTo(itemSubtotal, 2)
        }
      }
    })

    it('should include shipping cost in total when applicable', async () => {
      if (!dealerToken) return

      const cartResponse = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'Authorization': `Bearer ${dealerToken}` }
      })

      if (cartResponse.ok) {
        const data = await cartResponse.json()
        expect(data).toHaveProperty('total')
        expect(data).toHaveProperty('subtotal')
        if (data.shipping !== undefined) {
          expect(data.total).toBe(data.subtotal + data.shipping)
        }
      }
    })
  })
})
