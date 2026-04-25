import { API_BASE_URL } from "./constants"

export function imageUri(value?: string | null): string | null {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith("//")) return `https:${value}`
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`
  return `${API_BASE_URL}/${value}`
}
