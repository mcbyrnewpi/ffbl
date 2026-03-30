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
        team: { select: { name: true } }
      },
      take: 50, 
      orderBy: { lastName: 'asc' }
    });

    // 2. Search MLB API (ONLY if the user clicked the button & query is valid)
    let externalPlayers: any[] = [];

    if (searchMlb && query && query.length >= 3) { 
      try {
        const mlbRes = await fetch(
          `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}`
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

// Add this to the bottom of: src/app/api/players/route.ts

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mlbId, firstName, lastName, mlbRawData } = body;

    // 1. Basic Validation
    if (!mlbId || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Map the Position (if available)
    // MLB API returns abbreviations like 'SS', 'P', '1B'. We connect it to our local Position model.
    const posAbbrev = mlbRawData?.primaryPosition?.abbreviation;
    const positionConnect = posAbbrev ? {
      positions: {
        connect: { abbrev: posAbbrev }
      }
    } : {};

    // 3. Insert into the Database
    const newPlayer = await prisma.player.create({
      data: {
        mlbId,
        firstName,
        lastName,
        mlbRawData,
        status: "ACTIVE", // Default new imports to active
        ...positionConnect
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