// src/app/api/teams/[teamId]/hall-of-fame/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request, props: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await props.params;
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userTeamId = (session?.user as any)?.teamId;

    if (!session || (userTeamId !== teamId && userRole !== 'COMMISH' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { playerId, inductionYear, blurb } = body;

    if (!playerId || !inductionYear) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const inductee = await prisma.teamHallOfFame.create({
      data: {
        teamId,
        playerId,
        inductionYear: parseInt(inductionYear, 10),
        blurb,
      },
    });

    return NextResponse.json(inductee, { status: 201 });
  } catch (error: any) {
    console.error("HOF Induction Error:", error);
    // Prisma unique constraint violation code
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "This player is already in your Hall of Fame." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to induct player." }, { status: 500 });
  }
}