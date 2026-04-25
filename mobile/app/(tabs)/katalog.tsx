import React, { useEffect, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native"
import { useRouter } from "expo-router"
import { useProductStore } from "../../src/stores/product-store"
import { ProductCard } from "../../src/components/product-card"
import { COLORS } from "../../src/lib/constants"
import { Ionicons } from "@expo/vector-icons"
import type { ProductListParams } from "../../src/types"

export default function KatalogScreen() {
  const router = useRouter()
  const { products, meta, isLoading, params, fetch, reset } = useProductStore()

  useEffect(() => {
    reset()
    fetch({ page: 1 })
  }, [])

  const loadMore = useCallback(() => {
    if (isLoading || !meta || meta.page >= meta.totalPages) return
    fetch({ page: meta.page + 1 }, true)
  }, [isLoading, meta, fetch])

  const handleSearch = (q: string) => {
    fetch({ search: q || undefined, page: 1 })
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
            placeholderTextColor={COLORS.textMuted}
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
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Ürün bulunamadı</Text>
            </View>
          ) : null
        }
        refreshing={isLoading && products.length === 0}
        onRefresh={() => fetch({ page: 1 })}
      />
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
  count: { marginLeft: "auto", fontSize: 13, color: COLORS.textMuted },
  grid: { paddingHorizontal: 12, paddingBottom: 24 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 64 },
  emptyText: { fontSize: 16, color: COLORS.textMuted, marginTop: 12 },
})
