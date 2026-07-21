/**
 * MinIO client singleton.
 *
 * The app works fine without MinIO. If MINIO_ENDPOINT is not set, or if the
 * connection fails, isMinioAvailable() returns false and all storage
 * operations fall back to local /uploads.
 */

import { Client as MinioClient } from "minio"

declare global {
  // eslint-disable-next-line no-var
  var __minio: MinioClient | null | undefined
}

function createMinioClient(): MinioClient | null {
  const endpoint = process.env.MINIO_ENDPOINT
  if (!endpoint) {
    console.warn("[minio] MINIO_ENDPOINT not set — MinIO disabled, using local storage")
    return null
  }

  const port = parseInt(process.env.MINIO_PORT ?? "9000", 10)
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY
  // Use SSL only when not connecting to localhost or an explicit IP
  const useSSL = process.env.MINIO_USE_SSL === "true"

  if (process.env.NODE_ENV === "production" && (!accessKey || !secretKey)) {
    console.error("[minio] MINIO_ACCESS_KEY / MINIO_SECRET_KEY eksik — production'da MinIO devre dışı")
    return null
  }

  try {
    const client = new MinioClient({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey: accessKey ?? "minioadmin",
      secretKey: secretKey ?? "minioadmin",
    })

    return client
  } catch (err) {
    console.error("[minio] Failed to create client:", err)
    return null
  }
}

function getMinioClient(): MinioClient | null {
  if (process.env.NODE_ENV === "production") {
    if (!global.__minio) {
      global.__minio = createMinioClient()
    }
    return global.__minio
  }

  // Development: reuse across HMR cycles
  if (!global.__minio) {
    global.__minio = createMinioClient()
  }
  return global.__minio
}

export const minio = getMinioClient()

export function getDefaultBucket(): string {
  return process.env.MINIO_BUCKET ?? "nextai-assets"
}

/**
 * Ensure the default bucket exists, creating it if necessary.
 * Idempotent — safe to call on every startup or upload.
 */
export async function ensureBucket(bucketName?: string): Promise<void> {
  if (!minio) return

  const bucket = bucketName ?? getDefaultBucket()

  try {
    const exists = await minio.bucketExists(bucket)
    if (!exists) {
      await minio.makeBucket(bucket, "us-east-1")
      // Make the bucket publicly readable so presigned URLs are not required
      // for simple GET access via the MinIO public endpoint
      const policy = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      })
      await minio.setBucketPolicy(bucket, policy)
      console.log(`[minio] Bucket '${bucket}' created with public read policy`)
    }
  } catch (err) {
    console.error(`[minio] ensureBucket('${bucket}') failed:`, err)
    throw err
  }
}

/** Returns true when the MinIO client has been initialised. */
export function isMinioAvailable(): boolean {
  return minio !== null
}

/**
 * Build the public (direct) URL for an object stored in MinIO.
 * This works when the bucket has a public-read policy.
 */
export function buildMinioUrl(objectKey: string, bucket?: string): string {
  const endpoint = process.env.MINIO_ENDPOINT ?? "localhost"
  const port = process.env.MINIO_PORT ?? "9000"
  const useSSL = process.env.MINIO_USE_SSL === "true"
  const scheme = useSSL ? "https" : "http"
  const bucketName = bucket ?? getDefaultBucket()
  // Use /storage/ proxy path instead of direct MinIO URL for browser compatibility
  return `/storage/${objectKey}`
}
