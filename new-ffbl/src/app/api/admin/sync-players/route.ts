// src/app/api/admin/sync-players/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
// 🌟 NEW: Import your authOptions so the backend can read the session token!
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 🌟 CRITICAL: Allows this specific route to run for up to 5 minutes to avoid Vercel timeouts
export const maxDuration = 300; 

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    // 1. Basic Security Check
    // Pass authOptions into getServerSession
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    
    if (userRole !== 'COMMISH' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log("⚾ Starting Deep-Hydration MLB Raw Data Sync via Commish UI...");

    // 2. Get ALL players that HAVE an MLB ID
    const players = await prisma.player.findMany({
      where: { mlbId: { not: null } },
      select: { id: true, mlbId: true, status: true },
    });

    let successCount = 0;
    let retiredCount = 0;
    let errorCount = 0;
    const chunkSize = 300;
    const currentYear = new Date().getFullYear();
    
    // 3. Process in chunks to respect MLB API limits
    for (let i = 0; i < players.length; i += chunkSize) {
      const chunk = players.slice(i, i + chunkSize);
      const mlbIds = chunk.map(p => p.mlbId).join(',');

      try {
        // 🌟 Includes 'transactions' in the hydrate string
        const response = await fetch(
          `https://statsapi.mlb.com/api/v1/people?personIds=${mlbIds}&hydrate=currentTeam,stats(group=[hitting,pitching,fielding],type=[yearByYear,season,career,projected]),transactions`
        );
        
        if (!response.ok) throw new Error(`API responded with status: ${response.status}`);

        const data = await response.json();
        const fetchedPeople = data.people || [];
        const personMap = new Map(fetchedPeople.map((p: any) => [p.id, p]));

        // 4. Update the database concurrently for this batch
        await Promise.all(chunk.map(async (player) => {
          const personData = personMap.get(player.mlbId);

          if (personData) {
            const updatePayload: any = { mlbRawData: personData };

            if (personData.birthDate) {
              updatePayload.birthdate = new Date(personData.birthDate);
            }

            // --- 🌟 THE 3-STEP RETIREMENT HEURISTIC ---
            
            // Step 1: Explicit MLB Status
            let isRetired = personData.status?.description === 'Retired' || personData.status?.code === 'RM';
            
            // Step 2: The Transaction Checker
            if (!isRetired && personData.transactions && personData.transactions.length > 0) {
              const sortedTransactions = [...personData.transactions].sort((a: any, b: any) => {
                const dateA = new Date(a.effectiveDate || a.date).getTime();
                const dateB = new Date(b.effectiveDate || b.date).getTime();
                return dateB - dateA; // Descending
              });
              
              const latestTx = sortedTransactions[0];
              if (latestTx && (latestTx.typeCode === 'RET' || latestTx.typeDesc === 'Retired')) {
                isRetired = true;
              }
            }

            // Step 3: The 2-Year Rule (For guys like Lofton who just faded away)
            if (!isRetired && personData.active === false && personData.lastPlayedDate) {
               const lastPlayedYear = parseInt(personData.lastPlayedDate.split('-')[0]);
               if (currentYear - lastPlayedYear >= 2) {
                   isRetired = true;
               }
            }

            // CRITICAL: We ONLY update the status if they are retiring. 
            // If they are active, we leave their FFBL status alone so we don't accidentally wipe out a manager's IL or NA assignments!
            if (isRetired && player.status !== 'RETIRED') {
              updatePayload.status = 'RETIRED';
              retiredCount++;
            }

            await prisma.player.update({
              where: { id: player.id },
              data: updatePayload,
            });

            successCount++;
          } else {
            errorCount++;
          }
        }));

        // Be polite to MLB servers
        await sleep(1000);

      } catch (batchError: any) {
        console.error(`🚨 Error processing batch starting at index ${i}:`, batchError.message);
        errorCount += chunk.length; 
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Sync Complete! Updated ${successCount} profiles and explicitly flagged ${retiredCount} new retirees. (Errors: ${errorCount})` 
    });

  } catch (error) {
    console.error("Deep Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}