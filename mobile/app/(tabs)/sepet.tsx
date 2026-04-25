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

export default function SepetScreen() {
  const router = useRouter()
  const { cart, isLoading, fetch, updateItem, removeItem } = useCartStore()
  const [orderNote, setOrderNote] = useState("")
  const [couponCode, setCouponCode] = useState("")

  useEffect(() => { fetch() }, [])

  const total = cart?.items.reduce((sum, i) => sum + toNumber(i.priceSnapshot) * toNumber(i.quantity, 1), 0) ?? 0

  return (
    <View style={styles.container}>
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
            <Text style={styles.optionTitle}>Kupon / İndirim Kodu</Text>
            <View style={styles.couponRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Kod girin"
                placeholderTextColor="#667085"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.couponBtn} onPress={() => Alert.alert("Bilgi", "Kupon kodu sipariş notuna eklenecek.")}>
                <Text style={styles.couponBtnText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom summary */}
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push({ pathname: "/odeme", params: { notes: orderNote, couponCode } })}
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
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    color: COLORS.text,
  },
  couponBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.text,
  },
  couponBtnText: { color: "#fff", fontWeight: "800" },
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
