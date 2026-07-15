import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.production' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const customers = await prisma.customer.findMany({
    where: {
      status: 'APPROVED',
      deletedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    select: {
      dealerCode: true,
      companyName: true,
      contactName: true,
      email: true,
      phone: true,
      status: true
    }
  });

  console.log('Onaylı Bayiler (Test için):');
  console.log('─────────────────────────────────────────────────────────────');
  customers.forEach((c, i) => {
    console.log(`${i+1}. Bayi Kodu: ${c.dealerCode}`);
    console.log(`   Firma: ${c.companyName}`);
    console.log(`   İletişim: ${c.contactName || 'N/A'}`);
    console.log(`   Tel: ${c.phone || 'N/A'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Hata:', err.message);
  process.exit(1);
});
