import { Stack } from "expo-router"
import React, { useEffect } from "react"
import { useRouter, useSegments } from "expo-router"
import { useAuthStore } from "../src/stores/auth-store"
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { COLORS } from "../src/lib/constants"
import { Ionicons } from "@expo/vector-icons"


class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Bir şey ters gitti</Text>
          <Text style={styles.errorText}>Sayfa açılırken beklenmeyen bir hata oluştu.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => this.setState({ error: null })}>
            <Text style={styles.errorButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

export default function RootLayout() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === "login"

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login")
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/")
    }
  }, [isAuthenticated, isLoading, segments])

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <AppErrorBoundary>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="urun/[slug]"
        options={{
          headerShown: true,
          title: "Ürün Detay",
          headerTintColor: COLORS.primary,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Geri"
              style={styles.headerBackButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="siparis/[id]"
        options={{ headerShown: true, title: "Sipariş Detay", headerTintColor: COLORS.primary }}
      />
      <Stack.Screen
        name="odeme/index"
        options={{ headerShown: true, title: "Ödeme", headerTintColor: COLORS.primary }}
      />
      <Stack.Screen
        name="siparis-onay"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="cari"
        options={{ headerShown: true, title: "Cari Hesap", headerTintColor: COLORS.primary }}
      />
      <Stack.Screen
        name="favoriler"
        options={{ headerShown: true, title: "Favoriler", headerTintColor: COLORS.primary }}
      />
      <Stack.Screen
        name="kampanyalar"
        options={{ headerShown: true, title: "Kampanyalar", headerTintColor: COLORS.primary }}
      />
      <Stack.Screen
        name="bildirim-ayarlari"
        options={{ headerShown: true, title: "Bildirim Ayarları", headerTintColor: COLORS.primary }}
      />
      <Stack.Screen
        name="hakkinda"
        options={{ headerShown: true, title: "Hakkında", headerTintColor: COLORS.primary }}
      />
    </Stack>
    </AppErrorBoundary>
  )
}


const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: 24,
  },
  errorTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  errorText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", marginTop: 8, lineHeight: 20 },
  errorButton: { marginTop: 18, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12 },
  errorButtonText: { color: "#fff", fontWeight: "700" },
  headerBackButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
})
