// src/app/api/admin/standings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  try {
    const settings = await prisma.leagueSettings.findUnique({ where: { id: 1 } });
    const currentYear = settings?.currentSeason || new Date().getFullYear();

    const standings = await prisma.seasonStanding.findMany({
      where: { year: currentYear },
      orderBy: { rank: 'asc' }
    });

    return NextResponse.json({ standings, currentYear });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'ADMIN' && user?.role !== 'COMMISH') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { standings } = await req.json();

    // 1. Get current season from settings to assign new rows correctly
    const settings = await prisma.leagueSettings.findUnique({ where: { id: 1 } });
    const currentYear = settings?.currentSeason || new Date().getFullYear();

    // 2. Ensure the Season record exists so we don't hit a Foreign Key error
    await prisma.season.upsert({
      where: { year: currentYear },
      update: {},
      create: {
        year: currentYear,
        ffblChampion: 'TBD',
        playoffMvp: 'TBD',
        regularSeasonBest: 'TBD',
        mlbMvp: 'TBD',
        mlbCyYoung: 'TBD',
        mlbRoy: 'TBD',
      }
    });

    // 3. Process the creates vs updates
    const updates = standings.map((s: any) => {
      const wins = parseInt(s.wins) || 0;
      const losses = parseInt(s.losses) || 0;
      const ties = parseInt(s.ties) || 0;
      
      const totalGames = wins + losses + ties;
      const pct = totalGames > 0 ? (wins + (ties * 0.5)) / totalGames : 0;

      const data = {
        wins,
        losses,
        ties,
        rank: parseInt(s.rank) || 0,
        isPlayoffTeam: Boolean(s.isPlayoffTeam),
        pct
      };

      // If the ID came from our frontend self-healing fallback, it's a new row
      if (s.id.startsWith("temp_")) {
        return prisma.seasonStanding.create({
          data: {
            ...data,
            year: currentYear,
            teamId: s.teamId,
            teamName: s.teamName
          }
        });
      } else {
        // Otherwise, update the existing row
        return prisma.seasonStanding.update({
          where: { id: s.id },
          data
        });
      }
    });

    // Execute all updates/creates in a single transaction
    await prisma.$transaction(updates);
    
    return NextResponse.json({ message: "Standings updated successfully." });
  } catch (error: any) {
    console.error("Standings Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}