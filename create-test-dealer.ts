import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

config({ path: '.env.production' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = 'test1234';
  const passwordHash = await bcrypt.hash(password, 10);

  const customer = await prisma.customer.create({
    data: {
      dealerCode: 'NX0001',
      companyName: '112 BİLGİSAYAR',
      tradeName: '112 BİLGİSAYAR',
      contactName: 'Test Kullanıcı',
      contactTitle: 'Satış Temsilcisi',
      phone: '05551234567',
      email: 'test@112bilgisayar.com',
      taxOffice: 'Vergi Dairesi',
      taxNumber: '1234567890',
      address: 'Test Adresi',
      city: 'İstanbul',
      district: 'Kadıköy',
      postalCode: '34710',
      passwordHash,
      status: 'APPROVED',
      balance: 0,
      creditLimit: 50000,
      discountRate: 15,
      approvedAt: new Date(),
      lastLoginAt: null,
    }
  });

  console.log('Test Bayii Oluşturuldu:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Bayi Kodu: ${customer.dealerCode}`);
  console.log(`Firma: ${customer.companyName}`);
  console.log(`Şifre: ${password}`);
  console.log(`Email: ${customer.email}`);
  console.log(`Tel: ${customer.phone}`);
  console.log('');
  console.log('Login bilgileri:');
  console.log(`  Dealer Code: ${customer.dealerCode}`);
  console.log(`  Password: ${password}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Hata:', err.message);
  process.exit(1);
});
