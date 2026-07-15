import React, { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  ScrollView,
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
import { useSafeAreaInsets } from "react-native-safe-area-context"

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "Tümü" },
  { key: "PENDING", label: "Bekleyen" },
  { key: "CONFIRMED", label: "Onaylı" },
  { key: "DELIVERED", label: "Teslim" },
  { key: "CANCELLED", label: "İptal" },
]

export default function SiparislerScreen() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchOrders = useCallback(async (p: number, status: string, append = false) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await ordersApi.list({ page: p, limit: 20, status: status || undefined })
      setOrders(append ? (prev) => [...prev, ...res.data] : res.data)
      setHasMore(p < (res.meta?.totalPages ?? 1))
    } catch (err: any) {
      const message =
        err?.data?.message ??
        err?.data?.error ??
        err?.message ??
        "Siparişler yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin."
      setErrorMessage(message)
      if (!append) {
        setOrders([])
        setHasMore(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    fetchOrders(1, activeTab)
  }, [activeTab])

  const loadMore = () => {
    if (isLoading || !hasMore || errorMessage) return
    const next = page + 1
    setPage(next)
    fetchOrders(next, activeTab, true)
  }

  const retry = () => {
    setPage(1)
    fetchOrders(1, activeTab)
  }

  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <View style={{ height: insets.top, backgroundColor: "#0040a4" }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Siparişlerim</Text>
      </View>
      {/* Status tabs */}
      <View style={{ flexShrink: 0 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsRow, { alignItems: 'center' }]}
        >
          {STATUS_TABS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, activeTab === item.key && styles.tabActive]}
              onPress={() => setActiveTab(item.key)}
            >
              <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        style={{ flex: 1 }}
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
          errorMessage ? (
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Siparişler yüklenemedi</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={retry} activeOpacity={0.85}>
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Sipariş bulunamadı</Text>
            </View>
          ) : null
        }
        refreshing={isLoading && orders.length === 0}
        onRefresh={retry}
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
  errorText: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginTop: 8, lineHeight: 20 },
  retryButton: { marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  retryButtonText: { color: "#fff", fontWeight: "700" },
  header: {
    backgroundColor: "#0040a4",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
})
