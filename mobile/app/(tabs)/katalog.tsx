import React, { useEffect, useCallback, useMemo, useState } from "react"
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
} from "react-native"
import { useRouter } from "expo-router"
import { useLocalSearchParams } from "expo-router"
import { useProductStore } from "../../src/stores/product-store"
import { ProductCard } from "../../src/components/product-card"
import { COLORS } from "../../src/lib/constants"
import { Ionicons } from "@expo/vector-icons"
import { categoriesApi } from "../../src/api/categories"
import { brandsApi } from "../../src/api/brands"
import type { Brand, CategoryFlat, ProductListParams } from "../../src/types"

export default function KatalogScreen() {
  const router = useRouter()
  const { categorySlug: initialCategorySlug } = useLocalSearchParams<{ categorySlug?: string }>()
  const { products, meta, isLoading, errorMessage, params, fetch, reset } = useProductStore()
  const [filterOpen, setFilterOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryFlat[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [inStockOnly, setInStockOnly] = useState(false)

  useEffect(() => {
    reset()
    setSelectedCategory(initialCategorySlug)
    fetch({ page: 1, inStock: false, categorySlug: initialCategorySlug })
    Promise.all([categoriesApi.flat(), brandsApi.list()])
      .then(([categoryRes, brandRes]) => {
        setCategories(categoryRes.data.filter((category) => category.productCount > 0).slice(0, 40))
        setBrands(brandRes.data.slice(0, 60))
      })
      .catch(() => {
        setCategories([])
        setBrands([])
      })
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedCategory) count += 1
    if (selectedBrands.length) count += selectedBrands.length
    if (minPrice.trim() || maxPrice.trim()) count += 1
    if (inStockOnly) count += 1
    return count
  }, [inStockOnly, maxPrice, minPrice, selectedBrands.length, selectedCategory])

  const loadMore = useCallback(() => {
    if (isLoading || !meta || meta.page >= meta.totalPages) return
    fetch({ page: meta.page + 1 }, true)
  }, [isLoading, meta, fetch])

  const handleSearch = (q: string) => {
    fetch({ search: q || undefined, page: 1 })
  }

  const parsePrice = (value: string) => {
    const parsed = Number(value.trim().replace(",", "."))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }

  const getFilterParams = (): ProductListParams => ({
    categorySlug: selectedCategory,
    brandSlugs: selectedBrands.length ? selectedBrands : undefined,
    minPrice: parsePrice(minPrice),
    maxPrice: parsePrice(maxPrice),
    inStock: inStockOnly,
  })

  const applyFilters = () => {
    fetch({ ...getFilterParams(), page: 1 })
    setFilterOpen(false)
  }

  const clearFilters = () => {
    setSelectedCategory(undefined)
    setSelectedBrands([])
    setMinPrice("")
    setMaxPrice("")
    setInStockOnly(false)
    fetch({ categorySlug: undefined, brandSlugs: undefined, minPrice: undefined, maxPrice: undefined, inStock: false, page: 1 })
    setFilterOpen(false)
  }

  const toggleBrand = (slug: string) => {
    setSelectedBrands((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    )
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ürün ara..."
            placeholderTextColor="#667085"
            returnKeyType="search"
            onSubmitEditing={(e) => handleSearch(e.nativeEvent.text)}
          />
        </View>
      </View>

      {/* Sort buttons */}
      <View style={styles.sortRow}>
        {(["newest", "name-asc", "name-desc"] as const).map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[styles.sortBtn, params.sortBy === sort && styles.sortBtnActive]}
            onPress={() => fetch({ sortBy: sort, page: 1 })}
          >
            <Text style={[styles.sortBtnText, params.sortBy === sort && styles.sortBtnTextActive]}>
              {sort === "newest" ? "Yeni" : sort === "name-asc" ? "A-Z" : "Z-A"}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
          <Ionicons name="options-outline" size={17} color={COLORS.primary} />
          <Text style={styles.filterBtnText}>Filtre</Text>
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <Text style={styles.count}>{meta ? `${meta.total} ürün` : ""}</Text>
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={(slug) => router.push(`/urun/${slug}`)} />
        )}
        numColumns={2}
        contentContainerStyle={styles.grid}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? <ActivityIndicator color={COLORS.primary} style={{ margin: 16 }} /> : null}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonGrid}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.skeletonCard}>
                  <View style={styles.skeletonImage} />
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: "70%" }]} />
                </View>
              ))}
            </View>
          ) : errorMessage ? (
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Ürünler yüklenemedi</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetch({ page: 1 })}>
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Ürün bulunamadı</Text>
            </View>
          )
        }
        refreshing={isLoading && products.length === 0}
        onRefresh={() => fetch({ page: 1 })}
      />

      <Modal visible={filterOpen} animationType="slide" transparent onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filtreler</Text>
              <TouchableOpacity style={styles.iconButton} onPress={() => setFilterOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              <Text style={styles.sectionTitle}>Kategori</Text>
              <View style={styles.chipWrap}>
                {categories.map((category) => {
                  const active = selectedCategory === category.slug
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedCategory(active ? undefined : category.slug)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.name}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={styles.sectionTitle}>Marka</Text>
              <View style={styles.chipWrap}>
                {brands.map((brand) => {
                  const active = selectedBrands.includes(brand.slug)
                  return (
                    <TouchableOpacity
                      key={brand.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleBrand(brand.slug)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{brand.name}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={styles.sectionTitle}>Fiyat Aralığı</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  placeholderTextColor="#667085"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  placeholderTextColor="#667085"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Sadece stokta olanlar</Text>
                  <Text style={styles.switchDescription}>Stok adedi sıfır olan ürünleri gizle</Text>
                </View>
                <Switch value={inStockOnly} onValueChange={setInStockOnly} trackColor={{ true: COLORS.primary }} />
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Temizle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: { padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: COLORS.text },
  sortRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  sortBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  sortBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sortBtnText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },
  sortBtnTextActive: { color: "#fff" },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  filterBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5,
  },
  filterBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  count: { marginLeft: "auto", fontSize: 13, color: COLORS.textMuted },
  grid: { paddingHorizontal: 12, paddingBottom: 24 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 64 },
  emptyText: { fontSize: 16, color: COLORS.textMuted, marginTop: 12 },
  errorText: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", lineHeight: 20, marginTop: 8 },
  retryButton: { marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  retryButtonText: { color: "#fff", fontWeight: "800" },
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 4 },
  skeletonCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skeletonImage: { height: 118, borderRadius: 8, backgroundColor: "#e5e7eb" },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: "#e5e7eb", marginTop: 10 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 23, 42, 0.35)" },
  sheet: {
    maxHeight: "86%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  sheetContent: { padding: 18, paddingBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 10, marginTop: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  priceRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 12,
  },
  switchTitle: { fontSize: 14, color: COLORS.text, fontWeight: "700" },
  switchDescription: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sheetActions: { flexDirection: "row", gap: 10, paddingHorizontal: 18, paddingTop: 10 },
  clearBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtnText: { color: COLORS.text, fontWeight: "800" },
  applyBtn: { flex: 1, alignItems: "center", paddingVertical: 13, borderRadius: 10, backgroundColor: COLORS.primary },
  applyBtnText: { color: "#fff", fontWeight: "800" },
})
