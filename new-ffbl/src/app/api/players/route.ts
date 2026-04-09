// src/app/api/players/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('name');
    const level = searchParams.get('level'); 
    const unowned = searchParams.get('unowned') === 'true';
    const searchMlb = searchParams.get('searchMlb') === 'true';
    const position = searchParams.get('position');
    const playerStatus = searchParams.get('status'); 

    // 1. Search Local Database
    const localPlayers = await prisma.player.findMany({
      where: {
        AND: [
          query ? {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
            ],
          } : {},
          level ? { level: level as any } : {},
          unowned ? { teamId: null } : {},
          position ? { positions: { some: { abbrev: position } } } : {},
          playerStatus === 'RETIRED' 
            ? { status: 'RETIRED' } 
            : playerStatus === 'ACTIVE' 
              ? { status: { not: 'RETIRED' } } 
              : {},
        ]
      },
      include: {
        positions: true,
        team: { select: { name: true, logoUrl: true } },
        prospectRankings: true,
        hallOfFame: { include: { team: { select: { name: true, logoUrl: true } } } }
      },
      take: 50, 
      orderBy: { lastName: 'asc' }
    });

    // 2. Search MLB API
    let externalPlayers: any[] = [];

    if (searchMlb && query && query.length >= 3) { 
      try {
        const mlbRes = await fetch(
          `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}&sportIds=1,11,12,13,14,16,5442&hydrate=currentTeam,primaryPosition,transactions`
        );
        
        if (mlbRes.ok) {
          const mlbData = await mlbRes.json();
          const localMlbIds = new Set(localPlayers.map(p => p.mlbId).filter(Boolean));
          const currentYear = new Date().getFullYear();

          externalPlayers = (mlbData.people || [])
            .filter((p: any) => !localMlbIds.has(p.id)) 
            .map((p: any) => {
              
              // 🌟 HEURISTIC 1: Explicit MLB Status
              let isRetired = p.status?.description === 'Retired' || p.status?.code === 'RM';

              // 🌟 HEURISTIC 2: Explicit "RET" Transaction Check (Catches Pujols)
              if (!isRetired && p.transactions && p.transactions.length > 0) {
                const sortedTransactions = [...p.transactions].sort((a: any, b: any) => {
                  const dateA = new Date(a.effectiveDate || a.date).getTime();
                  const dateB = new Date(b.effectiveDate || b.date).getTime();
                  return dateB - dateA;
                });
                
                const latestTx = sortedTransactions[0];
                if (latestTx && (latestTx.typeCode === 'RET' || latestTx.typeDesc === 'Retired')) {
                  isRetired = true;
                }
              }

              // 🌟 HEURISTIC 3: The 2-Year Rule (Catches Lofton)
              if (!isRetired && p.active === false && p.lastPlayedDate) {
                 const lastPlayedYear = parseInt(p.lastPlayedDate.split('-')[0]);
                 if (currentYear - lastPlayedYear >= 2) {
                     isRetired = true;
                 }
              }

              return {
                id: `ext-${p.id}`, 
                mlbId: p.id,
                firstName: p.useName || p.firstName || "Unknown",
                lastName: p.lastName || "Unknown",
                isExternal: true, 
                teamId: null,
                team: null,
                positions: [], 
                status: isRetired ? 'RETIRED' : 'ACTIVE',
                mlbRawData: p 
              };
            });

          if (playerStatus === 'RETIRED') {
            externalPlayers = externalPlayers.filter(p => p.status === 'RETIRED');
          } else if (playerStatus === 'ACTIVE') {
            externalPlayers = externalPlayers.filter(p => p.status !== 'RETIRED');
          }
        }
      } catch (apiError) {
        console.error("MLB API Error during Omni-Search:", apiError);
      }
    }

    // 3. Merge and Return
    const combinedResults = [...localPlayers, ...externalPlayers];

    return NextResponse.json(combinedResults);

  } catch (error) {
    console.error("Player Search Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // We still accept frontend status as a fallback, but we will calculate it to be safe
    const { mlbId, firstName, lastName, status: frontendStatus } = body; 

    if (!mlbId || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Deep Hydration fetch (now including transactions)
    const mlbRes = await fetch(`https://statsapi.mlb.com/api/v1/people?personIds=${mlbId}&hydrate=currentTeam,stats(group=[hitting,pitching,fielding],type=[yearByYear,season,career,projected]),transactions`);
    const mlbData = await mlbRes.json();
    
    const richMlbRawData = mlbData.people?.[0] || {};

    const rawBirthDate = richMlbRawData?.birthDate; 
    const birthdate = rawBirthDate ? new Date(rawBirthDate) : null;

    const mlbPosCode = richMlbRawData?.primaryPosition?.code;
    let posAbbrev = richMlbRawData?.primaryPosition?.abbreviation;
    let rawPosName = richMlbRawData?.primaryPosition?.name || posAbbrev;

    // 🌟 THE OF INTERCEPTOR: Map specific outfield spots to the universal FFBL 'OF'
    if (['LF', 'CF', 'RF'].includes(posAbbrev)) {
      posAbbrev = 'OF';
      rawPosName = 'Outfielder';
    }

    const positionData = posAbbrev ? {
      positions: {
        connectOrCreate: {
          where: { abbrev: posAbbrev },
          create: { 
            abbrev: posAbbrev, 
            mlbCode: mlbPosCode,
            name: rawPosName 
          }
        }
      }
    } : {};

    // --- THE 3-STEP RETIREMENT HEURISTIC (Backend Source of Truth) ---
    let isRetired = false;
    const currentYear = new Date().getFullYear();

    // Step 1: Explicit MLB Status
    if (richMlbRawData.status?.description === 'Retired' || richMlbRawData.status?.code === 'RM') {
      isRetired = true;
    }

    // Step 2: The Transaction Checker
    if (!isRetired && richMlbRawData.transactions && richMlbRawData.transactions.length > 0) {
      const sortedTransactions = [...richMlbRawData.transactions].sort((a: any, b: any) => {
        const dateA = new Date(a.effectiveDate || a.date).getTime();
        const dateB = new Date(b.effectiveDate || b.date).getTime();
        return dateB - dateA; // Descending
      });
      
      const latestTx = sortedTransactions[0];
      if (latestTx && (latestTx.typeCode === 'RET' || latestTx.typeDesc === 'Retired')) {
        isRetired = true;
      }
    }

    // Step 3: The 2-Year Rule (Catches Kenny Lofton)
    if (!isRetired && richMlbRawData.active === false && richMlbRawData.lastPlayedDate) {
       const lastPlayedYear = parseInt(richMlbRawData.lastPlayedDate.split('-')[0]);
       if (currentYear - lastPlayedYear >= 2) {
           isRetired = true;
       }
    }

    // Final check: If our backend caught the retirement, OR the frontend passed it, mark as retired.
    const finalStatus = isRetired || frontendStatus === 'RETIRED' ? 'RETIRED' : 'ACTIVE';

    const newPlayer = await prisma.player.create({
      data: {
        mlbId: Number(mlbId),
        firstName,
        lastName,
        birthdate,
        mlbRawData: richMlbRawData, 
        status: finalStatus,
        ...positionData
      }
    });

    return NextResponse.json(newPlayer, { status: 201 });

  } catch (error: any) {
    console.error("Failed to import player:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Player with this MLB ID is already in the database." }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}