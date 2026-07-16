import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { decode } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  let session = await getServerSession(authOptions)
  if (!session?.user) {
    const bearer = req.headers.get("authorization")?.replace("Bearer ", "") ?? null
    if (bearer && process.env.NEXTAUTH_SECRET) {
      try {
        const decoded = await decode({ secret: process.env.NEXTAUTH_SECRET, token: bearer })
        if (decoded?.role === "dealer" && decoded?.status === "APPROVED") {
          session = {
            user: {
              id: decoded.id,
              dealerCode: decoded.dealerCode,
              companyName: decoded.companyName,
              contactName: decoded.contactName,
              email: decoded.email ?? undefined,
              role: decoded.role,
              status: decoded.status,
            },
            expires: "",
          }
        }
      } catch {}
    }
  }
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized", message: "Bu işlem için giriş yapmanız gerekiyor." }, { status: 401 })
  }

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
