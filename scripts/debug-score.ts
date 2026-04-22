import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
const pool = new pg.Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/nextai" })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const testProducts = [
  "16GB 3600MT/s DDR4 CL18 DIMM Beast RGB Turkey",
  "ACER A315-24 RYZ3-7320 8GB 256SSD UMA 15.6 FHD LINUX SILVER",
  "4TB SAS 12G Midline 7.2K LFF HDD",
]

async function main() {
  const cats = await prisma.$queryRaw<Array<{id:string;name:string;slug:string;depth:number;parent_id:string|null}>>`SELECT id, name, slug, depth, parent_id FROM categories WHERE deleted_at IS NULL AND is_active = true ORDER BY depth`
  
  for (const prodName of testProducts) {
    const n = prodName.toLowerCase()
    console.log(`\n=== ${prodName} ===`)
    
    let topScore = 0
    let topCat = ""
    
    for (const cat of cats) {
      const catName = cat.name.toLowerCase()
      const slug = cat.slug
      
      // Quick check - what scores > 0?
      let score = 0
      
      // Exact
      if (n === catName) score = 100
      else if (catName.length > 4 && n.includes(catName)) score = 80 + Math.min(catName.length, 15)
      
      if (score > 0) {
        console.log(`  [${score}] ${cat.name} (${slug}) via name-contains`)
        if (score > topScore) { topScore = score; topCat = cat.name }
        continue
      }
      
      // Keyword match
      const stopWords = new Set(['ve','için','ile','bir','the','and','for','ürün','cihaz','sistem','sistemleri','tipi','tip','grubu','genel','diger','other'])
      const genericWords = new Set(['kablo','cable','adaptör','adapter','set','ürün','cihaz','sistem','panel','modül','modul','sensor','sensör','güç','power','kabinet','rack','data','plus','pro','kit','yedek','aksesuar','sarj','dolmu','dolum'])
      const catKws = catName.replace(/[()\/&\-.,]/g," ").split(/\s+/).filter(w=>w.length>2&&!stopWords.has(w))
      const slugKws = slug.split(/-/).filter(w=>w.length>2&&!stopWords.has(w))
      const allKws = [...new Set([...catKws,...slugKws])].filter(kw=>!genericWords.has(kw)&&kw.length>3)
      
      const nameWords = n.replace(/[()\/\-.,&]/g," ").split(/\s+/).filter(w=>w.length>2)
      let hits = 0
      for (const kw of allKws) {
        if (nameWords.some(w=>w===kw)||n.includes(kw)) hits++
      }
      
      if (allKws.length > 0 && hits >= 2 && hits/allKws.length >= 0.3) {
        score = Math.round((hits/allKws.length)*60)
      } else if (hits >= 1 && allKws.length <= 2) {
        score = 40
      }
      
      if (score > 0) {
        console.log(`  [${score}] ${cat.name} (${slug}) via keywords: matched ${hits}/${allKws.length} [${allKws.join(",")}]`)
        if (score > topScore) { topScore = score; topCat = cat.name }
      }
    }
    console.log(`  >> BEST: [${topScore}] ${topCat}`)
  }
  await prisma.$disconnect()
}
main()
