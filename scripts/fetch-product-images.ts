import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import fs from "fs"
import path from "path"
import https from "https"
import http from "http"
import { Client as MinioClient } from "minio"
import { randomUUID } from "crypto"

// ---------------------------------------------------------------------------
// Prisma client (standalone, global cache olmadan)
// ---------------------------------------------------------------------------
function createPrisma() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter, log: ["error"] })
}

const prisma = createPrisma()

// ---------------------------------------------------------------------------
// Yardımcı: rastgele User-Agent
// ---------------------------------------------------------------------------
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// ---------------------------------------------------------------------------
// Yardımcı: sleep
// ---------------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Yardımcı: HTTP GET (Node built-in, fetch yerine – redirect takip eder)
// ---------------------------------------------------------------------------
function httpGet(
  url: string,
  headers: Record<string, string> = {},
  maxRedirects = 5
): Promise<{ body: string; statusCode: number }> {
  return new Promise((resolve, reject) => {
    const followRedirect = (currentUrl: string, redirectsLeft: number) => {
      const mod = currentUrl.startsWith("https://") ? https : http
      const req = mod.get(
        currentUrl,
        {
          headers: {
            "User-Agent": randomUA(),
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "identity",
            Connection: "keep-alive",
            ...headers,
          },
          timeout: 15000,
        },
        (res) => {
          const code = res.statusCode ?? 0
          if ([301, 302, 303, 307, 308].includes(code) && res.headers.location) {
            if (redirectsLeft === 0) {
              reject(new Error("Çok fazla yönlendirme"))
              return
            }
            const next = res.headers.location.startsWith("http")
              ? res.headers.location
              : new URL(res.headers.location, currentUrl).toString()
            res.resume()
            followRedirect(next, redirectsLeft - 1)
            return
          }
          const chunks: Buffer[] = []
          res.on("data", (c: Buffer) => chunks.push(c))
          res.on("end", () =>
            resolve({ body: Buffer.concat(chunks).toString("utf8"), statusCode: code })
          )
          res.on("error", reject)
        }
      )
      req.on("error", reject)
      req.on("timeout", () => {
        req.destroy()
        reject(new Error("İstek zaman aşımı"))
      })
    }
    followRedirect(url, maxRedirects)
  })
}

// ---------------------------------------------------------------------------
// Yardımcı: Binary HTTP GET (görsel indirme)
// ---------------------------------------------------------------------------
function httpGetBinary(
  url: string,
  maxRedirects = 5
): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const followRedirect = (currentUrl: string, redirectsLeft: number) => {
      const mod = currentUrl.startsWith("https://") ? https : http
      const req = mod.get(
        currentUrl,
        {
          headers: {
            "User-Agent": randomUA(),
            Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
            Referer: "https://www.google.com/",
          },
          timeout: 20000,
        },
        (res) => {
          const code = res.statusCode ?? 0
          if ([301, 302, 303, 307, 308].includes(code) && res.headers.location) {
            if (redirectsLeft === 0) {
              reject(new Error("Çok fazla yönlendirme"))
              return
            }
            const next = res.headers.location.startsWith("http")
              ? res.headers.location
              : new URL(res.headers.location, currentUrl).toString()
            res.resume()
            followRedirect(next, redirectsLeft - 1)
            return
          }
          const contentType = (res.headers["content-type"] ?? "").toLowerCase()
          const chunks: Buffer[] = []
          res.on("data", (c: Buffer) => chunks.push(c))
          res.on("end", () => resolve({ buffer: Buffer.concat(chunks), contentType }))
          res.on("error", reject)
        }
      )
      req.on("error", reject)
      req.on("timeout", () => {
        req.destroy()
        reject(new Error("İndirme zaman aşımı"))
      })
    }
    followRedirect(url, maxRedirects)
  })
}

