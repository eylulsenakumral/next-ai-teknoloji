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

const ZAI_API = 'https://api.z.ai/api/coding/paas/v4/chat/completions'
const ZAI_KEY = '042213d5518349509f67b0dcabb054d2.CrALf2SAl4jKXBgw'

async function findLogoWithLLM(brandName: string): Promise<string | null> {
  try {
    const response = await fetch(`${ZAI_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-5.1',
        stream: false,
        messages: [
          {
            role: 'user',
            content: `Find the official logo URL for brand "${brandName}". Return ONLY the direct image URL (https://...). Search: SimpleIcons, Clearbit, or brand's official website.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.log(`  API Error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content?.trim() || ''

    // Extract URL from content
    const urlMatch = content.match(/https?:\/\/[^\s]+\.(png|jpg|jpeg|svg)/i)
    const url = urlMatch ? urlMatch[0] : null

    if (!url) {
      console.log(`  No URL found in response: ${content.substring(0, 100)}...`)
      return null
    }

    return url
  } catch (error) {
    console.log(`  Error: ${error}`)
    return null
  }
}

async function downloadLogo(url: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    if (!response.ok) return false

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('image')) return false

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length < 1000) return false

    const brandsDir = join(process.cwd(), 'public', 'brand-logos')
    await mkdir(brandsDir, { recursive: true })
    await writeFile(join(brandsDir, filename), buffer)

    return true
  } catch {
    return false
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
    take: 30,
  })

  console.log(`Finding logos for ${brands.length} brands using LLM...`)

  for (const brand of brands) {
    console.log(`Processing: ${brand.name}`)

    const url = await findLogoWithLLM(brand.name)

    if (url) {
      const success = await downloadLogo(url, `${brand.slug}.png`)

      if (success) {
        await prisma.brand.update({
          where: { id: brand.id },
          data: { logoUrl: `/brand-logos/${brand.slug}.png` },
        })
        console.log(`✓ Downloaded: ${brand.name}`)
      } else {
        console.log(`✗ Failed to download: ${brand.name}`)
      }
    } else {
      console.log(`✗ Not found: ${brand.name}`)
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\nDone!')
  await prisma.$disconnect()
}

main().catch(console.error)
