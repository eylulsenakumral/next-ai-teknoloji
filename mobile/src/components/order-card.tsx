import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import type { Order } from "../types"
import { COLORS } from "../lib/constants"
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from "../lib/format"

interface Props {
  order: Order
  onPress: (id: string) => void
}

export function OrderCard({ order, onPress }: Props) {
  const itemCount = order.itemCount ?? order.items.length

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(order.id)} activeOpacity={0.7}>
      <View style={styles.rowBetween}>
        <Text style={styles.orderNo}>{order.orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(order.status) }]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        <Text style={styles.amount}>{formatPrice(order.totalAmount, order.currency)}</Text>
      </View>
      <Text style={styles.items}>{itemCount} ürün</Text>
      {order.previewItems && order.previewItems.length > 0 && (
        <Text style={styles.previewItems} numberOfLines={1}>
          {order.previewItems.join(", ")}
          {itemCount > order.previewItems.length ? ` +${itemCount - order.previewItems.length} ürün` : ""}
        </Text>
      )}
      {order.trackingNumber && (
        <Text style={styles.tracking}>Kargo: {order.trackingNumber}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderNo: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  date: { fontSize: 13, color: COLORS.textMuted, marginTop: 6 },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  items: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  previewItems: { fontSize: 12, color: "#6b7280", marginTop: 3 },
  tracking: { fontSize: 12, color: COLORS.primary, marginTop: 4 },
})
