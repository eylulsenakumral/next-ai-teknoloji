import React from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import type { ProductListItem } from "../types"
import { COLORS } from "../lib/constants"
import { formatPrice, toNumber } from "../lib/format"
import { imageUri } from "../lib/media"

interface Props {
  product: ProductListItem
  onPress: (slug: string) => void
}

export function ProductCard({ product, onPress }: Props) {
  const image = imageUri(product.images?.[0])
  const price = product.priceTry ?? product.price
  const brandName = product.brand?.name ?? "Marka"
  const stockCount = toNumber(product.stockCount)
  const hasStock = Boolean(product.stockStatus) || stockCount > 0

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => product.slug && onPress(product.slug)}
      activeOpacity={0.7}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Görsel yok</Text>
        </View>
      )}
      <Text style={styles.brand}>{brandName}</Text>
      <Text style={styles.name} numberOfLines={2}>{product.name ?? "Ürün"}</Text>
      <View style={styles.row}>
        {price != null && !product.hidePrice ? (
          <Text style={styles.price}>{formatPrice(price)}</Text>
        ) : (
          <Text style={styles.hiddenPrice}>Fiyat için giriş yapın</Text>
        )}
      </View>
      <View style={[styles.row, { marginTop: 4 }]}>
        <View style={[styles.stockDot, { backgroundColor: hasStock ? COLORS.success : COLORS.danger }]} />
        <Text style={styles.stockText}>
          {hasStock ? `Stokta (${stockCount})` : "Tükendi"}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: "50%",
  },
  image: { width: "100%", height: 120, borderRadius: 8 },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: COLORS.textMuted, fontSize: 12 },
  brand: { fontSize: 11, color: COLORS.primary, fontWeight: "600", marginTop: 8 },
  name: { fontSize: 13, color: COLORS.text, fontWeight: "500", marginTop: 2, lineHeight: 18 },
  row: { flexDirection: "row", alignItems: "center" },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  hiddenPrice: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  stockDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  stockText: { fontSize: 11, color: COLORS.textMuted },
})
