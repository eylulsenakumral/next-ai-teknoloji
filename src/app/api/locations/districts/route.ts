import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/locations/districts?cityId=34 - Secilen ilin ilcelerini dondur
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cityIdParam = searchParams.get("cityId")

    if (!cityIdParam) {
      return NextResponse.json(
        { error: "cityId parametresi gerekli." },
        { status: 400 }
      )
    }

    const cityId = parseInt(cityIdParam, 10)
    if (isNaN(cityId) || cityId < 1 || cityId > 81) {
      return NextResponse.json(
        { error: "Geçersiz cityId." },
        { status: 400 }
      )
    }

    const districts = await prisma.district.findMany({
      where: { cityId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ data: districts })
  } catch (error) {
    console.error("[locations/districts/GET]", error)
    return NextResponse.json(
      { error: "İlçeler yüklenirken hata oluştu." },
      { status: 500 }
    )
  }
}
