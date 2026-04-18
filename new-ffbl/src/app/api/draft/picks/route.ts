// src/app/api/draft/picks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  // Ensure the user is logged into the FFBL
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Determine the target draft year
    const settings = await prisma.leagueSettings.findUnique({ where: { id: 1 } });
    const currentSeason = settings?.currentSeason || new Date().getFullYear();
    const targetDraftYear = currentSeason + 1;

    // 2. Fetch all picks for that year, sorted by pickNumber
    const draftPicks = await prisma.draftPick.findMany({
      where: { year: targetDraftYear },
      orderBy: { pickNumber: 'asc' },
      include: {
        // Pulling currentOwner data to show who is on the clock
        currentOwner: {
          select: { id: true, name: true, logoUrl: true }
        },
        // Pulling originalOwner to show trade history (e.g., "via Team A")
        originalOwner: {
          select: { id: true, name: true }
        },
        // Pulling the player if the pick has already been made
        player: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            mlbId: true, // Needed for the MLB CDN headshot trick
            positions: {
              select: { abbrev: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      targetDraftYear, 
      isDraftOpen: settings?.isDraftOpen || false,
      draftPicks 
    });
  } catch (error: any) {
    console.error("Fetch Draft Picks Error:", error);
    return NextResponse.json({ error: 'Failed to fetch draft picks' }, { status: 500 });
  }
}