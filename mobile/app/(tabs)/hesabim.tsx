import React from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Linking,
} from "react-native"
import { useRouter } from "expo-router"
import { useAuthStore } from "../../src/stores/auth-store"
import { COLORS, SUPPORT_WHATSAPP_PHONE } from "../../src/lib/constants"
import { getStatusLabel, formatPrice } from "../../src/lib/format"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function HesabimScreen() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const avatarLetter = getAvatarLetter(user?.contactName, user?.companyName)
  const insets = useSafeAreaInsets()

  const openWhatsAppSupport = async () => {
    const normalizedPhone = SUPPORT_WHATSAPP_PHONE
    const message = encodeURIComponent("Merhaba, Next AI bayi uygulaması için destek almak istiyorum.")
    const url = `https://wa.me/${normalizedPhone}?text=${message}`

    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert("WhatsApp açılamadı", "Destek hattı şu anda açılamıyor. Lütfen daha sonra tekrar deneyin.")
    }
  }

  const handleLogout = () => {
    Alert.alert("Çıkış", "Hesabınızdan çıkış yapmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          await logout()
          router.replace("/login")
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
    <View style={{ height: insets.top, backgroundColor: "#f9f9f9" }} />
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {avatarLetter}
          </Text>
        </View>
        <Text style={styles.contactName}>{user?.contactName}</Text>
        <Text style={styles.companyName}>{user?.companyName}</Text>
        <Text style={styles.dealerCode}>{user?.dealerCode}</Text>
        <View style={styles.contactInfo}>
          <InfoPill icon="mail-outline" value={user?.email} />
          <InfoPill icon="call-outline" value={user?.phone ?? user?.phone2} />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: COLORS.success + "20" }]}>
          <Text style={[styles.statusText, { color: COLORS.success }]}>{user?.status ? getStatusLabel(user.status) : ""}</Text>
        </View>
      </View>

      {/* Balance card */}
      {(user?.balance !== undefined || user?.creditLimit !== undefined) && (
        <View style={styles.balanceCard}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Bakiye</Text>
            <Text style={styles.balanceValue}>
              {formatPrice(user?.balance ?? 0)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Kredi Limiti</Text>
            <Text style={styles.balanceValue}>
              {formatPrice(user?.creditLimit ?? 0)}
            </Text>
          </View>
        </View>
      )}

      {/* Menu items */}
      <View style={styles.menuSection}>
        <MenuItem icon="wallet-outline" label="Cari Hesap" onPress={() => router.push("/cari")} />
        <MenuItem icon="heart-outline" label="Favoriler" onPress={() => router.push("/favoriler")} />
        <MenuItem icon="pricetag-outline" label="Kampanyalar" onPress={() => router.push("/kampanyalar")} />
        <MenuItem
          icon="logo-whatsapp"
          label="WhatsApp Destek"
          onPress={openWhatsAppSupport}
        />
      </View>

      <View style={styles.menuSection}>
        <MenuItem icon="person-outline" label="Profili Düzenle" onPress={() => router.push("/profil-duzenle")} />
        <MenuItem icon="key-outline" label="Şifre Değiştir" onPress={() => router.push("/sifre-degistir")} />
        <MenuItem icon="settings-outline" label="Bildirim Ayarları" onPress={() => router.push("/bildirim-ayarlari")} />
        <MenuItem icon="information-circle-outline" label="Hakkında" onPress={() => router.push("/hakkinda")} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  )
}

function InfoPill({ icon, value }: { icon: string; value?: string | null }) {
  if (!value) return null
  return (
    <View style={styles.infoPill}>
      <Ionicons name={icon as any} size={14} color={COLORS.textMuted} />
      <Text style={styles.infoPillText}>{value}</Text>
    </View>
  )
}

function getAvatarLetter(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const letter = value?.trim().match(/[A-Za-zÇĞİÖŞÜçğıöşü]/)?.[0]
    if (letter) return letter.toLocaleUpperCase("tr-TR")
  }
  return "?"
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={mStyles.item} onPress={onPress}>
      <View style={mStyles.left}>
        <Ionicons name={icon as any} size={22} color={COLORS.primary} />
        <Text style={mStyles.label}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  )
}

const mStyles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 14 },
  label: { fontSize: 15, color: "#1a1a1a", fontWeight: "500" },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  profileCard: {
    backgroundColor: "#0040a4",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#0040a4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarText: { fontSize: 30, fontWeight: "900", color: "#ffffff" },
  contactName: { fontSize: 18, fontWeight: "800", color: "#ffffff", marginTop: 4 },
  companyName: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.85)" },
  dealerCode: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  contactInfo: { marginTop: 10, gap: 6, alignItems: "center" },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  infoPillText: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },
  menuSection: {
    marginTop: 8,
    marginHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff5f5",
    marginTop: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutText: { fontSize: 15, color: COLORS.danger, fontWeight: "600" },
  balanceCard: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  balanceItem: { flex: 1, alignItems: "center" },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 4 },
  balanceValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  balanceDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)", marginVertical: 4 },
})
