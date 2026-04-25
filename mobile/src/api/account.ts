import { api } from "./client"
import type { TransactionListResponse, ProfileResponse, Customer } from "../types"

export const accountApi = {
  profile() {
    return api.get<ProfileResponse>("/api/account/profile")
  },

  updateProfile(data: Partial<Pick<Customer, "contactName" | "phone" | "email">>) {
    return api.put<ProfileResponse>("/api/account/profile", data)
  },

  transactions(params?: {
    page?: number
    limit?: number
    type?: string
    dateFrom?: string
    dateTo?: string
  }) {
    return api.get<TransactionListResponse>("/api/account/transactions", params as Record<string, string | number>)
  },
}
