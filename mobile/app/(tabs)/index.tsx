import React, { useEffect, useState } from "react"
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
import { useAuthStore } from "../../src/stores/auth-store"
import { ExchangeRateBar } from "../../src/components/exchange-rate-bar"
import { useProductStore } from "../../src/stores/product-store"
import { ProductCard } from "../../src/components/product-card"
import { COLORS } from "../../src/lib/constants"

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const { products, fetch: fetchProducts, isLoading } = useProductStore()

  useEffect(() => {
    fetchProducts({ limit: 10, sortBy: "newest" })
  }, [])

  return (
    <View style={styles.container}>
      <ExchangeRateBar />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba, {user?.contactName?.split(" ")[0] ?? "Bayi"}</Text>
          <Text style={styles.company}>{user?.companyName}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/favoriler")}>
          <Ionicons name="heart-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push("/(tabs)/katalog")}
      >
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
        <Text style={styles.searchPlaceholder}>Ürün ara...</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* New Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yeni Gelenler</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/katalog")}>
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
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              scrollEnabled={true}
            />
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickActions}>
            <QuickAction icon="document-text-outline" label="Siparişler" onPress={() => router.push("/(tabs)/siparisler")} />
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

import { Ionicons } from "@expo/vector-icons"

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  company: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchPlaceholder: { marginLeft: 10, fontSize: 15, color: COLORS.textMuted },
  scroll: { paddingBottom: 24 },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
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
})
