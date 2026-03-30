// scripts/sync-mlb-raw-data.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is missing");

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Polite sleep function to avoid hammering the MLB API
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchMlbRawData() {
  console.log("⚾ Starting Deep-Hydration MLB Raw Data Sync...");

  // 1. Get ALL players that HAVE an MLB ID to "heal" their lightweight JSON
  const players = await prisma.player.findMany({
    where: {
      mlbId: { not: null },
    },
    select: { id: true, mlbId: true, firstName: true, lastName: true },
  });

  console.log(`Found ${players.length} players to deep-sync.`);

  let successCount = 0;
  let errorCount = 0;
  let retiredCount = 0;

  // 2. Process in chunks of 300 for the MLB Batch Endpoint
  const chunkSize = 300;
  
  for (let i = 0; i < players.length; i += chunkSize) {
    const chunk = players.slice(i, i + chunkSize);
    const mlbIds = chunk.map(p => p.mlbId).join(',');

    console.log(`\n📦 Fetching batch ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(players.length / chunkSize)}...`);

    try {
      // 3. Hit the batch endpoint with the ?hydrate=currentTeam flag
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/people?personIds=${mlbIds}&hydrate=currentTeam,stats(group=[hitting,pitching,fielding],type=[yearByYear,season,career,projected])`
      );
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      const fetchedPeople = data.people || [];

      // Create a quick lookup map from the MLB response
      const personMap = new Map(fetchedPeople.map((p: any) => [p.id, p]));

      // 4. Update the database concurrently for this batch
      await Promise.all(chunk.map(async (player) => {
        const personData = personMap.get(player.mlbId);

        if (personData) {
          // Prepare the rich JSON payload
          const updatePayload: any = { mlbRawData: personData };

          // Sync the birthdate to the root model just like our POST route does!
          if (personData.birthDate) {
            updatePayload.birthdate = new Date(personData.birthDate);
          }

          // Check for retired status
          if (
            personData.status?.description === 'Retired' || 
            personData.status?.code === 'RET'
          ) {
            updatePayload.status = 'RETIRED';
            retiredCount++;
          }

          // Save everything to the database
          await prisma.player.update({
            where: { id: player.id },
            data: updatePayload,
          });

          successCount++;
        } else {
          console.log(`  ⚠️ No data returned by MLB for: ${player.firstName} ${player.lastName}`);
          errorCount++;
        }
      }));

      console.log(`  ✅ Batch processed successfully.`);

      // 5. Be polite to the MLB servers between heavy batch calls
      await sleep(1000);

    } catch (error: any) {
      console.error(`  🚨 Error processing batch starting at index ${i}:`, error.message);
      errorCount += chunk.length; // Assume the whole chunk failed if the fetch blew up
    }
  }

  // Final Output
  console.log(`\n🎉 Deep-Hydration Sync Complete!`);
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`👴 Retired Players Flagged: ${retiredCount}`);
  console.log(`❌ Errors/Missing: ${errorCount}`);
}

fetchMlbRawData()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });