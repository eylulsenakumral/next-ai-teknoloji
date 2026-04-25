import { api } from "./client"
import type { OrderListResponse, Order, OrderCreatePayload, OrderCreateResponse } from "../types"

export const ordersApi = {
  list(params?: { page?: number; limit?: number; status?: string }) {
    return api.get<OrderListResponse>("/api/orders", params as Record<string, string | number>)
  },

  detail(id: string) {
    return api.get<{ data: Order }>(`/api/orders/${id}`)
  },

  create(payload: OrderCreatePayload) {
    return api.post<OrderCreateResponse>("/api/orders", payload)
  },

  cancel(id: string) {
    return api.del<{ data: { success: boolean } }>(`/api/orders/${id}`)
  },
}
