import { prisma } from "@/lib/db"
import { calculateBulkPrices } from "@/services/pricing.service"
import type { CreateOrderInput, ShippingAddressInput } from "@/lib/validators/order"
import type { OrderStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface OrderListItem {
  id: string
  orderNumber: string
  status: string
  grandTotal: number
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  itemCount: number
  customer?: {
    id: string
    companyName: string
    dealerCode: string
  }
}

export interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  discountTotal: number
  vatTotal: number
  shippingTotal: number
  grandTotal: number
  currency: string
  shippingAddress: ShippingAddressInput | null
  notes: string | null
  adminNotes: string | null
  paymentMethod: string
  paymentStatus: string
  shippingTrackingNumber: string | null
  shippingCarrier: string | null
  cancelledAt: string | null
  cancelledReason: string | null
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    companyName: string
    dealerCode: string
    contactName: string | null
    phone: string | null
    email: string | null
    city: string | null
    taxNumber: string | null
  }
  items: OrderItemDetail[]
  // Admin-only
  totalPurchaseCost?: number
  totalProfit?: number
  profitMarginPct?: number
}

export interface OrderItemDetail {
  id: string
  productId: string | null
  productName: string
  productBarcode: string | null
  quantity: number
  unitPrice: number
  discountAmount: number
  vatRate: number
  lineSubtotal: number
  lineVat: number
  lineTotal: number
  purchasePrice: number | null
  profitMarginPct: number | null
  notes: string | null
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// generateOrderNumber — NAT-XXXXXX formatı
// ---------------------------------------------------------------------------

export async function generateOrderNumber(): Promise<string> {
  // En son sipariş numarasını al, kilitli okuma ile race condition önle
  const result = await prisma.$queryRaw<Array<{ max_num: string | null }>>`
    SELECT MAX(order_number) AS max_num FROM orders
  `

  const maxNum = result[0]?.max_num
  let nextSeq = 1

  if (maxNum && /^NAT-\d{6}$/.test(maxNum)) {
    nextSeq = parseInt(maxNum.replace("NAT-", ""), 10) + 1
  }

  return `NAT-${String(nextSeq).padStart(6, "0")}`
}

// ---------------------------------------------------------------------------
// createOrder
// ---------------------------------------------------------------------------

export async function createOrder(
  customerId: string,
  input: CreateOrderInput
): Promise<{ orderId: string; orderNumber: string }> {
  // 1. Müşteri bilgisini çek
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, deletedAt: null },
    include: { priceList: true },
  })

  if (!customer) {
    throw new Error("Müşteri bulunamadı.")
  }

  if (customer.status !== "APPROVED") {
    throw new Error("Hesabınız sipariş vermeye uygun durumda değil.")
  }

  // 2. Ürün fiyatlarını hesapla
  const productIds = input.items.map((i) => i.productId)
  const priceMap = await calculateBulkPrices(productIds)

  // 3. Tüm ürünlerin fiyatını doğrula
  for (const item of input.items) {
    if (!priceMap.has(item.productId)) {
      throw new Error(
        `Ürün fiyatı hesaplanamadı (ID: ${item.productId}). Stokta olmayabilir.`
      )
    }
  }

  // 4. Sipariş kalemlerini ve toplamları hesapla
  let subtotal = 0
  let vatTotal = 0

  const orderItemsData = input.items.map((item) => {
    const price = priceMap.get(item.productId)!
    const unitPrice = price.salePriceExVat
    const vatRate = price.vatRate
    const purchasePrice = price.purchasePrice

    const lineSubtotal = round2(unitPrice * item.quantity)
    const lineVat = round2(lineSubtotal * (vatRate / 100))
    const lineTotal = round2(lineSubtotal + lineVat)

    const marginPct = price.marginPct

    subtotal += lineSubtotal
    vatTotal += lineVat

    return {
      productId: item.productId,
      supplierProductId: null as string | null,
      productName: "",       // geçici, aşağıda doldurulacak
      productBarcode: null as string | null,
      quantity: item.quantity,
      unitPrice,
      discountAmount: 0,
      vatRate,
      lineSubtotal,
      lineVat,
      lineTotal,
      purchasePrice,
      profitMarginPct: marginPct,
    }
  })

  // 5. Ürün isimlerini ve barkodlarını al
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, barcode: true },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))

  for (const item of orderItemsData) {
    const prod = productMap.get(item.productId!)
    if (prod) {
      item.productName = prod.name
      item.productBarcode = prod.barcode ?? null
    }
  }

  subtotal = round2(subtotal)
  vatTotal = round2(vatTotal)
  const grandTotal = round2(subtotal + vatTotal)

  // 6. Açık hesap kontrolü
  if (input.paymentMethod === "ON_ACCOUNT") {
    const newBalance = Number(customer.balance) + grandTotal
    const creditLimit = Number(customer.creditLimit)
    if (creditLimit > 0 && newBalance > creditLimit) {
      throw new Error(
        `Kredi limitiniz aşılıyor. Mevcut bakiye: ${Number(customer.balance).toFixed(2)} TL, Limit: ${creditLimit.toFixed(2)} TL`
      )
    }
  }

  // 7. Transaction: Sipariş + AccountTransaction + Balance güncelleme
  return await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber()

    const order = await tx.order.create({
      data: {
        customerId,
        orderNumber,
        status: "PENDING",
        subtotal,
        discountTotal: 0,
        vatTotal,
        shippingTotal: 0,
        grandTotal,
        currency: "TRY",
        shippingAddress: input.shippingAddress as object,
        notes: input.notes ?? null,
        paymentMethod: input.paymentMethod as "BANK_TRANSFER" | "ON_ACCOUNT",
        paymentStatus: "PENDING",
        orderItems: {
          create: orderItemsData,
        },
      },
    })

    // AccountTransaction: INVOICE (borç = pozitif)
    const balanceAfter = round2(Number(customer.balance) + grandTotal)

    await tx.accountTransaction.create({
      data: {
        customerId,
        type: "INVOICE",
        amount: grandTotal,
        balanceAfter,
        currency: "TRY",
        referenceType: "ORDER",
        referenceId: order.id,
        description: `Sipariş faturası - ${orderNumber}`,
      },
    })

    // Müşteri bakiyesini güncelle
    await tx.customer.update({
      where: { id: customerId },
      data: {
        balance: balanceAfter,
        lastOrderAt: new Date(),
      },
    })

    return { orderId: order.id, orderNumber }
  })
}

