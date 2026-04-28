import React, { useState } from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native"
import type { ProductListItem } from "../types"
import { COLORS } from "../lib/constants"
import { formatPrice, toNumber } from "../lib/format"
import { imageUri } from "../lib/media"
import { cartApi } from "../api/cart"
import { useCartStore } from "../stores/cart-store"
import { Ionicons } from "@expo/vector-icons"

interface Props {
  product: ProductListItem
  onPress: (slug: string) => void
  cardStyle?: object
}

export function ProductCard({ product, onPress, cardStyle }: Props) {
  const [adding, setAdding] = useState(false)
  const fetchCart = useCartStore((s) => s.fetch)
  const image = imageUri(product.images?.[0])
  const price = product.price
  const currency = product.currency || "USD"
  const priceTry = product.priceTry
  const brandName = product.brand?.name
  const stockCount = toNumber(product.stockCount)
  const hasStock = Boolean(product.stockStatus) || stockCount > 0

  const addToCart = async () => {
    if (!product.id || adding) return
    setAdding(true)
    try {
      await cartApi.add(product.id, 1)
      await fetchCart()
    } catch {
      Alert.alert("Hata", "Ürün sepete eklenemedi.")
    } finally {
      setAdding(false)
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, cardStyle]}
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
      {brandName ? <Text style={styles.brand}>{brandName}</Text> : null}
      <Text style={styles.name} numberOfLines={3}>{product.name ?? "Ürün"}</Text>
      <View style={styles.priceBlock}>
        {price != null && !product.hidePrice ? (
          <>
            {product.originalPrice != null && product.originalPrice > price && (
              <Text style={styles.originalPrice}>{formatPrice(product.originalPrice, currency)}</Text>
            )}
            <Text style={styles.price}>
              {formatPrice(price, currency)}
              <Text style={styles.vat}> +KDV</Text>
            </Text>
            {priceTry != null && currency !== "TRY" && (
              <Text style={styles.priceTry}>{formatPrice(priceTry, "TRY")} KDV Dahil</Text>
            )}
          </>
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
      <TouchableOpacity
        style={[styles.addBtn, (!hasStock || adding) && styles.addBtnDisabled]}
        onPress={(event) => {
          event.stopPropagation()
          addToCart()
        }}
        disabled={!hasStock || adding}
      >
        <Ionicons name={adding ? "hourglass-outline" : "add"} size={18} color="#fff" />
        <Text style={styles.addBtnText}>{adding ? "Ekleniyor" : "Sepete Ekle"}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    maxWidth: "50%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  image: { width: "100%", height: 120, borderRadius: 10 },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: COLORS.textMuted, fontSize: 12 },
  brand: { fontSize: 11, color: COLORS.primary, fontWeight: "700", marginTop: 8 },
  name: { fontSize: 13, color: "#1a1a1a", fontWeight: "600", marginTop: 2, lineHeight: 18 },
  row: { flexDirection: "row", alignItems: "center" },
  priceBlock: { marginTop: 4 },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
    fontVariant: ["tabular-nums"],
  },
  vat: { fontSize: 10, fontWeight: "400", color: COLORS.textMuted },
  priceTry: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  originalPrice: {
    fontSize: 11,
    color: "#999",
    textDecorationLine: "line-through",
    marginBottom: 1,
  },
  hiddenPrice: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  stockDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  stockText: { fontSize: 11, color: COLORS.textMuted },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnDisabled: { opacity: 0.50, shadowOpacity: 0 },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
})
