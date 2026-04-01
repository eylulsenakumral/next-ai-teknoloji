import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const brands = await prisma.brand.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  })
  return NextResponse.json({ data: brands })
}
