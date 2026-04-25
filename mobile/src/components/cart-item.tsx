import React from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import type { CartItem } from "../types"
import { COLORS } from "../lib/constants"
import { formatPrice, toNumber } from "../lib/format"
import { imageUri } from "../lib/media"
import { Ionicons } from "@expo/vector-icons"

interface Props {
  item: CartItem
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: Props) {
  const image = imageUri(item.product?.images?.[0])
  const stock = toNumber(item.product?.supplierProducts?.[0]?.stockQuantity)
  const quantity = toNumber(item.quantity, 1)
  const price = toNumber(item.priceSnapshot)

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.brand}>{item.product?.brand?.name ?? "Marka"}</Text>
          <Text style={styles.name} numberOfLines={2}>{item.product?.name ?? "Ürün"}</Text>
          <Text style={styles.price}>{formatPrice(price)}</Text>
          {stock < quantity && (
            <Text style={styles.stockWarning}>Stokta {stock} adet var</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => onRemove(item.id)} hitSlop={12}>
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
      <View style={styles.quantityRow}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onUpdateQuantity(item.id, Math.max(1, quantity - 1))}
        >
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onUpdateQuantity(item.id, quantity + 1)}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.lineTotal}>{formatPrice(price * quantity)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { flexDirection: "row", alignItems: "center" },
  image: { width: 60, height: 60, borderRadius: 8 },
  placeholder: {
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, marginLeft: 12 },
  brand: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  name: { fontSize: 14, color: COLORS.text, fontWeight: "500", marginTop: 2 },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  stockWarning: { fontSize: 11, color: COLORS.danger, marginTop: 2 },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 18, color: COLORS.primary, fontWeight: "600" },
  qty: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    fontVariant: ["tabular-nums"],
  },
  lineTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: "auto",
    fontVariant: ["tabular-nums"],
  },
})
