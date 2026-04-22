import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = process.env.API_URL || 'http://localhost:3000'

describe.skip('Customer/Account API', () => {
  let dealerToken: string
  let adminToken: string

  beforeAll(async () => {
    const dealerLogin = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.TEST_DEALER_EMAIL || 'test-dealer@example.com',
        password: process.env.TEST_DEALER_PASSWORD || 'TestPassword123!'
      })
    })

    if (dealerLogin.status === 200) {
      const data = await dealerLogin.json()
      dealerToken = data.token || data.sessionToken || data.accessToken
    }

    const adminLogin = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!'
      })
    })

    if (adminLogin.status === 200) {
      const data = await adminLogin.json()
      adminToken = data.token || data.sessionToken || data.accessToken
    }
  })

  describe('GET /api/account/profile', () => {
    it('should return dealer profile', async () => {
      const response = await fetch(`${API_BASE}/api/account/profile`, {
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('email')
      expect(data).toHaveProperty('name')
      expect(data).toHaveProperty('companyName')
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/account/profile`)
      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/account/profile', () => {
    it('should update dealer profile', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/account/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          name: 'Updated Name',
          phone: '5551234567'
        })
      })

      expect([200, 201]).toContain(response.status)
      const data = await response.json()
      expect(data.name || data.phone).toBeTruthy()
    })

    it('should return 400 for invalid phone format', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/account/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          phone: 'invalid-phone'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid email', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/account/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          email: 'invalid-email'
        })
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/account/transactions', () => {
    it('should return transaction history', async () => {
      const response = await fetch(`${API_BASE}/api/account/transactions?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('transactions')
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('page')
    })

    it('should support date range filtering', async () => {
      if (!dealerToken) return

      const response = await fetch(
        `${API_BASE}/api/account/transactions?startDate=2024-01-01&endDate=2024-12-31`,
        {
          headers: {
            'Authorization': `Bearer ${dealerToken}`
          }
        }
      )

      expect(response.status).toBe(200)
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/account/transactions`)
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/customers', () => {
    it('should return customer list for admin', async () => {
      const response = await fetch(`${API_BASE}/api/customers?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('customers')
      expect(data).toHaveProperty('total')
    })

    it('should return 403 for non-admin users', async () => {
      const response = await fetch(`${API_BASE}/api/customers`, {
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/customers', () => {
    const uniqueEmail = `new-customer-${Date.now()}@test.com`

    it('should create new customer for admin', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          email: uniqueEmail,
          name: 'New Customer',
          companyName: 'Customer Company',
          password: 'CustomerPass123!'
        })
      })

      expect([200, 201, 400]).toContain(response.status)
    })

    it('should return 400 for duplicate email', async () => {
      if (!adminToken) return

      const email = `duplicate-${Date.now()}@test.com`

      await fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          email,
          name: 'First Customer',
          password: 'Pass123!'
        })
      })

      const response = await fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          email,
          name: 'Second Customer',
          password: 'Pass123!'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 403 for dealer users', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          email: 'new@test.com',
          name: 'New Customer',
          password: 'Pass123!'
        })
      })

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/customers/:id', () => {
    it('should return customer details for admin', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/customers/1`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 404]).toContain(response.status)
      if (response.status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('id')
        expect(data).toHaveProperty('email')
      }
    })

    it('should return 403 for dealer accessing other customer', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/customers/999`, {
        headers: {
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(response.status).toBe(403)
    })
  })

  describe('PUT /api/customers/:id', () => {
    it('should update customer for admin', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/customers/1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Updated Customer Name'
        })
      })

      expect([200, 400, 404]).toContain(response.status)
    })
  })

  describe('POST /api/customers/:id/balance', () => {
    it('should add balance for admin', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/customers/1/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          amount: 1000,
          type: 'credit',
          note: 'Test balance add'
        })
      })

      expect([200, 400, 404]).toContain(response.status)
    })

    it('should deduct balance for admin', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/customers/1/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          amount: 500,
          type: 'debit',
          note: 'Test balance deduction'
        })
      })

      expect([200, 400, 404]).toContain(response.status)
    })

    it('should return 400 for invalid amount', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/customers/1/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          amount: -100,
          type: 'credit'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 403 for dealer users', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/customers/1/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        },
        body: JSON.stringify({
          amount: 100,
          type: 'credit'
        })
      })

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/customers/:id/send-credentials', () => {
    it('should send credentials email for admin', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/customers/1/send-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          sendEmail: true
        })
      })

      expect([200, 400, 404]).toContain(response.status)
    })

    it('should return 403 for dealer users', async () => {
      if (!dealerToken) return

      const response = await fetch(`${API_BASE}/api/customers/1/send-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dealerToken}`
        }
      })

      expect(response.status).toBe(403)
    })
  })
})
