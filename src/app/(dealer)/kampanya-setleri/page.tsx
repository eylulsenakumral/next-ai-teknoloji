export const dynamic = 'force-dynamic'

import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Layers, InboxIcon, Percent, Tag } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CampaignSetType = "OUTLET" | "FEATURED" | "BUNDLE"

const TYPE_LABELS: Record<CampaignSetType, string> = {
  OUTLET: "Outlet",
  FEATURED: "Öne Çıkan",
  BUNDLE: "Set",
}

const TYPE_COLORS: Record<CampaignSetType, string> = {
  OUTLET: "bg-orange-100 text-orange-700",
  FEATURED: "bg-blue-100 text-blue-700",
  BUNDLE: "bg-purple-100 text-purple-700",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function DealerKampanyaSetleriPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  // KRİTİK: Bayi fiyatları içerir — giriş yapmamış/anonim kullanıcıya açmamak için auth zorunlu.
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "dealer") {
    redirect("/login")
  }

  const { type } = await searchParams
  const now = new Date()

  const typeFilter =
    type === "OUTLET" || type === "FEATURED" || type === "BUNDLE"
      ? (type as CampaignSetType)
      : undefined

  const sets = await prisma.campaignSet.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [{ validFrom: null }, { validFrom: { lte: now } }],
      AND: [{ OR: [{ validUntil: null }, { validUntil: { gte: now } }] }],
      ...(typeFilter ? { type: typeFilter } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      imageUrl: true,
      discountPct: true,
      price: true,
      validFrom: true,
      validUntil: true,
      _count: { select: { products: true } },
    },
  })

  const typeFilters: Array<{ label: string; value: string }> = [
    { label: "Tümü", value: "" },
    { label: "Set", value: "BUNDLE" },
    { label: "Outlet", value: "OUTLET" },
    { label: "Öne Çıkan", value: "FEATURED" },
  ]

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-primary)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Layers className="h-6 w-6 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-orange-300">
              Kampanya Setleri
            </span>
            <Layers className="h-6 w-6 text-orange-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Özel Kampanya Setleri
          </h1>
          <p className="text-white/70 text-[14px] mt-3 max-w-lg mx-auto">
            Özel fiyatlı set kampanyalarını ve avantajlı fırsatları kaçırmayın.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Type filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {typeFilters.map((f) => {
            const active = (typeFilter ?? "") === f.value
            return (
              <Link
                key={f.value}
                href={f.value ? `/kampanya-setleri?type=${f.value}` : "/kampanya-setleri"}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </div>

        {/* Sets grid */}
        {sets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <InboxIcon className="h-14 w-14 text-[#cccccc]" aria-hidden />
            <div>
              <p className="text-[16px] font-semibold text-[var(--color-foreground)]">
                Şu an aktif kampanya seti bulunmuyor
              </p>
              <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                Yeni kampanya setleri eklendiğinde burada görünecektir.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sets.map((s) => {
              const setType = s.type as CampaignSetType
              return (
                <div
                  key={s.id}
                  className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
                >
                  {/* Image */}
                  <div className="aspect-video bg-gray-50 relative overflow-hidden">
                    {s.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.imageUrl}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    {/* Type badge */}
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[setType]}`}
                    >
                      {TYPE_LABELS[setType]}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h2 className="font-bold text-[15px] text-[#1a1a1a] line-clamp-1">
                      {s.name}
                    </h2>

                    {s.description && (
                      <p className="text-[13px] text-[#666666] line-clamp-2">
                        {s.description}
                      </p>
                    )}

                    {/* Pricing row */}
                    <div className="flex flex-col gap-1 pt-1">
                      {s.price && (
                        <>
                          <span className="font-bold text-[var(--color-primary)] text-[15px]">
                            {formatCurrency(parseFloat(String(s.price)), "TRY")} <span className="text-[10px] text-gray-400 font-normal">+KDV</span>
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {formatCurrency(parseFloat(String(s.price)) * 1.2, "TRY")} <span className="text-[9px]">KDV dahil</span>
                          </span>
                        </>
                      )}
                      {s.discountPct && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          <Percent className="h-3 w-3" />
                          %{parseFloat(String(s.discountPct))} İndirim
                        </span>
                      )}
                    </div>

                    {/* Product count */}
                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <Tag className="h-3 w-3" />
                      <span>{s._count.products} ürün</span>
                    </div>

                    {/* Validity */}
                    {(s.validFrom || s.validUntil) && (
                      <p className="text-[11px] text-[#999]">
                        {s.validFrom
                          ? new Date(s.validFrom).toLocaleDateString("tr-TR")
                          : "—"}{" "}
                        –{" "}
                        {s.validUntil
                          ? new Date(s.validUntil).toLocaleDateString("tr-TR")
                          : "—"}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
