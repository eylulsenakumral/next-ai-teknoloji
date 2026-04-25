import { API_BASE_URL } from "../lib/constants"
import { getSessionToken, clearSession } from "../lib/storage"

class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(`API Error ${status}`)
    this.status = status
    this.data = data
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }
  if (token) {
    headers["Cookie"] = `next-auth.session-token=${token}; __Secure-next-auth.session-token=${token}`
  }
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    await clearSession()
    throw new ApiError(401, { message: "Oturum süresi dolmuş" })
  }
  if (!res.ok) {
    let data: unknown
    try {
      data = await res.json()
    } catch {
      data = await res.text()
    }
    throw new ApiError(res.status, data)
  }
  return res.json() as Promise<T>
}

// Extract Set-Cookie from response headers
function extractSessionToken(res: Response): string | null {
  const setCookie = res.headers.get("set-cookie")
  if (!setCookie) return null
  const match = setCookie.match(/(?:__Secure-)?next-auth\.session-token=([^;]+)/)
  return match ? match[1] : null
}

export const api = {
  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = new URL(path, API_BASE_URL)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") url.searchParams.set(k, String(v))
      })
    }
    const headers = await getAuthHeaders()
    const res = await fetch(url.toString(), { headers, credentials: "include" })
    return handleResponse<T>(res)
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    })
    // Try to extract session cookie from login response
    const token = extractSessionToken(res)
    if (token) {
      const { setSessionToken } = require("../lib/storage")
      await setSessionToken(token)
    }
    return handleResponse<T>(res)
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    })
    return handleResponse<T>(res)
  },

  async del<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, API_BASE_URL)
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }
    const headers = await getAuthHeaders()
    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers,
      credentials: "include",
    })
    return handleResponse<T>(res)
  },
}

export { ApiError }
