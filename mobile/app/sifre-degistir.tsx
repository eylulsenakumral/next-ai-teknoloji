import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { COLORS } from "../src/lib/constants"

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")

  const submit = () => {
    if (!currentPassword || !newPassword || !repeatPassword) {
      Alert.alert("Eksik bilgi", "Lütfen tüm alanları doldurun.")
      return
    }
    if (newPassword !== repeatPassword) {
      Alert.alert("Hata", "Yeni şifreler eşleşmiyor.")
      return
    }
    Alert.alert("Şifre değişikliği", "Şifre değiştirme servisi hazır olduğunda bu ekrandan güncelleme yapılacak.")
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mevcut şifre</Text>
      <TextInput style={styles.input} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
      <Text style={styles.label}>Yeni şifre</Text>
      <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
      <Text style={styles.label}>Yeni şifre tekrar</Text>
      <TextInput style={styles.input} secureTextEntry value={repeatPassword} onChangeText={setRepeatPassword} />
      <TouchableOpacity style={styles.saveBtn} onPress={submit}>
        <Text style={styles.saveBtnText}>Şifreyi Güncelle</Text>
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
})
