import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useAuthStore } from "../src/stores/auth-store"
import { COLORS } from "../src/lib/constants"
import { Ionicons } from "@expo/vector-icons"

export default function LoginScreen() {
  const [dealerCode, setDealerCode] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const router = useRouter()

  const handleLogin = async () => {
    if (!dealerCode.trim() || !password.trim()) {
      Alert.alert("Hata", "Bayi kodu ve şifre gereklidir")
      return
    }
    setLoading(true)
    try {
      await login(dealerCode.toUpperCase().trim(), password)
      router.replace("/")
    } catch (err: any) {
      const msg = err?.data?.message ?? err?.message ?? "Giriş başarısız"
      Alert.alert("Giriş Hatası", msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.topAccent} />

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>N</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>Next AI</Text>
              <Text style={styles.brandSubtitle}>Teknoloji</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerLink} activeOpacity={0.75}>
            <Text style={styles.headerLinkText}>İletişim</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.formWrap}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Next AI Teknoloji'ye Hoş Geldiniz</Text>
              <Text style={styles.subtitle}>B2B Bayi Portalı</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bayi Kodu</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: BAY001"
                placeholderTextColor="#9ca3af"
                value={dealerCode}
                onChangeText={(value) => setDealerCode(value.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Şifre</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Şifrenizi girin"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe((value) => !value)}
                activeOpacity={0.75}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <Text style={styles.optionText}>Beni Hatırla</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.75}>
                <Text style={styles.primaryLink}>Şifremi Unuttum?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.buttonText}>Giriş yapılıyor...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.catalogButton} activeOpacity={0.8}>
              <Text style={styles.catalogText}>Ürün Kataloğunu İncele</Text>
              <Ionicons name="arrow-forward" size={16} color="#374151" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} activeOpacity={0.75}>
              <Text style={styles.applyText}>Bayilik Başvurusu</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>© 2026 Next AI Teknoloji. Tüm hakları saklıdır.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4ff" },
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  topAccent: { height: 5, backgroundColor: COLORS.primary },
  header: {
    height: 72,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoMark: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  logoLetter: { color: "#ffffff", fontSize: 22, fontWeight: "900" },
  brandTitle: { color: "#0e121a", fontSize: 15, fontWeight: "900" },
  brandSubtitle: { color: "#6b7280", fontSize: 11, marginTop: -1 },
  headerLink: { paddingVertical: 8, paddingLeft: 12 },
  headerLinkText: { color: "#6b7280", fontSize: 12, fontWeight: "600" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 20, paddingBottom: 24 },
  formWrap: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  titleBlock: { alignItems: "center", marginBottom: 28 },
  title: {
    color: "#0e121a",
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: { color: "#6b7280", fontSize: 13, marginTop: 6, textAlign: "center" },
  fieldGroup: { gap: 7, marginBottom: 16 },
  label: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 52,
    backgroundColor: "#f8faff",
    borderWidth: 1.5,
    borderColor: "#dde3f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#0e121a",
  },
  passwordContainer: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8faff",
    borderWidth: 1.5,
    borderColor: "#dde3f0",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#0e121a",
  },
  iconButton: { width: 48, height: "100%", alignItems: "center", justifyContent: "center" },
  optionsRow: {
    marginTop: 2,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#ccd1db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { color: "#374151", fontSize: 13 },
  primaryLink: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  button: {
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.65 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginTop: 24, marginBottom: 18 },
  catalogButton: {
    height: 46,
    borderWidth: 1.5,
    borderColor: "#dde3f0",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f8faff",
  },
  catalogText: { color: "#374151", fontSize: 14, fontWeight: "600" },
  applyButton: { alignItems: "center", paddingTop: 18 },
  applyText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  footer: { color: "#9ca3af", fontSize: 11, textAlign: "center", paddingHorizontal: 24, paddingBottom: 18 },
})
