import React, { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native"
import { useRouter } from "expo-router"
import { ordersApi } from "../../src/api/orders"
import { OrderCard } from "../../src/components/order-card"
import { COLORS } from "../../src/lib/constants"
import type { Order, OrderStatus } from "../../src/types"
import { Ionicons } from "@expo/vector-icons"

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "Tümü" },
  { key: "PENDING", label: "Bekleyen" },
  { key: "CONFIRMED", label: "Onaylı" },
  { key: "SHIPPED", label: "Kargoda" },
  { key: "DELIVERED", label: "Teslim" },
]

export default function SiparislerScreen() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchOrders = useCallback(async (p: number, status: string, append = false) => {
    setIsLoading(true)
    try {
      const res = await ordersApi.list({ page: p, limit: 20, status: status || undefined })
      setOrders(append ? (prev) => [...prev, ...res.data] : res.data)
      setHasMore(p < res.meta.totalPages)
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    fetchOrders(1, activeTab)
  }, [activeTab])

  const loadMore = () => {
    if (isLoading || !hasMore) return
    const next = page + 1
    setPage(next)
    fetchOrders(next, activeTab, true)
  }

  return (
    <View style={styles.container}>
      {/* Status tabs */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === item.key && styles.tabActive]}
            onPress={() => setActiveTab(item.key)}
          >
            <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      />

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={(id) => router.push(`/siparis/${id}`)} />
        )}
        contentContainerStyle={{ padding: 16 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? <ActivityIndicator color={COLORS.primary} style={{ margin: 16 }} /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Sipariş bulunamadı</Text>
            </View>
          ) : null
        }
        refreshing={isLoading && orders.length === 0}
        onRefresh={() => fetchOrders(1, activeTab)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 64 },
  emptyText: { fontSize: 16, color: COLORS.textMuted, marginTop: 12 },
})
