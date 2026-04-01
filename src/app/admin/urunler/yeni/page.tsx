import { prisma } from "@/lib/db"
import { getAdminSession } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"

export const metadata = {
  title: "Yeni Ürün Ekle",
}

export default async function YeniUrunPage() {
  const session = await getAdminSession()
  if (!session?.user) {
    redirect("/admin/giris")
  }

  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        depth: true,
        path: true,
        parent: { select: { id: true, name: true } },
      },
    }),
  ])

  return (
    <ProductForm
      brands={brands}
      categories={categories}
    />
  )
}
