import { api } from "./client"
import type { ExchangeRate } from "../types"

export const exchangeApi = {
  get() {
    return api.get<ExchangeRate>("/api/exchange-rate")
  },
}
