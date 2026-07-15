import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
} from "react-native"
import { useRouter } from "expo-router"
import { wishlistApi } from "../src/api/wishlist"
import { COLORS } from "../src/lib/constants"
import { imageUri } from "../src/lib/media"
import { toNumber } from "../src/lib/format"
import type { WishlistItem } from "../src/types"
import { Ionicons } from "@expo/vector-icons"

export default function FavorilerScreen() {
  const router = useRouter()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetch = () => {
    setIsLoading(true)
    wishlistApi.get()
      .then((res) => setItems(res.items ?? []))
      .catch(() => Alert.alert('Hata', 'Favoriler yüklenemedi. Lütfen tekrar deneyin.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(fetch, [])

  const remove = (productId: string) => {
    Alert.alert("Kaldır", "Favorilerden kaldırmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Kaldır",
        style: "destructive",
        onPress: () => {
          setItems((prev) => prev.filter((i) => i.productId !== productId))
          wishlistApi.remove(productId).catch(() => {
              setItems(prev => prev) // zaten optimistic update geri alındı
              Alert.alert('Hata', 'Ürün favorilerden kaldırılamadı.')
            })
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const image = imageUri(item.product?.images?.[0])
          const stock = toNumber(item.product?.supplierProducts?.[0]?.stockQuantity)
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => item.product?.slug && router.push(`/urun/${item.product.slug}`)}
              activeOpacity={0.7}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
              ) : (
                <View style={[styles.image, styles.placeholder]}>
                  <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.brand}>{item.product?.brand?.name ?? "Marka"}</Text>
                <Text style={styles.name} numberOfLines={2}>{item.product?.name ?? "Ürün"}</Text>
                <Text style={styles.stock}>
                  {stock > 0 ? `Stokta (${stock})` : "Tükendi"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => remove(item.productId)} hitSlop={12}>
                <Ionicons name="heart-dislike-outline" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
          )
        }}
        contentContainerStyle={{ padding: 16 }}
        refreshing={isLoading}
        onRefresh={fetch}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Favori ürününüz yok</Text>
              <TouchableOpacity style={styles.catalogBtn} onPress={() => router.push("/katalog")}>
                <Ionicons name="grid-outline" size={18} color="#fff" />
                <Text style={styles.catalogBtnText}>Kataloğa Git</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: { width: 60, height: 60, borderRadius: 8 },
  placeholder: { backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginLeft: 12 },
  brand: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  name: { fontSize: 14, color: COLORS.text, fontWeight: "500", marginTop: 2 },
  stock: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 64 },
  emptyText: { fontSize: 16, color: COLORS.textMuted, marginTop: 12 },
  catalogBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  catalogBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
})
