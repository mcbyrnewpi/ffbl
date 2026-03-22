// scripts/migrate-players.ts
import { PrismaClient, Level, Status } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// 1. Prisma 7 Adapter Setup (Idempotent and safe)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in your environment variables");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 2. The Rosetta Stone: Legacy ID to Modern Abbreviation
const legacyPositionMap: Record<number, string> = {
  1: 'C',
  2: '1B',
  3: '2B',
  4: '3B',
  5: 'SS',
  6: 'OF',
  7: 'SP',
  8: 'RP'
  // ID 9 ('Draft Pick') is intentionally omitted so it doesn't map to fielding positions
};

async function migratePlayers() {
  console.log("🔄 Starting Idempotent Player Migration...");

  // 3. Fetch all legacy players
  const legacyPlayers = await prisma.legacyPlayer.findMany({
    include: {
      users: true,      // The legacy team name/owner
      levels: true,     // The legacy roster slot (MLB, AAA, etc.)
      positions: true,  // The legacy positions join table
    }
  });

  console.log(`Found ${legacyPlayers.length} legacy players. Processing...`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const lp of legacyPlayers) {
    if (!lp.first_name || !lp.last_name) {
      skippedCount++;
      continue;
    }

    // 4. Map the Team
    let modernTeamId = null;
    if (lp.users?.team) {
      const team = await prisma.team.upsert({
        where: { name: lp.users.team },
        update: {}, 
        create: { name: lp.users.team } 
      });
      modernTeamId = team.id;
    }

    // 5. Map the Level
    let modernLevel: Level | null = null;
    const legacyLvlStr = lp.levels?.league?.toUpperCase().trim();
    if (legacyLvlStr === 'MLB') modernLevel = Level.MLB;
    else if (legacyLvlStr === 'AAA') modernLevel = Level.AAA;
    else if (legacyLvlStr === 'AA') modernLevel = Level.AA;
    else if (legacyLvlStr === 'A') modernLevel = Level.A;

    // 6. Map the Positions using the Rosetta Stone
    const positionConnections: { abbrev: string }[] = [];
    if (lp.positions && lp.positions.length > 0) {
      for (const pos of lp.positions) {
        
        // ⚠️ IMPORTANT: If your legacy join table uses 'position_id' instead of 'id', change this!
        const legacyPosId = pos.id; 
        
        const modernAbbrev = legacyPositionMap[legacyPosId];
        
        // Only connect if it's a valid mapped position (Ignores Draft Picks and missing mappings)
        if (modernAbbrev) {
          positionConnections.push({ abbrev: modernAbbrev });
        }
      }
    }

    // 7. UPSERT the Modern Player
    try {
      const result = await prisma.player.upsert({
        where: { legacyId: lp.id }, 
        update: {
          teamId: modernTeamId,
          level: modernLevel,
          positions: {
            set: [], // Clear old positions
            connect: positionConnections.length > 0 ? positionConnections : undefined
          }
        },
        create: {
          legacyId: lp.id,
          firstName: lp.first_name.trim(),
          lastName: lp.last_name.trim(),
          birthdate: lp.dob,
          teamId: modernTeamId,
          level: modernLevel,
          status: Status.ACTIVE,
          positions: {
            connect: positionConnections.length > 0 ? positionConnections : undefined
          }
        }
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        createdCount++;
      } else {
        updatedCount++;
      }

    } catch (error: any) {
      console.error(`⚠️ Failed to migrate ${lp.first_name} ${lp.last_name}. Error: ${error.message}`);
    }
  }

  console.log(`\n✅ Migration Complete!`);
  console.log(`✨ Created: ${createdCount}`);
  console.log(`🔄 Updated: ${updatedCount}`);
  if (skippedCount > 0) console.log(`⏭️ Skipped (missing names): ${skippedCount}`);
}

// 8. Execute and strictly clean up the pool
migratePlayers()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });