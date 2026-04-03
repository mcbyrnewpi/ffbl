// src/app/api/trades/propose/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ⬅️ NEW: Destructure correspondingMoves
    const { initiatingTeamId, expiresInDays, assets, correspondingMoves, counteringTradeId } = body;

    // 1. Basic Payload Validation
    if (!initiatingTeamId || !assets || assets.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: Must include an initiating team and at least one asset." },
        { status: 400 }
      );
    }

    // 2. Calculate the Expiration Date (if provided)
    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // 3. Extract all unique IDs needed for Snapshots
    const teamIds = new Set<string>();
    const playerIds = new Set<string>();
    const pickIds = new Set<string>();

    assets.forEach((asset: any) => {
      teamIds.add(asset.fromTeamId);
      teamIds.add(asset.toTeamId);
      if (asset.playerId) playerIds.add(asset.playerId);
      if (asset.draftPickId) pickIds.add(asset.draftPickId);
    });

    // 4. The Mega-Transaction
    const newTrade = await prisma.$transaction(async (tx) => {
      
      // --- 💥 NEW: Handle Counter Trades ---
      if (counteringTradeId) {
        // Mark the old trade as CANCELLED
        await tx.trade.update({
          where: { id: counteringTradeId },
          data: { status: 'CANCELLED' }
        });
      } // ⬅️ FIX 1: ADDED MISSING BRACKET


      // --- 🏗️ SNAPSHOT GATHERING ---
      
      // Fetch Teams
      const teams = await tx.team.findMany({
        where: { id: { in: Array.from(teamIds) } },
        select: { id: true, name: true }
      });
      const teamMap = new Map(teams.map(t => [t.id, t.name]));

      // Fetch Players
      const players = await tx.player.findMany({
        where: { id: { in: Array.from(playerIds) } },
        select: { id: true, firstName: true, lastName: true }
      });
      const playerMap = new Map(players.map(p => [p.id, `${p.firstName} ${p.lastName}`]));

      // Fetch Draft Picks (including the Original Owner for the lore string)
      const picks = await tx.draftPick.findMany({
        where: { id: { in: Array.from(pickIds) } },
        include: { originalOwner: { select: { name: true } } }
      });
      
      const pickMap = new Map(picks.map(p => {
        // Helper to add 'st', 'nd', 'rd', 'th'
        const suffix = ["st", "nd", "rd"][((p.round + 90) % 100 - 10) % 10 - 1] || "th";
        const pickString = `${p.year} ${p.round}${suffix} Round Pick (${p.originalOwner.name})`;
        return [p.id, pickString];
      }));

      // --- 🚀 A: Create the Trade and nested Assets ---
      const trade = await tx.trade.create({
        data: {
          initiatingTeamId,
          expiresAt,
          status: 'PENDING',
          assets: {
            create: assets.map((asset: any) => ({
              fromTeamId: asset.fromTeamId,
              toTeamId: asset.toTeamId,
              playerId: asset.playerId || null,
              draftPickId: asset.draftPickId || null,
              
              // Injecting the historical snapshots!
              fromTeamNameSnapshot: teamMap.get(asset.fromTeamId) || 'Unknown Team',
              toTeamNameSnapshot: teamMap.get(asset.toTeamId) || 'Unknown Team',
              playerNameSnapshot: asset.playerId ? playerMap.get(asset.playerId) : null,
              pickNameSnapshot: asset.draftPickId ? pickMap.get(asset.draftPickId) : null,
            })),
          },
        },
        include: {
          assets: true, 
        },
      });

      // --- 🔒 B: The Roster Freeze ---
      const tradePlayerIds = trade.assets
        .filter((a) => a.playerId && a.fromTeamId === initiatingTeamId)
        .map((a) => a.playerId as string);
        
      const tradePickIds = trade.assets
        .filter((a) => a.draftPickId && a.fromTeamId === initiatingTeamId)
        .map((a) => a.draftPickId as string);

      // Extract players from the initiator's corresponding moves
      const escrowPlayerIds: string[] = [];
      if (correspondingMoves) {
        if (correspondingMoves.drops) escrowPlayerIds.push(...correspondingMoves.drops);
        if (correspondingMoves.levelChanges) escrowPlayerIds.push(...correspondingMoves.levelChanges.map((c: any) => c.playerId));
        if (correspondingMoves.statusChanges) escrowPlayerIds.push(...correspondingMoves.statusChanges.map((c: any) => c.playerId));
      }

      // Combine traded players and escrow players into one unique array
      const allPlayersToLock = [...new Set([...tradePlayerIds, ...escrowPlayerIds])];

      if (allPlayersToLock.length > 0) {
        await tx.player.updateMany({
          where: { id: { in: allPlayersToLock } },
          data: { isTradeLocked: true },
        });
      }

      if (tradePickIds.length > 0) {
        await tx.draftPick.updateMany({
          where: { id: { in: tradePickIds } },
          data: { isTradeLocked: true },
        });
      }

      // --- 🔑 C: Figure out unique teams and create Approvals (Double-Lock Ready) ---
      const allTeamIds = trade.assets.flatMap((a) => [a.fromTeamId, a.toTeamId]);
      const uniqueTeamIds = [...new Set(allTeamIds)] as string[];

      const teamManagers = await tx.user.findMany({
        where: {
          teamId: { in: uniqueTeamIds },
          isPrimaryManager: true, 
        },
        select: { id: true, teamId: true }, 
      });

      for (const teamId of uniqueTeamIds) {
        if (!teamManagers.some(m => m.teamId === teamId)) {
          throw new Error(`Cannot propose trade: No primary manager found for team ${teamId}`);
        }
      }

      const approvalData = teamManagers.map((manager) => {
        return {
          tradeId: trade.id,
          userId: manager.id, 
          status: manager.teamId === initiatingTeamId ? 'APPROVED' : 'PENDING',
          // ⬅️ NEW: Attach the escrow moves to the initiator's auto-approved ticket!
          correspondingMoves: manager.teamId === initiatingTeamId ? correspondingMoves : null
        };
      });

      await tx.tradeApproval.createMany({
        data: approvalData
      });

      // --- 📦 Return the fully assembled trade out of the transaction ---
      return await tx.trade.findUnique({
        where: { id: trade.id },
        include: {
          assets: true,
          approvals: true
        }
      });
    });

    // 4. Send the successful response back to the frontend
    return NextResponse.json(newTrade, { status: 201 });

  } catch (error) {
    console.error("Trade Proposal Error:", error);
    return NextResponse.json(
      { error: "Failed to propose trade." },
      { status: 500 }
    );
  }
}