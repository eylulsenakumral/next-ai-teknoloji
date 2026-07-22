import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const tables = [
    { name: "pageSections", count: await prisma.pageSection.count({ where: { deletedAt: null } }) },
    { name: "heroSlides", count: await prisma.heroSlide.count({ where: { deletedAt: null } }) },
    { name: "siteTexts", count: await prisma.siteText.count() },
    { name: "solutions", count: await prisma.solution.count({ where: { deletedAt: null } }) },
    { name: "sectors", count: await prisma.sector.count({ where: { deletedAt: null } }) },
    { name: "references", count: await prisma.referenceProject.count({ where: { deletedAt: null } }) },
    { name: "faqs", count: await prisma.faq.count({ where: { deletedAt: null } }) },
    { name: "milestones", count: await prisma.milestone.count({ where: { deletedAt: null } }) },
    { name: "testimonials", count: await prisma.testimonial.count({ where: { deletedAt: null } }) },
    { name: "blogPosts", count: await prisma.blogPost.count({ where: { deletedAt: null } }) },
  ]

  for (const t of tables) {
    console.log(`${t.name}: ${t.count}`)
  }

  // Duplicate check for pageSections
  const sections = await prisma.pageSection.findMany({ where: { deletedAt: null }, orderBy: [{ section: "asc" }, { title: "asc" }] })
  console.log("\n=== PAGE SECTIONS ===")
  for (const s of sections) {
    console.log(`  [${s.page}] ${s.section} | ${s.title}`)
  }

  const slides = await prisma.heroSlide.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" } })
  console.log("\n=== HERO SLIDES ===")
  for (const s of slides) {
    console.log(`  #${s.sortOrder} ${s.label} | ${s.title.substring(0, 50)}`)
  }

  const sols = await prisma.solution.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" } })
  console.log("\n=== SOLUTIONS ===")
  for (const s of sols) {
    console.log(`  #${s.sortOrder} [${s.category}] ${s.title}`)
  }

  await prisma.$disconnect()
}

main()
