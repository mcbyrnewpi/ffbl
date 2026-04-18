// src/app/api/draft/make-pick/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userRole = (session.user as any).role;
  const userTeamId = (session.user as any).teamId;

  try {
    const { draftPickId, playerId } = await req.json();
    if (!draftPickId || !playerId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const pick = await prisma.draftPick.findUnique({ where: { id: draftPickId } });
    if (!pick) return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    if (pick.playerId) return NextResponse.json({ error: 'Pick already made' }, { status: 400 });

    // Validate ownership
    if (pick.currentOwnerId !== userTeamId && userRole !== 'COMMISH' && userRole !== 'ADMIN') {
       return NextResponse.json({ error: 'You do not own this pick.' }, { status: 403 });
    }

    // Execute the Draft Transaction
    await prisma.$transaction(async (tx) => {
      await tx.draftPick.update({
        where: { id: draftPickId },
        data: {
          playerId: playerId,
          pickTime: new Date()
        }
      });

      await tx.player.update({
        where: { id: playerId },
        data: { teamId: pick.currentOwnerId }
      });

      await tx.transaction.create({
        data: {
          type: 'DRAFT',
          playerId: playerId,
          draftPickId: draftPickId,
          teamId: pick.currentOwnerId,
          details: `Drafted in Round ${pick.round}, Pick ${pick.pickNumber}`
        }
      });
    });

    return NextResponse.json({ message: 'Pick successfully made!' });
  } catch (error: any) {
    console.error("Draft Execution Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}