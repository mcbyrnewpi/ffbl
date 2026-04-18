// src/app/api/admin/draft-order/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'ADMIN' && user?.role !== 'COMMISH') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { year, orderedTeamIds } = await req.json();

    if (!year || !orderedTeamIds || !Array.isArray(orderedTeamIds)) {
      return NextResponse.json({ error: 'Missing required data.' }, { status: 400 });
    }

    const updates = [];
    const totalTeams = orderedTeamIds.length;

    // The Draft order is linear. We loop through the exact order provided by the drag-and-drop UI.
    // The originalOwnerId dictates the draft slot, regardless of who currently owns the pick.
    for (let i = 0; i < totalTeams; i++) {
      const originalOwnerId = orderedTeamIds[i];
      const pickRank = i + 1; // 1st overall, 2nd overall, etc.

      // Process all 5 rounds for this franchise's slot
      for (let round = 1; round <= 5; round++) {
         // Math: For a 16 team league, if a team is 3rd overall:
         // Round 1: (0 * 16) + 3 = Pick 3
         // Round 2: (1 * 16) + 3 = Pick 19
         // Round 3: (2 * 16) + 3 = Pick 35
         const pickNumber = ((round - 1) * totalTeams) + pickRank;

         updates.push(
           prisma.draftPick.updateMany({
             where: {
               year: parseInt(year),
               round: round,
               originalOwnerId: originalOwnerId
             },
             data: {
               pickNumber: pickNumber
             }
           })
         );
      }
    }

    // Fire all 80 updates (16 teams * 5 rounds) safely in a single transaction
    await prisma.$transaction(updates);

    return NextResponse.json({ message: "Draft order locked in successfully." });
  } catch (error: any) {
    console.error("Draft Order Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}