import { create } from "zustand"
import type { Customer } from "../types"
import { checkAuth, login as apiLogin, logout as apiLogout } from "../api/auth"
import { clearSession } from "../lib/storage"

interface AuthState {
  user: Customer | null
  isLoading: boolean
  isAuthenticated: boolean

  initialize: () => Promise<void>
  login: (dealerCode: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: Customer) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const user = await checkAuth()
      set({ user, isAuthenticated: !!user, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (dealerCode, password) => {
    set({ isLoading: true })
    try {
      const user = await apiLogin(dealerCode, password)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: async () => {
    await apiLogout()
    set({ user: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user }),
}))
