// scripts/sync-mlb-ids.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is missing");

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper to prevent rate-limiting from the MLB API
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function matchMlbIds() {
  console.log("⚾ Starting MLB API Matchmaker...");

  // 1. Get all players missing an MLB ID
  const players = await prisma.player.findMany({
    where: { mlbId: null }, // Adjust this if your field is named differently
  });

  console.log(`Found ${players.length} players needing an MLB ID.`);

  let matchCount = 0;
  let missingCount = 0;
  let duplicateCount = 0;

  for (const player of players) {
    const fullName = `${player.firstName} ${player.lastName}`.trim();
    console.log(`Searching for: ${fullName}...`);

    try {
      // 2. Ask the MLB API for this specific name
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(fullName)}`
      );
      const data = await response.json();

      const people = data.people || [];

      if (people.length === 1) {
        // 🎯 EXACT MATCH
        const mlbId = parseInt(people[0].id, 10); 
        
        await prisma.player.update({
          where: { id: player.id },
          data: { mlbId: mlbId }, // Update this field!
        });

        console.log(`  ✅ Matched! ID: ${mlbId}`);
        matchCount++;
      } else if (people.length > 1) {
        // ⚠️ MULTIPLE MATCHES (e.g., Luis Garcia, Will Smith)
        console.log(`  ⚠️ Found ${people.length} matches for ${fullName}. Skipping for manual review.`);
        duplicateCount++;
      } else {
        // ❌ NO MATCH (Spelling differences, retired, or international)
        console.log(`  ❌ No match found for ${fullName}.`);
        missingCount++;
      }

      // Be polite to the MLB servers (wait half a second)
      await sleep(500);

    } catch (error: any) {
      console.error(`  🚨 API Error for ${fullName}:`, error.message);
    }
  }

  console.log(`\n🎉 MLB ID Sync Complete!`);
  console.log(`🎯 Exact Matches: ${matchCount}`);
  console.log(`⚠️ Multiple Matches (Needs Manual Fix): ${duplicateCount}`);
  console.log(`❌ Not Found (Check Spelling): ${missingCount}`);
}

matchMlbIds()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });