// scripts/migrate-draft-picks.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is missing");

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 🚨 THE FRANCHISE REBRAND DICTIONARY
// Map the dead legacy names to the exact name currently in your modern Team table.
const TEAM_ALIAS_MAP: Record<string, string> = {
  "Monk's Cafe": "Monk's Café",            // Fixes the accented 'e' issue
  "Scranton Yankees": "Little Town Blues", // Maps the old franchise to the new one
  "Team Kleinau": "Little Town Blues"      // Maps another old variation to the new one
  // Add any others if you spot more missing!
};

async function migrateDraftPicks() {
  console.log("🎟️ Starting Targeted Draft Pick Migration (2027-2028)...");

  const legacyPicks = await prisma.legacyPlayer.findMany({
    where: { position_id: 9 },
    include: { users: true } 
  });

  console.log(`Found ${legacyPicks.length} total legacy draft picks. Filtering for 2027/2028...`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedParseErrorCount = 0;
  let skippedOldPicksCount = 0; 

  for (const lp of legacyPicks) {
    if (!lp.first_name || !lp.last_name) {
      skippedParseErrorCount++;
      continue;
    }

    const match = lp.last_name.match(/(\d{4})\s+Round\s+(\d+)/i);
    if (!match) {
      skippedParseErrorCount++;
      continue;
    }
    
    const year = parseInt(match[1], 10);
    const round = parseInt(match[2], 10);

    if (year !== 2027 && year !== 2028) {
      skippedOldPicksCount++;
      continue;
    }

    // Identify Teams and apply the Alias Map
    let originalTeamName = lp.first_name.trim();
    let currentTeamName = lp.users?.team?.trim() || originalTeamName;

    originalTeamName = TEAM_ALIAS_MAP[originalTeamName] || originalTeamName;
    currentTeamName = TEAM_ALIAS_MAP[currentTeamName] || currentTeamName;

    const originalTeam = await prisma.team.findUnique({ where: { name: originalTeamName } });
    const currentTeam = await prisma.team.findUnique({ where: { name: currentTeamName } });

    if (!originalTeam || !currentTeam) {
      console.warn(`⚠️ Skipping ${lp.last_name} - Could not find Team records for ${originalTeamName} or ${currentTeamName}`);
      skippedParseErrorCount++;
      continue;
    }

    await prisma.season.upsert({
      where: { year: year },
      update: {},
      create: {
        year: year,
        ffblChampion: "TBD",
        playoffMvp: "TBD",
        regularSeasonBest: "TBD",
        mlbMvp: "TBD",
        mlbCyYoung: "TBD",
        mlbRoy: "TBD",
      }
    });

    try {
      const existingPick = await prisma.draftPick.findFirst({
        where: {
          year: year,
          round: round,
          originalOwnerId: originalTeam.id
        }
      });

      if (existingPick) {
        await prisma.draftPick.update({
          where: { id: existingPick.id },
          data: { currentOwnerId: currentTeam.id }
        });
        updatedCount++;
      } else {
        await prisma.draftPick.create({
          data: {
            year: year,
            round: round,
            originalOwnerId: originalTeam.id,
            currentOwnerId: currentTeam.id
          }
        });
        createdCount++;
      }
    } catch (error: any) {
      console.error(`⚠️ Failed to migrate pick ${lp.first_name} ${lp.last_name}. Error: ${error.message}`);
    }
  }

  console.log(`\n✅ Draft Pick Migration Complete!`);
  console.log(`✨ Created: ${createdCount}`);
  console.log(`🔄 Updated: ${updatedCount}`);
  console.log(`🗑️ Purged Old Picks (Noise): ${skippedOldPicksCount}`);
  if (skippedParseErrorCount > 0) console.log(`⏭️ Skipped (Parse/Team Errors): ${skippedParseErrorCount}`);
}

migrateDraftPicks()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });