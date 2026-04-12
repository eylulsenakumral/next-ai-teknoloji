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

// Brand logo URL patterns to try - All free logo services
function getLogoUrls(brandName: string, brandSlug: string): string[] {
  const search = brandName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const domain = brandName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')

  return [
    // Clearbit Logo API
    `https://logo.clearbit.com/${domain}.com?size=256&format=png`,

    // Logo.dev API (free, high quality SVGs)
    `https://logo.dev/api/${domain.replace('.com', '')}`,

    // SimpleIcons CDN (3000+ brands, SVG)
    `https://cdn.simpleicons.org/${search}/svg`,

    // SimpleIcons GitHub raw
    `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${search}.svg`,

    // CompaniesLogo
    `https://companieslogo.com/img/orig/${domain}com_big.png`,

    // VectorLogoZone SVG
    `https://www.vectorlogo.zone/resources/${search}/${search}-vector.svg`,

    // Wikipedia/Wikimedia Commons logo search
    `https://en.wikipedia.org/wiki/File:${brandName.replace(/\s+/g, '_')}_logo.svg`,

    // Flaticon (might work)
    `https://image.flaticon.com/icons/svg/${search}.svg`,

    // Google Favicon (fallback)
    `https://www.google.com/s2/favicons?domain=${domain}.com&sz=256`,

    // DuckDuckGo favicon (better than Google)
    `https://icons.duckduckgo.com/ip3/${domain}.com.ico`,
  ]
}

async function downloadLogo(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandLogoBot/1.0)',
      },
    })

    if (!response.ok) return null

    // Check content type
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('image/')) return null

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length < 1000) return null // Too small

    // Verify it's actually an image by checking magic bytes
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47])
    const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF])
    const isPng = buffer.subarray(0, 4).equals(pngSignature)
    const isJpeg = buffer.subarray(0, 3).equals(jpegSignature)

    if (!isPng && !isJpeg) return null

    return buffer
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
  })

  console.log(`Found ${brands.length} brands without logos`)

  // Create public/brands directory
  const brandsDir = join(process.cwd(), 'public', 'brand-logos')
  await mkdir(brandsDir, { recursive: true })

  for (const brand of brands) {
    console.log(`Processing: ${brand.name}`)

    const logoUrls = getLogoUrls(brand.name, brand.slug)
    let downloaded = false

    for (const [index, url] of logoUrls.entries()) {
      const buffer = await downloadLogo(url)

      if (buffer) {
        const filename = `${brand.slug}.png`
        const filepath = join(brandsDir, filename)
        await writeFile(filepath, buffer)

        // Update database
        const logoUrl = `/brand-logos/${filename}`
        await prisma.brand.update({
          where: { id: brand.id },
          data: { logoUrl },
        })

        console.log(`✓ Downloaded: ${brand.name} (source ${index + 1})`)
        downloaded = true
        break
      }
    }

    if (!downloaded) {
      console.log(`✗ Failed: ${brand.name}`)
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\nDone!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
