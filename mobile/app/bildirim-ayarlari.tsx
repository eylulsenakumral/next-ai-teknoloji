import React, { useState } from "react"
import { View, Text, StyleSheet, Switch } from "react-native"
import { COLORS } from "../src/lib/constants"

export default function BildirimAyarlariScreen() {
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [campaigns, setCampaigns] = useState(true)
  const [stockAlerts, setStockAlerts] = useState(false)

  return (
    <View style={styles.container}>
      <NotificationRow
        title="Sipariş Durumları"
        description="Onay, kargo ve teslimat güncellemeleri"
        value={orderUpdates}
        onValueChange={setOrderUpdates}
      />
      <NotificationRow
        title="Kampanyalar"
        description="Bayi kampanyaları ve özel fiyat bildirimleri"
        value={campaigns}
        onValueChange={setCampaigns}
      />
      <NotificationRow
        title="Stok Uyarıları"
        description="Takip ettiğiniz ürünler stoğa girince haber ver"
        value={stockAlerts}
        onValueChange={setStockAlerts}
      />
    </View>
  )
}

function NotificationRow({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string
  description: string
  value: boolean
  onValueChange: (value: boolean) => void
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: COLORS.primary + "55" }} thumbColor={value ? COLORS.primary : "#f4f4f5"} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 12 },
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
