import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../src/lib/constants"
import { useCartStore } from "../../src/stores/cart-store"
import { useEffect } from "react"
import { View, Text, StyleSheet } from "react-native"

function CartBadge() {
  const itemCount = useCartStore((s) => s.itemCount)
  if (itemCount === 0) return null
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
    </View>
  )
}

export default function TabLayout() {
  const fetchCart = useCartStore((s) => s.fetch)

  useEffect(() => {
    fetchCart()
  }, [])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { borderTopWidth: 1, borderTopColor: COLORS.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="katalog"
        options={{
          title: "Katalog",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sepet"
        options={{
          title: "Sepet",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="cart-outline" size={size} color={color} />
              <CartBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="siparisler"
        options={{
          title: "Siparişler",
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="hesabim"
        options={{
          title: "Hesabım",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
})
