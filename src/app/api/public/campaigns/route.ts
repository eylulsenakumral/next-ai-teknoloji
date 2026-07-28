import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { CampaignSetType } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// TCMB döviz kuru cache
let cachedUsdTry = 0
let cacheExpiry = 0

async function getUsdTryRate(): Promise<number> {
  const now = Date.now()
  if (cachedUsdTry && now < cacheExpiry) return cachedUsdTry
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml")
    const xml = await res.text()
    const match = xml.match(/CurrencyCode="USD"[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/)
    if (match) {
      cachedUsdTry = parseFloat(match[1])
      cacheExpiry = now + 3600_000
      return cachedUsdTry
    }
  } catch {}
  return 0
}

/* ------------------------------------------------------------------ */
/*  GET /api/public/campaigns                                           */
/*  Query params:                                                       */
/*    - type=FEATURED|OUTLET|BUNDLE                                     */
/*    - limit=N (default 20)                                            */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const typeParam = searchParams.get("type")
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100)
    const now = new Date()

    const session = await getServerSession(authOptions)
    const isAuthenticated = !!session?.user
    const isAdmin = ["admin", "super_admin"].includes((session?.user as { role?: string })?.role ?? "")
    const showPrice = isAuthenticated || isAdmin

    const type = typeParam && Object.values(CampaignSetType).includes(typeParam as CampaignSetType)
      ? (typeParam as CampaignSetType)
      : undefined

    const campaigns = await prisma.campaignSet.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(type ? { type } : {}),
        AND: [
          {
            OR: [
              { validFrom: null },
              { validFrom: { lte: now } },
            ],
          },
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                description: true,
                brand: { select: { name: true, slug: true } },
                category: { select: { name: true, slug: true } },
                supplierProducts: {
                  where: { deletedAt: null, isAvailable: true },
                  select: {
                    stockQuantity: true,
                    purchasePrice: showPrice,
                    currency: true,
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    const usdTry = showPrice ? await getUsdTryRate() : 0

    // Her set için fiyat hesapla
    const data = campaigns.map((c) => {
      // Ürün bazlı stok
      const productsWithStock = c.products.map((cp) => {
        const { supplierProducts, ...productRest } = cp.product as typeof cp.product & {
          supplierProducts: { stockQuantity: number }[]
        }
        const totalStock = supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)
        return { ...cp, product: { ...productRest, stockStatus: totalStock > 0 } }
      })

      // Set fiyatı: manuel girilen fiyat + currency
      let setPrice: number | null = null
      const setCurrency = c.currency || "TRY"
      let setPriceTry: number | null = null
      if (showPrice && c.price !== null) {
        setPrice = Number(c.price)
        setPriceTry = setCurrency === "USD" && usdTry > 0
          ? setPrice * usdTry
          : setPrice

        // İndirim uygula
        if (c.discountPct) {
          const disc = Number(c.discountPct) / 100
          setPrice = setPrice * (1 - disc)
          setPriceTry = setPriceTry != null ? setPriceTry * (1 - disc) : null
        }
      }

      // price & currency destructured out of `rest` below — overridden by setPrice/setCurrency.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { price, currency, ...rest } = c
      return {
        ...rest,
        products: productsWithStock,
        price: setPrice,
        currency: setCurrency,
        priceTry: setPriceTry,
        usdTryRate: usdTry,
      }
    })

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    )
  } catch (err) {
    console.error("GET /api/public/campaigns error:", err)
    return NextResponse.json(
      { error: "Kampanyalar yuklenemedi." },
      { status: 500 }
    )
  }
}
