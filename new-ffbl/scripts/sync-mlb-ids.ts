// scripts/sync-mlb-ids.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is missing");

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to strip "Jr.", "Sr.", "II", and accents for better fuzzy matching
function cleanName(name: string) {
  return name
    .normalize("NFD") // Deconstructs accents (ñ -> n + ~)
    .replace(/[\u0300-\u036f]/g, "") // Removes the accent marks
    .replace(/\s+(Jr\.|Sr\.|II|III|IV)$/i, "") // Removes suffixes
    .trim();
}

async function matchMlbIds() {
  console.log("⚾ Starting MLB API Matchmaker (Omni-Search Enabled)...");

  const players = await prisma.player.findMany({
    where: { mlbId: null }, 
  });

  console.log(`Found ${players.length} players needing an MLB ID.`);

  let matchCount = 0;
  let missingCount = 0;
  let duplicateCount = 0;

  for (const player of players) {
    const fullName = `${player.firstName} ${player.lastName}`.trim();
    const cleanedName = cleanName(fullName);

    console.log(`Searching for: ${fullName}...`);

    try {
      // Add sportIds for Minors, Fall League, Winter Leagues, etc.
      let response = await fetch(
        `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(fullName)}&sportIds=1,11,12,13,14,16,5442`
      );
      let data = await response.json();
      let people = data.people || [];

      // 🔄 FALLBACK SEARCH: If no matches, try the "cleaned" name (e.g., stripped accents/suffixes)
      if (people.length === 0 && fullName !== cleanedName) {
        console.log(`  🔄 Retrying with cleaned name: ${cleanedName}...`);
        await sleep(500); // Polite delay
        response = await fetch(
          `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(cleanedName)}&sportIds=1,11,12,13,14,16,5442`
        );
        data = await response.json();
        people = data.people || [];
      }

      if (people.length === 1) {
        // 🎯 EXACT MATCH
        const mlbId = parseInt(people[0].id, 10); 
        
        await prisma.player.update({
          where: { id: player.id },
          data: { mlbId: mlbId }, 
        });

        console.log(`  ✅ Matched! ID: ${mlbId}`);
        matchCount++;
      } else if (people.length > 1) {
        // ⚠️ MULTIPLE MATCHES
        console.log(`  ⚠️ Found ${people.length} matches for ${fullName}. Skipping for manual review.`);
        duplicateCount++;
      } else {
        // ❌ NO MATCH
        console.log(`  ❌ No match found for ${fullName}.`);
        missingCount++;
      }

      // Be polite to the MLB servers (wait half a second)
      await sleep(500);

    } catch (error: any) {
      console.error(`  🚨 API Error for ${fullName}:`, error.message);
    }
  }

  console.log(`\n🎉 MLB ID Omni-Sync Complete!`);
  console.log(`🎯 Exact Matches: ${matchCount}`);
  console.log(`⚠️ Multiple Matches (Needs Manual Fix): ${duplicateCount}`);
  console.log(`❌ Not Found (Check Spelling/Retired): ${missingCount}`);
}

matchMlbIds()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });