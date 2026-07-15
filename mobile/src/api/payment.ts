import { api } from "./client"
import type { NomuPayTicketResponse } from "../types"

export const paymentApi = {
  createNomuPayMobileTicket(orderId: string) {
    return api.post<NomuPayTicketResponse>("/api/payment/nomupay/mobile", { orderId })
  },
}
