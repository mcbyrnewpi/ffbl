// src/app/api/admin/draft/undo-pick/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  // Commish and Admin only
  if (!session?.user || (userRole !== 'COMMISH' && userRole !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { draftPickId } = await req.json();
    if (!draftPickId) return NextResponse.json({ error: 'Missing pick ID' }, { status: 400 });

    const pick = await prisma.draftPick.findUnique({
      where: { id: draftPickId },
      include: { player: true }
    });

    if (!pick || !pick.playerId) {
      return NextResponse.json({ error: 'Pick not found or no player drafted in this slot.' }, { status: 400 });
    }

    // Safely unwind the pick in a single transaction
    await prisma.$transaction(async (tx) => {
      // 1. Remove the player from the team's roster
      await tx.player.update({
        where: { id: pick.playerId! },
        data: { teamId: null }
      });

      // 2. Clear the draft pick slot
      await tx.draftPick.update({
        where: { id: draftPickId },
        data: { playerId: null, pickTime: null }
      });

      // 3. Erase the draft transaction log so it doesn't show in league history
      await tx.transaction.deleteMany({
        where: {
          type: 'DRAFT',
          draftPickId: draftPickId,
          playerId: pick.playerId!
        }
      });
    });

    return NextResponse.json({ message: 'Pick successfully reversed.' });
  } catch (error: any) {
    console.error("Undo Pick Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}