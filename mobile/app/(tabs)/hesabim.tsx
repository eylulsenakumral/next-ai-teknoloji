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
import { COLORS } from "../../src/lib/constants"
import { Ionicons } from "@expo/vector-icons"

export default function HesabimScreen() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const avatarLetter = getAvatarLetter(user?.contactName, user?.companyName)

  const openWhatsAppSupport = async () => {
    const phone = (user?.whatsappPhone ?? user?.phone ?? "").replace(/\D/g, "")
    const normalizedPhone = phone.startsWith("90") ? phone : phone ? `90${phone}` : "905551112233"
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
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
          <Text style={[styles.statusText, { color: COLORS.success }]}>{user?.status}</Text>
        </View>
      </View>

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
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 14 },
  label: { fontSize: 15, color: COLORS.text },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: COLORS.primary },
  contactName: { fontSize: 17, fontWeight: "800", color: COLORS.text, marginTop: 2 },
  companyName: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  dealerCode: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  contactInfo: { marginTop: 10, gap: 6, alignItems: "center" },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: COLORS.background,
  },
  infoPillText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },
  menuSection: {
    backgroundColor: COLORS.surface,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    marginTop: 12,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  logoutText: { fontSize: 15, color: COLORS.danger, fontWeight: "600" },
})
