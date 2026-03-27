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
};

// 3. String Transformation Utility (Data Dictionary Rule)
const toTitleCase = (str: string) => {
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

async function migratePlayers() {
  console.log("🔄 Starting Idempotent Player Migration...");

  // Fetch all legacy players
  const legacyPlayers = await prisma.legacyPlayer.findMany({
    include: {
      users: true,      
      levels: true,     
      positions: true,  
    }
  });

  console.log(`Found ${legacyPlayers.length} legacy players. Processing...`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let draftPicksIsolated = 0; // New tracker for ID 9

  for (const lp of legacyPlayers) {
    if (!lp.first_name || !lp.last_name) {
      skippedCount++;
      continue;
    }

    // 🚨 QUARANTINE DRAFT PICKS: If legacy position_id is 9, skip migrating as a Player
    if (lp.position_id === 9) {
      draftPicksIsolated++;
      continue; 
    }

    // Map the Team
    let modernTeamId = null;
    if (lp.users?.team) {
      const team = await prisma.team.upsert({
        where: { name: lp.users.team },
        update: {}, 
        create: { name: lp.users.team } 
      });
      modernTeamId = team.id;
    }

    // Map the Level & Status
    let modernLevel: Level | null = null;
    let modernStatus: Status = Status.ACTIVE; // Default to Active

    const legacyLvlStr = lp.levels?.league?.toUpperCase().trim();
    
    if (legacyLvlStr === 'MLB') {
      modernLevel = Level.MLB;
    } else if (legacyLvlStr === 'AAA') {
      modernLevel = Level.AAA;
    } else if (legacyLvlStr === 'AA') {
      modernLevel = Level.AA;
    } else if (legacyLvlStr === 'A') {
      modernLevel = Level.A;
    } else if (legacyLvlStr === '60 DAY DL') {
      modernLevel = Level.MLB; 
      modernStatus = Status.IL_60;
    } else if (legacyLvlStr === 'YAHOO! DL') {
      modernLevel = Level.MLB;
      modernStatus = Status.IL;
    } else if (legacyLvlStr === 'NA') {
      // NA prospects won't have a specific minor league level assigned
      modernLevel = null;
      modernStatus = Status.NA;
    }

    // Map the Positions using the Rosetta Stone against lp.position_id
    const positionConnections: { abbrev: string }[] = [];
    
    // Grab the primary position from the LegacyPlayer table directly
    if (lp.position_id) {
      const primaryAbbrev = legacyPositionMap[lp.position_id];
      if (primaryAbbrev) {
        positionConnections.push({ abbrev: primaryAbbrev });
      }
    }

    // Optional: If your LegacyPosition join table `spot` column holds string abbreviations (e.g., "OF"), catch those too
    if (lp.positions && lp.positions.length > 0) {
      for (const pos of lp.positions) {
        if (pos.spot && isNaN(Number(pos.spot))) {
          // Prevent duplicates if primary position already caught it
          if (!positionConnections.find(p => p.abbrev === pos.spot)) {
            positionConnections.push({ abbrev: pos.spot });
          }
        }
      }
    }

    // UPSERT the Modern Player
    try {
      const result = await prisma.player.upsert({
        where: { legacyId: lp.id }, 
        update: {
          firstName: toTitleCase(lp.first_name),
          lastName: toTitleCase(lp.last_name),
          teamId: modernTeamId,
          level: modernLevel,
          status: modernStatus, // 👈 ADDED HERE
          positions: {
            set: [], 
            connect: positionConnections.length > 0 ? positionConnections : undefined
          }
        },
        create: {
          legacyId: lp.id,
          firstName: toTitleCase(lp.first_name),
          lastName: toTitleCase(lp.last_name),
          birthdate: lp.dob,
          teamId: modernTeamId,
          level: modernLevel,
          status: modernStatus, // 👈 UPDATED HERE
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
  console.log(`⚾ Draft Picks Isolated (position_id 9): ${draftPicksIsolated}`);
}

// Execute and strictly clean up the pool
migratePlayers()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });