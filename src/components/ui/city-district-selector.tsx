"use client"

import { useState, useEffect, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Loader2, MapPin, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface City {
  id: number
  name: string
  plateCode: number
}

interface District {
  id: number
  name: string
}

interface CityDistrictSelectorProps {
  cityId: number | null
  districtId: number | null
  onCityChange: (cityId: number | null, cityName: string) => void
  onDistrictChange: (districtId: number | null, districtName: string) => void
  cityName?: string
  districtName?: string
  disabled?: boolean
  showLabels?: boolean
  className?: string
}

export function CityDistrictSelector({
  cityId,
  districtId,
  onCityChange,
  onDistrictChange,
  disabled = false,
  showLabels = true,
  className,
}: CityDistrictSelectorProps) {
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [loadingCities, setLoadingCities] = useState(true)
  const [loadingDistricts, setLoadingDistricts] = useState(false)

  useEffect(() => {
    fetch("/api/locations/cities")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setCities(json.data)
      })
      .catch(() => {})
      .finally(() => setLoadingCities(false))
  }, [])

  const fetchDistricts = useCallback(async (id: number) => {
    setLoadingDistricts(true)
    try {
      const res = await fetch(`/api/locations/districts?cityId=${id}`)
      const json = await res.json()
      if (json.data) setDistricts(json.data)
    } catch {
      setDistricts([])
    } finally {
      setLoadingDistricts(false)
    }
  }, [])

  useEffect(() => {
    if (cityId) {
      fetchDistricts(cityId)
    } else {
      setDistricts([])
    }
  }, [cityId, fetchDistricts])

  const selectClass = cn(
    "w-full h-10 px-3 rounded-lg border border-[#e0e0e0] bg-white text-[#333333] text-sm",
    "outline-none focus:border-[#00179e] focus:ring-2 focus:ring-[#00179e]/20 transition-all",
    "appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  )

  return (
    <div className={className}>
      {/* İl */}
      <div className="space-y-1.5">
        {showLabels && (
          <Label className="flex items-center gap-1.5 text-sm text-[#333333]">
            <MapPin className="h-3.5 w-3.5 text-[#767676]" />
            İl
          </Label>
        )}
        <div className="relative">
          <select
            value={cityId ? String(cityId) : ""}
            onChange={(e) => {
              const val = e.target.value
              if (!val) {
                onCityChange(null, "")
                onDistrictChange(null, "")
                setDistricts([])
                return
              }
              const id = parseInt(val, 10)
              const city = cities.find((c) => c.id === id)
              onCityChange(id, city?.name ?? "")
              onDistrictChange(null, "")
            }}
            disabled={disabled || loadingCities}
            className={selectClass}
          >
            <option value="">
              {loadingCities ? "Yükleniyor..." : "İl seçin..."}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={String(city.id)}>
                {city.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            {loadingCities ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#767676]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#767676]" />
            )}
          </div>
        </div>
      </div>

      {/* İlçe */}
      <div className="space-y-1.5">
        {showLabels && (
          <Label className="flex items-center gap-1.5 text-sm text-[#333333]">
            <MapPin className="h-3.5 w-3.5 text-[#767676]" />
            İlçe
          </Label>
        )}
        <div className="relative">
          <select
            value={districtId ? String(districtId) : ""}
            onChange={(e) => {
              const val = e.target.value
              if (!val) {
                onDistrictChange(null, "")
                return
              }
              const id = parseInt(val, 10)
              const district = districts.find((d) => d.id === id)
              onDistrictChange(id, district?.name ?? "")
            }}
            disabled={disabled || !cityId || loadingDistricts}
            className={selectClass}
          >
            <option value="">
              {loadingDistricts ? "Yükleniyor..." : cityId ? "İlçe seçin..." : "Önce il seçin"}
            </option>
            {districts.map((district) => (
              <option key={district.id} value={String(district.id)}>
                {district.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            {loadingDistricts ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#767676]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#767676]" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
