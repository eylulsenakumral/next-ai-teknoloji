import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getDealerSession, requireDealerSession } from "@/lib/dealer-auth"

export async function GET(req: NextRequest) {
  const session = await getDealerSession()
  const authError = requireDealerSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const flat = searchParams.get("flat") === "true"

  if (flat) {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: { products: { where: { deletedAt: null, isActive: true } } },
        },
      },
    })
    return NextResponse.json({ data: categories })
  }

  // Tree yapısı (3 seviye derinlik)
  const categories = await prisma.category.findMany({
    where: { deletedAt: null, isActive: true, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { products: { where: { deletedAt: null, isActive: true } } },
      },
      children: {
        where: { deletedAt: null, isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          _count: {
            select: {
              products: { where: { deletedAt: null, isActive: true } },
            },
          },
          children: {
            where: { deletedAt: null, isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            include: {
              _count: {
                select: {
                  products: { where: { deletedAt: null, isActive: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  return NextResponse.json({ data: categories })
}
