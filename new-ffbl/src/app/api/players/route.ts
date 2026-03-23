// src/app/api/players/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 1. Grab search parameters from the URL (e.g., /api/players?name=Griffin)
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('name');
    const level = searchParams.get('level'); // Optional filter (MLB, AAA, etc.)
    const unowned = searchParams.get('unowned') === 'true';

    const players = await prisma.player.findMany({
      where: {
        AND: [
          // If a name is provided, search both firstName and lastName
          query ? {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
            ],
          } : {},
          // If a level is provided, filter by it
          level ? { level: level as any } : {},
          // 3. 🆕 If unowned=true, only show players where teamId is null
          unowned ? { teamId: null } : {},
        ]
      },
      include: {
        positions: true,
        team: { select: { name: true } } // Show who currently owns them
      },
      take: 50, // Limit results for performance
      orderBy: { lastName: 'asc' }
    });

    return NextResponse.json(players);

  } catch (error) {
    console.error("Player Search Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}