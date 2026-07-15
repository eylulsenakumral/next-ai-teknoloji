import React, { useEffect, useCallback, useMemo, useState, useRef } from "react"
import { Dimensions } from "react-native"
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
import type { Brand, CategoryTreeNode, ProductListParams } from "../../src/types"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function KatalogScreen() {
  const router = useRouter()
  const { categorySlug: initialCategorySlug } = useLocalSearchParams<{ categorySlug?: string }>()
  const { products, meta, isLoading, errorMessage, params, fetch, reset } = useProductStore()
  const [filterOpen, setFilterOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategorySlug)
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<string | undefined>()
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [inStockOnly, setInStockOnly] = useState(true)
  const [searchText, setSearchText] = useState("")
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const insets = useSafeAreaInsets()
  const [layoutReady, setLayoutReady] = useState(false)
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width)

  useEffect(() => {
    reset()
    fetch({ page: 1, inStock: true, categorySlug: initialCategorySlug })
    categoriesApi.tree()
      .then((res) => setTree(res.data))
      .catch(() => setTree([]))
    brandsApi.list()
      .then((res) => setBrands(res.data))
      .catch(() => setBrands([]))
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedBrands.length) count += selectedBrands.length
    if (minPrice.trim() || maxPrice.trim()) count += 1
    // stok filtresi varsayılan açık, kapatıldığında say
    if (!inStockOnly) count += 1
    return count
  }, [inStockOnly, maxPrice, minPrice, selectedBrands.length])

  const loadMore = useCallback(() => {
    if (isLoading || !meta || meta.page >= meta.totalPages) return
    fetch({ page: meta.page + 1 }, true)
  }, [isLoading, meta, fetch])

  const handleSearch = (q: string) => {
    setSearchText(q)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      fetch({ search: q.trim() || undefined, page: 1 })
    }, 400)
  }

  const clearSearch = () => {
    setSearchText("")
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    fetch({ search: undefined, page: 1 })
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
    setSelectedBrands([])
    setMinPrice("")
    setMaxPrice("")
    setInStockOnly(true)
    fetch({ categorySlug: selectedCategory, brandSlugs: undefined, minPrice: undefined, maxPrice: undefined, inStock: true, page: 1 })
    setFilterOpen(false)
  }

  const toggleBrand = (slug: string) => {
    setSelectedBrands((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    )
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectCategory = (slug: string, label: string) => {
    const isSame = selectedCategory === slug
    const newSlug = isSame ? undefined : slug
    const newLabel = isSame ? undefined : label
    setSelectedCategory(newSlug)
    setSelectedCategoryLabel(newLabel)
    fetch({ categorySlug: newSlug, page: 1, inStock: inStockOnly })
    if (!isSame) setCategoryOpen(false)
  }

  const clearCategory = () => {
    setSelectedCategory(undefined)
    setSelectedCategoryLabel(undefined)
    setExpanded(new Set())
    fetch({ categorySlug: undefined, page: 1, inStock: inStockOnly })
  }

  const renderCatNode = (node: CategoryTreeNode, depth: number, parentLabel: string): React.ReactNode => {
    const isSelected = selectedCategory === node.slug
    const isNodeExpanded = expanded.has(node.id)
    const hasChildren = (node.children ?? []).length > 0
    const label = parentLabel ? `${parentLabel} › ${node.name}` : node.name
    const pl = 18 + depth * 14
    const bgColors = ["#ffffff", "#f8f9fa", "#f0f4ff", "#e8effd", "#e0ecff"]
    const bg = bgColors[Math.min(depth, bgColors.length - 1)]
    const fontSize = depth === 0 ? 14 : depth === 1 ? 13 : 12
    const fontWeight = depth === 0 ? "700" : depth === 1 ? "600" : "500"

    return (
      <View key={node.id}>
        <TouchableOpacity
          style={[styles.catRow, { backgroundColor: bg, paddingLeft: pl }, isSelected && styles.catRowActive]}
          onPress={() => {
            if (hasChildren) toggleExpand(node.id)
            else selectCategory(node.slug, label)
          }}
        >
          <Text
            style={[styles.catRowText, { fontSize, fontWeight: fontWeight as any }, isSelected && styles.catRowTextActive]}
            numberOfLines={1}
          >
            {node.name}
          </Text>
          <View style={styles.catRowRight}>
            <Text style={styles.catCount}>{node.productCount}</Text>
            {hasChildren && (
              <Ionicons
                name={isNodeExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={isSelected ? "#fff" : COLORS.textMuted}
              />
            )}
          </View>
        </TouchableOpacity>

        {isNodeExpanded && hasChildren && (
          <View>
            {hasChildren && (
              <TouchableOpacity
                style={[styles.catRow, { backgroundColor: bg, paddingLeft: pl + 14 }]}
                onPress={() => selectCategory(node.slug, label)}
              >
                <Text style={[styles.catRowText, { fontSize: 12, fontWeight: "400", color: COLORS.textMuted }]}>
                  Tümü ({node.productCount})
                </Text>
              </TouchableOpacity>
            )}
            {(node.children ?? []).map((child) => renderCatNode(child, depth + 1, label))}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={{ height: insets.top, backgroundColor: "#0040a4" }} />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ürün ara..."
            placeholderTextColor="#667085"
            returnKeyType="search"
            value={searchText}
            onChangeText={handleSearch}
            onSubmitEditing={(e) => handleSearch(e.nativeEvent.text)}
          />
          {searchText.length > 0 ? (
            <TouchableOpacity onPress={clearSearch} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Sort + Category + Filter bar */}
      <View style={styles.sortRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={styles.sortScrollContent}
        >
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

          {/* Kategoriler butonu */}
          <TouchableOpacity
            style={[styles.filterBtn, selectedCategory && styles.filterBtnActive]}
            onPress={() => setCategoryOpen(true)}
          >
            <Ionicons name="grid-outline" size={15} color={selectedCategory ? "#fff" : COLORS.primary} />
            <Text style={[styles.filterBtnText, selectedCategory && styles.filterBtnTextActive]} numberOfLines={1}>
              {selectedCategoryLabel ?? "Kategori"}
            </Text>
            {selectedCategory && (
              <TouchableOpacity onPress={clearCategory} hitSlop={6}>
                <Ionicons name="close-circle" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
            <Ionicons name="options-outline" size={15} color={COLORS.primary} />
            <Text style={styles.filterBtnText}>Filtre</Text>
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </ScrollView>

        {meta?.total !== undefined && (
          <Text style={styles.count}>{meta.total} ürün</Text>
        )}
      </View>

      {/* Product Grid */}
      <View
        style={{ flex: 1 }}
        onLayout={(e) => {
          setContainerWidth(e.nativeEvent.layout.width)
          setLayoutReady(true)
        }}
      >
        {layoutReady && (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={(slug) => router.push(`/urun/${slug}`)} />
            )}
            numColumns={2}
            contentContainerStyle={[styles.grid, { paddingBottom: 16 + insets.bottom + 90 }]}
            columnWrapperStyle={{ gap: 8 }}
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
        )}
      </View>

      {/* Kategori Modal */}
      <Modal visible={categoryOpen} animationType="slide" transparent onRequestClose={() => setCategoryOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Kategori Seç</Text>
              <TouchableOpacity style={styles.iconButton} onPress={() => setCategoryOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              {tree.map((root) => renderCatNode(root, 0, ""))}
            </ScrollView>
            {selectedCategory && (
              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.clearBtn} onPress={() => { clearCategory(); setCategoryOpen(false) }}>
                  <Text style={styles.clearBtnText}>Kategoriyi Temizle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Filtre Modal */}
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
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  searchContainer: { padding: 14, backgroundColor: "#0040a4" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: COLORS.text },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sortScrollContent: { gap: 6, alignItems: "center" },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
  },
  sortBtnActive: { backgroundColor: "#0040a4", borderColor: "#0040a4" },
  sortBtnText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  sortBtnTextActive: { color: "#fff" },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    maxWidth: 110,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: "700", flexShrink: 1 },
  filterBtnTextActive: { color: "#fff" },
  filterBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 4,
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  count: { marginLeft: 8, flexShrink: 0, fontSize: 12, color: COLORS.textMuted },
  grid: { paddingHorizontal: 12, paddingTop: 4 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 64 },
  emptyText: { fontSize: 16, color: COLORS.textMuted, marginTop: 12 },
  errorText: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", lineHeight: 20, marginTop: 8 },
  retryButton: { marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  retryButtonText: { color: "#fff", fontWeight: "800" },
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 4, paddingHorizontal: 12 },
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
    maxHeight: "88%",
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
  sheetContent: { paddingVertical: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 10, marginTop: 8, paddingHorizontal: 18 },

  // Category tree rows
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  catRowActive: { backgroundColor: COLORS.primary },
  catRowText: { fontSize: 14, fontWeight: "700", color: COLORS.text, flex: 1, marginRight: 6 },
  catRowTextActive: { color: "#fff" },
  catRowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  catCount: { fontSize: 11, color: COLORS.textMuted },

  // Filter modal
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12, paddingHorizontal: 18 },
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
  priceRow: { flexDirection: "row", gap: 10, marginBottom: 12, paddingHorizontal: 18 },
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
    paddingHorizontal: 18,
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
