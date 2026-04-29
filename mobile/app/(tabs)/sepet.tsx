import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native"
import { useRouter } from "expo-router"
import { useCartStore } from "../../src/stores/cart-store"
import { CartItemRow } from "../../src/components/cart-item"
import { COLORS } from "../../src/lib/constants"
import { formatPrice, toNumber } from "../../src/lib/format"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { exchangeApi } from "../../src/api/exchange"
import type { ExchangeRate } from "../../src/types"

export default function SepetScreen() {
  const router = useRouter()
  const { cart, isLoading, fetch, updateItem, removeItem } = useCartStore()
  const [orderNote, setOrderNote] = useState("")
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const insets = useSafeAreaInsets()

  useEffect(() => { fetch() }, [])
  useEffect(() => { exchangeApi.get().then(setExchangeRate).catch(() => {}) }, [])

  const subtotalTRY = cart?.items.reduce((sum, i) => {
    const price = toNumber(i.priceSnapshot)
    const qty = toNumber(i.quantity, 1)
    const priceTRY = i.priceCurrency === "USD" && exchangeRate?.usd
      ? price * exchangeRate.usd
      : price
    return sum + priceTRY * qty
  }, 0) ?? 0
  const vatTRY = Math.round(subtotalTRY * 0.20 * 100) / 100
  const totalTRY = Math.round((subtotalTRY + vatTRY) * 100) / 100

  return (
    <View style={styles.container}>
      <View style={{ height: insets.top, backgroundColor: "#0040a4" }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sepetim</Text>
      </View>
      {isLoading && !cart ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : !cart || cart.items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={58} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyText}>Sepetiniz boş</Text>
          <Text style={styles.emptyDescription}>Bayi alışverişine katalogdan ürün ekleyerek başlayın.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push("/katalog")}>
            <Ionicons name="storefront-outline" size={19} color="#fff" />
            <Text style={styles.shopBtnText}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CartItemRow
                item={item}
                usdTryRate={exchangeRate?.usd}
                onUpdateQuantity={updateItem}
                onRemove={(id) => {
                  Alert.alert("Kaldır", "Bu ürünü sepetten kaldırmak istediğinize emin misiniz?", [
                    { text: "İptal", style: "cancel" },
                    { text: "Kaldır", style: "destructive", onPress: () => removeItem(id) },
                  ])
                }}
              />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            refreshing={isLoading}
            onRefresh={fetch}
          />

          <View style={styles.checkoutOptions}>
            <Text style={styles.optionTitle}>Sipariş Notu</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Teslimat, ürün veya fiyat notu ekleyin"
              placeholderTextColor="#667085"
              value={orderNote}
              onChangeText={setOrderNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Bottom summary */}
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.totalLabel}>KDV Hariç: {formatPrice(subtotalTRY, "TRY")}</Text>
              <Text style={styles.totalLabel}>KDV (%20): {formatPrice(vatTRY, "TRY")}</Text>
              <Text style={styles.totalAmount}>KDV Dahil: {formatPrice(totalTRY, "TRY")}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push({ pathname: "/odeme", params: { notes: orderNote } })}
            >
              <Text style={styles.checkoutBtnText}>Ödemeye Geç</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "12",
  },
  emptyText: { fontSize: 20, color: COLORS.text, marginTop: 18, fontWeight: "800" },
  emptyDescription: { fontSize: 14, color: COLORS.textMuted, marginTop: 8, textAlign: "center", lineHeight: 20 },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  shopBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  checkoutOptions: { backgroundColor: COLORS.surface, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  optionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  noteInput: {
    minHeight: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    padding: 12,
    color: COLORS.text,
    marginBottom: 14,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: { fontSize: 13, color: COLORS.textMuted },
  totalAmount: { fontSize: 22, fontWeight: "800", color: COLORS.text, fontVariant: ["tabular-nums"] },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  checkoutBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  header: {
    backgroundColor: "#0040a4",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
})
