import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { COLORS } from "../lib/constants"
import { formatPrice } from "../lib/format"

interface Props {
  salePriceIncVat: number
  salePriceExVat?: number
  vatRate?: number
  currency?: string
  size?: "large" | "normal" | "small"
}

export function PriceDisplay({ salePriceIncVat, salePriceExVat, vatRate = 20, currency = "TRY", size = "normal" }: Props) {
  const fontSize = size === "large" ? 24 : size === "small" ? 14 : 18

  return (
    <View>
      <Text style={[styles.price, { fontSize }]}>{formatPrice(salePriceIncVat, currency)}</Text>
      {salePriceExVat != null && (
        <Text style={styles.exVat}>
          KDV hariç: {formatPrice(salePriceExVat, currency)} (%{vatRate} KDV)
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  price: {
    fontWeight: "700",
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
  },
  exVat: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
})
