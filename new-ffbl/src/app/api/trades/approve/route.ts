// src/app/api/trades/approve.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Escrow moves will look like: { drops: ["playerId1"], levelChanges: [...], statusChanges: [...] }
    const { tradeId, userId, correspondingMoves } = body;

    if (!tradeId || !userId) {
      return NextResponse.json({ error: "Missing tradeId or userId" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch trade with approvals (including user data for team IDs) and assets
      const trade = await tx.trade.findUnique({
        where: { id: tradeId },
        include: {
          approvals: { include: { user: true } },
          assets: true,
        },
      });

      if (!trade) throw new Error("Trade not found");
      if (trade.status !== 'PENDING') throw new Error(`Trade is already ${trade.status}`);

      // 2. Validate User & Ticket
      const userApproval = trade.approvals.find(a => a.userId === userId);
      if (!userApproval) throw new Error("User is not authorized to approve this trade");
      if (userApproval.status === 'APPROVED') throw new Error("User has already approved this trade");

      const approvingUser = userApproval.user;
      if (!approvingUser.teamId) throw new Error("User team not found");

      // 3. The Escrow & Progressive Lock
      await tx.tradeApproval.update({
        where: { id: userApproval.id },
        data: { 
          status: 'APPROVED',
          correspondingMoves: correspondingMoves ? correspondingMoves : null
        }
      });

      // Lock ONLY this team's assets
      const teamPlayerIds = trade.assets
        .filter(a => a.fromTeamId === approvingUser.teamId && a.playerId)
        .map(a => a.playerId as string);

      const teamPickIds = trade.assets
        .filter(a => a.fromTeamId === approvingUser.teamId && a.draftPickId)
        .map(a => a.draftPickId as string);

      // Extract players from this manager's corresponding moves
      const escrowPlayerIds: string[] = [];
      if (correspondingMoves) {
        if (correspondingMoves.drops) escrowPlayerIds.push(...correspondingMoves.drops);
        if (correspondingMoves.levelChanges) escrowPlayerIds.push(...correspondingMoves.levelChanges.map((c: any) => c.playerId));
        if (correspondingMoves.statusChanges) escrowPlayerIds.push(...correspondingMoves.statusChanges.map((c: any) => c.playerId));
      }

      const allPlayersToLock = [...new Set([...teamPlayerIds, ...escrowPlayerIds])];

      if (allPlayersToLock.length > 0) {
        await tx.player.updateMany({
          where: { id: { in: teamPlayerIds } },
          data: { isTradeLocked: true }
        });
      }
      if (teamPickIds.length > 0) {
        await tx.draftPick.updateMany({
          where: { id: { in: teamPickIds } },
          data: { isTradeLocked: true }
        });
      }

      // 4. The Consensus Check
      const allApproved = trade.approvals.every(a => 
        a.id === userApproval.id ? true : a.status === 'APPROVED'
      );

      if (!allApproved) {
        // Stop here! We have saved their vote and locked their assets. We wait for the others.
        return { status: "Response recorded. Waiting on other managers.", executed: false };
      }

      // ==========================================
      // 🚀 5. THE EXECUTION BLOCK (Consensus Reached!)
      // ==========================================

      // A. Process Escrow Moves for ALL managers
      for (const approval of trade.approvals) {
        // Grab the moves from the DB, or from the current request if it's the final voter
        const moves = (approval.id === userApproval.id ? correspondingMoves : approval.correspondingMoves) as any;
        const managerTeamId = approval.user.teamId;
        
        if (moves?.drops && Array.isArray(moves.drops) && managerTeamId) {
          for (const dropPlayerId of moves.drops) {
            await tx.player.update({
              where: { id: dropPlayerId },
              data: { teamId: null, isTradeLocked: false }
            });
            
            await tx.transaction.create({
              data: {
                type: 'DROP',
                playerId: dropPlayerId,
                teamId: managerTeamId,
                details: 'Dropped as corresponding move for trade execution.'
              }
            });
          }
        }

        if (moves?.levelChanges && Array.isArray(moves.levelChanges) && managerTeamId) {
          const levelWeights: Record<string, number> = { MLB: 4, AAA: 3, AA: 2, A: 1 };

          for (const change of moves.levelChanges) {
            const playerToMove = await tx.player.findUnique({
              where: { id: change.playerId },
              select: { level: true }
            });

            if (!playerToMove || !playerToMove.level) continue;

            const oldWeight = levelWeights[playerToMove.level] || 0;
            const newWeight = levelWeights[change.newLevel] || 0;
            const transType = newWeight > oldWeight ? 'PROMOTE' : 'DEMOTE';

            await tx.player.update({
              where: { id: change.playerId },
              data: { level: change.newLevel, isTradeLocked: false }
            });
            
            await tx.transaction.create({
              data: {
                type: transType, 
                playerId: change.playerId,
                teamId: managerTeamId,
                details: `Moved from ${playerToMove.level} to ${change.newLevel} as a corresponding move for trade.`
              }
            });
          }
        }

        if (moves?.statusChanges && Array.isArray(moves.statusChanges) && managerTeamId) {
          for (const change of moves.statusChanges) {
            const playerToMove = await tx.player.findUnique({
              where: { id: change.playerId },
              select: { status: true }
            });

            if (!playerToMove || !playerToMove.status) continue;

            let transType: any = 'ADD'; 
            if (playerToMove.status === 'IL' && change.newStatus === 'ACTIVE') transType = 'ACTIVATE_FROM_IL';
            if (playerToMove.status === 'ACTIVE' && change.newStatus === 'IL') transType = 'PLACE_ON_IL';
            if (playerToMove.status === 'NA' && change.newStatus === 'ACTIVE') transType = 'ACTIVATE_FROM_NA';
            if (playerToMove.status === 'ACTIVE' && change.newStatus === 'NA') transType = 'PLACE_ON_NA';

            await tx.player.update({
              where: { id: change.playerId },
              data: { status: change.newStatus, isTradeLocked: false }
            });
            
            await tx.transaction.create({
              data: {
                type: transType, 
                playerId: change.playerId,
                teamId: managerTeamId,
                details: `Status changed from ${playerToMove.status} to ${change.newStatus} as a corresponding move for trade.`
              }
            });
          }
        }
      }

      // B. Move the Traded Players & Remove Padlocks
      const tradedPlayers = trade.assets.filter(a => a.playerId);
      for (const asset of tradedPlayers) {
        await tx.player.update({
          where: { id: asset.playerId! },
          data: { 
            teamId: asset.toTeamId,
            isTradeLocked: false 
          }
        });

        await tx.transaction.create({
          data: {
            type: 'TRADE',
            playerId: asset.playerId!,
            teamId: asset.toTeamId,
            tradeId: trade.id,
            details: `Traded from ${asset.fromTeamNameSnapshot} to ${asset.toTeamNameSnapshot}`
          }
        });
      }

      // C. Move the Traded Draft Picks & Remove Padlocks
      const tradedPicks = trade.assets.filter(a => a.draftPickId);
      if (tradedPicks.length > 0) {
        for (const asset of tradedPicks) {
          
          // 1. Update the Draft Pick Owner
          await tx.draftPick.update({
            where: { id: asset.draftPickId! },
            data: { 
              currentOwnerId: asset.toTeamId,
              isTradeLocked: false 
            }
          });

          // 2. Create the Transaction (MUST be inside the loop with asset!)
          await tx.transaction.create({
            data: {
              type: 'TRADE',
              draftPickId: asset.draftPickId!,
              teamId: asset.toTeamId,
              tradeId: trade.id,
              details: `Acquired ${asset.pickNameSnapshot || 'Draft Pick'} via trade from ${asset.fromTeamNameSnapshot}.`
            }
          });

        }
      }

      // D. Finalize the Trade Record
      await tx.trade.update({
        where: { id: trade.id },
        data: { status: 'PROCESSED' }
      });

      // ==========================================
      // 🛑 6. THE BOUNCER (Roster Limit Enforcement)
      // ==========================================
      
      const settings = await tx.leagueSettings.findUnique({ where: { id: 1 } });
      if (!settings) throw new Error("League settings not found.");

      if (settings.enforceRosterLimits) {
        const uniqueTeamIds = [...new Set(trade.assets.flatMap(a => [a.fromTeamId, a.toTeamId]))];

        for (const teamId of uniqueTeamIds) {
          const mlbCount = await tx.player.count({ where: { teamId, level: 'MLB', status: 'ACTIVE' } });
          const aaaCount = await tx.player.count({ where: { teamId, level: 'AAA', status: 'ACTIVE' } });
          const aaCount  = await tx.player.count({ where: { teamId, level: 'AA',  status: 'ACTIVE' } });
          const aCount   = await tx.player.count({ where: { teamId, level: 'A',   status: 'ACTIVE' } });

          const ilCount = await tx.player.count({ where: { teamId, status: 'IL' } });
          const naCount = await tx.player.count({ where: { teamId, status: 'NA' } });

          if (mlbCount > settings.mlbLimit) throw new Error(`Team ${teamId} exceeds the MLB limit (${mlbCount}/${settings.mlbLimit}).`);
          if (aaaCount > settings.aaaLimit) throw new Error(`Team ${teamId} exceeds the AAA limit (${aaaCount}/${settings.aaaLimit}).`);
          if (aaCount > settings.aaLimit) throw new Error(`Team ${teamId} exceeds the AA limit (${aaCount}/${settings.aaLimit}).`);
          if (aCount > settings.aLimit) throw new Error(`Team ${teamId} exceeds the A limit (${aCount}/${settings.aLimit}).`);
          
          if (ilCount > settings.ilLimit) throw new Error(`Team ${teamId} exceeds the IL limit (${ilCount}/${settings.ilLimit}).`);
          if (naCount > settings.naLimit) throw new Error(`Team ${teamId} exceeds the NA limit (${naCount}/${settings.naLimit}).`);
        }
      }

      return { status: "Trade successfully processed!", executed: true };
    });

    // ==========================================
    // 🤖 THE SPORTS MEDIA TRIGGER (Background Task)
    // ==========================================
    if (result.executed) {
      const baseUrl = new URL(request.url).origin;
      fetch(`${baseUrl}/api/ai/generate-trade-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId })
      }).catch(err => console.error("Failed to trigger AI Media:", err));
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Trade Execution Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute trade." },
      { status: 500 }
    );
  }
}