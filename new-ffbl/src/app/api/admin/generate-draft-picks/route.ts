// src/app/api/admin/generate-draft-picks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'ADMIN' && user?.role !== 'COMMISH') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { year } = await req.json();
    const targetYear = parseInt(year);
    if (!targetYear) return NextResponse.json({ error: 'Year is required' }, { status: 400 });

    // 1. Maintain Relational Integrity: Ensure the Season record exists
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
      },
    });

    // 2. Fetch all teams
    const teams = await prisma.team.findMany({ select: { id: true } });

    // 3. Prepare 5 rounds of picks
    const picksToCreate = teams.flatMap((team) => 
      [1, 2, 3, 4, 5].map((round) => ({
        year: targetYear,
        round,
        originalOwnerId: team.id,
        currentOwnerId: team.id,
      }))
    );

    const createdPicks = await prisma.draftPick.createMany({
      data: picksToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({ 
      message: `Generated ${createdPicks.count} picks for ${targetYear}.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}