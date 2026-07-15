import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { accountApi } from "../src/api/account"
import { COLORS } from "../src/lib/constants"

export default function ChangePasswordScreen() {
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)

  const [loading, setLoading] = useState(false)

  const validate = (): string | null => {
    if (!currentPassword.trim()) return "Mevcut şifrenizi girin."
    if (!newPassword.trim()) return "Yeni şifrenizi girin."
    if (newPassword.length < 6) return "Yeni şifre en az 6 karakter olmalıdır."
    if (!repeatPassword.trim()) return "Yeni şifrenizi tekrar girin."
    if (newPassword !== repeatPassword) return "Yeni şifreler eşleşmiyor."
    return null
  }

  const handleSubmit = async () => {
    const error = validate()
    if (error) {
      Alert.alert("Eksik veya hatalı bilgi", error)
      return
    }

    setLoading(true)
    try {
      await accountApi.changePassword({
        currentPassword,
        newPassword,
      })
      Alert.alert("Başarılı", "Şifreniz başarıyla güncellendi.", [
        { text: "Tamam", onPress: () => router.back() },
      ])
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      if (status === 400 || status === 401) {
        Alert.alert("Hata", "Mevcut şifreniz hatalı. Lütfen tekrar deneyin.")
      } else {
        Alert.alert("Hata", "Şifre güncellenemedi. Lütfen tekrar deneyin.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Mevcut Şifre</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={COLORS.textMuted}
              placeholder="Mevcut şifrenizi girin"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowCurrent((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showCurrent ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Yeni Şifre</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={COLORS.textMuted}
              placeholder="En az 6 karakter"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowNew((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showNew ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={repeatPassword}
              onChangeText={setRepeatPassword}
              secureTextEntry={!showRepeat}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={COLORS.textMuted}
              placeholder="Yeni şifrenizi tekrar girin"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowRepeat((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showRepeat ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.disabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Şifreyi Güncelle</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    color: COLORS.text,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 12,
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    padding: 13,
    color: COLORS.text,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 13,
    paddingVertical: 13,
  },
  saveBtn: {
    marginTop: 28,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    minHeight: 50,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
})
