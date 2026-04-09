// src/app/api/rosters/[teamId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  try {
    const roster = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        // 1. Fetch all players assigned to this team
        players: {
          include: {
            positions: true, // Show if they are a P, SS, etc.
            team: true,
            prospectRankings: true
          },
          orderBy: [
            { level: 'asc' },   // Group by MLB, then AAA, etc.
            { lastName: 'asc' } // Then alphabetical
          ]
        },
        // 2. Fetch all draft picks CURRENTLY owned by this team
        currentPicks: {
          where: { year: { in: [2027, 2028] } }, // Only the future assets
          orderBy: [
            { year: 'asc' },
            { round: 'asc' }
          ]
        },
        // 3. Fetch the managers
        managers: {
          select: { name: true, role: true }
        }
      }
    });

    if (!roster) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(roster);

  } catch (error) {
    console.error("Roster Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}