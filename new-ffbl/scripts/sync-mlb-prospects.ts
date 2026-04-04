// scripts/sync-mlb-prospects.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The undocumented MLB Pipeline JSON endpoint for the current year
const PIPELINE_URL = 'https://www.mlb.com/gen/players/prospects/2026/playerProspects.json'; 

async function main() {
  console.log('⚾ Fetching MLB Pipeline Top 100 Prospects...');
  
  try {
    const res = await fetch(PIPELINE_URL);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch prospects. Status: ${res.status}`);
    }
    
    const data = await res.json();
    // The JSON key varies slightly by year, it's usually `prospectPlayers`
    const prospects = data.prospectPlayers || data.players || []; 
    
    // 1. Clear the slate (reset everyone's top 100 status)
    console.log('🧹 Clearing old prospect rankings...');
    await prisma.player.updateMany({
      where: { isTop100: true },
      data: { isTop100: false, prospectRank: null, prospectEta: null }
    });

    let matchedCount = 0;
    
    // 2. Process the new Top 100
    for (const prospect of prospects) {
      // The API returns strings for IDs and ranks, so we parse them
      const mlbId = parseInt(prospect.playerId || prospect.player_id);
      const rank = parseInt(prospect.rank);
      const eta = prospect.eta || prospect.estimatedMajorLeagueDebut;

      // We only care about the actual Top 100 (some endpoints return 150)
      if (!mlbId || !rank || rank > 100) continue;

      try {
        const updated = await prisma.player.updateMany({
          where: { mlbId: mlbId },
          data: {
            isTop100: true,
            prospectRank: rank,
            prospectEta: eta ? eta.toString() : null
          }
        });

        if (updated.count > 0) {
          matchedCount++;
          console.log(`✅ Ranked #${rank}: ${prospect.playerFirstName} ${prospect.playerLastName} (ETA: ${eta})`);
        } else {
          console.log(`⚠️ Ranked #${rank}: ${prospect.playerFirstName} ${prospect.playerLastName} not found in FFBL Database.`);
        }
      } catch (err) {
        console.error(`❌ Error updating prospect #${rank}`, err);
      }
    }
    
    console.log(`\n🎉 Prospect Sync Complete! Successfully matched ${matchedCount} / 100 prospects.`);
    
  } catch (error) {
    console.error('Failed to sync prospects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();