import React, { useState, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from "react-native"
import { useRouter } from "expo-router"
import { useFocusEffect } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuthStore } from "../../src/stores/auth-store"
import { ExchangeRateBar } from "../../src/components/exchange-rate-bar"
import { useProductStore } from "../../src/stores/product-store"
import { ProductCard } from "../../src/components/product-card"
import { COLORS } from "../../src/lib/constants"
import { categoriesApi } from "../../src/api/categories"
import { brandsApi } from "../../src/api/brands"
import { productsApi } from "../../src/api/products"
import type { CategoryFlat, Brand, ProductListItem } from "../../src/types"
import { Ionicons } from "@expo/vector-icons"

const CARD_STYLE = { width: 158, flex: 0, maxWidth: 158 }

const CATEGORY_SECTIONS = [
  { title: "Güvenlik Ürünleri",    badge: "GÜVENLİK",   slug: "guvenlik-urunleri",       icon: "shield-outline",        color: "#059669" },
  { title: "Bilgisayar Ürünleri",  badge: "BİLGİSAYAR", slug: "kisisel-bilgisayarlar",   icon: "hardware-chip-outline", color: "#2563eb" },
  { title: "Sunucular",            badge: "SUNUCU",      slug: "sunucu-aksesuarlari-1",   icon: "server-outline",        color: "#7c3aed" },
  { title: "Kabinler",             badge: "KABİN",       slug: "kabinler",                icon: "folder-outline",        color: "#d97706" },
  { title: "Ağ ve Network",        badge: "NETWORK",     slug: "ag-ve-network-urunleri",  icon: "globe-outline",         color: "#0891b2" },
  { title: "Seslendirme",          badge: "SESLİ",       slug: "seslendirme-sistemleri",  icon: "volume-high-outline",   color: "#db2777" },
  { title: "Yazıcı ve Tarayıcı",   badge: "YAZICI",      slug: "yazici-tarayici",         icon: "print-outline",         color: "#ea580c" },
  { title: "POS ve Barkod",        badge: "POS",         slug: "otvt-barkod-pdks",        icon: "barcode-outline",       color: "#0d9488" },
  { title: "Yazılımlar",           badge: "YAZILIM",     slug: "yazilim-ve-lisanslar",    icon: "code-slash-outline",    color: "#4f46e5" },
] as const

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const { products, fetch: fetchProducts, isLoading } = useProductStore()
  const [categories, setCategories] = useState<CategoryFlat[]>([])
  const [campaignProducts, setCampaignProducts] = useState<ProductListItem[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categoryProducts, setCategoryProducts] = useState<Record<string, ProductListItem[]>>({})
  const unreadCount = 3
  const insets = useSafeAreaInsets()

  const fetchData = useCallback(() => {
    fetchProducts({ limit: 12, sortBy: "newest", inStock: false })
    categoriesApi.flat()
      .then((res) => setCategories(res.data.filter((category) => category.productCount === undefined || category.productCount > 0).slice(0, 8)))
      .catch(() => setCategories([]))
    productsApi.list({ limit: 12, campaign: true, inStock: false })
      .then((res) => setCampaignProducts(res.data))
      .catch(() => setCampaignProducts([]))
    brandsApi.list()
      .then((res) => setBrands(res.data.slice(0, 12)))
      .catch(() => setBrands([]))
    Promise.all(
      CATEGORY_SECTIONS.map(cs =>
        productsApi.list({ limit: 8, inStock: true, categorySlug: cs.slug })
          .then(res => ({ slug: cs.slug, products: res.data }))
          .catch(() => ({ slug: cs.slug, products: [] }))
      )
    ).then(results => {
      const map: Record<string, ProductListItem[]> = {}
      results.forEach(r => { map[r.slug] = r.products })
      setCategoryProducts(map)
    })
  }, [fetchProducts])

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [fetchData])
  )

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: "#0040a4" }} />
      <ExchangeRateBar />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba, {user?.contactName?.split(" ")[0] ?? "Bayi"}</Text>
          <Text style={styles.company}>{user?.companyName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push("/bildirim-ayarlari")}>
            <Ionicons name="notifications-outline" size={24} color={"#ffffff"} />
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push("/favoriler")}>
            <Ionicons name="heart-outline" size={24} color={"#ffffff"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push("/katalog")}
      >
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
        <Text style={styles.searchPlaceholder}>Ürün ara...</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Campaigns */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannerList}
        >
          <TouchableOpacity style={[styles.banner, styles.bannerPrimary]} onPress={() => router.push("/kampanyalar")}>
            <Text style={styles.bannerTitle}>Bayi kampanyaları</Text>
            <Text style={styles.bannerText}>Seçili ürünlerde özel toptan fiyatlar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.banner, styles.bannerSecondary]} onPress={() => router.push("/katalog")}>
            <Text style={styles.bannerTitle}>Yeni stoklar</Text>
            <Text style={styles.bannerText}>Depoya yeni giren ürünleri inceleyin</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Fırsat Ürünleri */}
        {campaignProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Fırsat Ürünleri</Text>
              <TouchableOpacity onPress={() => router.push("/kampanyalar")}>
                <Text style={styles.seeAll}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={campaignProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={(slug) => router.push(`/urun/${slug}`)}
                  cardStyle={CARD_STYLE}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              scrollEnabled={true}
            />
          </View>
        )}

        {/* Category Product Sections */}
        {CATEGORY_SECTIONS.map((cs, i) => {
          const prods = categoryProducts[cs.slug]
          if (!prods || prods.length === 0) return null
          return (
            <View key={cs.slug} style={[styles.section, { backgroundColor: i % 2 === 0 ? "#f3f3f3" : "#ffffff" }]}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <View style={[styles.catBadge, { backgroundColor: cs.color }]}>
                    <Ionicons name={cs.icon as any} size={11} color="#fff" />
                    <Text style={styles.catBadgeText}>{cs.badge}</Text>
                  </View>
                  <Text style={[styles.sectionTitle, { flex: 1 }]} numberOfLines={1}>{cs.title}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push({ pathname: "/katalog", params: { categorySlug: cs.slug } })}>
                  <Text style={styles.seeAll}>Tümünü Gör</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={prods}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    onPress={(slug) => router.push(`/urun/${slug}`)}
                    cardStyle={CARD_STYLE}
                  />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
                scrollEnabled={true}
              />
            </View>
          )
        })}

        {/* Category shortcuts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kategoriler</Text>
            <TouchableOpacity onPress={() => router.push("/katalog")}>
              <Text style={styles.seeAll}>Katalog</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryChip}
                onPress={() => router.push({ pathname: "/katalog", params: { categorySlug: category.slug } })}
              >
                <Text style={styles.categoryText} numberOfLines={1}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* New Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yeni Gelenler</Text>
            <TouchableOpacity onPress={() => router.push("/katalog")}>
              <Text style={styles.seeAll}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={(slug) => router.push(`/urun/${slug}`)}
                  cardStyle={CARD_STYLE}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              scrollEnabled={true}
            />
          )}
        </View>

        {/* Markalar */}
        {brands.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Markalar</Text>
              <TouchableOpacity onPress={() => router.push("/katalog")}>
                <Text style={styles.seeAll}>Kataloğa Git</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {brands.map((brand) => (
                <TouchableOpacity
                  key={brand.id}
                  style={styles.brandChip}
                  onPress={() => router.push({ pathname: "/katalog", params: { brand: brand.slug } })}
                >
                  <Text style={styles.brandText} numberOfLines={1}>{brand.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickActions}>
            <QuickAction icon="document-text-outline" label="Siparişler" onPress={() => router.push("/siparisler")} />
            <QuickAction icon="wallet-outline" label="Cari Hesap" onPress={() => router.push("/cari")} />
            <QuickAction icon="heart-outline" label="Favoriler" onPress={() => router.push("/favoriler")} />
            <QuickAction icon="call-outline" label="Destek" onPress={() => {}} />
          </View>
        </View>

        {/* Balance Card */}
        {user && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Bakiye</Text>
            <Text style={styles.balanceAmount}>
              {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(user.balance)}
            </Text>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Kredi Limiti</Text>
              <Text style={styles.creditValue}>
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(user.creditLimit)}
              </Text>
            </View>
          </View>
        )}

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          {[
            { icon: "shield-checkmark-outline", title: "Güvenli Ödeme", desc: "SSL ile korunan ödeme" },
            { icon: "car-outline", title: "Hızlı Teslimat", desc: "Aynı gün kargo" },
            { icon: "refresh-outline", title: "Kolay İade", desc: "15 gün iade hakkı" },
            { icon: "star-outline", title: "Orijinal Ürün", desc: "Garantili ürünler" },
          ].map((badge) => (
            <View key={badge.title} style={styles.trustBadge}>
              <View style={styles.trustIcon}>
                <Ionicons name={badge.icon as any} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.trustTitle}>{badge.title}</Text>
              <Text style={styles.trustDesc}>{badge.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={qStyles.btn} onPress={onPress}>
      <View style={qStyles.iconContainer}>
        <Ionicons name={icon as any} size={24} color={COLORS.primary} />
      </View>
      <Text style={qStyles.label}>{label}</Text>
    </TouchableOpacity>
  )
}

const qStyles = StyleSheet.create({
  btn: { alignItems: "center", flex: 1 },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  label: { fontSize: 12, color: COLORS.text, fontWeight: "500" },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#0040a4",
  },
  greeting: { fontSize: 17, fontWeight: "800", color: "#ffffff" },
  company: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  unreadBadge: {
    position: "absolute",
    top: 4,
    right: 3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.danger,
    paddingHorizontal: 4,
  },
  unreadBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  searchPlaceholder: { marginLeft: 10, fontSize: 15, color: COLORS.textMuted },
  scroll: { paddingBottom: 24 },
  bannerList: { gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  banner: { width: 286, minHeight: 108, borderRadius: 18, padding: 18, justifyContent: "center" },
  bannerPrimary: { backgroundColor: "#0040a4" },
  bannerSecondary: { backgroundColor: "#1e293b" },
  bannerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  bannerText: { color: "#ffffffcc", fontSize: 13, lineHeight: 19, marginTop: 6 },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  categoryList: { gap: 8, paddingRight: 12 },
  categoryChip: {
    maxWidth: 150,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoryText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  quickActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
  },
  balanceLabel: { fontSize: 13, color: "#ffffffaa" },
  balanceAmount: { fontSize: 28, fontWeight: "800", color: "#fff", marginTop: 4, fontVariant: ["tabular-nums"] },
  creditRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#ffffff33" },
  creditLabel: { fontSize: 13, color: "#ffffffaa" },
  creditValue: { fontSize: 14, fontWeight: "700", color: "#fff", fontVariant: ["tabular-nums"] },
  brandChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  catBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  trustSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  trustBadge: {
    width: "46%",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  trustIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  trustDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
  },
})
