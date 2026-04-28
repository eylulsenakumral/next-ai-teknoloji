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
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { productsApi } from "../../src/api/products"
import { cartApi } from "../../src/api/cart"
import { wishlistApi } from "../../src/api/wishlist"
import { exchangeApi } from "../../src/api/exchange"
import { COLORS } from "../../src/lib/constants"
import { formatPrice, toNumber } from "../../src/lib/format"
import { imageUri } from "../../src/lib/media"
import { useCartStore } from "../../src/stores/cart-store"
import type { ProductDetail, RelatedProduct, ExchangeRate } from "../../src/types"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ChatWidget from "../../src/components/chat-widget"

const { width } = Dimensions.get("window")


export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const fetchCart = useCartStore((s) => s.fetch)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [related, setRelated] = useState<RelatedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isFav, setIsFav] = useState(false)
  const [adding, setAdding] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    Promise.all([
      productsApi.detail(slug),
      exchangeApi.get().catch(() => null),
    ])
      .then(([res, rate]) => {
        setProduct(res.product)
        setRelated(res.relatedProducts ?? [])
        if (rate) setExchangeRate(rate)
      })
      .catch(() => Alert.alert("Hata", "Ürün yüklenemedi"))
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
      if (isFav) await wishlistApi.remove(product.id)
      else await wishlistApi.add(product.id)
      setIsFav(!isFav)
    } catch {}
  }

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveImageIndex(Math.round(event.nativeEvent.contentOffset.x / width))
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <ActivityIndicator color={COLORS.primary} size="large" style={{ flex: 1 }} />
      </View>
    )
  }

  if (!product) return null

  const images = product.images?.map(imageUri).filter((uri): uri is string => Boolean(uri)) ?? []
  const pricing = product.pricing
  const stock = product.stock ?? { quantity: 0, isAvailable: false }
  const currency = pricing?.currency ?? "USD"
  const specs = product.specs
    ? Object.entries(product.specs).filter(([, v]) => v != null && String(v).trim() !== "")
    : []
  const hasSpecs = specs.length > 0
  const hasDescription = Boolean(product.description)
  const cleanDesc = (product.description ?? "").replace(/<[^>]+>/g, "").trim()

  const stockQty = toNumber(stock.quantity)
  const minQty = product.minOrderQuantity ?? 1

  const breadcrumb = [
    product.category?.parent?.parent?.name,
    product.category?.parent?.name,
    product.category?.name,
  ].filter(Boolean).join(" › ")

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Image Gallery */}
        <View>
          {images.length > 0 ? (
            <>
              <FlatList
                data={images}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleImageScroll}
              />
              {images.length > 1 && (
                <View style={styles.dotsRow}>
                  {images.map((_, i) => (
                    <View key={i} style={[styles.dot, i === activeImageIndex && styles.dotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImage}>
              <Ionicons name="image-outline" size={52} color={COLORS.border} />
              <Text style={{ color: COLORS.textMuted, marginTop: 8, fontSize: 13 }}>Görsel yok</Text>
            </View>
          )}
          <TouchableOpacity onPress={toggleFav} style={styles.favBtn}>
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={24} color={isFav ? "#e53e3e" : COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Breadcrumb */}
          {breadcrumb ? (
            <Text style={styles.breadcrumb} numberOfLines={1}>{breadcrumb}</Text>
          ) : null}

          {/* Brand */}
          {product.brand && (
            <Text style={styles.brand}>{product.brand.name}</Text>
          )}

          {/* Name */}
          <Text style={styles.name}>{product.name}</Text>

          {/* Badges */}
          {(product.isNew || product.isOutlet || product.isFeatured) && (
            <View style={styles.badgeRow}>
              {product.isNew && <View style={[styles.badge, { backgroundColor: COLORS.primary }]}><Text style={styles.badgeText}>Yeni</Text></View>}
              {product.isOutlet && <View style={[styles.badge, { backgroundColor: "#dc2626" }]}><Text style={styles.badgeText}>Outlet</Text></View>}
              {product.isFeatured && <View style={[styles.badge, { backgroundColor: "#7c3aed" }]}><Text style={styles.badgeText}>Öne Çıkan</Text></View>}
            </View>
          )}

          {/* Codes grid */}
          {(product.barcode || product.sku || product.modelCode || product.warrantyMonths) && (
            <View style={styles.codesGrid}>
              {product.barcode && (
                <View style={styles.codeItem}>
                  <Ionicons name="barcode-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.codeLabel}>Barkod</Text>
                  <Text style={styles.codeValue}>{product.barcode}</Text>
                </View>
              )}
              {product.sku && (
                <View style={styles.codeItem}>
                  <Ionicons name="pricetag-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.codeLabel}>Ürün Kodu</Text>
                  <Text style={styles.codeValue}>{product.sku}</Text>
                </View>
              )}
              {product.modelCode && (
                <View style={styles.codeItem}>
                  <Ionicons name="cube-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.codeLabel}>Model</Text>
                  <Text style={styles.codeValue}>{product.modelCode}</Text>
                </View>
              )}
              {product.warrantyMonths && (
                <View style={styles.codeItem}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.codeLabel}>Garanti</Text>
                  <Text style={styles.codeValue}>{product.warrantyMonths} ay</Text>
                </View>
              )}
            </View>
          )}

          {/* Stock badge */}
          {(() => {
            const suppliers = product.suppliers ?? []
            const depotLabel = suppliers.length === 1
              ? suppliers[0].depoName
              : suppliers.length > 1
              ? `${suppliers.length} Depo`
              : null
            return (
              <View style={[styles.stockPillBase, {
                backgroundColor: !stock.isAvailable ? "#fef2f2" : stockQty < 5 ? "#fffbeb" : "#f0fdf4",
                borderColor: !stock.isAvailable ? "#fecaca" : stockQty < 5 ? "#fde68a" : "#bbf7d0",
              }]}>
                <View style={[styles.stockDotBase, {
                  backgroundColor: !stock.isAvailable ? "#ef4444" : stockQty < 5 ? "#f59e0b" : "#22c55e",
                }]} />
                <Text style={[styles.stockPillTextBase, {
                  color: !stock.isAvailable ? "#b91c1c" : stockQty < 5 ? "#92400e" : "#15803d",
                }]}>
                  {!stock.isAvailable
                    ? "Stok Yok"
                    : `${depotLabel ? depotLabel + " · " : ""}${stockQty < 5 ? `Son ${stockQty}` : `${stockQty} adet`}`}
                </Text>
              </View>
            )
          })()}

          {/* Pricing box — web ile birebir aynı tasarım */}
          {pricing ? (
            <View style={styles.pricingBox}>
              {/* Kampanya indirimi */}
              {pricing.campaignDiscountPct != null && pricing.campaignDiscountPct > 0 && (
                <Text style={styles.pricingDiscount}>
                  %{Math.round(pricing.campaignDiscountPct)} özel indirim
                </Text>
              )}
              {/* Orijinal fiyat (üstü çizili) — sadece fırsat/outlet ürünlerde */}
              {pricing.originalPrice != null && pricing.originalPrice > pricing.salePriceExVat && (
                <Text style={styles.pricingOriginal}>
                  {formatPrice(pricing.originalPrice, currency)}
                </Text>
              )}
              {/* Ana fiyat: KDV hariç */}
              <View style={styles.pricingMainRow}>
                <Text style={styles.pricingMain}>
                  {formatPrice(pricing.salePriceExVat, currency)}
                </Text>
                <Text style={styles.pricingVatBadge}> +KDV</Text>
              </View>
              {/* KDV dahil */}
              <Text style={styles.pricingIncVat}>
                KDV Dahil (%{pricing.vatRate ?? 20}): {formatPrice(pricing.salePriceIncVat, currency)}
              </Text>
              {/* TL karşılığı — sadece USD ürünlerde göster */}
              {currency === "USD" && exchangeRate?.usd && (
                <Text style={styles.pricingTry}>
                  ≈ {formatPrice(toNumber(pricing.salePriceIncVat) * exchangeRate.usd, "TRY")}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.noPriceBox}>
              <Ionicons name="lock-closed-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.noPriceText}>Özel Fiyatlar İçin Bayi Girişi Yapınız</Text>
            </View>
          )}

          {/* Depo Stokları */}
          {product.suppliers && product.suppliers.length > 0 && (
            <View style={styles.depoSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business-outline" size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Depo Stokları</Text>
              </View>
              {product.suppliers.map((s, i) => (
                <View key={i} style={styles.depoRow}>
                  <View style={styles.depoLeft}>
                    <View style={[styles.depoDot, { backgroundColor: s.stockQuantity > 5 ? "#22c55e" : s.stockQuantity > 0 ? "#f59e0b" : "#ef4444" }]} />
                    <Text style={styles.depoName}>{s.depoName}</Text>
                  </View>
                  <Text style={styles.depoQty}>{s.stockQuantity} adet</Text>
                </View>
              ))}
            </View>
          )}

          {/* AI sor butonu */}
          <TouchableOpacity
            style={styles.aiAskBtn}
            onPress={() => setShowChat(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
            <Text style={styles.aiAskText}>Bu ürün hakkında AI'ye sor</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Short description */}
          {product.shortDescription ? (
            <View style={styles.shortDesc}>
              <View style={styles.shortDescBar} />
              <Text style={styles.shortDescText}>{product.shortDescription}</Text>
            </View>
          ) : null}

          {/* Teknik Özellikler */}
          {hasSpecs && (
            <View style={styles.tabsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list-outline" size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Teknik Özellikler</Text>
              </View>
              <View style={styles.specsTable}>
                {specs.map(([key, value], i) => (
                  <View key={key} style={[styles.specRow, { backgroundColor: i % 2 === 0 ? "#f9f9f9" : "#ffffff" }]}>
                    <Text style={styles.specKey}>{key}</Text>
                    <Text style={styles.specValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Açıklama */}
          {hasDescription && (
            <View style={styles.tabsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Açıklama</Text>
              </View>
              <View style={styles.descBox}>
                <Text style={styles.descText}>{cleanDesc}</Text>
              </View>
            </View>
          )}

          {/* Related products */}
          {related.length > 0 && (
            <View style={styles.relatedSection}>
              <View style={styles.relatedHeader}>
                <Text style={styles.relatedTitle}>Benzer Ürünler</Text>
                <View style={styles.relatedLine} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {related.map((item) => {
                  const img = imageUri(item.images?.[0])
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.relatedCard}
                      onPress={() => router.push(`/urun/${item.slug}`)}
                    >
                      {img ? (
                        <Image source={{ uri: img }} style={styles.relatedImage} resizeMode="contain" />
                      ) : (
                        <View style={[styles.relatedImage, styles.relatedPlaceholder]}>
                          <Ionicons name="image-outline" size={22} color={COLORS.border} />
                        </View>
                      )}
                      <Text style={styles.relatedBrand} numberOfLines={1}>{item.brand?.name}</Text>
                      <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
                      {item.pricing && (
                        <Text style={styles.relatedPrice} numberOfLines={1}>
                          {formatPrice(item.pricing.salePriceIncVat, "TRY")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* AI Chat */}
      <ChatWidget
        hideFab
        externalOpen={showChat}
        onExternalClose={() => setShowChat(false)}
        productContext={product.name}
      />

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(Math.max(minQty, quantity - 1))}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(Math.min(stockQty, quantity + 1))}
            disabled={quantity >= stockQty}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, (!stock.isAvailable || adding) && { opacity: 0.5 }]}
          onPress={handleAddToCart}
          disabled={!stock.isAvailable || adding}
        >
          <Ionicons name={adding ? "hourglass-outline" : "cart-outline"} size={18} color="#fff" />
          <Text style={styles.addToCartText}>{adding ? "Ekleniyor..." : "Sepete Ekle"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  favBtn: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Gallery
  image: { width, height: 280, backgroundColor: COLORS.surface },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 18, backgroundColor: COLORS.primary },
  noImage: {
    height: 200,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // Content
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  breadcrumb: { fontSize: 11, color: COLORS.textMuted },
  brand: { fontSize: 13, fontWeight: "700", color: COLORS.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  name: { fontSize: 20, fontWeight: "700", color: COLORS.text, lineHeight: 28 },

  // Badges
  badgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Codes grid
  codesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  codeItem: { flexDirection: "row", alignItems: "center", gap: 5, width: "47%" },
  codeLabel: { fontSize: 12, color: COLORS.textMuted },
  codeValue: { fontSize: 12, fontWeight: "700", color: COLORS.text, flex: 1 },

  stockPillBase: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  stockDotBase: { width: 8, height: 8, borderRadius: 4 },
  stockPillTextBase: { fontSize: 13, fontWeight: "600" as const },

  // Pricing box — web: bg-[#0040a4] rounded-xl px-5 py-4 text-white
  pricingBox: {
    borderRadius: 14,
    backgroundColor: "#0040a4",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 4,
  },
  pricingDiscount: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 2,
  },
  pricingOriginal: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  pricingMainRow: { flexDirection: "row", alignItems: "baseline" },
  pricingMain: { fontSize: 26, fontWeight: "800", color: "#ffffff" },
  pricingVatBadge: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "400" },
  pricingIncVat: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  pricingTry: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  noPriceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,64,164,0.05)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,64,164,0.15)",
  },
  noPriceText: { flex: 1, fontSize: 13, color: "#0040a4", fontWeight: "600" },

  // Short description
  shortDesc: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  shortDescBar: { width: 3, borderRadius: 2, backgroundColor: "#dbeafe", alignSelf: "stretch" },
  shortDescText: { flex: 1, fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },

  // Specs/description sections
  tabsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  specsTable: { borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  specRow: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  specKey: { flex: 1, fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },
  specValue: { flex: 1, fontSize: 13, color: COLORS.text, textAlign: "right" },
  descBox: { backgroundColor: "#ffffff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  descText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },

  // Depo Stokları
  depoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  depoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  depoLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  depoDot: { width: 8, height: 8, borderRadius: 4 },
  depoName: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  depoQty: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

  // AI sor button
  aiAskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,64,164,0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(0,64,164,0.15)",
  },
  aiAskText: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.primary },

  // Section headers (shared by depo, specs, description)
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },

  // Related
  relatedSection: { gap: 12 },
  relatedHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  relatedTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  relatedLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  relatedCard: {
    width: 148,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },
  relatedImage: { width: "100%", height: 90, borderRadius: 8 },
  relatedPlaceholder: { backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" },
  relatedBrand: { color: COLORS.primary, fontSize: 10, fontWeight: "700", marginTop: 8 },
  relatedName: { color: COLORS.text, fontSize: 12, fontWeight: "600", lineHeight: 16, marginTop: 2 },
  relatedPrice: { color: COLORS.primary, fontSize: 12, fontWeight: "800", marginTop: 4 },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  qtyBtn: { width: 38, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface },
  qtyBtnText: { fontSize: 20, fontWeight: "500", color: COLORS.primary },
  qtyText: { fontSize: 16, fontWeight: "700", marginHorizontal: 14, fontVariant: ["tabular-nums"], color: COLORS.text },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addToCartText: { color: "#fff", fontSize: 15, fontWeight: "700" },
})
