import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { calculateProductPrice } from "@/services/pricing.service"

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
})

// CartItem.id @default(cuid()) — uuid doğrulaması cuid'yi reddeder, PUT üretimde 400 verir.
const updateCartSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1),
})

// GET /api/cart - Get current user's cart
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                brand: { select: { name: true } },
                supplierProducts: {
                  where: { supplier: { isActive: true, deletedAt: null } },
                  select: { stockQuantity: true },
                  orderBy: { purchasePrice: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(cart ?? { items: [] })
  } catch (error) {
    console.error("Cart GET error:", error)
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
  }
}

// POST /api/cart - Add item to cart
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { productId, quantity } = addToCartSchema.parse(body)

    // Get product to snapshot price
    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null, isActive: true },
      select: {
        id: true,
        manualPrice: true,
        manualPriceCurrency: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Satış fiyatını merkezi pricing servisten al — tedarik maliyetine (purchasePrice) fallback YASAK.
    const calc = await calculateProductPrice(productId)
    if (!calc) {
      return NextResponse.json(
        { error: "Bu ürün şu anda fiyatlandırılamıyor (stok/tedarikçi yok)." },
        { status: 400 }
      )
    }
    const price = calc.salePriceExVat

    // Currency: outlet (manualPrice) ürünlerde manualPriceCurrency; yoksa USD (satış fiyatları USD kökenli, siparişte TL'ye çevrilir)
    const currency =
      product.manualPrice != null
        ? (product.manualPriceCurrency ?? "USD")
        : "USD"

    // Upsert cart
    const cart = await prisma.cart.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    })

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    })

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: quantity }, priceSnapshot: price, priceCurrency: currency },
      })
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          priceSnapshot: price,
          priceCurrency: currency,
        },
      })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Cart POST error:", error)
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 })
  }
}

// PUT /api/cart - Update item quantity
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { itemId, quantity } = updateCartSchema.parse(body)

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    })

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    await prisma.cartItem.updateMany({
      where: { id: itemId, cartId: cart.id },
      data: { quantity },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Cart PUT error:", error)
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 })
  }
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get("itemId")

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    })

    if (!itemId) {
      if (!cart) {
        return NextResponse.json({ success: true })
      }
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
      return NextResponse.json({ success: true })
    }

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    await prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cart DELETE error:", error)
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 })
  }
}
