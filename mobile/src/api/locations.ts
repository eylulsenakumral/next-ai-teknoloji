import { api } from "./client"
import type { City, District } from "../types"

export const locationsApi = {
  cities() {
    return api.get<{ data: City[] }>("/api/locations/cities")
  },

  districts(cityId: number) {
    return api.get<{ data: District[] }>("/api/locations/districts", { cityId })
  },
}
