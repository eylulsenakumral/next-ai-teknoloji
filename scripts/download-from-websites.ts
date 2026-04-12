import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import 'dotenv/config'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Get possible website URLs for brand
function getWebsiteUrls(brandName: string): string[] {
  const slug = brandName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')

  return [
    `https://${slug}.com`,
    `https://${slug}.com.tr`,
    `https://www.${slug}.com`,
    `https://www.${slug}.com.tr`,
  ]
}

// Common logo paths in websites
const logoPaths = [
  '/logo.png',
  '/logo.svg',
  '/assets/logo.png',
  '/assets/logo.svg',
  '/static/logo.png',
  '/static/logo.svg',
  '/images/logo.png',
  '/img/logo.png',
  '/public/logo.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon.png',
]

async function tryDownloadFromWebsite(url: string): Promise<Buffer | null> {
  try {
    // First check if website exists
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandLogoBot/1.0)',
      },
      redirect: 'manual',
    })

    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location')
      if (location) {
        return tryDownloadFromWebsite(location)
      }
    }

    if (response.status !== 200) return null

    // Try to find logo in HTML
    const html = await response.text()

    // Look for logo in meta tags or common paths
    const logoMatch = html.match(/<link[^>]*rel=["'](?:icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i)
    if (logoMatch && logoMatch[1]) {
      const logoUrl = new URL(logoMatch[1], url).toString()
      const logoResponse = await fetch(logoUrl)
      if (logoResponse.ok) {
        const buffer = Buffer.from(await logoResponse.arrayBuffer())
        if (buffer.length > 1000) return buffer
      }
    }

    // Try common paths
    for (const path of logoPaths) {
      try {
        const logoUrl = new URL(path, url).toString()
        const logoResponse = await fetch(logoUrl)
        if (logoResponse.ok) {
          const contentType = logoResponse.headers.get('content-type') || ''
          if (contentType.includes('image')) {
            const buffer = Buffer.from(await logoResponse.arrayBuffer())
            if (buffer.length > 1000) return buffer
          }
        }
      } catch {
        continue
      }
    }

    return null
  } catch {
    return null
  }
}

async function main() {
  const brands = await prisma.brand.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      logoUrl: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: 'asc' },
    take: 50,
  })

  console.log(`Searching logos from official websites for ${brands.length} brands...`)

  const brandsDir = join(process.cwd(), 'public', 'brand-logos')
  await mkdir(brandsDir, { recursive: true })

  let downloaded = 0

  for (const brand of brands) {
    console.log(`Processing: ${brand.name}`)

    const websites = getWebsiteUrls(brand.name)
    let found = false

    for (const website of websites) {
      if (found) break

      try {
        const buffer = await tryDownloadFromWebsite(website)

        if (buffer) {
          const filename = `${brand.slug}.png`
          const filepath = join(brandsDir, filename)
          await writeFile(filepath, buffer)

          await prisma.brand.update({
            where: { id: brand.id },
            data: { logoUrl: `/brand-logos/${filename}` },
          })

          console.log(`✓ Downloaded from ${website}`)
          downloaded++
          found = true
        }
      } catch {
        continue
      }
    }

    if (!found) {
      console.log(`✗ Not found: ${brand.name}`)
    }

    // Rate limiting - be respectful
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log(`\nDone! Downloaded ${downloaded} logos.`)
  await prisma.$disconnect()
}

main().catch(console.error)
