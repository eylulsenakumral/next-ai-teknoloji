import React from "react"
import { View, Text, StyleSheet } from "react-native"
import Constants from "expo-constants"
import * as Application from "expo-application"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../src/lib/constants"

export default function HakkindaScreen() {
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "1.0.0"
  const build = Application.nativeBuildVersion ?? "-"

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <Text style={styles.title}>NexaDepo Bayi</Text>
        <Text style={styles.subtitle}>Next AI Teknoloji B2B Bayi Portalı</Text>
      </View>

      <View style={styles.infoCard}>
        <InfoRow icon="phone-portrait-outline" label="Sürüm" value={version} />
        <InfoRow icon="construct-outline" label="Build" value={build} />
        <InfoRow icon="business-outline" label="Geliştirici" value="Next AI Teknoloji" />
      </View>
    </View>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon as any} size={20} color={COLORS.primary} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16, gap: 12 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 20, alignItems: "center" },
  logo: { width: 64, height: 64, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoText: { color: "#fff", fontSize: 32, fontWeight: "800" },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, textAlign: "center" },
  infoCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { flex: 1, fontSize: 14, color: COLORS.textMuted },
  value: { fontSize: 14, fontWeight: "700", color: COLORS.text },
})
