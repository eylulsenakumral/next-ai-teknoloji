import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../src/lib/constants"

export default function KampanyalarScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ionicons name="pricetag-outline" size={34} color={COLORS.primary} />
        <Text style={styles.title}>Kampanyalar</Text>
        <Text style={styles.text}>Bayi kampanyaları ve özel fiyat listeleri burada yayınlanacak.</Text>
      </View>

      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Aktif kampanya bulunamadı</Text>
        <Text style={styles.emptyText}>Yeni kampanyalar başladığında bu ekrandan takip edebilirsiniz.</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 12 },
  hero: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 18, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text, marginTop: 10 },
  text: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", marginTop: 6, lineHeight: 20 },
  empty: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 18 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 6, lineHeight: 20 },
})
