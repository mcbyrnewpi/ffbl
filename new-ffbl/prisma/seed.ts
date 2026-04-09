import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import { seedPositions } from './seed-positions';
import { seedSettings } from './seed-settings';

// 1. Setup the connection pool and adapter
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in your environment variables");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);

// 2. Pass the adapter to the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // 3. Pass the initialized prisma instance into our seed function
    await seedPositions(prisma);
    await seedSettings(prisma);
    console.log('✅ All seeds completed.');
  } catch (e) {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  } finally {
    // 4. CLEANUP: Disconnect Prisma AND drain the pg pool
    await prisma.$disconnect();
    await pool.end(); 
  }
}

main();