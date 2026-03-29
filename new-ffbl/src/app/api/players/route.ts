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