import { api } from "./client"
import type { ProfileResponse, Customer } from "../types"
import { setSessionToken, clearSession, setUserData, getSessionToken } from "../lib/storage"

/**
 * Mobile login endpoint — bypasses NextAuth CSRF
 */
export async function login(dealerCode: string, password: string): Promise<Customer> {
  const res = await fetch("https://nexadepo.com/api/auth/mobile-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ dealerCode, password }),
    credentials: "include",
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Giriş başarısız" }))
    throw new Error((error as any).error ?? "Giriş başarısız")
  }

  const result = await res.json()
  const customer = result.data as Customer

  const setCookie = res.headers.get("set-cookie") ?? ""
  const match = setCookie.match(/(?:__Secure-)?next-auth\.session-token=([^;]+)/)
  const sessionToken = result.sessionToken ?? match?.[1]
  if (sessionToken) {
    await setSessionToken(sessionToken)
  }

  await setUserData(customer)
  return customer
}

export async function getProfile(): Promise<Customer | null> {
  const token = await getSessionToken()
  if (!token) return null
  try {
    const profile = await api.get<ProfileResponse>("/api/account/profile")
    await setUserData(profile.data)
    return profile.data
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post("/api/auth/signout")
  } catch {
    // ignore
  }
  await clearSession()
}

export async function checkAuth(): Promise<Customer | null> {
  const token = await getSessionToken()
  if (!token) return null
  return getProfile()
}
