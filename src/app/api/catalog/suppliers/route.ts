import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getDealerSession, requireDealerSession } from "@/lib/dealer-auth"

export async function GET() {
  const session = await getDealerSession()
  const authError = requireDealerSession(session)
  if (authError) return authError

  const suppliers = await prisma.supplier.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      supplierProducts: {
        some: {
          product: {
            deletedAt: null,
            isActive: true,
          },
        },
      },
    },
    orderBy: [{ priority: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
    },
  })

  return NextResponse.json({ data: suppliers })
}
