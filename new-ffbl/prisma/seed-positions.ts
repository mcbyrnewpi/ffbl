import { PrismaClient } from '@prisma/client';

export async function seedPositions(prisma: PrismaClient) {
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