// ---------------------------------------------------------------------------
// getOrdersByCustomer
// ---------------------------------------------------------------------------

export async function getOrdersByCustomer(
  customerId: string,
  page = 1,
  limit = 20,
  status?: string
): Promise<{ data: OrderListItem[]; meta: PaginationMeta }> {
  const validStatuses = [
    "PENDING", "CONFIRMED", "PREPARING", "SHIPPED",
    "DELIVERED", "CANCELLED", "RETURNED",
  ]

  const where = {
    customerId,
    deletedAt: null as null,
    ...(status && validStatuses.includes(status)
      ? { status: status as OrderStatus }
      : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        grandTotal: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        _count: { select: { orderItems: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return {
    data: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      grandTotal: Number(o.grandTotal),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
      itemCount: o._count.orderItems,
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ---------------------------------------------------------------------------
// getAllOrders (Admin)
// ---------------------------------------------------------------------------

export async function getAllOrders(options: {
  page?: number
  limit?: number
  status?: string
  customerId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}): Promise<{ data: OrderListItem[]; meta: PaginationMeta }> {
  const { page = 1, limit = 20, status, customerId, search, dateFrom, dateTo } = options

  const validStatuses = [
    "PENDING", "CONFIRMED", "PREPARING", "SHIPPED",
    "DELIVERED", "CANCELLED", "RETURNED",
  ]

  type WhereType = {
    deletedAt: null
    status?: OrderStatus
    customerId?: string
    createdAt?: { gte?: Date; lte?: Date }
    OR?: Array<{
      orderNumber?: { contains: string; mode: "insensitive" }
      customer?: { companyName?: { contains: string; mode: "insensitive" }; dealerCode?: { contains: string; mode: "insensitive" } }
    }>
  }

  const where: WhereType = { deletedAt: null }

  if (status && validStatuses.includes(status)) {
    where.status = status as OrderStatus
  }
  if (customerId) {
    where.customerId = customerId
  }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
  }
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customer: { companyName: { contains: search, mode: "insensitive" } } },
      { customer: { dealerCode: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        grandTotal: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        _count: { select: { orderItems: true } },
        customer: {
          select: {
            id: true,
            companyName: true,
            dealerCode: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ])

  return {
    data: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      grandTotal: Number(o.grandTotal),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
      itemCount: o._count.orderItems,
      customer: o.customer
        ? {
            id: o.customer.id,
            companyName: o.customer.companyName,
            dealerCode: o.customer.dealerCode,
          }
        : undefined,
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ---------------------------------------------------------------------------
// getOrderById
// ---------------------------------------------------------------------------

export async function getOrderById(
  orderId: string,
  includeProfit = false
): Promise<OrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
          dealerCode: true,
          contactName: true,
          phone: true,
          email: true,
          city: true,
          taxNumber: true,
        },
      },
      orderItems: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!order) return null

  const items: OrderItemDetail[] = order.orderItems.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productBarcode: item.productBarcode,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    discountAmount: Number(item.discountAmount),
    vatRate: Number(item.vatRate),
    lineSubtotal: Number(item.lineSubtotal),
    lineVat: Number(item.lineVat),
    lineTotal: Number(item.lineTotal),
    purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
    profitMarginPct: item.profitMarginPct ? Number(item.profitMarginPct) : null,
    notes: item.notes,
  }))

  const result: OrderDetail = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    vatTotal: Number(order.vatTotal),
    shippingTotal: Number(order.shippingTotal),
    grandTotal: Number(order.grandTotal),
    currency: order.currency,
    shippingAddress: order.shippingAddress as ShippingAddressInput | null,
    notes: order.notes,
    adminNotes: order.adminNotes,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingTrackingNumber: order.shippingTrackingNumber,
    shippingCarrier: order.shippingCarrier,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    cancelledReason: order.cancelledReason,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: order.customer,
    items,
  }

  // Admin: Kar/zarar hesapla
  if (includeProfit) {
    const totalPurchaseCost = items.reduce((sum, item) => {
      if (item.purchasePrice == null) return sum
      return sum + round2(item.purchasePrice * item.quantity)
    }, 0)
    const totalProfit = round2(Number(order.subtotal) - totalPurchaseCost)
    const profitMarginPct =
      totalPurchaseCost > 0
        ? round2((totalProfit / totalPurchaseCost) * 100)
        : 0

    result.totalPurchaseCost = totalPurchaseCost
    result.totalProfit = totalProfit
    result.profitMarginPct = profitMarginPct
  }

  return result
}

