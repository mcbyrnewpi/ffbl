import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransType } from '@prisma/client'; // Import your Enum from Prisma

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    // 1. Next.js 15 Requirement: Await the params
    const { playerId } = await params;
    const body = await request.json();

    // 2. Fetch the player's CURRENT state (The "Before" picture)
    const currentPlayer = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!currentPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // 3. Setup the target variables (fallback to current state if not provided in the request)
    const newTeamId = body.teamId !== undefined ? body.teamId : currentPlayer.teamId;
    const newLevel = body.level !== undefined ? body.level : currentPlayer.level;
    const newStatus = body.status !== undefined ? body.status : currentPlayer.status;

    // 4. The "Detective" Logic: Figure out what type of transaction this is
    let transType: TransType | null = null;
    let details = "";

    if (currentPlayer.teamId === null && newTeamId !== null) {
      transType = 'ADD';
      details = "Added from Free Agency";
    } else if (currentPlayer.teamId !== null && newTeamId === null) {
      transType = 'DROP';
      details = "Dropped to Free Agency";
    } else if (currentPlayer.level !== newLevel && newLevel !== null) {
      // Simple logic to deduce Promote vs Demote using an array hierarchy
      const hierarchy = ['MLB', 'AAA', 'AA', 'A'];
      const oldIdx = currentPlayer.level ? hierarchy.indexOf(currentPlayer.level) : -1;
      const newIdx = hierarchy.indexOf(newLevel);

      if (oldIdx !== -1 && newIdx < oldIdx) {
        transType = 'PROMOTE';
      } else {
        transType = 'DEMOTE';
      }
      details = `Moved from ${currentPlayer.level || 'Unassigned'} to ${newLevel}`;
    }

    // 🛡️ NEW: DUAL-CHECK ROSTER VALIDATION (Level & Status Limits)
    if (newTeamId && (newTeamId !== currentPlayer.teamId || newLevel !== currentPlayer.level || newStatus !== currentPlayer.status)) {
      
      const settings = await prisma.leagueSettings.findUnique({
        where: { id: 1 }
      });

      if (settings?.enforceRosterLimits) {
        
        // --- CHECK 1: ACTIVE LEVEL LIMITS ---
        if (newStatus === 'ACTIVE' && newLevel) {
          const currentLevelCount = await prisma.player.count({
            where: { teamId: newTeamId, level: newLevel, status: 'ACTIVE' },
          });

          const limitField = `${newLevel.toLowerCase()}Limit` as keyof typeof settings;
          const limit = settings[limitField] as number;

          if (currentLevelCount >= limit) {
            return NextResponse.json(
              { error: "Roster Limit Exceeded", message: `The ${newLevel} active roster is full (Limit: ${limit}).` }, 
              { status: 400 }
            );
          }
        }

        // --- CHECK 2: STATUS STASH LIMITS (IL, NA, IL_60) ---
        if (newStatus !== 'ACTIVE' && ['IL', 'IL_60', 'NA'].includes(newStatus)) {
          const currentStatusCount = await prisma.player.count({
            where: { teamId: newTeamId, status: newStatus },
          });

          let statusLimit: number | null = null;
          if (newStatus === 'IL') statusLimit = settings.ilLimit;
          if (newStatus === 'IL_60') statusLimit = settings.il60Limit;
          if (newStatus === 'NA') statusLimit = settings.naLimit;

          // If statusLimit is null, it means it's unlimited (like our optional il60Limit)
          if (statusLimit !== null && currentStatusCount >= statusLimit) {
            return NextResponse.json(
              { error: "Stash Limit Exceeded", message: `Your ${newStatus} slots are full (Limit: ${statusLimit}).` }, 
              { status: 400 }
            );
          }
        }
      }
    }

    // 5. Execute BOTH the update and the log simultaneously
    const result = await prisma.$transaction(async (tx) => {
      // A. Update the Player
      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          teamId: newTeamId,
          level: newLevel,
          status: newStatus,
        },
        include: { team: true }, // Send back the team info so the UI can update
      });

      // B. Create the Transaction Log (if a valid move was detected)
      if (transType) {
        await tx.transaction.create({
          data: {
            type: transType,
            playerId: playerId,
            teamId: newTeamId || currentPlayer.teamId, // Log it against the team making the move
            details: details,
          },
        });
      }

      return updatedPlayer;
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("PATCH Player Error:", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}