import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getDealerSession, requireDealerSession } from "@/lib/dealer-auth"

export async function GET(req: NextRequest) {
  const session = await getDealerSession()
  const authError = requireDealerSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId") ?? undefined

  const brands = await prisma.brand.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      ...(categoryId
        ? {
            products: {
              some: {
                categoryId,
                deletedAt: null,
                isActive: true,
              },
            },
          }
        : {
            products: {
              some: { deletedAt: null, isActive: true },
            },
          }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          products: {
            where: {
              deletedAt: null,
              isActive: true,
              ...(categoryId ? { categoryId } : {}),
            },
          },
        },
      },
    },
  })

  return NextResponse.json({
    data: brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl,
      productCount: b._count.products,
    })),
  })
}
