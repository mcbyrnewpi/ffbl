// src/app/api/players/[playerId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransType } from '@prisma/client'; 
import { checkMinorLeagueEligibility, validateTeamFarmSystem } from '@/lib/roster-rules'; // 🌟 NEW IMPORTS

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const body = await request.json();

    const currentPlayer = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!currentPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const newTeamId = body.teamId !== undefined ? body.teamId : currentPlayer.teamId;
    const newLevel = body.level !== undefined ? body.level : currentPlayer.level;
    const newStatus = body.status !== undefined ? body.status : currentPlayer.status;
    const newMlbId = body.mlbId !== undefined ? body.mlbId : currentPlayer.mlbId;
    const newMlbRawData = body.mlbRawData !== undefined ? body.mlbRawData : currentPlayer.mlbRawData;
    
    // Extract retroactive date
    const retroactiveDate = body.retroactiveDate; 

    // 🛡️ 60-Day IL Lock Enforcement
    if (currentPlayer.status === 'IL_60' && currentPlayer.il60UnlockDate) {
      const isLocked = new Date() < new Date(currentPlayer.il60UnlockDate);
      const isDropping = newTeamId === null; // The only legal move is dropping them
      
      if (isLocked && !isDropping) {
        return NextResponse.json(
          { error: "Player Locked", message: `This player is locked on the 60-Day IL until ${new Date(currentPlayer.il60UnlockDate).toLocaleDateString()}.` }, 
          { status: 400 }
        );
      }
    }

    // 🗓️ Calculate Unlock Date if moving TO IL_60
    let newIl60UnlockDate = currentPlayer.il60UnlockDate;
    if (newStatus === 'IL_60' && currentPlayer.status !== 'IL_60') {
      // 1. Force the retroactive date to noon to avoid UTC midnight timezone shifting
      const startDate = retroactiveDate ? new Date(`${retroactiveDate}T12:00:00`) : new Date();
      
      // 2. Add exactly 60 days in milliseconds (Bulletproof math)
      newIl60UnlockDate = new Date(startDate.getTime() + (60 * 24 * 60 * 60 * 1000));
    } else if (newTeamId === null || newStatus !== 'IL_60') {
      // Clear the lock if they are dropped or legally activated
      newIl60UnlockDate = null;
    }

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
      const hierarchy = ['MLB', 'AAA', 'AA', 'A'];
      const oldIdx = currentPlayer.level ? hierarchy.indexOf(currentPlayer.level) : -1;
      const newIdx = hierarchy.indexOf(newLevel);

      if (oldIdx !== -1 && newIdx < oldIdx) {
        transType = 'PROMOTE';
      } else {
        transType = 'DEMOTE';
      }
      details = `Moved from ${currentPlayer.level || 'Unassigned'} to ${newLevel}`;
    } else if (currentPlayer.status !== newStatus) {
      // Map Status changes to specific TransTypes for history logs
      if (newStatus === 'IL') {
        transType = 'PLACE_ON_IL';
        details = "Placed on Injured List";
      } else if (newStatus === 'IL_60') {
        transType = 'PLACE_ON_IL_60';
        details = `Placed on 60-Day IL${retroactiveDate ? ` (Retroactive to ${new Date(retroactiveDate).toLocaleDateString()})` : ''}`;
      } else if (newStatus === 'NA') {
        transType = 'PLACE_ON_NA';
        details = "Placed on Not Active List";
      } else if (newStatus === 'ACTIVE') {
        transType = currentPlayer.status === 'IL' ? 'ACTIVATE_FROM_IL' :
                    currentPlayer.status === 'IL_60' ? 'ACTIVATE_FROM_IL_60' :
                    currentPlayer.status === 'NA' ? 'ACTIVATE_FROM_NA' : null;
        details = "Activated to Roster";
      }
    }

    // 🛡️ THE BOUNCER: MINOR LEAGUE ELIGIBILITY ENFORCEMENT 🌟
    if (newTeamId && newLevel && ['AAA', 'AA', 'A'].includes(newLevel)) {
      const isMovingToOrWithinMinors = newTeamId !== currentPlayer.teamId || newLevel !== currentPlayer.level;
      
      if (isMovingToOrWithinMinors) {
        const playerToCheck = { ...currentPlayer, mlbRawData: newMlbRawData };
        
        // 1. Is this specific player eligible for this level?
        const playerCheck = checkMinorLeagueEligibility(playerToCheck, newLevel);
        
        if (!playerCheck.isEligible) {
          return NextResponse.json(
            { error: "Ineligible for Level", message: `Move Blocked: ${playerCheck.reason}` }, 
            { status: 403 }
          );
        }

        // 2. The Poison Pill: Is the team's entire farm system compliant?
        // We pass the pending move so the Bouncer knows we are trying to fix the illegal player!
        const systemCheck = await validateTeamFarmSystem(newTeamId, { 
          playerId: playerId, 
          newLevel: newLevel 
        });
        
        if (!systemCheck.isValid) {
          return NextResponse.json(
            { 
              error: "Farm System Non-Compliant", 
              message: `Move Blocked: Your farm system contains ineligible players. You must promote or drop them before making Minor League roster moves.\n\nViolations:\n- ${systemCheck.violations.join('\n- ')}` 
            }, 
            { status: 403 }
          );
        }
      }
    }

    // 🛡️ DUAL-CHECK ROSTER VALIDATION (Level & Status Limits)
    if (newTeamId && (newTeamId !== currentPlayer.teamId || newLevel !== currentPlayer.level || newStatus !== currentPlayer.status)) {
      
      const settings = await prisma.leagueSettings.findUnique({
        where: { id: 1 }
      });

      if (settings?.enforceRosterLimits) {
        
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
      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          teamId: newTeamId,
          level: newLevel,
          status: newStatus,
          mlbId: newMlbId,           
          mlbRawData: newMlbRawData, 
          il60UnlockDate: newIl60UnlockDate !== undefined ? newIl60UnlockDate : null
        },
        include: { team: true }, 
      });

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
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "MLB ID Collision", message: "This MLB ID is already linked to another player in the database." }, 
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}