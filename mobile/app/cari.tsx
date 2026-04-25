import React, { useEffect, useState } from "react"
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native"
import { accountApi } from "../src/api/account"
import { COLORS } from "../src/lib/constants"
import { formatPrice, formatDate, toNumber } from "../src/lib/format"
import type { AccountTransaction, TransactionMeta } from "../src/types"

export default function CariScreen() {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([])
  const [meta, setMeta] = useState<TransactionMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    accountApi.transactions({ limit: 50 })
      .then((res) => {
        setTransactions(res.data)
        setMeta(res.meta)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

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
          setIsLoading(true)
          accountApi.transactions({ limit: 50 })
            .then((res) => { setTransactions(res.data); setMeta(res.meta) })
            .finally(() => setIsLoading(false))
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
