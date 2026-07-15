import React, { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { api } from "../src/api/client"
import { COLORS } from "../src/lib/constants"

interface CampaignSet {
  id: string
  name: string
  slug: string
  type: string
  discountPercent: number
  imageUrl?: string | null
  products: unknown[]
}

interface CampaignSetsResponse {
  data: CampaignSet[]
}

// Deterministic gradient pair derived from campaign id for visual variety
const GRADIENT_PAIRS: [string, string][] = [
  ["#0040a4", "#2189ff"],
  ["#16a34a", "#4ade80"],
  ["#f59e0b", "#fcd34d"],
  ["#ef4444", "#f87171"],
  ["#7c3aed", "#a78bfa"],
  ["#0891b2", "#38bdf8"],
]

function getGradientPair(id: string): [string, string] {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff
  }
  return GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length]
}

function CampaignCard({
  item,
  onPress,
}: {
  item: CampaignSet
  onPress: (item: CampaignSet) => void
}) {
  const [primary, accent] = getGradientPair(item.id)

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {/* Image / gradient placeholder */}
      <View style={[styles.imagePlaceholder, { backgroundColor: primary }]}>
        <View style={[styles.imageAccentBar, { backgroundColor: accent }]} />
        <Ionicons name="pricetag" size={36} color="rgba(255,255,255,0.35)" />
      </View>

      <View style={styles.cardBody}>
        {/* Discount badge */}
        {item.discountPercent > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>%{item.discountPercent} İndirim</Text>
          </View>
        )}

        <Text style={styles.campaignName} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.footer}>
          <Ionicons name="cube-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.productCount}>
            {item.products.length} ürün
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.primary}
            style={styles.chevron}
          />
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function KampanyalarScreen() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<CampaignSet[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await api.get<CampaignSetsResponse>(
        "/api/public/campaign-sets",
        { status: "active" }
      )
      setCampaigns(res.data ?? [])
    } catch {
      setError("Kampanyalar yüklenirken bir hata oluştu.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchCampaigns(true)
  }, [fetchCampaigns])

  const handlePress = (item: CampaignSet) => {
    router.push(`/kampanya/${item.slug}` as any)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Kampanyalar yükleniyor…</Text>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchCampaigns()}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CampaignCard item={item} onPress={handlePress} />
        )}
        contentContainerStyle={
          campaigns.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <Ionicons name="pricetag-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aktif kampanya bulunmuyor</Text>
            <Text style={styles.emptyText}>
              Yeni kampanyalar başladığında bu ekrandan takip edebilirsiniz.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, padding: 16 },

  // Loading / error / empty shared center layout
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  errorText: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Empty state
  emptyInner: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },

  // Campaign card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePlaceholder: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageAccentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    opacity: 0.6,
  },
  cardBody: { padding: 14 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.warning + "22",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: COLORS.warning },
  campaignName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  productCount: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  chevron: { marginLeft: "auto" },
})
