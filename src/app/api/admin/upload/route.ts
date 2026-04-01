import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { uploadFile, ALLOWED_IMAGE_TYPES, type StorageFolder } from "@/lib/storage"

// ============================================================================
// POST /api/admin/upload
// Dosya yukleme (gorsel, belge vb.)
// Supports optional query param: ?folder=products|brands|categories|misc
// ============================================================================
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Dosya seçilmedi." }, { status: 400 })
    }

    // Dosya boyutu kontrolu (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Dosya boyutu en fazla 10MB olabilir." },
        { status: 400 }
      )
    }

    // Dosya tipi kontrolu
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: "Sadece JPEG, PNG, GIF, WebP ve SVG dosyaları yüklenebilir." },
        { status: 400 }
      )
    }

    // Determine target folder from query string (default: misc)
    const { searchParams } = new URL(req.url)
    const rawFolder = searchParams.get("folder") ?? "misc"
    const validFolders: StorageFolder[] = ["products", "brands", "categories", "misc"]
    const folder: StorageFolder = validFolders.includes(rawFolder as StorageFolder)
      ? (rawFolder as StorageFolder)
      : "misc"

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await uploadFile(buffer, file.name, file.type, folder, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 85,
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      storage: result.storage,
      fileName: result.key.split("/").pop() ?? result.key,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Dosya yüklenirken hata oluştu." }, { status: 500 })
  }
}
