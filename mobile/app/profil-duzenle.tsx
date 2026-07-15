import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { useRouter } from "expo-router"
import { accountApi } from "../src/api/account"
import { useAuthStore } from "../src/stores/auth-store"
import { COLORS } from "../src/lib/constants"

export default function ProfileEditScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [contactName, setContactName] = useState(user?.contactName ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [saving, setSaving] = useState(false)

  const saveProfile = async () => {
    if (!contactName.trim()) return Alert.alert('Hata', 'Ad Soyad alanı boş bırakılamaz.')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Alert.alert('Hata', 'Geçerli bir e-posta adresi girin.')
    if (!phone.trim()) return Alert.alert('Hata', 'Telefon numarası boş bırakılamaz.')
    setSaving(true)
    try {
      const res = await accountApi.updateProfile({ contactName, email, phone })
      setUser(res.data)
      Alert.alert("Kaydedildi", "Profil bilgileriniz güncellendi.", [{ text: "Tamam", onPress: () => router.back() }])
    } catch {
      Alert.alert("Hata", "Profil bilgileri güncellenemedi.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Kullanıcı adı</Text>
      <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholderTextColor="#667085" />
      <Text style={styles.label}>E-posta</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.textMuted} />
      <Text style={styles.label}>Telefon</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />
      <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={saveProfile} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? "Kaydediliyor..." : "Kaydet"}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: COLORS.background },
  label: { color: COLORS.text, fontWeight: "800", marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  saveBtn: { marginTop: 24, borderRadius: 12, paddingVertical: 15, alignItems: "center", backgroundColor: COLORS.primary },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  disabled: { opacity: 0.6 },
})
