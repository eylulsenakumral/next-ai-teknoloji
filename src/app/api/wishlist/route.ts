import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const addToWishlistSchema = z.object({
  productId: z.string().uuid(),
})

// GET /api/wishlist - Get current user's wishlist
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const wishlist = await prisma.wishlist.findUnique({
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
                category: { select: { name: true, slug: true } },
                supplierProducts: {
                  where: { supplier: { isActive: true, deletedAt: null } },
                  select: { stockQuantity: true },
                  orderBy: { purchasePrice: "asc" },
                  take: 1,
                },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
      },
    })

    return NextResponse.json(wishlist ?? { items: [] })
  } catch (error) {
    console.error("Wishlist GET error:", error)
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
  }
}

// POST /api/wishlist - Add product to wishlist
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { productId } = addToWishlistSchema.parse(body)

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null, isActive: true },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Upsert wishlist
    const wishlist = await prisma.wishlist.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    })

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findFirst({
      where: { wishlistId: wishlist.id, productId },
    })

    if (existing) {
      return NextResponse.json({ success: true, alreadyExists: true })
    }

    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Wishlist POST error:", error)
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 })
  }
}

// DELETE /api/wishlist - Remove product from wishlist
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 })
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
    })

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
    }

    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Wishlist DELETE error:", error)
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 })
  }
}
