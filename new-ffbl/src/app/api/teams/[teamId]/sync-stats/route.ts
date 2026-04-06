// src/app/api/teams/[teamId]/sync-stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: Request,
  props: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await props.params;
    const session = await getServerSession(authOptions);

    // 1. Security: Ensure the user actually owns this team
    if ((session?.user as any)?.teamId !== teamId && (session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized. You can only sync your own team." }, { status: 403 });
    }

    // 2. Fetch the team and all their players with an mlbId
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { players: { where: { mlbId: { not: null } }, select: { id: true, mlbId: true } } }
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    // 3. Enforce the 24-hour limit
    if (team.lastStatSync) {
      const hoursSince = (Date.now() - team.lastStatSync.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        const hoursLeft = Math.ceil(24 - hoursSince);
        return NextResponse.json({ error: `Stats are up to date. Please wait ${hoursLeft} hours before syncing again.` }, { status: 429 });
      }
    }

    const mlbIds = team.players.map(p => p.mlbId);
    let updatedCount = 0;

    // 4. Fetch the MLB Data in chunks of 100 (to avoid URL length limits)
    for (let i = 0; i < mlbIds.length; i += 100) {
      const chunk = mlbIds.slice(i, i + 100);
      const mlbUrl = `https://statsapi.mlb.com/api/v1/people?personIds=${chunk.join(',')}&hydrate=stats(group=[hitting,pitching,fielding],type=[yearByYear,season,career,projected]),currentTeam`;

      const res = await fetch(mlbUrl);
      if (!res.ok) continue;
      
      const data = await res.json();
      if (!data.people) continue;

      // 5. Bulk Update the database
      for (const person of data.people) {
        await prisma.player.updateMany({
          where: { mlbId: person.id, teamId: teamId }, // Extra safety check
          data: { mlbRawData: person }
        });
        updatedCount++;
      }
    }

    // 6. Lock the sync button for 24 hours
    await prisma.team.update({
      where: { id: teamId },
      data: { lastStatSync: new Date() }
    });

    return NextResponse.json({ success: true, message: `Successfully pulled fresh MLB stats for ${updatedCount} players!` });

  } catch (error) {
    console.error("Team Sync Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}