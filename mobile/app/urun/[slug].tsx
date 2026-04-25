import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  FlatList,
  Dimensions,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { productsApi } from "../../src/api/products"
import { cartApi } from "../../src/api/cart"
import { wishlistApi } from "../../src/api/wishlist"
import { PriceDisplay } from "../../src/components/price-display"
import { COLORS } from "../../src/lib/constants"
import { toNumber } from "../../src/lib/format"
import { imageUri } from "../../src/lib/media"
import { useCartStore } from "../../src/stores/cart-store"
import type { ProductDetail, RelatedProduct } from "../../src/types"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const fetchCart = useCartStore((s) => s.fetch)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [related, setRelated] = useState<RelatedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isFav, setIsFav] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    productsApi.detail(slug)
      .then((res) => {
        setProduct(res.product)
        setRelated(res.relatedProducts ?? [])
      })
      .catch(() => Alert.alert("Hata", "Ürün bulunamadı"))
      .finally(() => setIsLoading(false))
  }, [slug])

  const handleAddToCart = async () => {
    if (!product) return
    setAdding(true)
    try {
      await cartApi.add(product.id, quantity)
      await fetchCart()
      Alert.alert("Başarılı", "Ürün sepete eklendi")
    } catch {
      Alert.alert("Hata", "Sepete eklenemedi")
    } finally {
      setAdding(false)
    }
  }

  const toggleFav = async () => {
    if (!product) return
    try {
      if (isFav) {
        await wishlistApi.remove(product.id)
      } else {
        await wishlistApi.add(product.id)
      }
      setIsFav(!isFav)
    } catch {}
  }

  if (isLoading) {
    return <ActivityIndicator color={COLORS.primary} style={{ flex: 1, marginTop: 40 }} />
  }

  if (!product) return null

  const images = product.images?.map(imageUri).filter((uri): uri is string => Boolean(uri)) ?? []
  const pricing = product.pricing ?? { salePriceIncVat: 0, salePriceExVat: 0, vatRate: 0, currency: "TRY" }
  const stock = product.stock ?? { quantity: 0, isAvailable: false }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Images */}
        {images.length > 0 ? (
          <FlatList
            data={images}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {}}>
                <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
              </TouchableOpacity>
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageList}
          />
        ) : (
          <View style={[styles.imageList, styles.noImage]}>
            <Ionicons name="image-outline" size={48} color={COLORS.textMuted} />
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.brand}>{product.brand?.name ?? "Marka"}</Text>
          <Text style={styles.name}>{product.name}</Text>

          {/* Price */}
          <PriceDisplay
            salePriceIncVat={toNumber(pricing.salePriceIncVat)}
            salePriceExVat={toNumber(pricing.salePriceExVat)}
            vatRate={toNumber(pricing.vatRate)}
            currency={pricing.currency ?? "TRY"}
            size="large"
          />

          {/* Stock */}
          <View style={styles.stockRow}>
            <View style={[styles.stockDot, { backgroundColor: stock.isAvailable ? COLORS.success : COLORS.danger }]} />
            <Text style={styles.stockText}>
              {stock.isAvailable ? `Stokta (${toNumber(stock.quantity)})` : "Tükendi"}
            </Text>
          </View>

          {/* Specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <View style={styles.specsSection}>
              <Text style={styles.sectionTitle}>Teknik Özellikler</Text>
              {Object.entries(product.specs).map(([key, value]) => (
                <View key={key} style={styles.specRow}>
                  <Text style={styles.specKey}>{key}</Text>
                  <Text style={styles.specValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {product.description ? (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionTitle}>Açıklama</Text>
              <Text style={styles.description}>{product.description.replace(/<[^>]+>/g, "")}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={toggleFav} style={styles.favBtn}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={24} color={isFav ? COLORS.danger : COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, (!stock.isAvailable || adding) && styles.disabled]}
          onPress={handleAddToCart}
          disabled={!stock.isAvailable || adding}
        >
          <Text style={styles.addToCartText}>{adding ? "Ekleniyor..." : "Sepete Ekle"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

import { Image } from "react-native"

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  imageList: { width, height: 300, backgroundColor: COLORS.surface },
  image: { width, height: 300 },
  noImage: { alignItems: "center", justifyContent: "center" },
  info: { padding: 16 },
  brand: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  name: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginTop: 4, lineHeight: 28 },
  stockRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  stockDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  stockText: { fontSize: 14, color: COLORS.textMuted },
  specsSection: { marginTop: 20, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 12 },
  specRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  specKey: { fontSize: 14, color: COLORS.textMuted, flex: 1 },
  specValue: { fontSize: 14, color: COLORS.text, fontWeight: "500", flex: 1, textAlign: "right" },
  description: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  favBtn: { padding: 12 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  qtyBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: COLORS.primary },
  qtyText: { fontSize: 16, fontWeight: "700", marginHorizontal: 8, fontVariant: ["tabular-nums"] },
  addToCartBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  addToCartText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.5 },
})
