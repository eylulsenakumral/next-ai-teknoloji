import { prisma } from "@/lib/db"
import { calculateBulkPrices } from "@/services/pricing.service"
import type { CreateOrderInput, ShippingAddressInput } from "@/lib/validators/order"
import type { OrderStatus, Prisma } from "@prisma/client"
import { getUsdTryRate } from "@/lib/exchange-rate"
// Backward-compat: eski importer'lar (ör. nomupay callback) hâlâ @/services/order.service
// üzerinden alabilsin diye re-export. Tek kaynak: @/lib/exchange-rate.
export { getUsdTryRate }

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface OrderListItem {
  id: string
  orderNumber: string
  status: string
  grandTotal: number
  currency: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  itemCount: number
  previewItems?: string[]
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
// generateOrderNumber — NAT-XXXXXXXXX formatı (9 hane)
// ---------------------------------------------------------------------------

export async function generateOrderNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  // MAX(order_number)'ı transaction içinde FOR UPDATE ile kilitleyerek oku.
  // Bu, eşzamanlı iki siparişin aynı numarayı üretmesini (race) engeller.
  const result = await tx.$queryRaw<Array<{ max_num: string | null }>>`
    SELECT MAX(order_number) AS max_num FROM orders FOR UPDATE
  `

  const maxNum = result[0]?.max_num
  let nextSeq = 1

  // Eski 6 haneli ve yeni 9 haneli kayıtların ikisini de kabul et → seq devamı doğru kalsın.
  if (maxNum && /^NAT-\d{6,9}$/.test(maxNum)) {
    nextSeq = parseInt(maxNum.replace("NAT-", ""), 10) + 1
  }

  return `NAT-${String(nextSeq).padStart(9, "0")}`
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

  // 2. Normal ürün + set ürünlerini ayır
  const setItems = input.items.filter((i) => i.productId.startsWith("set-"))
  const normalItems = input.items.filter((i) => !i.productId.startsWith("set-"))

  // 3. Normal ürün fiyatlarını hesapla
  const normalProductIds = normalItems.map((i) => i.productId)
  const priceMap = await calculateBulkPrices(normalProductIds)

  for (const item of normalItems) {
    if (!priceMap.has(item.productId)) {
      throw new Error(
        `Ürün fiyatı hesaplanamadı (ID: ${item.productId}). Stokta olmayabilir.`
      )
    }
  }

  // Set ürünlerini DB'den çek
  const setIds = setItems.map((i) => i.productId.replace("set-", ""))
  let setMap = new Map<string, { name: string; price: number }>()
  if (setIds.length > 0) {
    const sets = await prisma.campaignSet.findMany({
      where: { id: { in: setIds }, deletedAt: null },
      select: { id: true, name: true, price: true, discountPct: true },
    })
    for (const s of sets) {
      const basePrice = Number(s.price ?? 0)
      const discount = s.discountPct ? Number(s.discountPct) : 0
      const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice
      setMap.set(s.id, { name: `[Set] ${s.name}`, price: finalPrice })
    }
  }

  for (const item of setItems) {
    const setId = item.productId.replace("set-", "")
    if (!setMap.has(setId)) {
      throw new Error(`Kampanya seti bulunamadı (ID: ${setId}).`)
    }
  }

  // 4. Sipariş kalemlerini ve toplamları hesapla
  let subtotal = 0
  let vatTotal = 0

  const orderItemsData = input.items.map((item) => {
    let unitPrice: number
    let vatRate: number
    let purchasePrice: number | null = null
    let marginPct: number | null = null
    let supplierProductId: string | null = null
    let productName = ""

    if (item.productId.startsWith("set-")) {
      // Set ürünü
      const setData = setMap.get(item.productId.replace("set-", ""))!
      unitPrice = setData.price
      vatRate = 20 // default KDV
      productName = setData.name
    } else {
      // Normal ürün
      const price = priceMap.get(item.productId)!
      unitPrice = price.salePriceExVat
      vatRate = price.vatRate
      purchasePrice = price.purchasePrice
      marginPct = price.marginPct
      supplierProductId = price.supplierProductId
    }

    const lineSubtotal = round2(unitPrice * item.quantity)
    const lineVat = round2(lineSubtotal * (vatRate / 100))
    const lineTotal = round2(lineSubtotal + lineVat)

    subtotal += lineSubtotal
    vatTotal += lineVat

    return {
      productId: item.productId.startsWith("set-") ? null : item.productId,
      supplierProductId,
      productName,
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

  // 5. Normal ürün isimlerini ve barkodlarını al
  if (normalProductIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: normalProductIds } },
      select: { id: true, name: true, barcode: true },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    for (const item of orderItemsData) {
      if (item.productId && !item.productId.startsWith("set-")) {
        const prod = productMap.get(item.productId!)
        if (prod) {
          item.productName = prod.name
          item.productBarcode = prod.barcode ?? null
        }
      }
    }
  }

  subtotal = round2(subtotal)
  vatTotal = round2(vatTotal)
  const grandTotal = round2(subtotal + vatTotal)

  // 6. Döviz kuru (USD → TL çevrim)
  const usdTryRate = await getUsdTryRate()
  const grandTotalTL = round2(grandTotal * usdTryRate)

  // 7. Transaction: Sipariş + (sadece ON_ACCOUNT cari borç/bakiye) + sepet temizle.
  //    Bakiye ve kredi limiti tx İÇİNDE fresh okunur (eşzamanlı siparişte lost update fix — cancelOrder pattern).
  //    CREDIT_CARD / BANK_TRANSFER cari hesaba borç yazmaz; ödeme ayrı akışta (NomuPay callback vb.) işlenir.
  return await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx)

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
        shippingAddress: (input.shippingAddress as object) ?? undefined,
        notes: input.notes ?? null,
        paymentMethod: input.paymentMethod as "BANK_TRANSFER" | "ON_ACCOUNT" | "CREDIT_CARD",
        paymentStatus: "PENDING",
        orderItems: {
          create: orderItemsData,
        },
      },
    })

    // Stok düşürme — supplierProductId'si olan normal ürünler için koşullu (conditional) decrement.
    // Stok yetmezse updateMany 0 satır etkiler → throw → tx rollback (oversell koruması, KRİTİK-08).
    // Set ürünleri ve manuel fiyatlı (outlet) ürünler supplierProductId olmadığından burada atlanır.
    for (const item of orderItemsData) {
      if (item.supplierProductId && item.quantity > 0) {
        const result = await tx.supplierProduct.updateMany({
          where: { id: item.supplierProductId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        })
        if (result.count === 0) {
          throw new Error(
            `Yetersiz stok: ${item.productName} (istenen: ${item.quantity}). Sipariş oluşturulamadı.`
          )
        }
      }
    }

    if (input.paymentMethod === "ON_ACCOUNT") {
      // Bakiyeyi transaction içinde tekrar oku — stale balance ile lost update'i engeller
      const fresh = await tx.customer.findUnique({
        where: { id: customerId },
        select: { balance: true, creditLimit: true },
      })
      const currentBalance = Number(fresh?.balance ?? 0)
      const creditLimit = Number(fresh?.creditLimit ?? 0)
      const balanceAfter = round2(currentBalance + grandTotalTL)

      // Kredi limit kontrolü fresh bakiye ile tx içinde
      if (creditLimit > 0 && balanceAfter > creditLimit) {
        throw new Error(
          `Kredi limitiniz aşılıyor. Mevcut bakiye: ${currentBalance.toFixed(2)} TL, Limit: ${creditLimit.toFixed(2)} TL`
        )
      }

      await tx.accountTransaction.create({
        data: {
          customerId,
          type: "INVOICE",
          amount: grandTotalTL,
          balanceAfter,
          currency: "TRY",
          referenceType: "ORDER",
          referenceId: order.id,
          description: `Sipariş faturası - ${orderNumber} (${grandTotal} USD × ${usdTryRate})`,
        },
      })

      await tx.customer.update({
        where: { id: customerId },
        data: {
          balance: balanceAfter,
          lastOrderAt: new Date(),
        },
      })
    } else {
      // CREDIT_CARD / BANK_TRANSFER: cari hesaba borç yazma, ödeme akışı ayrı işlenir
      await tx.customer.update({
        where: { id: customerId },
        data: { lastOrderAt: new Date() },
      })
    }

    // Sepeti temizle — sipariş başarıyla oluşturuldu, tekrar sipariş riskini engeller
    const cart = await tx.cart.findFirst({ where: { userId: customerId } })
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
    }

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
): Promise<{ data: OrderListItem[]; meta: PaginationMeta; usdTryRate: number }> {
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
        currency: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        _count: { select: { orderItems: true } },
        orderItems: {
          select: { productName: true },
          take: 3,
          orderBy: { id: "asc" },
        },
      },
    }),
    prisma.order.count({ where }),
  ])

  const usdTryRate = await getUsdTryRate()

  return {
    data: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      grandTotal: Number(o.grandTotal),
      currency: o.currency,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
      itemCount: o._count.orderItems,
      previewItems: o.orderItems.map((i) => i.productName).filter(Boolean),
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    usdTryRate,
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
        currency: true,
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
      currency: o.currency,
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

  // TL karşılığını hesapla
  const usdTryRate = await getUsdTryRate()
  const grandTotalTL = round2(grandTotal * usdTryRate)

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

    // Cari iade hareketi (REFUND - negatif tutar, TL cinsinden)
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { balance: true },
    })

    if (customer) {
      const balanceAfter = round2(Number(customer.balance) - grandTotalTL)

      await tx.accountTransaction.create({
        data: {
          customerId,
          type: "REFUND",
          amount: -grandTotalTL,
          balanceAfter,
          currency: "TRY",
          referenceType: "ORDER",
          referenceId: orderId,
          description: `Sipariş iadesi - ${order.orderNumber} (${grandTotal} USD × ${usdTryRate})`,
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