// ---------------------------------------------------------------------------
// Ürün adından model kodunu çıkar (büyük harf+rakam karışımı)
// Örn: "Uniview IPC2122LB-AF28-E 2MP" → "IPC2122LB-AF28-E"
// ---------------------------------------------------------------------------
function extractModelCode(name: string): string | null {
  // En az 4 karakter uzunluğunda, büyük harf + rakam + tire/nokta içeren token
  const tokens = name.split(/\s+/)
  for (const token of tokens) {
    // Marka adı gibi saf büyük harf değil, rakam da içermeli
    if (/^[A-Z0-9][A-Z0-9\-_.]{3,}$/.test(token) && /\d/.test(token)) {
      return token
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Google Images'tan URL listesi çek
// ---------------------------------------------------------------------------
async function searchGoogleImages(query: string): Promise<string[]> {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&tbs=isz:m&num=10`

  try {
    const { body, statusCode } = await httpGet(searchUrl, {
      Referer: "https://www.google.com/",
    })

    if (statusCode !== 200) return []

    const urls: string[] = []

    // Yöntem 1: "ou":"URL" JSON pattern (Google'ın içgömülü data)
    const ouMatches = body.matchAll(/"ou"\s*:\s*"(https?:\/\/[^"]+)"/g)
    for (const m of ouMatches) {
      const url = m[1].replace(/\\u003d/g, "=").replace(/\\u0026/g, "&")
      if (!url.startsWith("data:") && !urls.includes(url)) {
        urls.push(url)
      }
    }

    // Yöntem 2: imgurl= pattern
    if (urls.length === 0) {
      const imgurlMatches = body.matchAll(/imgurl=(https?[^&"]+)/g)
      for (const m of imgurlMatches) {
        const url = decodeURIComponent(m[1])
        if (!url.startsWith("data:") && !urls.includes(url)) {
          urls.push(url)
        }
      }
    }

    // Yöntem 3: src= içindeki http URL'ler (img tag)
    if (urls.length === 0) {
      const srcMatches = body.matchAll(/\bsrc=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi)
      for (const m of srcMatches) {
        if (!m[1].startsWith("data:") && !urls.includes(m[1])) {
          urls.push(m[1])
        }
      }
    }

    return urls.slice(0, 10)
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Bing Images'tan URL listesi çek (fallback)
// ---------------------------------------------------------------------------
async function searchBingImages(query: string): Promise<string[]> {
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`

  try {
    const { body, statusCode } = await httpGet(searchUrl, {
      Referer: "https://www.bing.com/",
    })

    if (statusCode !== 200) return []

    const urls: string[] = []

    // Bing: murl:"URL" pattern
    const murlMatches = body.matchAll(/murl&quot;:&quot;(https?:\/\/[^&"]+)&quot;/g)
    for (const m of murlMatches) {
      const url = m[1]
      if (!url.startsWith("data:") && !urls.includes(url)) {
        urls.push(url)
      }
    }

    // Bing: mediaurl pattern
    if (urls.length === 0) {
      const mediaMatches = body.matchAll(/"mediaUrl"\s*:\s*"(https?:\/\/[^"]+)"/g)
      for (const m of mediaMatches) {
        if (!m[1].startsWith("data:") && !urls.includes(m[1])) {
          urls.push(m[1])
        }
      }
    }

    // Bing: src= içindeki .jpg/.png URL'ler
    if (urls.length === 0) {
      const srcMatches = body.matchAll(/\bsrc=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi)
      for (const m of srcMatches) {
        if (!m[1].startsWith("data:") && !urls.includes(m[1])) {
          urls.push(m[1])
        }
      }
    }

    return urls.slice(0, 10)
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// MinIO client (script-local, standalone — not the app singleton)
// ---------------------------------------------------------------------------
function createScriptMinioClient(): MinioClient | null {
  const endpoint = process.env.MINIO_ENDPOINT
  if (!endpoint) return null

  return new MinioClient({
    endPoint: endpoint,
    port: parseInt(process.env.MINIO_PORT ?? "9000", 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  })
}

async function ensureScriptBucket(client: MinioClient, bucket: string): Promise<void> {
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
    console.log(`[minio] Bucket '${bucket}' created`)
  }
}

function buildMinioUrl(endpoint: string, port: string, bucket: string, key: string): string {
  const useSSL = process.env.MINIO_USE_SSL === "true"
  const scheme = useSSL ? "https" : "http"
  return `${scheme}://${endpoint}:${port}/${bucket}/${key}`
}

// ---------------------------------------------------------------------------
// Görsel URL'yi indir ve kaydet (MinIO veya local fallback)
// Min 5KB, Max 5MB, Content-Type: image/
// ---------------------------------------------------------------------------
async function downloadImage(
  url: string,
  destPath: string,
  minioClient: MinioClient | null,
  minioBucket: string
): Promise<{ ok: boolean; imageUrl: string }> {
  const FAIL = { ok: false, imageUrl: "" }

  try {
    if (url.length > 2000) return FAIL
    if (!url.startsWith("http")) return FAIL

    const { buffer, contentType } = await httpGetBinary(url)

    if (!contentType.includes("image/")) return FAIL
    if (buffer.length < 5 * 1024) return FAIL    // min 5KB
    if (buffer.length > 5 * 1024 * 1024) return FAIL // max 5MB

    if (minioClient) {
      // Upload to MinIO
      const ext = contentType.includes("png") ? "png"
        : contentType.includes("webp") ? "webp"
        : "jpg"
      const objectKey = `products/${randomUUID()}.${ext}`
      const { Readable } = await import("stream")
      const stream = Readable.from(buffer)
      await minioClient.putObject(minioBucket, objectKey, stream, buffer.length, {
        "Content-Type": contentType,
      })
      const endpoint = process.env.MINIO_ENDPOINT ?? "localhost"
      const port = process.env.MINIO_PORT ?? "9000"
      const imageUrl = buildMinioUrl(endpoint, port, minioBucket, objectKey)
      return { ok: true, imageUrl }
    } else {
      // Local fallback — write to public/products/
      fs.writeFileSync(destPath, buffer)
      return { ok: true, imageUrl: "" } // caller builds local URL
    }
  } catch {
    return FAIL
  }
}

// ---------------------------------------------------------------------------
// Bir ürün için görsel ara ve kaydet
// Önce Google, bulamazsa Bing
// ---------------------------------------------------------------------------
async function fetchAndSaveImage(
  productName: string,
  brandName: string | null,
  modelCode: string | null,
  destPath: string,
  minioClient: MinioClient | null,
  minioBucket: string
): Promise<{ ok: boolean; imageUrl: string }> {
  const FAIL = { ok: false, imageUrl: "" }

  // Arama sorgusu oluştur: önce model kodu varsa onu kullan
  const queries: string[] = []

  if (modelCode) {
    queries.push(`${brandName ?? ""} ${modelCode} product photo`.trim())
    queries.push(`${modelCode} ürün fotoğrafı`.trim())
  }

  // Model kodu yoksa veya bulunamazsa tam isimle ara
  queries.push(`${brandName ?? ""} ${productName} product photo`.trim())
  queries.push(`${productName} product image`.trim())

  for (const query of queries) {
    // Google'da ara
    let urls = await searchGoogleImages(query)

    // Bing fallback
    if (urls.length === 0) {
      urls = await searchBingImages(query)
    }

    for (const url of urls) {
      const result = await downloadImage(url, destPath, minioClient, minioBucket)
      if (result.ok) return result
      // Kısa bekleme (sunucu yüklemesini azalt)
      await sleep(300)
    }

    await sleep(1000)
  }

  return FAIL
}

// ---------------------------------------------------------------------------
// Ana fonksiyon
// ---------------------------------------------------------------------------
async function main() {
  console.log("[fetch-product-images] Başlatılıyor...\n")

  // MinIO bağlantısı kur (yoksa local fallback)
  const minioClient = createScriptMinioClient()
  const minioBucket = process.env.MINIO_BUCKET ?? "nextai-assets"

  if (minioClient) {
    await ensureScriptBucket(minioClient, minioBucket)
    console.log(`[storage] MinIO aktif — bucket: ${minioBucket}`)
  } else {
    console.log("[storage] MinIO yapılandırılmamış — local public/products/ kullanılacak")
  }

  // Local fallback: public/products/ klasörünü oluştur
  const publicProductsDir = path.join(process.cwd(), "public", "products")
  if (!minioClient && !fs.existsSync(publicProductsDir)) {
    fs.mkdirSync(publicProductsDir, { recursive: true })
    console.log(`[mkdir] ${publicProductsDir} oluşturuldu`)
  }

  // Fotoğrafsız ürünleri çek
  const products = await prisma.product.findMany({
    where: {
      categoryId: { not: null },
      deletedAt: null,
      images: { equals: [] },
    },
    include: {
      brand: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const total = products.length
  console.log(`[DB] ${total} fotoğrafsız ürün bulundu.\n`)

  if (total === 0) {
    console.log("Yapılacak işlem yok. Çıkılıyor.")
    await prisma.$disconnect()
    process.exit(0)
  }

  let found = 0
  let notFound = 0
  let skipped = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const brandName = product.brand?.name ?? null
    const label = `[${i + 1}/${total}] ${brandName ? brandName + " " : ""}${product.name.slice(0, 60)}`

    // Slug'dan güvenli dosya adı oluştur
    const slug = product.slug.replace(/[^a-z0-9\-_]/g, "_").slice(0, 100)
    const destPath = path.join(publicProductsDir, `${slug}.jpg`)

    // Daha önce indirilmişse atla (local only — MinIO'da her zaman yeniden yükle)
    if (!minioClient && fs.existsSync(destPath)) {
      console.log(`${label} → ⊘ zaten var, atlanıyor`)
      skipped++
      continue
    }

    // Model kodunu çıkar
    const modelCode = product.modelCode ?? extractModelCode(product.name)

    try {
      const result = await fetchAndSaveImage(
        product.name,
        brandName,
        modelCode,
        destPath,
        minioClient,
        minioBucket
      )

      if (result.ok) {
        // DB'deki görsel URL'sini güncelle
        const imageUrl = result.imageUrl || `/products/${slug}.jpg`
        await prisma.product.update({
          where: { id: product.id },
          data: { images: [imageUrl] },
        })
        console.log(`${label} → ✓ görsel bulundu ve kaydedildi (${imageUrl.slice(0, 80)})`)
        found++
      } else {
        console.log(`${label} → ✗ bulunamadı`)
        notFound++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`${label} → ✗ hata: ${msg}`)
      notFound++
    }

    // Rate limit: 2-3 saniye arası rastgele bekle
    if (i < products.length - 1) {
      const waitMs = 2000 + Math.floor(Math.random() * 1000)
      await sleep(waitMs)
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Özet]
  Toplam  : ${total}
  Bulundu : ${found}
  Bulunamadı: ${notFound}
  Atlandı : ${skipped}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

  await prisma.$disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error("[HATA]", err)
  prisma.$disconnect().finally(() => process.exit(1))
})
