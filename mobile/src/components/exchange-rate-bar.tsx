import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, Linking, Pressable } from "react-native"
import type { ExchangeRate } from "../types"
import { exchangeApi } from "../api/exchange"
import { COLORS } from "../lib/constants"
import { Ionicons } from "@expo/vector-icons"

const REP = {
  name: "Ahmet ÜSTÜN",
  phone: "05529895959",
  phoneDisplay: "0552 989 5959",
  email: "ahmet@next-ai.com.tr",
  whatsapp: "905529895959",
}

export function ExchangeRateBar() {
  const [rate, setRate] = useState<ExchangeRate | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    exchangeApi.get().then(setRate).catch(() => {})
  }, [])

  if (!rate) return null

  return (
    <>
      <View style={styles.bar}>
        <TouchableOpacity style={styles.rep} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
          <Text style={styles.repLabel}>Temsilciniz</Text>
          <Text style={styles.repName}>{REP.name}</Text>
        </TouchableOpacity>
        <View style={styles.rates}>
          <View style={styles.item}>
            <Text style={styles.label}>USD</Text>
            <Text style={styles.value}>{rate.usd.toFixed(2)} ₺</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.item}>
            <Text style={styles.label}>EUR</Text>
            <Text style={styles.value}>{rate.eur.toFixed(2)} ₺</Text>
          </View>
        </View>
      </View>

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalLabel}>Satış Temsilciniz</Text>
                <Text style={styles.modalName}>{REP.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${REP.phone}`)}>
              <View style={[styles.contactIcon, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="call-outline" size={18} color="#0284c7" />
              </View>
              <View>
                <Text style={styles.contactLabel}>Telefon</Text>
                <Text style={styles.contactValue}>{REP.phoneDisplay}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${REP.email}`)}>
              <View style={[styles.contactIcon, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="mail-outline" size={18} color="#d97706" />
              </View>
              <View>
                <Text style={styles.contactLabel}>E-posta</Text>
                <Text style={styles.contactValue}>{REP.email}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={() => Linking.openURL(`https://wa.me/${REP.whatsapp}`)}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.whatsappText}>WhatsApp ile Yaz</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  rep: { flexDirection: "column", gap: 1 },
  repLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  repName: { fontSize: 13, color: "#fff", fontWeight: "700" },
  rates: { flexDirection: "row", alignItems: "center" },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  divider: { width: 1, height: 16, backgroundColor: "rgba(255,255,255,0.3)", marginHorizontal: 16 },
  label: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  value: { fontSize: 13, color: "#fff", fontWeight: "700", fontVariant: ["tabular-nums"] },

  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 24 },
  modal: { backgroundColor: "#fff", borderRadius: 20, padding: 20, width: "100%", gap: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },
  modalName: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginTop: 2 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  contactIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  contactLabel: { fontSize: 11, color: COLORS.textMuted },
  contactValue: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  whatsappBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#25d366", borderRadius: 12, paddingVertical: 14, marginTop: 4,
  },
  whatsappText: { color: "#fff", fontSize: 15, fontWeight: "700" },
})
