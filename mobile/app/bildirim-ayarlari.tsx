import React, { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, Switch, ActivityIndicator, Alert } from "react-native"
import { COLORS } from "../src/lib/constants"
import { api } from "../src/api/client"

interface NotificationPreferences {
  orderUpdates: boolean
  campaigns: boolean
  stockAlerts: boolean
}

export default function BildirimAyarlariScreen() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    orderUpdates: true,
    campaigns: true,
    stockAlerts: false,
  })
  const [loadingField, setLoadingField] = useState<keyof NotificationPreferences | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ data: NotificationPreferences } | NotificationPreferences>("/api/account/notification-preferences")
      .then((raw) => {
        const prefs = (raw as { data: NotificationPreferences }).data ?? (raw as NotificationPreferences)
        setPrefs(prefs)
      })
      .catch(() => {
        // Hata durumunda varsayılan değerler kalır, sessizce geç
      })
      .finally(() => setInitialLoading(false))
  }, [])

  const handleToggle = useCallback(
    async (field: keyof NotificationPreferences, newValue: boolean) => {
      const previous = prefs[field]
      setPrefs((p) => ({ ...p, [field]: newValue }))
      setLoadingField(field)

      try {
        await api.put("/api/account/notification-preferences", {
          ...prefs,
          [field]: newValue,
        })
      } catch {
        setPrefs((p) => ({ ...p, [field]: previous }))
        Alert.alert("Hata", "Bildirim ayarı kaydedilemedi. Lütfen tekrar deneyin.")
      } finally {
        setLoadingField(null)
      }
    },
    [prefs]
  )

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <NotificationRow
        title="Sipariş Durumları"
        description="Onay, kargo ve teslimat güncellemeleri"
        value={prefs.orderUpdates}
        onValueChange={(v) => handleToggle("orderUpdates", v)}
        disabled={loadingField === "orderUpdates"}
      />
      <NotificationRow
        title="Kampanyalar"
        description="Bayi kampanyaları ve özel fiyat bildirimleri"
        value={prefs.campaigns}
        onValueChange={(v) => handleToggle("campaigns", v)}
        disabled={loadingField === "campaigns"}
      />
      <NotificationRow
        title="Stok Uyarıları"
        description="Takip ettiğiniz ürünler stoğa girince haber ver"
        value={prefs.stockAlerts}
        onValueChange={(v) => handleToggle("stockAlerts", v)}
        disabled={loadingField === "stockAlerts"}
      />
    </View>
  )
}

function NotificationRow({
  title,
  description,
  value,
  onValueChange,
  disabled,
}: {
  title: string
  description: string
  value: boolean
  onValueChange: (value: boolean) => void
  disabled: boolean
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: COLORS.primary + "55" }}
        thumbColor={value ? COLORS.primary : "#f4f4f5"}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 12 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  description: { fontSize: 13, color: COLORS.textMuted, marginTop: 3, lineHeight: 18 },
})
