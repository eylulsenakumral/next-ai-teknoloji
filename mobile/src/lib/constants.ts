import Constants from "expo-constants"

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ?? "https://nexadepo.com"

export const COLORS = {
  primary: "#0040a4",
  primaryLight: "#2189ff",
  secondary: "#1a1a2e",
  background: "#f3f3f3",
  surface: "#ffffff",
  text: "#1a1a1a",
  textMuted: "#6b7280",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#ef4444",
  border: "#e5e7eb",
} as const

export const STORAGE_KEYS = {
  SESSION_TOKEN: "next-auth.session-token",
  USER_DATA: "nexadepo_user",
} as const

export const PAGE_SIZE = 20
