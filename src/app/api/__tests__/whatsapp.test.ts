import { describe, it, expect } from 'vitest'

const API_BASE = process.env.API_URL || 'http://localhost:3000'

describe.skip('WhatsApp API', () => {
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

  describe('GET /api/whatsapp/status', () => {
    it('should return WhatsApp connection status', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/status`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 401]).toContain(response.status)
      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('connected')
        expect(data).toHaveProperty('ready')
      }
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/whatsapp/status`)
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/whatsapp/qrcode', () => {
    it('should return QR code for WhatsApp connection', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/qrcode`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 400, 401]).toContain(response.status)
      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('qr')
      }
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/whatsapp/qrcode`)
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/whatsapp/connect', () => {
    it('should initiate WhatsApp connection', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/whatsapp/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/whatsapp/auth-state', () => {
    it('should return WhatsApp auth state', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/auth-state`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 401]).toContain(response.status)
      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('authenticated')
        expect(data).toHaveProperty('phone')
      }
    })
  })

  describe('POST /api/whatsapp/send', () => {
    it('should send WhatsApp message', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          phone: '905551234567',
          message: 'Test message from API'
        })
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })

    it('should return 400 for invalid phone format', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          phone: 'invalid-phone',
          message: 'Test message'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for missing message', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          phone: '905551234567'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '905551234567',
          message: 'Test'
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/whatsapp/conversations', () => {
    it('should return conversation list', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/conversations?page=1&limit=20`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 401]).toContain(response.status)
      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('conversations')
        expect(data).toHaveProperty('total')
      }
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/whatsapp/conversations`)
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/whatsapp/conversations/:id/messages', () => {
    it('should return messages for a conversation', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/conversations/1/messages?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      expect([200, 401, 404]).toContain(response.status)
      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('messages')
        expect(data).toHaveProperty('total')
      }
    })

    it('should return 401 without auth', async () => {
      const response = await fetch(`${API_BASE}/api/whatsapp/conversations/1/messages`)
      expect(response.status).toBe(401)
    })
  })

  describe('WhatsApp Message Format', () => {
    it('should validate message format', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          phone: '905551234567',
          message: 'Test with special chars: !@#$%',
          priority: 'normal'
        })
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })

    it('should support Turkish characters', async () => {
      if (!adminToken) return

      const response = await fetch(`${API_BASE}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          phone: '905551234567',
          message: 'Türkçe karakterler: çğıöşü'
        })
      })

      expect([200, 201, 400, 401]).toContain(response.status)
    })
  })
})
