import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateSlug } from "@/lib/utils/slug"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

interface ImportRow {
  levels: string[]
  slug: string
  isActive: boolean
  sortOrder: number
  description: string
}

function parseTsv(text: string): ImportRow[] {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []

  // Skip header row
  const dataLines = lines.slice(1)
  const rows: ImportRow[] = []

  for (const line of dataLines) {
    const cols = line.split("\t")
    if (cols.length < 5) continue

    const levels = cols.slice(0, 5).map((s) => s.trim()).filter(Boolean)
    if (levels.length === 0) continue

    rows.push({
      levels,
      slug: (cols[5] ?? "").trim(),
      isActive: cols[6] === "0" ? false : true,
      sortOrder: parseInt(cols[7] ?? "0", 10) || 0,
      description: (cols[8] ?? "").trim(),
    })
  }

  return rows
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadi." }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseTsv(text)

  if (rows.length === 0) {
    return NextResponse.json({ error: "Dosyada islenilebilir satir bulunamadi." }, { status: 400 })
  }

  // Get existing categories for duplicate check
  const existingCategories = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, slug: true, parentId: true, depth: true },
  })
  const existingByName = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c]))
  const existingBySlug = new Map(existingCategories.map((c) => [c.slug, c]))

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  }

  // Process row by row, tracking created categories for parent resolution
  const createdMap = new Map<string, string>() // "parentSlug/childName" -> id

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
    let parentId: string | null = null

    try {
      // Resolve parent chain
      for (let levelIdx = 0; levelIdx < row.levels.length; levelIdx++) {
        const name = row.levels[levelIdx]
        const depth = levelIdx
        const slug = row.slug && levelIdx === row.levels.length - 1
          ? row.slug
          : generateSlug(name)

        // Build lookup key: parent path + this name
        const parentKey = levelIdx === 0 ? name.toLowerCase() : Array.from(createdMap.entries()).find(
          ([, v]) => v === parentId
        )?.[0] + "/" + name.toLowerCase()

        // Check existing
        const existing = existingBySlug.get(slug)

        if (levelIdx < row.levels.length - 1) {
          // Intermediate level - ensure exists
          if (existing) {
            parentId = existing.id
          } else {
            // Check if we created it in this import
            const createdId = createdMap.get(name.toLowerCase())
            if (createdId) {
              parentId = createdId
            } else {
              // Create intermediate category
              const created: { id: string } = await prisma.category.create({
                data: {
                  name,
                  slug,
                  parentId,
                  depth,
                  path: slug,
                  isActive: true,
                  sortOrder: 0,
                  createdBy: session!.user.id,
                },
              }) as { id: string }
              createdMap.set(name.toLowerCase(), created.id)
              results.created++
              parentId = created.id
            }
          }
        } else {
          // Leaf level - this is the actual row
          if (existing) {
            // Update existing
            await prisma.category.update({
              where: { id: existing.id },
              data: {
                name,
                parentId,
                depth,
                isActive: row.isActive,
                sortOrder: row.sortOrder,
                description: row.description || null,
                updatedBy: session!.user.id,
              },
            })
            results.updated++
          } else {
            // Create new
            let finalSlug = slug
            let attempt = 0
            while (existingBySlug.has(finalSlug)) {
              attempt++
              finalSlug = `${slug}-${attempt}`
            }

            await prisma.category.create({
              data: {
                name,
                slug: finalSlug,
                parentId,
                depth,
                path: finalSlug,
                isActive: row.isActive,
                sortOrder: row.sortOrder,
                description: row.description || null,
                createdBy: session!.user.id,
              },
            })
            results.created++
          }
        }
      }
    } catch (err) {
      results.errors.push(`Satir ${rowIdx + 2}: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
      results.skipped++
    }
  }

  return NextResponse.json({
    data: results,
  })
}

// Preview endpoint - dry run
export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadi." }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseTsv(text)

  if (rows.length === 0) {
    return NextResponse.json({ error: "Dosyada islenilebilir satir bulunamadi." }, { status: 400 })
  }

  // Get existing for comparison
  const existingSlugs = new Set(
    (await prisma.category.findMany({
      where: { deletedAt: null },
      select: { slug: true },
    })).map((c) => c.slug)
  )

  let newCount = 0
  let updateCount = 0
  const preview: Array<{
    name: string
    depth: number
    slug: string
    action: "new" | "update"
  }> = []

  for (const row of rows) {
    const name = row.levels[row.levels.length - 1]
    const slug = row.slug || generateSlug(name)
    const isExisting = existingSlugs.has(slug)
    const action = isExisting ? "update" : "new"

    if (isExisting) updateCount++
    else newCount++

    preview.push({
      name,
      depth: row.levels.length - 1,
      slug,
      action,
    })
  }

  return NextResponse.json({
    data: {
      total: rows.length,
      newCount,
      updateCount,
      preview: preview.slice(0, 50), // Limit preview
    },
  })
}
