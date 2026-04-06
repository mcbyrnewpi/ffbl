// src/app/api/players/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('name');
    const level = searchParams.get('level'); 
    const unowned = searchParams.get('unowned') === 'true';
    
    // NEW: The manual trigger flag from the frontend
    const searchMlb = searchParams.get('searchMlb') === 'true';

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
        ]
      },
      include: {
        positions: true,
        team: { select: { name: true } },
        prospectRankings: true
      },
      take: 50, 
      orderBy: { lastName: 'asc' }
    });

    // 2. Search MLB API (ONLY if the user clicked the button & query is valid)
    let externalPlayers: any[] = [];

    if (searchMlb && query && query.length >= 3) { 
      try {
        const mlbRes = await fetch(
          `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}&sportIds=1,11,12,13,14,16,5442&hydrate=currentTeam,primaryPosition`
        );
        
        if (mlbRes.ok) {
          const mlbData = await mlbRes.json();
          
          // Deduplicate: Don't show MLB results for players we already have locally
          const localMlbIds = new Set(localPlayers.map(p => p.mlbId).filter(Boolean));

          externalPlayers = (mlbData.people || [])
            .filter((p: any) => !localMlbIds.has(p.id)) 
            .map((p: any) => ({
              id: `ext-${p.id}`, 
              mlbId: p.id,
              firstName: p.useName || p.firstName || "Unknown",
              lastName: p.lastName || "Unknown",
              isExternal: true, // Frontend will use this to render the "Import" button
              teamId: null,
              team: null,
              positions: [], 
              status: p.status?.description === 'Retired' ? 'RETIRED' : 'ACTIVE',
              mlbRawData: p 
            }));
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
    const { mlbId, firstName, lastName } = body; // Notice we stop caring about the client's mlbRawData

    if (!mlbId || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 🚀 THE HYDRATION STEP: Fetch the rich, heavy JSON profile directly from MLB
    // ?hydrate=currentTeam forces MLB to include the actual team name string!
    const mlbRes = await fetch(`https://statsapi.mlb.com/api/v1/people?personIds=${mlbIds}&hydrate=currentTeam,stats(group=[hitting,pitching,fielding],type=[yearByYear,season,career,projected])`);
    const mlbData = await mlbRes.json();
    
    // Grab the first (and only) person from the response
    const richMlbRawData = mlbData.people?.[0] || {};

    // 1. Extract and Format Birthdate (using the rich data)
    const rawBirthDate = richMlbRawData?.birthDate; 
    const birthdate = rawBirthDate ? new Date(rawBirthDate) : null;

    // 2. Map Position using the MLB Index Code
    const mlbPosCode = richMlbRawData?.primaryPosition?.code;
    const posAbbrev = richMlbRawData?.primaryPosition?.abbreviation;

    const positionData = posAbbrev ? {
      positions: {
        connectOrCreate: {
          where: { abbrev: posAbbrev },
          create: { 
            abbrev: posAbbrev, 
            mlbCode: mlbPosCode,
            name: richMlbRawData?.primaryPosition?.name || posAbbrev 
          }
        }
      }
    } : {};

    // 3. Insert into the Database
    const newPlayer = await prisma.player.create({
      data: {
        mlbId: Number(mlbId),
        firstName,
        lastName,
        birthdate,
        mlbRawData: richMlbRawData, // 💾 Save the highly-detailed JSON!
        status: "ACTIVE",
        ...positionData
      }
    });

    return NextResponse.json(newPlayer, { status: 201 });

  } catch (error: any) {
    console.error("Failed to import player:", error);
    
    // Prisma unique constraint violation (P2002) means someone else just imported this mlbId
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Player with this MLB ID is already in the database." }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}