import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native"
import { useRouter } from "expo-router"
import { useCartStore } from "../../src/stores/cart-store"
import { useAuthStore } from "../../src/stores/auth-store"
import { ordersApi } from "../../src/api/orders"
import { COLORS } from "../../src/lib/constants"
import { formatPrice } from "../../src/lib/format"
import { Ionicons } from "@expo/vector-icons"

export default function OdemeScreen() {
  const router = useRouter()
  const cart = useCartStore((s) => s.cart)
  const user = useAuthStore((s) => s.user)
  const clearCart = useCartStore((s) => s.clearCart)
  const [paymentMethod, setPaymentMethod] = useState<"BANK_TRANSFER" | "ON_ACCOUNT">("BANK_TRANSFER")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const total = cart?.items.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0) ?? 0

  const handleOrder = async () => {
    if (!cart || cart.items.length === 0 || !user) return
    setLoading(true)
    try {
      const res = await ordersApi.create({
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: {
          companyName: user.companyName,
          contactName: user.contactName,
          phone: user.phone ?? "",
          address: user.address ?? "",
          city: user.city ?? "",
          district: user.district ?? "",
          postalCode: user.postalCode ?? "",
          country: "TR",
        },
        paymentMethod,
        notes: notes || undefined,
      })
      await clearCart()
      Alert.alert(
        "Sipariş Oluşturuldu",
        `Sipariş No: ${res.data.orderNumber}`,
        [{ text: "Tamam", onPress: () => router.replace("/siparisler") }]
      )
    } catch (err: any) {
      Alert.alert("Hata", err?.data?.message ?? "Sipariş oluşturulamadı")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sipariş Özeti</Text>
        <Text style={styles.itemCount}>{cart?.items.length ?? 0} ürün</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Toplam</Text>
          <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
        </View>
      </View>

      {/* Payment method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ödeme Yöntemi</Text>
        <TouchableOpacity
          style={[styles.methodBtn, paymentMethod === "BANK_TRANSFER" && styles.methodBtnActive]}
          onPress={() => setPaymentMethod("BANK_TRANSFER")}
        >
          <Ionicons name="business-outline" size={22} color={paymentMethod === "BANK_TRANSFER" ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.methodText, paymentMethod === "BANK_TRANSFER" && styles.methodTextActive]}>
            Havale / EFT
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodBtn, paymentMethod === "ON_ACCOUNT" && styles.methodBtnActive]}
          onPress={() => setPaymentMethod("ON_ACCOUNT")}
        >
          <Ionicons name="wallet-outline" size={22} color={paymentMethod === "ON_ACCOUNT" ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.methodText, paymentMethod === "ON_ACCOUNT" && styles.methodTextActive]}>
            Açık Hesap
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sipariş Notu</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Not ekleyin (isteğe bağlı)"
          placeholderTextColor={COLORS.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.disabled]}
        onPress={handleOrder}
        disabled={loading}
      >
        <Text style={styles.submitText}>{loading ? "Gönderiliyor..." : "Sipariş Ver"}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { backgroundColor: COLORS.surface, marginTop: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 12 },
  itemCount: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  totalAmount: { fontSize: 22, fontWeight: "800", color: COLORS.text, fontVariant: ["tabular-nums"] },
  methodBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  methodBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "08" },
  methodText: { fontSize: 15, color: COLORS.textMuted },
  methodTextActive: { color: COLORS.primary, fontWeight: "600" },
  notesInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 20,
  },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  disabled: { opacity: 0.6 },
})
