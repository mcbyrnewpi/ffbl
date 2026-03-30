// src/app/api/players/[playerId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransType } from '@prisma/client'; 

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

    // 3. Setup the target variables
    const newTeamId = body.teamId !== undefined ? body.teamId : currentPlayer.teamId;
    const newLevel = body.level !== undefined ? body.level : currentPlayer.level;
    const newStatus = body.status !== undefined ? body.status : currentPlayer.status;
    
    // NEW: Grab MLB Link data if provided in the request
    const newMlbId = body.mlbId !== undefined ? body.mlbId : currentPlayer.mlbId;
    const newMlbRawData = body.mlbRawData !== undefined ? body.mlbRawData : currentPlayer.mlbRawData;

    // 4. The "Detective" Logic: Figure out what type of transaction this is
    let transType: TransType | null = null;
    let details = "";

    // Note: We don't trigger a 'TransType' log just for linking an MLB profile, 
    // so this logic stays focused on actual roster moves.
    if (currentPlayer.teamId === null && newTeamId !== null) {
      transType = 'ADD';
      details = "Added from Free Agency";
    } else if (currentPlayer.teamId !== null && newTeamId === null) {
      transType = 'DROP';
      details = "Dropped to Free Agency";
    } else if (currentPlayer.level !== newLevel && newLevel !== null) {
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

    // 🛡️ DUAL-CHECK ROSTER VALIDATION (Level & Status Limits)
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
      // A. Update the Player (Now includes MLB fields!)
      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          teamId: newTeamId,
          level: newLevel,
          status: newStatus,
          mlbId: newMlbId,           // <-- NEW
          mlbRawData: newMlbRawData, // <-- NEW
        },
        include: { team: true }, 
      });

      // B. Create the Transaction Log (if a valid move was detected)
      if (transType) {
        await tx.transaction.create({
          data: {
            type: transType,
            playerId: playerId,
            teamId: newTeamId || currentPlayer.teamId, 
            details: details,
          },
        });
      }

      return updatedPlayer;
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("PATCH Player Error:", error);
    
    // NEW: Safely catch duplicate MLB ID links
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "MLB ID Collision", message: "This MLB ID is already linked to another player in the database." }, 
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}