// src/app/api/admin/standings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryYear = searchParams.get('year');

    let yearToFetch;
    if (queryYear) {
      yearToFetch = parseInt(queryYear);
    } else {
      const settings = await prisma.leagueSettings.findUnique({ where: { id: 1 } });
      yearToFetch = settings?.currentSeason || new Date().getFullYear();
    }

    const standings = await prisma.seasonStanding.findMany({
      where: { year: yearToFetch },
      orderBy: { rank: 'asc' }
    });

    return NextResponse.json({ standings, year: yearToFetch });
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
    const { standings, year } = await req.json();
    const targetYear = parseInt(year);

    // 1. Ensure the Season record exists so we don't hit a Foreign Key error
    await prisma.season.upsert({
      where: { year: targetYear },
      update: {},
      create: {
        year: targetYear,
        ffblChampion: 'TBD',
        playoffMvp: 'TBD',
        regularSeasonBest: 'TBD',
        mlbMvp: 'TBD',
        mlbCyYoung: 'TBD',
        mlbRoy: 'TBD',
      }
    });

    // 2. Use UPSERT to definitively prevent duplicates
    const updates = standings.map((s: any) => {
      const wins = parseInt(s.wins) || 0;
      const losses = parseInt(s.losses) || 0;
      const ties = parseInt(s.ties) || 0;
      
      const totalGames = wins + losses + ties;
      const pct = totalGames > 0 ? (wins + (ties * 0.5)) / totalGames : 0;

      return prisma.seasonStanding.upsert({
        where: {
          year_teamId: { // Uses the new composite unique constraint
            year: targetYear,
            teamId: s.teamId
          }
        },
        update: {
          wins, losses, ties, rank: parseInt(s.rank) || 0, isPlayoffTeam: Boolean(s.isPlayoffTeam), pct,
          teamName: s.teamName,
          division: s.division || null
        },
        create: {
          year: targetYear,
          teamId: s.teamId,
          teamName: s.teamName,
          division: s.division || null,
          wins, losses, ties, rank: parseInt(s.rank) || 0, isPlayoffTeam: Boolean(s.isPlayoffTeam), pct
        }
      });
    });

    await prisma.$transaction(updates);
    
    return NextResponse.json({ message: "Standings updated successfully." });
  } catch (error: any) {
    console.error("Standings Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}