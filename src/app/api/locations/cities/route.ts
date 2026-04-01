import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/locations/cities - Tum illeri dondur (name'e gore sirali)
export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      select: {
        id: true,
        name: true,
        plateCode: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ data: cities })
  } catch (error) {
    console.error("[locations/cities/GET]", error)
    return NextResponse.json(
      { error: "Iller yuklenirken hata olustu." },
      { status: 500 }
    )
  }
}
