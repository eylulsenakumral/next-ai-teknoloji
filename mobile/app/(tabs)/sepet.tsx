import React, { useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { useCartStore } from "../../src/stores/cart-store"
import { CartItemRow } from "../../src/components/cart-item"
import { COLORS } from "../../src/lib/constants"
import { formatPrice, toNumber } from "../../src/lib/format"
import { Ionicons } from "@expo/vector-icons"

export default function SepetScreen() {
  const router = useRouter()
  const { cart, isLoading, fetch, updateItem, removeItem } = useCartStore()

  useEffect(() => { fetch() }, [])

  const total = cart?.items.reduce((sum, i) => sum + toNumber(i.priceSnapshot) * toNumber(i.quantity, 1), 0) ?? 0

  return (
    <View style={styles.container}>
      {isLoading && !cart ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : !cart || cart.items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Sepetiniz boş</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push("/(tabs)/katalog")}>
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
                onUpdateQuantity={updateItem}
                onRemove={(id) => {
                  Alert.alert("Kaldır", "Bu ürünü sepetten kaldırmak istediğinize emin misiniz?", [
                    { text: "İptal", style: "cancel" },
                    { text: "Kaldır", style: "destructive", onPress: () => removeItem(id) },
                  ])
                }}
              />
            )}
            contentContainerStyle={{ padding: 16 }}
            refreshing={isLoading}
            onRefresh={fetch}
          />

          {/* Bottom summary */}
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push("/odeme")}
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
  emptyText: { fontSize: 18, color: COLORS.textMuted, marginTop: 16 },
  shopBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  shopBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
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
})
