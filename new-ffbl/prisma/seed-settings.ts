import { PrismaClient } from '@prisma/client';

export async function seedSettings(prisma: PrismaClient) {
  console.log('🌱 Seeding League Settings...');

  const settings = await prisma.leagueSettings.upsert({
    where: { id: 1 },
    update: {}, // If it exists, we don't overwrite it
    create: {
      id: 1,
      enforceRosterLimits: true,
      mlbLimit: 25,
      aaaLimit: 6,
      aaLimit: 6,
      aLimit: 6,
      ilLimit: 5,
      naLimit: 2,
      il60Limit: null, // Unlimited 60-Day IL
    },
  });

  console.log('✅ League Settings configured.');
}