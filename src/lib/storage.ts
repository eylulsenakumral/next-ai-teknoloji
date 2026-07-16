/**
 * Storage abstraction layer.
 *
 * Provides a unified interface for file/image storage. When MinIO is
 * configured the object is streamed to the MinIO bucket; when it is not
 * available (or explicitly disabled) files are saved to the local
 * public/uploads directory so the app never breaks.
 *
 * Supported folder prefixes (kept in the bucket / on disk):
 *   products/   — product photos
 *   brands/     — brand logos
 *   categories/ — category images
 *   misc/       — generic uploads from the admin UI
 */

import { randomUUID } from "crypto"
import path from "path"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { Readable } from "stream"

import { minio, ensureBucket, getDefaultBucket, buildMinioUrl, isMinioAvailable } from "@/lib/minio"

// ---------------------------------------------------------------------------
// Allowed image MIME types
// ---------------------------------------------------------------------------
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

// ---------------------------------------------------------------------------
// Folder prefix helpers
// ---------------------------------------------------------------------------
export type StorageFolder = "products" | "brands" | "categories" | "misc"

export function folderForType(mimeType: string): StorageFolder {
  if (mimeType.startsWith("image/")) return "misc" // caller can override
  return "misc"
}

// ---------------------------------------------------------------------------
// Unique filename generator
// ---------------------------------------------------------------------------
function generateFileName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin"
  return `${randomUUID()}.${ext}`
}

// ---------------------------------------------------------------------------
// Image resize helper (Jimp — already a project dependency)
// ---------------------------------------------------------------------------
export interface ResizeOptions {
  /** Max width in px. Aspect ratio is preserved. */
  maxWidth?: number
  /** Max height in px. Aspect ratio is preserved. */
  maxHeight?: number
  /** JPEG quality 1-100 (ignored for non-JPEG). Default 85. */
  quality?: number
}

async function resizeImage(
  buffer: Buffer,
  contentType: string,
  opts: ResizeOptions
): Promise<Buffer> {
  // Only resize raster images — skip SVG
  if (contentType === "image/svg+xml") return buffer
  if (!opts.maxWidth && !opts.maxHeight) return buffer

  try {
    // Dynamic import keeps jimp out of the edge runtime
    const { Jimp } = await import("jimp")
    const image = await Jimp.fromBuffer(buffer)

    const { maxWidth, maxHeight, quality = 85 } = opts
    const w = image.width
    const h = image.height

    let newW = w
    let newH = h

    if (maxWidth && w > maxWidth) {
      newW = maxWidth
      newH = Math.round((h * maxWidth) / w)
    }

    if (maxHeight && newH > maxHeight) {
      newH = maxHeight
      newW = Math.round((newW * maxHeight) / newH)
    }

    if (newW !== w || newH !== h) {
      image.resize({ w: newW, h: newH })
    }

    // In Jimp v1 quality is passed as a second argument to getBuffer
    type GetBufferMime = Parameters<typeof image.getBuffer>[0]
    type GetBufferWithQuality = (
      mime: GetBufferMime,
      opts?: { quality?: number }
    ) => Promise<Buffer>
    const mimeArg = contentType as GetBufferMime
    if (contentType === "image/jpeg") {
      return await (image.getBuffer as unknown as GetBufferWithQuality)(mimeArg, { quality })
    }

    return await image.getBuffer(mimeArg)
  } catch (err) {
    console.warn("[storage] Image resize failed, using original:", err)
    return buffer
  }
}

// ---------------------------------------------------------------------------
// Core: upload to MinIO
// ---------------------------------------------------------------------------
async function uploadToMinio(
  buffer: Buffer,
  objectKey: string,
  contentType: string
): Promise<string> {
  if (!minio) throw new Error("[storage] MinIO client not available")

  const bucket = getDefaultBucket()
  await ensureBucket(bucket)

  const stream = Readable.from(buffer)

  await minio.putObject(bucket, objectKey, stream, buffer.length, {
    "Content-Type": contentType,
  })

  return buildMinioUrl(objectKey, bucket)
}

// ---------------------------------------------------------------------------
// Core: upload to local filesystem (fallback)
// ---------------------------------------------------------------------------
async function uploadToLocal(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const filePath = path.join(uploadDir, fileName)
  await writeFile(filePath, buffer)
  return `/uploads/${fileName}`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UploadResult {
  url: string
  key: string
  storage: "minio" | "local"
}

/**
 * Upload a file buffer.
 *
 * @param buffer      Raw file bytes.
 * @param originalName  Original filename (used only for extension extraction).
 * @param contentType MIME type.
 * @param folder      Sub-folder prefix inside the bucket / on disk.
 * @param resize      Optional resize constraints applied before upload.
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: StorageFolder = "misc",
  resize?: ResizeOptions
): Promise<UploadResult> {
  // Optionally resize before upload
  const finalBuffer = resize
    ? await resizeImage(buffer, contentType, resize)
    : buffer

  const fileName = generateFileName(originalName)

  if (isMinioAvailable()) {
    const objectKey = `${folder}/${fileName}`
    const url = await uploadToMinio(finalBuffer, objectKey, contentType)
    return { url, key: objectKey, storage: "minio" }
  }

  // Fallback: save to local public/uploads
  const localName = `${folder.replace("/", "-")}-${fileName}`
  const url = await uploadToLocal(finalBuffer, localName)
  return { url, key: localName, storage: "local" }
}

/**
 * Delete a file by its storage key.
 *
 * For local storage, the key is just the filename inside public/uploads.
 * For MinIO the key is the full object path (e.g. "products/uuid.jpg").
 *
 * Errors are swallowed — deletion is best-effort.
 */
export async function deleteFile(key: string): Promise<void> {
  if (!key) return

  if (isMinioAvailable() && minio) {
    try {
      const bucket = getDefaultBucket()
      await minio.removeObject(bucket, key)
    } catch (err) {
      console.error(`[storage] MinIO delete failed for key '${key}':`, err)
    }
    return
  }

  // Local fallback
  try {
    const { unlink } = await import("fs/promises")
    const filePath = path.join(process.cwd(), "public", "uploads", key)
    await unlink(filePath)
  } catch {
    // File may not exist — ignore
  }
}

/**
 * Get the public URL for a stored file.
 *
 * Pass the key returned by uploadFile. For backward-compat with existing
 * /uploads/* URLs, strings that already start with "/" or "http" are
 * returned as-is.
 */
export function getFileUrl(key: string): string {
  if (!key) return ""
  if (key.startsWith("http") || key.startsWith("/")) return key

  if (isMinioAvailable()) {
    return buildMinioUrl(key)
  }

  return `/uploads/${key}`
}

/**
 * Generate a time-limited presigned GET URL for a MinIO object.
 * Falls back to getFileUrl when MinIO is not available.
 *
 * @param key      Object key (e.g. "products/uuid.jpg").
 * @param ttlSecs  Expiry time in seconds. Default 3600 (1 hour).
 */
export async function getPresignedUrl(key: string, ttlSecs = 3600): Promise<string> {
  if (!key) return ""

  if (isMinioAvailable() && minio) {
    try {
      const bucket = getDefaultBucket()
      return await minio.presignedGetObject(bucket, key, ttlSecs)
    } catch (err) {
      console.error(`[storage] Presigned URL failed for key '${key}':`, err)
    }
  }

  return getFileUrl(key)
}
