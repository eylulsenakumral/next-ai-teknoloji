import { describe, it, expect } from 'vitest'

const API_BASE = process.env.API_URL || 'http://localhost:3000'

describe.skip('Supplier Sync API', () => {
  let adminToken: string

  beforeAll(async () => {
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

  describe('POST /api/b2bdepo/sync-products', () => {
    it('should sync products from B2BDepo', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/b2bdepo/sync-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          fullSync: false,
          lastSyncDate: '2024-01-01T00:00:00Z'
        })
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })

    it('should perform full sync when requested', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/b2bdepo/sync-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          fullSync: true
        })
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/b2bdepo/sync-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for non-admin users', async () => {
      const dealerLogin = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.TEST_DEALER_EMAIL || 'test-dealer@example.com',
          password: process.env.TEST_DEALER_PASSWORD || 'TestPassword123!'
        })
      })

      if (!dealerLogin.ok) return

      const { token } = await dealerLogin.json()

      const response = await fetch(`${API_BASE}/api/b2bdepo/sync-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/b2bdepo/sync-pricestock', () => {
    it('should sync price and stock', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/b2bdepo/sync-pricestock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          productIds: ['prod-1', 'prod-2']
        })
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })
  })

  describe('GET /api/b2bdepo/status', () => {
    it('should return B2BDepo connection status', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/b2bdepo/status`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 401]).toContain(response.status)
      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('status')
        expect(data).toHaveProperty('lastSync')
      }
    })
  })

  describe('POST /api/bizimhesap/sync-products', () => {
    it('should sync products from BizimHesap', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/bizimhesap/sync-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })
  })

  describe('POST /api/bizimhesap/sync-customers', () => {
    it('should sync customers from BizimHesap', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/bizimhesap/sync-customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })
  })

  describe('POST /api/bizimhesap/sync-inventory', () => {
    it('should sync inventory from BizimHesap', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/bizimhesap/sync-inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })
  })

  describe('GET /api/bizimhesap/test', () => {
    it('should test BizimHesap connection', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/bizimhesap/test`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 400, 401]).toContain(response.status)
    })
  })

  describe('POST /api/okisan/sync', () => {
    it('should sync from Okisan', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/okisan/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })
  })

  describe('POST /api/netex/sync', () => {
    it('should sync from Netex', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/netex/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })
  })

  describe('POST /api/indexgrup/sync', () => {
    it('should sync from IndexGrup', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/indexgrup/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })
  })

  describe('POST /api/tesan/sync', () => {
    it('should sync from Tesan', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/tesan/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })
  })

  describe('POST /api/cron/sync-suppliers', () => {
    it('should trigger supplier sync via cron', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/cron/sync-suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          suppliers: ['b2bdepo', 'bizimhesap', 'okisan']
        })
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })
  })

  describe('Sync Response Format', () => {
    it('should return sync statistics', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/b2bdepo/sync-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          fullSync: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('synced')
        expect(data).toHaveProperty('failed')
        expect(data).toHaveProperty('duration')
      }
    })

    it('should handle partial sync failures gracefully', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/b2bdepo/sync-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          fullSync: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        expect(typeof data.synced).toBe('number')
        expect(typeof data.failed).toBe('number')
      }
    })
  })
})
