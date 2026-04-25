import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import type { ExchangeRate } from "../types"
import { exchangeApi } from "../api/exchange"
import { COLORS } from "../lib/constants"

export function ExchangeRateBar() {
  const [rate, setRate] = useState<ExchangeRate | null>(null)

  useEffect(() => {
    exchangeApi.get().then(setRate).catch(() => {})
  }, [])

  if (!rate) return null

  return (
    <View style={styles.bar}>
      <View style={styles.item}>
        <Text style={styles.label}>USD</Text>
        <Text style={styles.value}>{rate.usd.toFixed(2)} ₺</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Text style={styles.label}>EUR</Text>
        <Text style={styles.value}>{rate.eur.toFixed(2)} ₺</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  divider: { width: 1, height: 16, backgroundColor: "#444", marginHorizontal: 16 },
  label: { fontSize: 12, color: "#aaa", fontWeight: "600" },
  value: { fontSize: 13, color: "#fff", fontWeight: "700", fontVariant: ["tabular-nums"] },
})
