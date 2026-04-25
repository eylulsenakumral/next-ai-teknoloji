import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../src/lib/constants"
import { formatPrice } from "../src/lib/format"

export default function OrderConfirmationScreen() {
  const router = useRouter()
  const { orderNumber, orderId, total } = useLocalSearchParams<{ orderNumber?: string; orderId?: string; total?: string }>()

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark" size={58} color="#fff" />
      </View>
      <Text style={styles.title}>Siparişiniz alındı</Text>
      <Text style={styles.description}>Ekibimiz siparişinizi kontrol edip en kısa sürede işleme alacak.</Text>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sipariş No</Text>
          <Text style={styles.summaryValue}>{orderNumber ?? "-"}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Toplam</Text>
          <Text style={styles.summaryValue}>{formatPrice(total ?? 0)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.replace(orderId ? `/siparis/${orderId}` : "/siparisler")}
      >
        <Text style={styles.primaryBtnText}>Siparişi Görüntüle</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace("/")}>
        <Text style={styles.secondaryBtnText}>Ana Sayfaya Dön</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: COLORS.background },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.success,
  },
  title: { marginTop: 22, fontSize: 24, fontWeight: "900", color: COLORS.text, textAlign: "center" },
  description: { marginTop: 10, fontSize: 15, color: COLORS.textMuted, textAlign: "center", lineHeight: 22 },
  summary: {
    alignSelf: "stretch",
    marginTop: 26,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  summaryLabel: { color: COLORS.textMuted, fontSize: 14 },
  summaryValue: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  primaryBtn: {
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  secondaryBtn: { alignSelf: "stretch", alignItems: "center", marginTop: 10, paddingVertical: 15 },
  secondaryBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: "800" },
})
