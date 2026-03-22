import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// 1. Setup the Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });

// The (pool as any) bypasses that version mismatch error
const adapter = new PrismaPg(pool as any); 
const prisma = new PrismaClient({ adapter });

async function main() {
  const positions = [
    { name: 'Catcher', abbrev: 'C' },
    { name: 'First Base', abbrev: '1B' },
    { name: 'Second Base', abbrev: '2B' },
    { name: 'Third Base', abbrev: '3B' },
    { name: 'Shortstop', abbrev: 'SS' },
    { name: 'Outfield', abbrev: 'OF' },
    { name: 'Starting Pitcher', abbrev: 'SP' },
    { name: 'Relief Pitcher', abbrev: 'RP' },
  ];

  console.log('🌱 Seeding positions...');
  for (const pos of positions) {
    await prisma.position.upsert({
      where: { abbrev: pos.abbrev },
      update: {},
      create: pos,
    });
  }
  console.log('✅ Positions seeded.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());