// ---------------------------------------------------------------------------
// updateOrderStatus (Admin)
// ---------------------------------------------------------------------------

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  adminNotes?: string,
  shippingTrackingNumber?: string,
  shippingCarrier?: string
): Promise<{ success: boolean }> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
  })

  if (!order) throw new Error("Sipariş bulunamadı.")

  const updateData: Record<string, unknown> = {
    status: newStatus,
    ...(adminNotes !== undefined ? { adminNotes } : {}),
    ...(shippingTrackingNumber !== undefined ? { shippingTrackingNumber } : {}),
    ...(shippingCarrier !== undefined ? { shippingCarrier } : {}),
  }

  // Durum değişikliğine özel alanlar
  if (newStatus === "SHIPPED" && !order.shippedAt) {
    updateData.shippedAt = new Date()
  }
  if (newStatus === "DELIVERED" && !order.deliveredAt) {
    updateData.deliveredAt = new Date()
    updateData.paymentStatus = order.paymentMethod === "ON_ACCOUNT" ? "PENDING" : "PAID"
  }

  await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  })

  return { success: true }
}

// ---------------------------------------------------------------------------
// cancelOrder
// ---------------------------------------------------------------------------

export async function cancelOrder(
  orderId: string,
  customerId: string,
  reason: string
): Promise<{ success: boolean }> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId, deletedAt: null },
  })

  if (!order) throw new Error("Sipariş bulunamadı.")

  if (order.status !== "PENDING") {
    throw new Error("Yalnızca beklemedeki siparişler iptal edilebilir.")
  }

  const grandTotal = Number(order.grandTotal)

  return await prisma.$transaction(async (tx) => {
    // Siparişi iptal et
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledReason: reason,
      },
    })

    // Cari iade hareketi (REFUND - negatif tutar)
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { balance: true },
    })

    if (customer) {
      const balanceAfter = round2(Number(customer.balance) - grandTotal)

      await tx.accountTransaction.create({
        data: {
          customerId,
          type: "REFUND",
          amount: -grandTotal,
          balanceAfter,
          currency: "TRY",
          referenceType: "ORDER",
          referenceId: orderId,
          description: `Sipariş iadesi - ${order.orderNumber}`,
          notes: reason,
        },
      })

      await tx.customer.update({
        where: { id: customerId },
        data: { balance: balanceAfter },
      })
    }

    return { success: true }
  })
}

// ---------------------------------------------------------------------------
// getTodayStats (Admin dashboard)
// ---------------------------------------------------------------------------

export async function getTodayOrderStats(): Promise<{
  count: number
  total: number
  pending: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [count, aggregates, pending] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: today, lt: tomorrow }, deletedAt: null },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today, lt: tomorrow }, deletedAt: null },
      _sum: { grandTotal: true },
    }),
    prisma.order.count({
      where: { status: "PENDING", deletedAt: null },
    }),
  ])

  return {
    count,
    total: Number(aggregates._sum.grandTotal ?? 0),
    pending,
  }
}

// ---------------------------------------------------------------------------
// Yardımcı
// ---------------------------------------------------------------------------

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
