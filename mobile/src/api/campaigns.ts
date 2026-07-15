import { api } from "./client"

export interface CampaignProduct {
  sortOrder: number
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    brand: { name: string; slug: string }
    category: { name: string; slug: string }
    stockStatus: boolean
  }
}

export interface Campaign {
  id: string
  title: string
  description?: string | null
  type: "FEATURED" | "OUTLET" | "BUNDLE"
  price: number | null
  currency: string
  priceTry: number | null
  discountPct?: number | null
  sortOrder: number
  products: CampaignProduct[]
}

export interface CampaignListResponse {
  data: Campaign[]
}

export const campaignsApi = {
  list(params?: { limit?: number }) {
    return api.get<CampaignListResponse>("/api/public/campaigns", params)
  },
}
