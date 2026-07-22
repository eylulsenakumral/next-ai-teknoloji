import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const faqs = await prisma.faq.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] })
  console.log("=== FAQ COUNT:", faqs.length, "===")
  for (const f of faqs) console.log(`  [${f.group}] #${f.sortOrder} | ${f.question.substring(0, 60)}`)

  console.log("\n=== BLOG POSTS ===")
  const posts = await prisma.blogPost.findMany()
  console.log("Count:", posts.length)

  await prisma.$disconnect()
}

main()
