/**
 * One-shot migration script: move files from public/uploads and public/products
 * to MinIO, and update the corresponding product image URLs in the database.
 *
 * Usage:
 *   tsx scripts/migrate-uploads-to-minio.ts [--dry-run]
 *
 * Options:
 *   --dry-run   List what would be migrated without actually uploading or
 *               updating the database.
 *
 * Prerequisites:
 *   - MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET set in .env
 *   - DATABASE_URL set in .env
 *   - MinIO container running (docker compose up minio)
 */

import "dotenv/config"
import fs from "fs"
import path from "path"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { Client as MinioClient } from "minio"
import { Readable } from "stream"
import { randomUUID } from "crypto"
import mime from "mime-types"

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
function createPrisma() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter, log: ["error"] })
}
const prisma = createPrisma()

// ---------------------------------------------------------------------------
// MinIO
// ---------------------------------------------------------------------------
function createMinio(): MinioClient {
  const endpoint = process.env.MINIO_ENDPOINT
  if (!endpoint) throw new Error("MINIO_ENDPOINT not set in .env")

  return new MinioClient({
    endPoint: endpoint,
    port: parseInt(process.env.MINIO_PORT ?? "9000", 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  })
}

async function ensureBucket(client: MinioClient, bucket: string): Promise<void> {
  const exists = await client.bucketExists(bucket)
  if (!exists) {
    await client.makeBucket(bucket, "us-east-1")
    const policy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      }],
    })
    await client.setBucketPolicy(bucket, policy)
    console.log(`[minio] Bucket '${bucket}' created with public-read policy`)
  }
}

function buildUrl(endpoint: string, port: string, bucket: string, key: string): string {
  const useSSL = process.env.MINIO_USE_SSL === "true"
  return `${useSSL ? "https" : "http"}://${endpoint}:${port}/${bucket}/${key}`
}

// ---------------------------------------------------------------------------
// Upload single file to MinIO
// ---------------------------------------------------------------------------
async function uploadFile(
  client: MinioClient,
  bucket: string,
  localPath: string,
  folder: string
): Promise<string> {
  const ext = path.extname(localPath).slice(1) || "jpg"
  const objectKey = `${folder}/${randomUUID()}.${ext}`
  const contentType = (mime.lookup(localPath) || "application/octet-stream") as string

  const fileBuffer = fs.readFileSync(localPath)
  const stream = Readable.from(fileBuffer)

  await client.putObject(bucket, objectKey, stream, fileBuffer.length, {
    "Content-Type": contentType,
  })

  const endpoint = process.env.MINIO_ENDPOINT ?? "localhost"
  const port = process.env.MINIO_PORT ?? "9000"
  return buildUrl(endpoint, port, bucket, objectKey)
}

// ---------------------------------------------------------------------------
// Collect all local image files
// ---------------------------------------------------------------------------
interface LocalFile {
  localPath: string
  /** URL as stored in the DB, e.g. /uploads/abc.jpg or /products/slug.jpg */
  dbPattern: string
  /** Folder prefix to use in MinIO */
  minioFolder: string
}

function collectLocalFiles(rootDir: string, folder: string, urlPrefix: string): LocalFile[] {
  if (!fs.existsSync(rootDir)) return []

  return fs
    .readdirSync(rootDir)
    .filter((f) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
    .map((f) => ({
      localPath: path.join(rootDir, f),
      dbPattern: `${urlPrefix}/${f}`,
      minioFolder: folder,
    }))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const isDryRun = process.argv.includes("--dry-run")
  if (isDryRun) console.log("[migrate] DRY RUN — no files will be uploaded\n")

  const minio = createMinio()
  const bucket = process.env.MINIO_BUCKET ?? "nextai-assets"

  if (!isDryRun) await ensureBucket(minio, bucket)

  const projectRoot = process.cwd()
  const files: LocalFile[] = [
    ...collectLocalFiles(
      path.join(projectRoot, "public", "uploads"),
      "misc",
      "/uploads"
    ),
    ...collectLocalFiles(
      path.join(projectRoot, "public", "products"),
      "products",
      "/products"
    ),
  ]

  console.log(`[migrate] Found ${files.length} local file(s) to migrate\n`)

  if (files.length === 0) {
    console.log("[migrate] Nothing to migrate. Exiting.")
    await prisma.$disconnect()
    process.exit(0)
  }

  // Build a map: old local URL → new MinIO URL
  const urlMap = new Map<string, string>()

  for (const file of files) {
    if (isDryRun) {
      console.log(`[dry] ${file.dbPattern} → would upload to ${file.minioFolder}/`)
      urlMap.set(file.dbPattern, `[minio]/${file.minioFolder}/<uuid>`)
      continue
    }

    try {
      const newUrl = await uploadFile(minio, bucket, file.localPath, file.minioFolder)
      urlMap.set(file.dbPattern, newUrl)
      console.log(`[upload] ${file.dbPattern} → ${newUrl}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[error] Failed to upload ${file.localPath}: ${msg}`)
    }
  }

  if (isDryRun) {
    console.log("\n[dry] Database would be updated for products referencing these files.")
    await prisma.$disconnect()
    process.exit(0)
  }

  // Update product image URLs in the database
  console.log("\n[migrate] Updating product image URLs in database...")

  const products = await prisma.product.findMany({
    where: { images: { isEmpty: false } },
    select: { id: true, images: true },
  })

  let updated = 0
  for (const product of products) {
    const newImages = product.images.map((img) => urlMap.get(img) ?? img)
    const changed = newImages.some((img, i) => img !== product.images[i])

    if (changed) {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: newImages },
      })
      updated++
    }
  }

  console.log(`[migrate] Updated ${updated} product record(s)`)
  console.log("\n[migrate] Migration complete.")
  console.log(
    "[migrate] NOTE: Original files in public/uploads and public/products have NOT been deleted."
  )
  console.log(
    "[migrate] Once you verify everything works, you can safely remove them."
  )

  await prisma.$disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error("[FATAL]", err)
  prisma.$disconnect().finally(() => process.exit(1))
})
