import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: [{ priority: "asc" }, { name: "asc" }],
    select: { id: true, name: true, code: true },
  })
  return NextResponse.json({ data: suppliers })
}
