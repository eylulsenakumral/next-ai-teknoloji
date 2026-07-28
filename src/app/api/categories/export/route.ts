import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      depth: true,
      path: true,
      isActive: true,
      sortOrder: true,
      description: true,
    },
  })

  // Build a map for quick parent lookup
  const catMap = new Map(categories.map((c) => [c.id, c]))

  // Build breadcrumb for each category
  function getBreadcrumb(cat: (typeof categories)[0]): string[] {
    const parts: string[] = []
    let current: typeof cat | undefined = cat
    while (current) {
      parts.unshift(current.name)
      current = current.parentId ? catMap.get(current.parentId) : undefined
    }
    return parts
  }

  // Build TSV with hierarchical columns: Level1, Level2, Level3, Level4, Level5
  const maxDepth = 4 // 0-4 = 5 levels
  const header = ["Level1", "Level2", "Level3", "Level4", "Level5", "Slug", "Aktif", "Sira", "Aciklama"]
  const rows: string[][] = []

  for (const cat of categories) {
    const breadcrumb = getBreadcrumb(cat)
    const row: string[] = []
    for (let i = 0; i <= maxDepth; i++) {
      row.push(breadcrumb[i] ?? "")
    }
    row.push(cat.slug)
    row.push(cat.isActive ? "1" : "0")
    row.push(String(cat.sortOrder))
    row.push(cat.description ?? "")
    rows.push(row)
  }

  const tsv = [header.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n")

  return new NextResponse(tsv, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": `attachment; filename="kategoriler-${new Date().toISOString().slice(0, 10)}.tsv"`,
    },
  })
}
