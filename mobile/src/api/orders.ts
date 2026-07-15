import { api } from "./client"
import { toNumber } from "../lib/format"
import type { OrderListResponse, Order, OrderCreatePayload, OrderCreateResponse, OrderItem } from "../types"

type RawOrder = Partial<Order> & {
  grandTotal?: unknown
  itemCount?: unknown
  previewItems?: string[]
  shippingTrackingNumber?: string | null
  items?: RawOrderItem[]
}

type RawOrderItem = Partial<OrderItem> & {
  lineTotal?: unknown
  lineSubtotal?: unknown
}

function normalizeOrderItem(item: RawOrderItem, index: number): OrderItem {
  return {
    id: item.id ?? `${item.productId ?? "item"}-${index}`,
    productId: item.productId ?? "",
    quantity: toNumber(item.quantity, 1),
    unitPrice: toNumber(item.unitPrice),
    totalPrice: toNumber(item.totalPrice ?? item.lineTotal ?? item.lineSubtotal),
  }
}

function normalizeOrder(order: RawOrder): Order {
  const items = Array.isArray(order.items) ? order.items.map(normalizeOrderItem) : []

  return {
    id: order.id ?? "",
    orderNumber: order.orderNumber ?? "-",
    status: order.status ?? "PENDING",
    totalAmount: toNumber(order.totalAmount ?? order.grandTotal),
    currency: order.currency ?? "TRY",
    createdAt: order.createdAt ?? new Date().toISOString(),
    updatedAt: order.updatedAt ?? order.createdAt ?? new Date().toISOString(),
    customer: order.customer ?? { id: "", contactName: "" },
    items,
    itemCount: toNumber(order.itemCount, items.length),
    previewItems: Array.isArray((order as any).previewItems) ? (order as any).previewItems : [],
    shippingAddress: order.shippingAddress ?? null,
    trackingNumber: order.trackingNumber ?? order.shippingTrackingNumber ?? null,
    estimatedDelivery: order.estimatedDelivery ?? null,
  }
}

export const ordersApi = {
  async list(params?: { page?: number; limit?: number; status?: string }) {
    const res = await api.get<OrderListResponse>("/api/orders", params as Record<string, string | number>)
    return {
      ...res,
      data: Array.isArray(res.data) ? res.data.map((order) => normalizeOrder(order as RawOrder)) : [],
    }
  },

  async detail(id: string) {
    const res = await api.get<{ data: Order }>(`/api/orders/${id}`)
    return {
      ...res,
      data: normalizeOrder(res.data as RawOrder),
    }
  },

  create(payload: OrderCreatePayload) {
    return api.post<OrderCreateResponse>("/api/orders", payload)
  },

  cancel(id: string) {
    return api.del<{ data: { success: boolean } }>(`/api/orders/${id}`)
  },
}
