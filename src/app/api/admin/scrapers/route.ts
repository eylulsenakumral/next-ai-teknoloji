/**
 * Admin Scrapers API
 *
 * GET    /api/admin/scrapers          — List all scraper statuses
 * POST   /api/admin/scrapers/trigger   — Manually trigger a sync
 * GET    /api/admin/scrapers/logs      — Get recent scraper logs
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// ============================================================================
// GET /api/admin/scrapers — List all scraper statuses
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get("view") // "status" | "logs"

    if (view === "logs") {
      return handleGetLogs(searchParams)
    }

    // Default: supplier statuses
    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { priority: "desc" },
      include: {
        scraperLogs: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
        _count: {
          select: { supplierProducts: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: suppliers.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        websiteUrl: s.websiteUrl,
        scraperType: s.scraperType,
        isActive: s.isActive,
        priority: s.priority,
        syncStatus: s.syncStatus,
        syncError: s.syncError,
        syncIntervalMinutes: s.syncIntervalMinutes,
        lastSyncAt: s.lastSyncAt,
        productCount: s._count.supplierProducts,
        lastLog: s.scraperLogs[0] ?? null,
      })),
    })
  } catch (error) {
    console.error("[API:Scrapers:GET] Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/admin/scrapers/trigger — Manually trigger a sync
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, supplierCode, force } = body as {
      supplierId?: string
      supplierCode?: string
      force?: boolean
    }

    if (!supplierId && !supplierCode) {
      return NextResponse.json(
        { success: false, error: "supplierId or supplierCode is required" },
        { status: 400 }
      )
    }

    // Find supplier
    const supplier = await prisma.supplier.findFirst({
      where: {
        ...(supplierId ? { id: supplierId } : { code: supplierCode }),
        deletedAt: null,
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      )
    }

    if (!supplier.isActive) {
      return NextResponse.json(
        { success: false, error: "Supplier is inactive" },
        { status: 400 }
      )
    }

    if (!force && supplier.syncStatus === "RUNNING") {
      return NextResponse.json(
        { success: false, error: "Scraper is already running" },
        { status: 409 }
      )
    }

    // Trigger sync in background
    // Since we're in a Next.js API route, we spawn the sync asynchronously
    triggerBackgroundSync(supplier.code).catch((err) => {
      console.error(`[API:Scrapers:POST] Background sync error for ${supplier.code}:`, err)
    })

    return NextResponse.json({
      success: true,
      message: `Sync triggered for ${supplier.name} (${supplier.code})`,
      data: { supplierId: supplier.id, supplierCode: supplier.code },
    })
  } catch (error) {
    console.error("[API:Scrapers:POST] Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/admin/scrapers/logs — Recent scraper logs
// ============================================================================

async function handleGetLogs(searchParams: URLSearchParams) {
  const supplierId = searchParams.get("supplierId")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200)
  const offset = parseInt(searchParams.get("offset") ?? "0", 10)

  const where = supplierId ? { supplierId } : {}

  const [logs, total] = await Promise.all([
    prisma.scraperLog.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        supplier: {
          select: { code: true, name: true },
        },
      },
    }),
    prisma.scraperLog.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      logs: logs.map((log) => ({
        id: log.id,
        supplierId: log.supplierId,
        supplierCode: log.supplier.code,
        supplierName: log.supplier.name,
        status: log.status,
        startedAt: log.startedAt,
        finishedAt: log.finishedAt,
        durationMs: log.durationMs,
        productsFound: log.productsFound,
        productsUpdated: log.productsUpdated,
        productsNew: log.productsNew,
        productsRemoved: log.productsRemoved,
        errorsCount: log.errorsCount,
        errorMessage: log.errorMessage,
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    },
  })
}

// ============================================================================
// Background sync trigger
// ============================================================================

async function triggerBackgroundSync(supplierCode: string): Promise<void> {
  const { exec } = await import("child_process")
  const path = await import("path")

  const projectRoot = path.resolve(process.cwd())
  const scriptPath = path.join(projectRoot, "workers", "scraper", "scheduler.ts")

  // Spawn sync in background — don't await
  exec(
    `npx tsx "${scriptPath}" "${supplierCode}"`,
    {
      cwd: projectRoot,
      env: { ...process.env },
      timeout: 10 * 60 * 1000, // 10 min timeout
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`[BackgroundSync:${supplierCode}] Error:`, error.message)
      }
      if (stdout) console.log(`[BackgroundSync:${supplierCode}]`, stdout.trim())
      if (stderr) console.error(`[BackgroundSync:${supplierCode}]`, stderr.trim())
    }
  )
}
