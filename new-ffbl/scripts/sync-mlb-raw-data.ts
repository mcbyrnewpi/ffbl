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
  console.log("⚾ Starting MLB Raw Data Sync...");

  // 1. Get all players that HAVE an MLB ID, but DON'T have raw data yet.
  const players = await prisma.player.findMany({
    where: {
      mlbId: { not: null },
      mlbRawData: { equals: Prisma.DbNull },
    },
    select: { id: true, mlbId: true, firstName: true, lastName: true },
  });

  console.log(`Found ${players.length} players needing raw MLB data.`);

  let successCount = 0;
  let errorCount = 0;
  let retiredCount = 0; // <-- NEW: Tracking retired players

  for (const player of players) {
    const fullName = `${player.firstName} ${player.lastName}`;
    console.log(`Fetching data for: ${fullName} (MLB ID: ${player.mlbId})...`);

    try {
      // 2. Fetch the player's specific profile from the MLB Stats API
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/people/${player.mlbId}`
      );
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      const personData = data.people?.[0];

      if (personData) {
        // 3a. Prepare the update payload with the raw JSON
        const updatePayload: any = { mlbRawData: personData };

        // 3b. Check the MLB status string to see if they are retired
        if (
          personData.status?.description === 'Retired' || 
          personData.status?.code === 'RET'
        ) {
          updatePayload.status = 'RETIRED';
          console.log(`  👴 Player is retired! Updating status.`);
          retiredCount++; // <-- NEW: Increment the counter
        }

        // 3c. Save everything to the database
        await prisma.player.update({
          where: { id: player.id },
          data: updatePayload,
        });

        console.log(`  ✅ Successfully saved raw data.`);
        successCount++;
      } else {
        console.log(`  ⚠️ No person data found in payload.`);
        errorCount++;
      }

      // 4. Be polite to the MLB servers (wait 250ms)
      await sleep(250);

    } catch (error: any) {
      console.error(`  🚨 Error fetching ${fullName}:`, error.message);
      errorCount++;
    }
  }

  // NEW: Updated final output
  console.log(`\n🎉 MLB Raw Data Sync Complete!`);
  console.log(`✅ Successfully synced: ${successCount}`);
  console.log(`👴 Retired Players Found: ${retiredCount}`);
  console.log(`❌ Errors: ${errorCount}`);
}

fetchMlbRawData()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });