import React, { useEffect, useState } from "react"
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native"
import { accountApi } from "../src/api/account"
import { COLORS } from "../src/lib/constants"
import { formatPrice, formatDate, toNumber } from "../src/lib/format"
import type { AccountTransaction, TransactionMeta } from "../src/types"
import { Ionicons } from "@expo/vector-icons"

export default function CariScreen() {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([])
  const [meta, setMeta] = useState<TransactionMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const fetchTransactions = (filters = { dateFrom, dateTo }) => {
    setIsLoading(true)
    accountApi.transactions({
      limit: 50,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    })
      .then((res) => {
        setTransactions(res.data)
        setMeta(res.meta)
      })
      .catch(() => Alert.alert('Hata', 'İşlemler yüklenemedi. Lütfen tekrar deneyin.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchTransactions({ dateFrom: "", dateTo: "" })
  }, [])

  const monthlySummary = transactions.reduce(
    (summary, item) => {
      const created = new Date(item.createdAt)
      const now = new Date()
      if (created.getFullYear() !== now.getFullYear() || created.getMonth() !== now.getMonth()) return summary
      const amount = Math.abs(toNumber(item.amount))
      if (item.type === "PAYMENT" || item.type === "REFUND") summary.incoming += amount
      else summary.outgoing += amount
      return summary
    },
    { incoming: 0, outgoing: 0 }
  )

  if (isLoading) return <ActivityIndicator color={COLORS.primary} style={{ flex: 1, marginTop: 40 }} />

  return (
    <View style={styles.container}>
      {/* Balance card */}
      {meta && (
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Bakiye</Text>
              <Text style={styles.balanceAmount}>{formatPrice(meta.currentBalance)}</Text>
            </View>
            <View style={styles.creditInfo}>
              <Text style={styles.creditLabel}>Kredi Limiti</Text>
              <Text style={styles.creditValue}>{formatPrice(meta.creditLimit)}</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Bu ay gelen</Text>
                <Text style={[styles.summaryAmount, { color: COLORS.success }]}>+{formatPrice(monthlySummary.incoming)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Bu ay giden</Text>
                <Text style={[styles.summaryAmount, { color: COLORS.danger }]}>-{formatPrice(monthlySummary.outgoing)}</Text>
              </View>
            </View>

            <View style={styles.filterPanel}>
              <View style={styles.dateRow}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="Başlangıç YYYY-AA-GG"
                  placeholderTextColor="#667085"
                  value={dateFrom}
                  onChangeText={setDateFrom}
                />
                <TextInput
                  style={styles.dateInput}
                  placeholder="Bitiş YYYY-AA-GG"
                  placeholderTextColor="#667085"
                  value={dateTo}
                  onChangeText={setDateTo}
                />
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.filterBtn} onPress={() => fetchTransactions()}>
                  <Ionicons name="filter-outline" size={18} color="#fff" />
                  <Text style={styles.filterBtnText}>Filtrele</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pdfBtn}
                  onPress={() => Alert.alert("Ekstre", "PDF ekstre indirme bağlantısı hazırlanıyor.")}
                >
                  <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.pdfBtnText}>PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.transactionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionDesc}>{item.description ?? item.type}</Text>
              <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: item.type === "PAYMENT" || item.type === "REFUND" ? COLORS.success : COLORS.danger },
            ]}>
              {item.type === "PAYMENT" || item.type === "REFUND" ? "+" : "-"}{formatPrice(Math.abs(toNumber(item.amount)))}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshing={isLoading}
        onRefresh={() => {
          fetchTransactions()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  balanceCard: {
    backgroundColor: COLORS.primary,
    padding: 20,
    margin: 16,
    borderRadius: 16,
  },
  balanceRow: { flexDirection: "row", justifyContent: "space-between" },
  balanceLabel: { fontSize: 13, color: "#ffffffaa" },
  balanceAmount: { fontSize: 28, fontWeight: "800", color: "#fff", marginTop: 4, fontVariant: ["tabular-nums"] },
  creditInfo: { alignItems: "flex-end" },
  creditLabel: { fontSize: 13, color: "#ffffffaa" },
  creditValue: { fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 4, fontVariant: ["tabular-nums"] },
  summaryRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  summaryLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  summaryAmount: { marginTop: 6, fontSize: 17, fontWeight: "900", fontVariant: ["tabular-nums"] },
  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateRow: { gap: 8 },
  dateInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
  },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  filterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  filterBtnText: { color: "#fff", fontWeight: "800" },
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  pdfBtnText: { color: COLORS.primary, fontWeight: "800" },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transactionDesc: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  transactionDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: "700", fontVariant: ["tabular-nums"] },
})
