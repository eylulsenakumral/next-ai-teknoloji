import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Linking,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCartStore } from "../../src/stores/cart-store"
import { useAuthStore } from "../../src/stores/auth-store"
import { ordersApi } from "../../src/api/orders"
import { paymentApi } from "../../src/api/payment"
import { exchangeApi } from "../../src/api/exchange"
import type { ExchangeRate } from "../../src/types"
import { COLORS } from "../../src/lib/constants"
import { formatPrice } from "../../src/lib/format"
import { Ionicons } from "@expo/vector-icons"

type PaymentMethod = "BANK_TRANSFER" | "ON_ACCOUNT" | "CREDIT_CARD"

function getErrorMessage(err: unknown, fallback: string): string {
  const error = err as { data?: { error?: string; message?: string; resultMessage?: string }; message?: string }
  return error?.data?.error ?? error?.data?.message ?? error?.data?.resultMessage ?? error?.message ?? fallback
}

export default function OdemeScreen() {
  const router = useRouter()
  const { notes: initialNotes, couponCode } = useLocalSearchParams<{ notes?: string; couponCode?: string }>()
  const cart = useCartStore((s) => s.cart)
  const user = useAuthStore((s) => s.user)
  const clearCart = useCartStore((s) => s.clearCart)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER")
  const [notes, setNotes] = useState(initialNotes ?? "")
  const [loading, setLoading] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)

  useEffect(() => { exchangeApi.get().then(setExchangeRate).catch(() => {}) }, [])

  const totalTRY = cart?.items.reduce((sum, i) => {
    const price = Number(i.priceSnapshot)
    const qty = Number(i.quantity)
    const priceTRY = i.priceCurrency === "USD" && exchangeRate?.usd
      ? price * exchangeRate.usd
      : price
    return sum + priceTRY * qty
  }, 0) ?? 0

  const handleOrder = async () => {
    if (!cart || cart.items.length === 0 || !user) return
    setLoading(true)
    try {
      const couponNote = couponCode ? `Kupon/indirim kodu: ${couponCode}` : ""
      const fullNotes = [notes, couponNote].filter(Boolean).join("\n")
      const phone = user.phone ?? ""
      const address = user.address ?? ""
      const city = user.city ?? ""
      const shippingAddress =
        phone.length >= 10 && address.length >= 10 && city.length >= 2
          ? {
              companyName: user.companyName,
              contactName: user.contactName,
              phone,
              address,
              city,
              district: user.district ?? "",
              postalCode: user.postalCode ?? "",
              country: "TR" as const,
            }
          : undefined
      const res = await ordersApi.create({
        items: cart.items.map((i) => ({ productId: i.productId, quantity: Math.round(Number(i.quantity)) })),
        shippingAddress,
        paymentMethod,
        notes: fullNotes || undefined,
      })

      if (paymentMethod === "CREDIT_CARD") {
        let paymentUrl: string | undefined
        try {
          const payRes = await paymentApi.createNomuPayMobileTicket(res.data.orderId)
          paymentUrl = payRes.paymentUrl
        } catch (err) {
          Alert.alert("Hata", getErrorMessage(err, "Ödeme linki alınamadı, lütfen tekrar deneyin"))
          return
        }
        if (!paymentUrl) {
          Alert.alert("Hata", "Ödeme linki alınamadı, lütfen tekrar deneyin")
          return
        }
        await clearCart()
        await Linking.openURL(paymentUrl)
        router.replace({
          pathname: "/siparis-onay",
          params: {
            orderNumber: res.data.orderNumber,
            orderId: res.data.orderId,
            total: String(Math.round(totalTRY * 100) / 100),
            paymentStatus: "pending",
          },
        })
        return
      }

      await clearCart()
      router.replace({
        pathname: "/siparis-onay",
        params: { orderNumber: res.data.orderNumber, orderId: res.data.orderId, total: String(Math.round(totalTRY * 100) / 100) },
      })
    } catch (err) {
      Alert.alert("Hata", getErrorMessage(err, "Sipariş oluşturulamadı"))
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
          <Text style={styles.totalAmount}>{formatPrice(totalTRY, "TRY")}</Text>
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
          <View style={styles.methodContent}>
            <Text style={[styles.methodText, paymentMethod === "BANK_TRANSFER" && styles.methodTextActive]}>
              Havale / EFT
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodBtn, paymentMethod === "ON_ACCOUNT" && styles.methodBtnActive]}
          onPress={() => setPaymentMethod("ON_ACCOUNT")}
        >
          <Ionicons name="wallet-outline" size={22} color={paymentMethod === "ON_ACCOUNT" ? COLORS.primary : COLORS.textMuted} />
          <View style={styles.methodContent}>
            <Text style={[styles.methodText, paymentMethod === "ON_ACCOUNT" && styles.methodTextActive]}>
              Açık Hesap
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodBtn, paymentMethod === "CREDIT_CARD" && styles.methodBtnActive]}
          onPress={() => setPaymentMethod("CREDIT_CARD")}
        >
          <Ionicons name="card-outline" size={22} color={paymentMethod === "CREDIT_CARD" ? COLORS.primary : COLORS.textMuted} />
          <View style={styles.methodContent}>
            <Text style={[styles.methodText, paymentMethod === "CREDIT_CARD" && styles.methodTextActive]}>
              Kredi Kartı
            </Text>
            <Text style={styles.methodSubText}>Güvenli ödeme - NomuPay</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sipariş Notu</Text>
        {couponCode ? <Text style={styles.couponInfo}>Kupon kodu: {couponCode}</Text> : null}
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
        <Text style={styles.submitText}>
          {loading
            ? paymentMethod === "CREDIT_CARD"
              ? "İşleniyor..."
              : "Gönderiliyor..."
            : paymentMethod === "CREDIT_CARD"
            ? "Ödemeye Devam Et →"
            : "Sipariş Ver"}
        </Text>
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
  methodContent: { flex: 1 },
  methodText: { fontSize: 15, color: COLORS.textMuted },
  methodTextActive: { color: COLORS.primary, fontWeight: "600" },
  methodSubText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  couponInfo: { color: COLORS.primary, fontSize: 13, fontWeight: "700", marginBottom: 8 },
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
