import React, { useEffect, useState } from "react"
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { ordersApi } from "../../src/api/orders"
import { COLORS } from "../../src/lib/constants"
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from "../../src/lib/format"
import type { Order } from "../../src/types"
import { Ionicons } from "@expo/vector-icons"

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"]

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ordersApi.detail(id)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return <ActivityIndicator color={COLORS.primary} style={{ flex: 1, marginTop: 40 }} />
  if (!order) return <Text style={{ padding: 20 }}>Sipariş bulunamadı</Text>

  const currentStep = STATUS_STEPS.indexOf(order.status)

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Order header */}
      <View style={styles.header}>
        <Text style={styles.orderNo}>{order.orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(order.status) }]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.date}>{formatDate(order.createdAt)}</Text>

      {/* Timeline */}
      <View style={styles.timeline}>
        {STATUS_STEPS.map((step, i) => (
          <View key={step} style={styles.timelineRow}>
            <View style={[styles.timelineDot, i <= currentStep && styles.timelineDotActive]} />
            {i < STATUS_STEPS.length - 1 && (
              <View style={[styles.timelineLine, i < currentStep && styles.timelineLineActive]} />
            )}
            <Text style={[styles.timelineLabel, i <= currentStep && styles.timelineLabelActive]}>
              {getStatusLabel(step)}
            </Text>
          </View>
        ))}
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ürünler</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Ürün</Text>
              <Text style={styles.itemQty}>{item.quantity} adet</Text>
            </View>
            <Text style={styles.itemTotal}>{formatPrice(item.totalPrice)}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Toplam</Text>
        <Text style={styles.totalAmount}>{formatPrice(order.totalAmount, order.currency)}</Text>
      </View>

      {/* Shipping address */}
      {order.shippingAddress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
          <Text style={styles.address}>{order.shippingAddress.address}</Text>
          <Text style={styles.address}>
            {order.shippingAddress.district}, {order.shippingAddress.city}
          </Text>
        </View>
      )}

      {/* Tracking */}
      {order.trackingNumber && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kargo Takip</Text>
          <Text style={styles.tracking}>{order.trackingNumber}</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  orderNo: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  date: { fontSize: 14, color: COLORS.textMuted, paddingHorizontal: 16, paddingTop: 8, backgroundColor: COLORS.surface, paddingBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  timeline: { padding: 20, backgroundColor: COLORS.surface, marginTop: 12 },
  timelineRow: { flexDirection: "row", alignItems: "center", height: 36, position: "relative" },
  timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.surface, zIndex: 1 },
  timelineDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timelineLine: { position: "absolute", left: 6, top: 14, width: 2, height: 22, backgroundColor: COLORS.border },
  timelineLineActive: { backgroundColor: COLORS.primary },
  timelineLabel: { marginLeft: 12, fontSize: 14, color: COLORS.textMuted },
  timelineLabelActive: { color: COLORS.text, fontWeight: "600" },
  section: { backgroundColor: COLORS.surface, marginTop: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 12 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemName: { fontSize: 14, color: COLORS.text },
  itemQty: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: "600", color: COLORS.text, fontVariant: ["tabular-nums"] },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.surface, marginTop: 12, padding: 16 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  totalAmount: { fontSize: 22, fontWeight: "800", color: COLORS.text, fontVariant: ["tabular-nums"] },
  address: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  tracking: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
})
